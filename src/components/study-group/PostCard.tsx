import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PostCardProps {
  post: any;
  currentUserId?: string;
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  onToggleComments: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onSave?: (postId: string) => void;
  onShare?: (post: any) => void;
  isCommentsExpanded: boolean;
  comments: any[];
}

const PostCard = ({
  post,
  currentUserId,
  onLike,
  onComment,
  onToggleComments,
  onDelete,
  onSave,
  onShare,
  isCommentsExpanded,
  comments,
}: PostCardProps) => {
  const [commentInput, setCommentInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const isLiked = currentUserId ? post.likedUserIds?.includes(currentUserId) : false;
  const isSaved = post.isSaved;
  const fullName = post.author ? `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() : 'Người dùng';
  
  const isAuthor = currentUserId === post.userId;
  const isGroupAdmin = post.group?.ownerId === currentUserId;
  const canDelete = isAuthor || isGroupAdmin;

  const shouldTruncate = post.content && post.content.length > 150;
  const displayedContent = isExpanded ? post.content : post.content?.slice(0, 150);

  const handleMorePress = () => {
    const buttons: any[] = [
      { text: 'Hủy', style: 'cancel' },
      { text: isSaved ? 'Bỏ lưu bài viết' : 'Lưu bài viết', onPress: () => onSave?.(post.id) },
      { text: 'Chia sẻ bài viết', onPress: () => onShare?.(post) }
    ];

    if (canDelete) {
      buttons.push({ 
        text: 'Xóa bài viết', 
        style: 'destructive', 
        onPress: () => {
          Alert.alert(
            'Xác nhận',
            'Bạn có chắc chắn muốn xóa bài viết này?',
            [
              { text: 'Hủy', style: 'cancel' },
              { text: 'Xóa', style: 'destructive', onPress: () => onDelete?.(post.id) }
            ]
          );
        } 
      });
    }
    
    Alert.alert('Tùy chọn', 'Chọn hành động cho bài viết này', buttons);
  };

  const handleCommentSubmit = () => {
    if (!commentInput.trim()) return;
    onComment(post.id, commentInput);
    setCommentInput('');
  };

  const renderAvatar = (name: string, url?: string, size = 40) => {
    if (url) {
      return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
    }
    return (
      <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{name?.[0]?.toUpperCase() || 'U'}</Text>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        {post.group?.avatarUrl ? (
          renderAvatar(post.group.name, post.group.avatarUrl, 42)
        ) : (
          renderAvatar(fullName, post.author?.avatarUrl, 42)
        )}
        <View style={styles.headerInfo}>
          {post.group ? (
            <>
              <Text style={styles.groupName}>{post.group.name}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.authorSubName}>{fullName}</Text>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.timeText}>
                  {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                </Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.authorName}>{fullName}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.communityText}>Cộng đồng</Text>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.timeText}>
                  {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                </Text>
              </View>
            </>
          )}
        </View>
        <TouchableOpacity style={styles.moreBtn} onPress={handleMorePress}>
          <Ionicons name="ellipsis-vertical" size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.contentText}>
          {displayedContent}
          {shouldTruncate && !isExpanded && '...'}
        </Text>
        {shouldTruncate && !isExpanded && (
          <TouchableOpacity onPress={() => setIsExpanded(true)}>
            <Text style={styles.readMoreText}>Xem thêm</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Image */}
      {post.imageUrl && (
        <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <Text style={styles.statText}>{post.likeCount || 0} lượt thích</Text>
        <Text style={styles.statText}>{post.commentCount || 0} bình luận</Text>
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onLike(post.id)}>
          <Ionicons name={isLiked ? "heart" : "heart-outline"} size={22} color={isLiked ? "#f43f5e" : "#6b7280"} />
          <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>Thích</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionBtn} onPress={() => onToggleComments(post.id)}>
          <Ionicons name="chatbubble-outline" size={20} color="#6b7280" />
          <Text style={styles.actionText}>Bình luận</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => onSave?.(post.id)}>
          <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={20} color={isSaved ? "#f59e0b" : "#6b7280"} />
          <Text style={[styles.actionText, isSaved && { color: '#f59e0b' }]}>Lưu</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => onShare?.(post)}>
          <Ionicons name="share-social-outline" size={20} color="#6b7280" />
          <Text style={styles.actionText}>Chia sẻ</Text>
        </TouchableOpacity>
      </View>

      {/* Comments Section */}
      {isCommentsExpanded && (
        <View style={styles.commentsSection}>
          {comments.map((comment: any) => (
            <View key={comment.id} style={styles.commentItem}>
              {renderAvatar(comment.author?.firstName || 'U', comment.author?.avatarUrl, 32)}
              <View style={styles.commentBubble}>
                <Text style={styles.commentAuthor}>
                  {comment.author ? `${comment.author.firstName} ${comment.author.lastName}`.trim() : 'Người dùng'}
                </Text>
                <Text style={styles.commentContent}>{comment.content}</Text>
              </View>
            </View>
          ))}

          {/* Comment Input */}
          <View style={styles.commentInputRow}>
            {renderAvatar('U', undefined, 32)}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Viết bình luận..."
                value={commentInput}
                onChangeText={setCommentInput}
                multiline
              />
              <TouchableOpacity 
                style={[styles.sendBtn, !commentInput.trim() && styles.sendBtnDisabled]}
                onPress={handleCommentSubmit}
                disabled={!commentInput.trim()}
              >
                <Ionicons name="send" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  avatarPlaceholder: {
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '700',
    color: '#6366f1',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  groupName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4f46e5',
  },
  authorSubName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },
  communityText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10b981',
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timeText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  dot: {
    color: '#d1d5db',
    marginHorizontal: 6,
  },
  subjectBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  subjectText: {
    fontSize: 10,
    fontWeight: '700',
  },
  moreBtn: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  contentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  readMoreText: {
    color: '#6366f1',
    fontWeight: '600',
    marginTop: 4,
  },
  postImage: {
    width: '100%',
    height: 250,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  statText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  actionTextActive: {
    color: '#f43f5e',
  },
  commentsSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginTop: 8,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 10,
    marginLeft: 8,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  commentContent: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    maxHeight: 80,
    minHeight: 32,
    fontSize: 13,
    color: '#1a1a1a',
  },
  sendBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendBtnDisabled: {
    backgroundColor: '#d1d5db',
  },
});

export default PostCard;
