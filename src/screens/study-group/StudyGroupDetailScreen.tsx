import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Text,
  Image,
  Modal,
  TextInput,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as studyGroupService from '../../services/studyGroupService';
import { useAuthStore } from '../../store/authStore';
import PostCard from '../../components/study-group/PostCard';

const StudyGroupDetailScreen = ({ route, navigation }: any) => {
  const { groupId } = route.params;
  const { user } = useAuthStore();

  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'posts' | 'info' | 'members' | 'resources'>('posts');
  const [resourceTypeTab, setResourceTypeTab] = useState<'DOCUMENT' | 'EXERCISE'>('DOCUMENT');
  
  // Post Composer
  const [postContent, setPostContent] = useState('');
  const [postImageUri, setPostImageUri] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editRules, setEditRules] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [editAvatarUri, setEditAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadGroupData();
  }, [groupId]);

  const loadGroupData = async () => {
    try {
      setLoading(true);
      const [groupData, membersList, resourcesData, postsData] = await Promise.all([
        studyGroupService.getStudyGroupDetail(groupId),
        studyGroupService.getGroupMembers(groupId),
        studyGroupService.getSharedResources(groupId).catch(() => []),
        studyGroupService.getGroupPosts(groupId, 1, 20).catch(() => ({ data: [] })),
      ]);
      setGroup(groupData);
      setMembers(Array.isArray(membersList) ? membersList : (membersList as any)?.data || []);

      const resourcesArray = Array.isArray(resourcesData)
        ? resourcesData
        : Array.isArray((resourcesData as any)?.resources)
          ? (resourcesData as any).resources
          : Array.isArray((resourcesData as any)?.data)
            ? (resourcesData as any).data
            : [];

      const validResources = resourcesArray.filter((r: any) => r.resource !== null && r.resource !== undefined);
      setResources(validResources);
      setPosts(postsData?.data || []);
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể tải thông tin nhóm');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      'Rời nhóm',
      'Bạn có chắc muốn rời nhóm này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Rời nhóm',
          style: 'destructive',
          onPress: async () => {
            try {
              await studyGroupService.leaveGroup(groupId);
              Alert.alert('Thành công', 'Đã rời khỏi nhóm');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Lỗi', 'Không thể rời nhóm');
            }
          }
        }
      ]
    );
  };

  const handleUnshareResource = (sharedResourceId: string) => {
    Alert.alert(
      'Gỡ tài nguyên',
      'Bạn có chắc muốn gỡ tài nguyên này khỏi nhóm?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gỡ',
          style: 'destructive',
          onPress: async () => {
            try {
              await studyGroupService.unshareResource(groupId, sharedResourceId);
              setResources(prev => prev.filter((r: any) => r.id !== sharedResourceId));
              Alert.alert('Thành công', 'Đã gỡ tài nguyên');
            } catch (error: any) {
              Alert.alert('Lỗi', 'Không thể gỡ tài nguyên');
            }
          }
        }
      ]
    );
  };

  const openEditModal = () => {
    setEditName(group?.name || '');
    setEditDesc(group?.description || '');
    setEditRules(group?.rules || '');
    setEditIsPublic(group?.isPublic ?? true);
    setEditAvatarUri(group?.avatarUrl || null);
    setShowEditModal(true);
  };

  const pickAvatar = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setEditAvatarUri(result.assets[0].uri);
    }
  };

  const handleSaveGroup = async () => {
    if (!editName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên nhóm');
      return;
    }

    try {
      setSaving(true);

      // Update group info
      await studyGroupService.updateStudyGroup(groupId, {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
        rules: editRules.trim() || undefined,
        isPublic: editIsPublic,
      });

      // Upload new avatar if changed
      if (editAvatarUri && editAvatarUri !== group?.avatarUrl) {
        const file: any = {
          uri: editAvatarUri,
          name: 'avatar.jpg',
          type: 'image/jpeg',
        };
        await studyGroupService.uploadAvatar(groupId, file);
      }

      Alert.alert('Thành công', 'Đã cập nhật thông tin nhóm');
      setShowEditModal(false);
      loadGroupData();
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể cập nhật');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      'Xóa nhóm',
      'Bạn có chắc muốn xóa nhóm này? Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await studyGroupService.deleteStudyGroup(groupId);
              Alert.alert('Thành công', 'Đã xóa nhóm');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Lỗi', 'Không thể xóa nhóm');
            }
          }
        }
      ]
    );
  };

  const isOwner = group?.ownerId === user?.id;
  const filteredResources = resources.filter((r: any) => r.resourceType === resourceTypeTab);
  const documentsCount = resources.filter((r: any) => r.resourceType === 'DOCUMENT').length;
  const exercisesCount = resources.filter((r: any) => r.resourceType === 'EXERCISE').length;

  const renderResource = (item: any) => {
    const isDocument = item.resourceType === 'DOCUMENT';
    const resource = item.resource;

    return (
      <View key={item.id} style={styles.resourceCard}>
        <TouchableOpacity
          style={styles.resourceCardContent}
          onPress={() => {
            if (isDocument) {
              navigation.navigate('PDFViewer', { documentId: item.resourceId });
            } else {
              navigation.navigate('ExerciseDetail', { exerciseId: item.resourceId });
            }
          }}
        >
          <View style={[styles.resourceIcon, isDocument ? styles.docIcon : styles.exerciseIcon]}>
            <Ionicons name={isDocument ? 'document' : 'clipboard'} size={18} color="#fff" />
          </View>
          <View style={styles.resourceInfo}>
            <Text style={styles.resourceTitle} numberOfLines={1}>
              {resource?.title || 'Chưa đặt tên'}
            </Text>
            <View style={styles.resourceMeta}>
              <Text style={styles.resourceSharedBy}>
                {item.sharedByUser?.firstName || 'Ai đó'}
              </Text>
              <Text style={styles.resourceDivider}>•</Text>
              <Text style={styles.resourceDate}>
                {new Date(item.createdAt || item.sharedAt).toLocaleDateString('vi-VN')}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {isOwner && (
          <TouchableOpacity
            style={styles.unshareButton}
            onPress={() => handleUnshareResource(item.id)}
          >
            <Ionicons name="close-circle" size={18} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.centerContainer}>
        <Text>Không tìm thấy nhóm</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{group.name}</Text>
        {isOwner && (
          <TouchableOpacity onPress={openEditModal} style={styles.editBtn}>
            <Ionicons name="create-outline" size={20} color="#6366f1" />
          </TouchableOpacity>
        )}
      </View>

      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          {group.avatarUrl ? (
            <Image source={{ uri: group.avatarUrl }} style={styles.heroAvatarImage} />
          ) : (
            <View style={[styles.heroAvatar, { backgroundColor: group.color || '#6366f1' }]}>
              <Text style={styles.heroAvatarText}>{group.name?.[0]?.toUpperCase() || '?'}</Text>
            </View>
          )}
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{group.name}</Text>
            <View style={styles.heroBadges}>
              <View style={[styles.heroBadge, (String(group.isPublic) === 'true' || String(group.isPublic) === '1') ? styles.badgePublic : styles.badgePrivate]}>
                <Ionicons
                  name={(String(group.isPublic) === 'true' || String(group.isPublic) === '1') ? 'earth' : 'lock-closed'}
                  size={10}
                  color={(String(group.isPublic) === 'true' || String(group.isPublic) === '1') ? '#059669' : '#d97706'}
                />
                <Text style={[styles.heroBadgeText, (String(group.isPublic) === 'true' || String(group.isPublic) === '1') ? { color: '#059669' } : { color: '#d97706' }]}>
                  {(String(group.isPublic) === 'true' || String(group.isPublic) === '1') ? 'Công khai' : 'Riêng tư'}
                </Text>
              </View>
              <View style={styles.heroBadge}>
                <Ionicons name="people" size={10} color="#6b7280" />
                <Text style={styles.heroBadgeText}>{members.length} thành viên</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{members.length}</Text>
            <Text style={styles.statLabel}>Thành viên</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{documentsCount}</Text>
            <Text style={styles.statLabel}>Tài liệu</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{exercisesCount}</Text>
            <Text style={styles.statLabel}>Bài tập</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {members.some(m => m.userId === user?.id) && (
          <TouchableOpacity
            style={[styles.tab, tab === 'posts' && styles.tabActive]}
            onPress={() => setTab('posts')}
          >
            <Ionicons name="chatbox" size={16} color={tab === 'posts' ? '#6366f1' : '#9ca3af'} />
            <Text style={[styles.tabText, tab === 'posts' && styles.tabTextActive]}>Bài đăng</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.tab, tab === 'info' && styles.tabActive]}
          onPress={() => setTab('info')}
        >
          <Ionicons name="information-circle" size={16} color={tab === 'info' ? '#6366f1' : '#9ca3af'} />
          <Text style={[styles.tabText, tab === 'info' && styles.tabTextActive]}>Thông tin</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'members' && styles.tabActive]}
          onPress={() => setTab('members')}
        >
          <Ionicons name="people" size={16} color={tab === 'members' ? '#6366f1' : '#9ca3af'} />
          <Text style={[styles.tabText, tab === 'members' && styles.tabTextActive]}>Thành viên</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'resources' && styles.tabActive]}
          onPress={() => setTab('resources')}
        >
          <Ionicons name="folder" size={16} color={tab === 'resources' ? '#6366f1' : '#9ca3af'} />
          <Text style={[styles.tabText, tab === 'resources' && styles.tabTextActive]}>Tài nguyên</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {tab === 'posts' && (
          <View style={styles.tabContent}>
            {/* Composer */}
            <View style={styles.composerCard}>
              <View style={styles.composerRow}>
                <View style={styles.composerAvatar}>
                  <Text style={styles.composerAvatarText}>{user?.firstName?.[0]?.toUpperCase() || 'U'}</Text>
                </View>
                <TextInput
                  style={styles.composerInput}
                  placeholder="Chia sẻ câu hỏi hoặc tài liệu..."
                  placeholderTextColor="#9ca3af"
                  value={postContent}
                  onChangeText={setPostContent}
                  multiline
                />
              </View>
              {postImageUri && (
                <View style={styles.composerImagePreview}>
                  <Image source={{ uri: postImageUri }} style={styles.composerImage} />
                  <TouchableOpacity style={styles.removeImageBtn} onPress={() => setPostImageUri(null)}>
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.composerActions}>
                <TouchableOpacity 
                  style={styles.composerAttachBtn}
                  onPress={async () => {
                    const result = await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: ImagePicker.MediaTypeOptions.Images,
                      quality: 0.8,
                    });
                    if (!result.canceled && result.assets[0]) {
                      setPostImageUri(result.assets[0].uri);
                    }
                  }}
                >
                  <Ionicons name="image-outline" size={20} color="#6366f1" />
                  <Text style={styles.composerAttachText}>Ảnh</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.postBtn, (!postContent.trim() && !postImageUri) && styles.postBtnDisabled]}
                  disabled={isPosting || (!postContent.trim() && !postImageUri)}
                  onPress={async () => {
                    try {
                      setIsPosting(true);
                      const file = postImageUri ? {
                        uri: postImageUri,
                        name: 'post.jpg',
                        type: 'image/jpeg',
                      } : undefined;
                      await studyGroupService.createPost(groupId, postContent, undefined, file);
                      setPostContent('');
                      setPostImageUri(null);
                      const newPosts = await studyGroupService.getGroupPosts(groupId, 1, 20).catch(() => ({ data: [] }));
                      setPosts(newPosts.data);
                    } catch (e) {
                      Alert.alert('Lỗi', 'Không thể đăng bài');
                    } finally {
                      setIsPosting(false);
                    }
                  }}
                >
                  {isPosting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.postBtnText}>Đăng</Text>}
                </TouchableOpacity>
              </View>
            </View>

            {/* Posts List */}
            {posts.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyText}>Chưa có bài đăng nào</Text>
              </View>
            ) : (
              posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={async (postId) => {
                    try {
                      await studyGroupService.togglePostLike(postId);
                      setPosts(prev => prev.map(p => {
                        if (p.id === postId) {
                          const isLiked = p.likedUserIds?.includes(user?.id);
                          return { ...p, likeCount: (p.likeCount || 0) + (isLiked ? -1 : 1) };
                        }
                        return p;
                      }));
                    } catch(e) {}
                  }}
                  onComment={async (postId, content) => {
                    try {
                      await studyGroupService.createPostComment(postId, content);
                      // Optimistic or reload
                    } catch(e) {}
                  }}
                  onToggleComments={() => {}}
                  isCommentsExpanded={false}
                  comments={[]}
                />
              ))
            )}
          </View>
        )}

        {tab === 'info' && (
          <View style={styles.tabContent}>
            {/* Rules */}
            {group.rules && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="shield-checkmark" size={18} color="#6366f1" />
                  <Text style={styles.sectionTitle}>Nội quy nhóm</Text>
                </View>
                <View style={styles.rulesCard}>
                  <Text style={styles.rulesText}>{group.rules}</Text>
                </View>
              </View>
            )}

            {/* Description */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="text" size={18} color="#6366f1" />
                <Text style={styles.sectionTitle}>Mô tả</Text>
              </View>
              <Text style={styles.descriptionText}>{group.description || 'Chưa có mô tả'}</Text>
            </View>

            {/* Owner */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="person" size={18} color="#6366f1" />
                <Text style={styles.sectionTitle}>Chủ nhóm</Text>
              </View>
              <View style={styles.ownerCard}>
                <View style={styles.ownerAvatar}>
                  <Text style={styles.ownerAvatarText}>
                    {(group.owner?.firstName || group.ownerName || '?')[0]?.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.ownerName}>
                  {group.owner
                    ? `${group.owner.firstName || ''} ${group.owner.lastName || ''}`.trim()
                    : group.ownerName || 'N/A'}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionsSection}>
              <TouchableOpacity
                style={styles.chatButton}
                onPress={() => navigation.navigate('StudyGroupChat', { groupId })}
              >
                <Ionicons name="chatbubbles" size={20} color="#fff" />
                <Text style={styles.chatButtonText}>Vào chat nhóm</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </TouchableOpacity>

              {isOwner ? (
                <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteGroup}>
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  <Text style={styles.deleteButtonText}>Xóa nhóm</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveGroup}>
                  <Ionicons name="exit" size={18} color="#ef4444" />
                  <Text style={styles.leaveButtonText}>Rời nhóm</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {tab === 'members' && (
          <View style={styles.tabContent}>
            {members.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyText}>Chưa có thành viên</Text>
              </View>
            ) : (
              members.map((member) => (
                <View key={member.id} style={styles.memberCard}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {(member.user?.firstName || '?')[0]?.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName} numberOfLines={1}>
                      {member.user
                        ? `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim()
                        : 'Unknown'}
                    </Text>
                    <Text style={styles.memberRole}>
                      {member.role === 'admin' || member.role === 'owner' ? 'Quản trị viên' : 'Thành viên'}
                    </Text>
                  </View>
                  {(member.role === 'admin' || member.role === 'owner') && (
                    <View style={styles.adminBadge}>
                      <Ionicons name="shield-checkmark" size={14} color="#6366f1" />
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {tab === 'resources' && (
          <View style={styles.tabContent}>
            {/* Resource Type Tabs */}
            <View style={styles.resourceTypeTabs}>
              <TouchableOpacity
                style={[styles.resourceTypeTab, resourceTypeTab === 'DOCUMENT' && styles.resourceTypeTabActive]}
                onPress={() => setResourceTypeTab('DOCUMENT')}
              >
                <Ionicons
                  name="document"
                  size={16}
                  color={resourceTypeTab === 'DOCUMENT' ? '#6366f1' : '#9ca3af'}
                />
                <Text style={[styles.resourceTypeTabText, resourceTypeTab === 'DOCUMENT' && styles.resourceTypeTabTextActive]}>
                  Tài liệu
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.resourceTypeTab, resourceTypeTab === 'EXERCISE' && styles.resourceTypeTabActive]}
                onPress={() => setResourceTypeTab('EXERCISE')}
              >
                <Ionicons
                  name="clipboard"
                  size={16}
                  color={resourceTypeTab === 'EXERCISE' ? '#6366f1' : '#9ca3af'}
                />
                <Text style={[styles.resourceTypeTabText, resourceTypeTab === 'EXERCISE' && styles.resourceTypeTabTextActive]}>
                  Bài tập
                </Text>
              </TouchableOpacity>
            </View>

            {/* Resources List */}
            {filteredResources.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name={resourceTypeTab === 'DOCUMENT' ? 'document-outline' : 'clipboard-outline'}
                  size={48}
                  color="#d1d5db"
                />
                <Text style={styles.emptyText}>
                  Chưa có {resourceTypeTab === 'DOCUMENT' ? 'tài liệu' : 'bài tập'} nào
                </Text>
                <Text style={styles.emptySubtext}>
                  Tài nguyên được chia sẻ sẽ hiển thị ở đây
                </Text>
              </View>
            ) : (
              <View style={styles.resourcesList}>
                {filteredResources.map((resource) => renderResource(resource))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.editModalOverlay}>
          <View style={styles.editModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh sửa nhóm</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editModalScroll} showsVerticalScrollIndicator={false}>
              {/* Avatar */}
              <View style={styles.avatarPickerContainer}>
                <TouchableOpacity style={styles.avatarPickerButton} onPress={pickAvatar}>
                  {editAvatarUri ? (
                    <Image source={{ uri: editAvatarUri }} style={styles.avatarPreview} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="camera" size={24} color="#9ca3af" />
                    </View>
                  )}
                  <View style={styles.avatarBadge}>
                    <Ionicons name="camera" size={12} color="#fff" />
                  </View>
                </TouchableOpacity>
                <Text style={styles.avatarLabel}>Ảnh đại diện nhóm</Text>
              </View>

              {/* Name */}
              <Text style={styles.modalLabel}>Tên nhóm</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Tên nhóm..."
                placeholderTextColor="#9ca3af"
                value={editName}
                onChangeText={setEditName}
                maxLength={50}
              />

              {/* Description */}
              <Text style={styles.modalLabel}>Mô tả</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextarea]}
                placeholder="Mô tả về nhóm..."
                placeholderTextColor="#9ca3af"
                value={editDesc}
                onChangeText={setEditDesc}
                maxLength={200}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Rules */}
              <Text style={styles.modalLabel}>Nội quy nhóm</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextarea]}
                placeholder="Nội quy nhóm..."
                placeholderTextColor="#9ca3af"
                value={editRules}
                onChangeText={setEditRules}
                maxLength={500}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* Public/Private */}
              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchLabel}>Công khai</Text>
                  <Text style={styles.switchHint}>
                    {editIsPublic ? 'Mọi người có thể tìm và tham gia' : 'Chỉ tham gia bằng mã mời'}
                  </Text>
                </View>
                <Switch
                  value={editIsPublic}
                  onValueChange={setEditIsPublic}
                  trackColor={{ false: '#d1d5db', true: '#a5b4fc' }}
                  thumbColor={editIsPublic ? '#6366f1' : '#9ca3af'}
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnSave, saving && { opacity: 0.6 }]}
              onPress={handleSaveGroup}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalBtnSaveText}>Lưu thay đổi</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default StudyGroupDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  editBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', flex: 1, marginHorizontal: 12 },

  // Hero
  hero: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  heroTop: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16,
  },
  heroAvatar: {
    width: 52, height: 52, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  heroAvatarImage: {
    width: 52, height: 52, borderRadius: 16,
  },
  heroAvatarText: { fontSize: 22, fontWeight: '700', color: '#fff' },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 6 },
  heroBadges: { flexDirection: 'row', gap: 6 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#f5f5f5',
  },
  badgePublic: { backgroundColor: '#ecfdf5' },
  badgePrivate: { backgroundColor: '#fffbeb' },
  heroBadgeText: { fontSize: 11, fontWeight: '600' },

  // Stats
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f8f9fc', borderRadius: 12, paddingVertical: 12,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  statLabel: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  statDivider: { width: 1, height: 24, backgroundColor: '#e5e7eb' },

  // Tabs
  tabContainer: {
    flexDirection: 'row', backgroundColor: '#fff',
    paddingHorizontal: 8, paddingVertical: 4,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10,
  },
  tabActive: { backgroundColor: '#eef2ff' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#9ca3af' },
  tabTextActive: { color: '#6366f1' },

  // Content
  content: { flex: 1 },
  tabContent: { padding: 16 },

  // Sections
  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },

  // Rules
  rulesCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#f0f0f0',
  },
  rulesText: { fontSize: 13, color: '#4b5563', lineHeight: 20 },

  // Description
  descriptionText: { fontSize: 13, color: '#6b7280', lineHeight: 20 },

  // Owner
  ownerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#f0f0f0',
  },
  ownerAvatar: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#6366f1',
    alignItems: 'center', justifyContent: 'center',
  },
  ownerAvatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  ownerName: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },

  // Actions
  actionsSection: { marginTop: 8, gap: 10 },
  chatButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#6366f1', paddingVertical: 14, borderRadius: 12,
  },
  chatButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  leaveButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#fee2e2',
  },
  leaveButtonText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
  deleteButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#fee2e2',
  },
  deleteButtonText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },

  // Members
  memberCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 12, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: '#f0f0f0',
  },
  memberAvatar: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#6366f1',
    alignItems: 'center', justifyContent: 'center',
  },
  memberAvatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  memberRole: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  adminBadge: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: '#eef2ff',
    alignItems: 'center', justifyContent: 'center',
  },

  // Resource Type Tabs
  resourceTypeTabs: {
    flexDirection: 'row', gap: 8, marginBottom: 16,
  },
  resourceTypeTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#f0f0f0',
  },
  resourceTypeTabActive: {
    backgroundColor: '#6366f1', borderColor: '#6366f1',
  },
  resourceTypeTabText: {
    fontSize: 13, fontWeight: '600', color: '#9ca3af',
  },
  resourceTypeTabTextActive: {
    color: '#fff',
  },

  // Resources
  resourcesList: { gap: 8 },
  resourceCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, borderWidth: 1, borderColor: '#f0f0f0',
  },
  resourceCardContent: {
    flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12,
  },
  resourceIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  docIcon: { backgroundColor: '#6366f1' },
  exerciseIcon: { backgroundColor: '#6366f1' },
  resourceInfo: { flex: 1 },
  resourceTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 },
  resourceMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resourceSharedBy: { fontSize: 11, fontWeight: '600', color: '#6366f1' },
  resourceDivider: { fontSize: 11, color: '#d1d5db' },
  resourceDate: { fontSize: 11, color: '#9ca3af' },
  unshareButton: {
    padding: 12,
  },

  // Empty
  emptyState: { paddingVertical: 48, alignItems: 'center' },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#9ca3af', marginTop: 12 },
  emptySubtext: { fontSize: 13, color: '#d1d5db', marginTop: 4 },

  // Edit Modal
  editModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  editModalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    maxHeight: '90%',
  },
  editModalScroll: { marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  modalLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  modalInput: {
    backgroundColor: '#f8f9fc', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#1a1a1a', borderWidth: 1, borderColor: '#f0f0f0', marginBottom: 16,
  },
  modalTextarea: { minHeight: 80 },
  modalBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalBtnSave: { backgroundColor: '#6366f1' },
  modalBtnSaveText: { fontSize: 15, fontWeight: '600', color: '#fff' },

  // Avatar Picker
  avatarPickerContainer: { alignItems: 'center', marginBottom: 20 },
  avatarPickerButton: { position: 'relative' },
  avatarPreview: { width: 80, height: 80, borderRadius: 20 },
  avatarPlaceholder: {
    width: 80, height: 80, borderRadius: 20, backgroundColor: '#f8f9fc',
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#e5e7eb', borderStyle: 'dashed',
  },
  avatarBadge: {
    position: 'absolute', bottom: -4, right: -4,
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#6366f1',
    justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff',
  },
  avatarLabel: { fontSize: 12, color: '#9ca3af', marginTop: 10, fontWeight: '600' },

  // Switch
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  switchInfo: { flex: 1 },

  // Composer
  composerCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: '#f0f0f0', shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  composerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  composerAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#eef2ff',
    alignItems: 'center', justifyContent: 'center',
  },
  composerAvatarText: { fontSize: 16, fontWeight: '700', color: '#6366f1' },
  composerInput: {
    flex: 1, fontSize: 14, color: '#1a1a1a', minHeight: 40,
    paddingTop: 8, paddingBottom: 8,
  },
  composerImagePreview: {
    marginTop: 12, position: 'relative', borderRadius: 16, overflow: 'hidden',
  },
  composerImage: { width: '100%', height: 200, borderRadius: 16 },
  removeImageBtn: {
    position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12, padding: 2,
  },
  composerActions: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6',
  },
  composerAttachBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#f8f9fc', borderRadius: 12 },
  composerAttachText: { fontSize: 13, fontWeight: '600', color: '#6366f1' },
  postBtn: {
    backgroundColor: '#6366f1', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 12,
  },
  postBtnDisabled: { backgroundColor: '#c7d2fe' },
  postBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  switchLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  switchHint: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
});
