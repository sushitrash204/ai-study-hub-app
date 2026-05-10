import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Text,
  Modal,
  Switch,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as studyGroupService from '../../services/studyGroupService';
import { useAuthStore } from '../../store/authStore';
import PostCard from '../../components/study-group/PostCard';

const StudyGroupsListScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [publicGroups, setPublicGroups] = useState<any[]>([]);
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState<'my' | 'public' | 'community' | 'saved'>('my');
  const [joinCode, setJoinCode] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create group state
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupRules, setGroupRules] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  // Server-side search debounce cho nhóm công khai
  useEffect(() => {
    if (tab === 'public') {
      const timer = setTimeout(() => {
        loadGroups();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, tab]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const [myGroupsData, publicGroupsData, feedData, savedData] = await Promise.all([
        studyGroupService.getUserStudyGroups(),
        studyGroupService.listStudyGroups(1, 50, tab === 'public' ? searchQuery : undefined),
        tab === 'community' ? studyGroupService.getDiscoveryFeed(1, 20) : Promise.resolve({ data: communityPosts }),
        tab === 'saved' ? studyGroupService.getSavedPosts(1, 50) : Promise.resolve({ data: savedPosts }),
      ]);

      const myGroupsArray = Array.isArray(myGroupsData) ? myGroupsData : [];

      const publicGroupsArray = Array.isArray(publicGroupsData?.groups)
        ? publicGroupsData.groups
        : Array.isArray(publicGroupsData?.data)
          ? publicGroupsData.data
          : Array.isArray(publicGroupsData)
            ? publicGroupsData
            : [];

      setMyGroups(myGroupsArray);
      setPublicGroups(publicGroupsArray);
      
      if (tab === 'community' && feedData?.data) {
        setCommunityPosts(feedData.data);
      }

      if (tab === 'saved' && savedData?.data) {
        setSavedPosts(savedData.data);
      }
    } catch (error: any) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã mời');
      return;
    }

    try {
      await studyGroupService.joinByCode(joinCode.trim());
      Alert.alert('Thành công', 'Đã tham gia nhóm');
      setShowJoinModal(false);
      setJoinCode('');
      loadGroups();
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể tham gia nhóm');
    }
  };

  const handleSavePost = async (postId: string) => {
    try {
      const result = await studyGroupService.toggleSavePost(postId);
      
      const updatePost = (p: any) => p.id === postId ? { ...p, isSaved: result.saved } : p;
      
      setCommunityPosts(prev => prev.map(updatePost));
      setSavedPosts(prev => {
        if (!result.saved) return prev.filter(p => p.id !== postId);
        const postInFeed = communityPosts.find(p => p.id === postId);
        if (postInFeed && !prev.find(p => p.id === postId)) {
          return [{ ...postInFeed, isSaved: true }, ...prev];
        }
        return prev;
      });

      Alert.alert('Thành công', result.saved ? 'Đã lưu bài viết' : 'Đã bỏ lưu bài viết');
    } catch (error) {
      console.error('Save post error:', error);
    }
  };

  const handleSharePost = async (post: any) => {
    Alert.alert('Chia sẻ', 'Tính năng chia sẻ đang được phát triển (Demo)');
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
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên nhóm');
      return;
    }

    try {
      setCreating(true);
      const newGroup = await studyGroupService.createStudyGroup(groupName.trim(), {
        description: groupDesc.trim() || undefined,
        isPublic,
        rules: groupRules.trim() || undefined,
      });

      if (avatarUri) {
        const file: any = {
          uri: avatarUri,
          name: 'avatar.jpg',
          type: 'image/jpeg',
        };
        await studyGroupService.uploadAvatar(newGroup.id, file);
      }

      Alert.alert('Thành công', 'Đã tạo nhóm');
      setShowCreateModal(false);
      resetCreateForm();
      loadGroups();
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể tạo nhóm');
    } finally {
      setCreating(false);
    }
  };

  const renderGroupAvatar = (item: any) => {
    if (item.avatarUrl) {
      return <Image source={{ uri: item.avatarUrl }} style={styles.groupAvatarImage} />;
    }
    return (
      <View style={[styles.groupAvatar, { backgroundColor: item.color || '#6366f1' }]}>
        <Text style={styles.groupAvatarText}>{item.name?.[0]?.toUpperCase() || '?'}</Text>
      </View>
    );
  };

  const renderGroup = ({ item }: any) => (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() => navigation.navigate('StudyGroupDetail', { groupId: item.id })}
    >
      {renderGroupAvatar(item)}
      <View style={styles.groupInfo}>
        <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.groupDesc} numberOfLines={1}>
          {item.description || 'Chưa có mô tả'}
        </Text>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, (String(item.isPublic) === 'true' || String(item.isPublic) === '1') ? styles.badgePublic : styles.badgePrivate]}>
            <Ionicons
              name={(String(item.isPublic) === 'true' || String(item.isPublic) === '1') ? 'earth' : 'lock-closed'}
              size={10}
              color={(String(item.isPublic) === 'true' || String(item.isPublic) === '1') ? '#059669' : '#d97706'}
            />
            <Text style={[styles.badgeText, (String(item.isPublic) === 'true' || String(item.isPublic) === '1') ? { color: '#059669' } : { color: '#d97706' }]}>
              {(String(item.isPublic) === 'true' || String(item.isPublic) === '1') ? 'Công khai' : 'Riêng tư'}
            </Text>
          </View>
          {item.memberCount && (
            <Text style={styles.memberCount}>{item.memberCount} thành viên</Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const groups = tab === 'my' ? myGroups : publicGroups;
  const filteredGroups = tab === 'my' 
    ? Array.isArray(groups) ? groups.filter((g: any) => g.name?.toLowerCase().includes(searchQuery.toLowerCase())) : []
    : groups; // publicGroups đã được search trên server

  const [commPostContent, setCommPostContent] = useState('');
  const [isPostingComm, setIsPostingComm] = useState(false);

  const handleLikePost = async (postId: string) => {
    try {
      await studyGroupService.togglePostLike(postId);
      loadGroups();
    } catch (e) {}
  };
  const handleCommentPost = async (postId: string, content: string) => {
    try {
      await studyGroupService.createPostComment(postId, content);
      loadGroups();
    } catch (e) {}
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await studyGroupService.deletePost(postId);
      setCommunityPosts(prev => prev.filter(p => p.id !== postId));
      setSavedPosts(prev => prev.filter(p => p.id !== postId));
      Alert.alert('Thành công', 'Đã xóa bài viết');
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể xóa bài viết');
    }
  };

  const handleCreateCommunityPost = async () => {
    if (!commPostContent.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập nội dung');
      return;
    }

    try {
      setIsPostingComm(true);
      await studyGroupService.createDiscoveryPost(commPostContent.trim());
      setCommPostContent('');
      loadGroups();
      Alert.alert('Thành công', 'Đã đăng bài lên cộng đồng');
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể đăng bài');
    } finally {
      setIsPostingComm(false);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Nhóm học tập</Text>
          <Text style={styles.headerSubtitle}>Học cùng nhau, tiến bộ cùng nhau</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowJoinModal(true)}>
            <Ionicons name="person-add" size={18} color="#6366f1" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerBtn, styles.headerBtnPrimary]} onPress={() => setShowCreateModal(true)}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
          <TouchableOpacity
            style={[styles.tab, tab === 'my' && styles.tabActive]}
            onPress={() => setTab('my')}
          >
            <Text style={[styles.tabText, tab === 'my' && styles.tabTextActive]}>
              Nhóm của tôi
            </Text>
            {tab === 'my' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'public' && styles.tabActive]}
            onPress={() => setTab('public')}
          >
            <Text style={[styles.tabText, tab === 'public' && styles.tabTextActive]}>
              Gợi ý Nhóm
            </Text>
            {tab === 'public' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'community' && styles.tabActive]}
            onPress={() => setTab('community')}
          >
            <Text style={[styles.tabText, tab === 'community' && styles.tabTextActive]}>
              Cộng đồng
            </Text>
            {tab === 'community' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'saved' && styles.tabActive]}
            onPress={() => setTab('saved')}
          >
            <Text style={[styles.tabText, tab === 'saved' && styles.tabTextActive]}>
              Đã lưu
            </Text>
            {tab === 'saved' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Search */}
      {(tab === 'my' || tab === 'public') && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm nhóm..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {/* Content List */}
      {(tab === 'community' || tab === 'saved') ? (
        <FlatList
          data={tab === 'community' ? communityPosts : savedPosts}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            tab === 'community' ? (
              <View style={styles.communityComposer}>
                <View style={styles.composerRow}>
                  <View style={styles.miniAvatar}>
                    <Text style={styles.miniAvatarText}>
                      {user?.firstName?.[0]?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <TextInput
                    style={styles.composerInput}
                    placeholder="Hôm nay bạn học được gì mới không?"
                    placeholderTextColor="#9ca3af"
                    value={commPostContent}
                    onChangeText={setCommPostContent}
                    multiline
                  />
                </View>
                <View style={styles.composerFooter}>
                  <Text style={styles.composerTarget}>Đăng lên Cộng đồng</Text>
                  <TouchableOpacity 
                    style={[styles.miniPostBtn, !commPostContent.trim() && styles.miniPostBtnDisabled]}
                    onPress={handleCreateCommunityPost}
                    disabled={isPostingComm || !commPostContent.trim()}
                  >
                    {isPostingComm ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.miniPostBtnText}>Đăng bài</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <PostCard
              post={item}
              currentUserId={user?.id}
              onLike={handleLikePost}
              onComment={(postId, content) => handleCommentPost(postId, content)}
              onDelete={handleDeletePost}
              onSave={handleSavePost}
              onShare={handleSharePost}
              onToggleComments={(postId) => { /* TODO handle local expansion if needed */ }}
              isCommentsExpanded={false}
              comments={[]}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="chatbubbles-outline" size={32} color="#6366f1" />
              </View>
              <Text style={styles.emptyText}>Chưa có bài viết nào từ cộng đồng</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredGroups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroup}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={32} color="#6366f1" />
              </View>
              <Text style={styles.emptyText}>
                {tab === 'my' ? 'Chưa tham gia nhóm nào' : 'Không có nhóm công khai'}
              </Text>
              {tab === 'my' && (
                <TouchableOpacity style={styles.emptyAction} onPress={() => setShowCreateModal(true)}>
                  <Text style={styles.emptyActionText}>Tạo nhóm mới</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Join Modal */}
      <Modal visible={showJoinModal} transparent animationType="fade" onRequestClose={() => setShowJoinModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tham gia nhóm</Text>
              <TouchableOpacity onPress={() => { setShowJoinModal(false); setJoinCode(''); }}>
                <Ionicons name="close" size={20} color="#374151" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>Nhập mã mời</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Mã mời..."
              placeholderTextColor="#9ca3af"
              value={joinCode}
              onChangeText={setJoinCode}
              autoFocus
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => { setShowJoinModal(false); setJoinCode(''); }}
              >
                <Text style={styles.modalBtnCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnJoin]} onPress={handleJoinByCode}>
                <Text style={styles.modalBtnJoinText}>Tham gia</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.createModalOverlay}>
          <View style={styles.createModalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo nhóm mới</Text>
              <TouchableOpacity onPress={() => { setShowCreateModal(false); resetCreateForm(); }}>
                <Ionicons name="close" size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.createModalScroll} showsVerticalScrollIndicator={false}>
              {/* Avatar Picker */}
              <View style={styles.avatarPickerContainer}>
                <TouchableOpacity style={styles.avatarPickerButton} onPress={pickAvatar}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatarPreview} />
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

              {/* Group Name */}
              <Text style={styles.modalLabel}>Tên nhóm</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="VD: Toán lớp 10"
                placeholderTextColor="#9ca3af"
                value={groupName}
                onChangeText={setGroupName}
                maxLength={50}
              />

              {/* Description */}
              <Text style={styles.modalLabel}>Mô tả</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextarea]}
                placeholder="Mục tiêu của nhóm, các chủ đề sẽ thảo luận..."
                placeholderTextColor="#9ca3af"
                value={groupDesc}
                onChangeText={setGroupDesc}
                maxLength={200}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Rules */}
              <Text style={styles.modalLabel}>Nội quy nhóm</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextarea]}
                placeholder={'1. Tôn trọng lẫn nhau\n2. Không share link spam\n3. Tập trung học tập...'}
                placeholderTextColor="#9ca3af"
                value={groupRules}
                onChangeText={setGroupRules}
                maxLength={500}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* Public/Private Toggle */}
              <View style={styles.visibilityContainer}>
                <TouchableOpacity
                  style={[styles.visibilityOption, isPublic && styles.visibilityOptionActive]}
                  onPress={() => setIsPublic(true)}
                >
                  <View style={[styles.visibilityIcon, isPublic && styles.visibilityIconActive]}>
                    <Ionicons name="earth" size={18} color={isPublic ? '#fff' : '#6366f1'} />
                  </View>
                  <View style={styles.visibilityInfo}>
                    <Text style={[styles.visibilityTitle, isPublic && styles.visibilityTitleActive]}>Công khai</Text>
                    <Text style={styles.visibilityDesc}>Ai cũng có thể tìm thấy</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.visibilityOption, !isPublic && styles.visibilityOptionActive]}
                  onPress={() => setIsPublic(false)}
                >
                  <View style={[styles.visibilityIcon, !isPublic && styles.visibilityIconActive]}>
                    <Ionicons name="lock-closed" size={18} color={!isPublic ? '#fff' : '#6366f1'} />
                  </View>
                  <View style={styles.visibilityInfo}>
                    <Text style={[styles.visibilityTitle, !isPublic && styles.visibilityTitleActive]}>Riêng tư</Text>
                    <Text style={styles.visibilityDesc}>Cần mã mời để tham gia</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Create Button */}
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnCreate, creating && { opacity: 0.6 }]}
              onPress={handleCreateGroup}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalBtnCreateText}>Tạo nhóm</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );

  function resetCreateForm() {
    setGroupName('');
    setGroupDesc('');
    setGroupRules('');
    setIsPublic(true);
    setAvatarUri(null);
  }
};

export default StudyGroupsListScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a1a' },
  headerSubtitle: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#f5f5f5',
    justifyContent: 'center', alignItems: 'center',
  },
  headerBtnPrimary: { backgroundColor: '#6366f1' },

  // Tabs
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16 },
  tab: { paddingVertical: 12, marginRight: 20, position: 'relative' },
  tabActive: {},
  tabText: { fontSize: 14, fontWeight: '600', color: '#9ca3af' },
  tabTextActive: { color: '#1a1a1a' },
  tabIndicator: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 2, backgroundColor: '#6366f1', borderRadius: 1,
  },

  // Search
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 16, marginTop: 12, marginBottom: 8,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: '#f0f0f0',
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1a1a1a' },

  // List
  listContent: { padding: 16 },
  groupCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#f0f0f0',
  },
  groupAvatar: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  groupAvatarImage: {
    width: 48, height: 48, borderRadius: 14, marginRight: 12,
  },
  groupAvatarText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  groupDesc: { fontSize: 13, color: '#6b7280', marginBottom: 6 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  badgePublic: { backgroundColor: '#ecfdf5' },
  badgePrivate: { backgroundColor: '#fffbeb' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  memberCount: { fontSize: 11, color: '#9ca3af' },

  // Empty
  emptyContainer: { paddingVertical: 60, alignItems: 'center' },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: '#eef2ff',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyText: { fontSize: 15, color: '#6b7280', marginBottom: 16 },
  emptyAction: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#6366f1', borderRadius: 10 },
  emptyActionText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  modalLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  modalInput: {
    backgroundColor: '#f8f9fc', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#1a1a1a', borderWidth: 1, borderColor: '#f0f0f0', marginBottom: 16,
  },
  modalTextarea: { minHeight: 80 },
  modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: '#f5f5f5', flex: 1 },
  modalBtnCancelText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  modalBtnJoin: { backgroundColor: '#6366f1', flex: 1 },
  modalBtnJoinText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  modalBtnCreate: { backgroundColor: '#6366f1', marginTop: 8 },
  modalBtnCreateText: { fontSize: 15, fontWeight: '600', color: '#fff' },

  // Create Modal
  createModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  createModalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    maxHeight: '90%',
  },
  createModalScroll: { marginBottom: 16 },

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

  // Visibility Options
  visibilityContainer: { gap: 10, marginBottom: 16 },
  visibilityOption: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#f0f0f0', backgroundColor: '#fff',
  },
  visibilityOptionActive: { borderColor: '#6366f1', backgroundColor: '#eef2ff' },
  visibilityIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#f5f5f5',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  visibilityIconActive: { backgroundColor: '#6366f1' },
  visibilityInfo: { flex: 1 },
  visibilityTitle: { fontSize: 14, fontWeight: '700', color: '#374151' },
  visibilityTitleActive: { color: '#6366f1' },
  visibilityDesc: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  communityComposer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  miniAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniAvatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  composerInput: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
    paddingTop: 8,
    minHeight: 40,
  },
  composerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  composerTarget: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10b981',
    textTransform: 'uppercase',
  },
  miniPostBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  miniPostBtnDisabled: {
    backgroundColor: '#d1d5db',
  },
  miniPostBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
