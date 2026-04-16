import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Text,
  Alert,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as studyGroupService from '../../services/studyGroupService';
import { useAuthStore } from '../../store/authStore';
import { useGroupSocket } from '../../hooks/useGroupSocket';
import { TYPOGRAPHY } from '../../theme/typography';
import ChatMarkdownMessage from '../../components/ChatMarkdownMessage';

const hasComplexMarkdownStructure = (value: string): boolean => {
  const text = String(value || '');
  return /```|`|\n|^\s*[-*+]\s|^\s*\d+\.\s|^\s*>|\$\$|\\\(|\\\[|\\\]|\|.+\|/m.test(text);
};

const StudyGroupChatScreen = ({ route, navigation }: any) => {
  const { groupId } = route.params;
  const { user } = useAuthStore();

  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionList, setSuggestionList] = useState<any[]>([]);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    loadGroupInfo();
    loadMessages(true);
  }, [groupId]);

  // Socket for real-time messages
  const { activeUsers } = useGroupSocket({
    groupId,
    userId: user?.id || '',
    onNewMessage: (newMsg) => {
      setMessages(prev => {
        // Check if message already exists (either as temp or already received)
        const exists = prev.some(m => m._id === newMsg._id || m._id === newMsg.id);
        if (exists) return prev;

        // Try to find if this is a response to our just-sent temp message
        // We look for a temp message with the same content sent by us recently
        const tempIndex = prev.findIndex(m => 
          m._id.startsWith('temp-') && 
          m.userId === newMsg.userId && 
          m.content === newMsg.content
        );

        if (tempIndex !== -1) {
          const updated = [...prev];
          updated[tempIndex] = newMsg;
          return updated;
        }

        return [...prev, newMsg];
      });

      // Always scroll to bottom for new messages
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    },
  });

  const loadGroupInfo = async () => {
    try {
      const groupData = await studyGroupService.getStudyGroupDetail(groupId);
      setGroupName(groupData.name || 'Nhóm học tập');
      setGroupMembers(groupData.members || groupData.GroupMembers || []);
    } catch (error) {
      console.error('Error loading group info:', error);
    }
  };

  const loadMessages = async (initial = false) => {
    try {
      if (initial) {
        setLoading(true);
        setOffset(0);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      const limit = 20;
      const currentOffset = initial ? 0 : offset;

      const msgs: any = await studyGroupService.getMessages(groupId, limit, currentOffset);
      const msgsArray: any[] = Array.isArray(msgs) ? msgs : msgs?.data || msgs?.messages || [];

      if (initial) {
        setMessages(msgsArray);
        setOffset(msgsArray.length);
        if (msgsArray.length < limit) setHasMore(false);

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
          isInitialLoad.current = false;
        }, 100);
      } else {
        if (msgsArray.length < limit) setHasMore(false);

        setMessages(prev => [...msgsArray.reverse(), ...prev]);
        setOffset(prev => prev + msgsArray.length);
        setLoadingMore(false);
      }
    } catch (error: any) {
      console.error('Error loading messages:', error);
      setLoadingMore(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loadingMore && !loading && !isInitialLoad.current) {
      loadMessages(false);
    }
  }, [hasMore, loadingMore, loading]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || sending) return;

    try {
      setSending(true);
      const text = inputText.trim();
      setInputText('');
      Keyboard.dismiss();

      const tempMsg = {
        _id: `temp-${Date.now()}`,
        groupId,
        userId: user?.id,
        content: text,
        type: 'TEXT',
        createdAt: new Date().toISOString(),
        user: { firstName: user?.firstName, lastName: user?.lastName },
        replyTo: replyingTo ? {
          userId: replyingTo.userId,
          content: replyingTo.content,
          user: replyingTo.user,
        } : null,
      };
      setMessages(prev => [...prev, tempMsg]);
      
      const replyId = replyingTo?._id;
      setReplyingTo(null);

      // Luôn gửi tin nhắn của người dùng vào nhóm trước
      await studyGroupService.sendMessage(groupId, text, 'TEXT', undefined, replyId);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn');
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (text: string) => {
    setInputText(text);
    const lastWord = text.split(' ').pop() || '';
    if (lastWord.startsWith('@')) {
      const query = lastWord.slice(1).toLowerCase();
      const members = groupMembers.map(m => ({ id: m.userId, name: `${m.user?.firstName} ${m.user?.lastName}`, type: 'MEMBER' }));
      const all = [
        { id: 'ai', name: 'ai (Trợ lý học tập)', type: 'AI' },
        { id: 'summary', name: 'summary (Tóm tắt thảo luận)', type: 'AI' },
        ...members
      ];
      const filtered = all.filter(item => item.name.toLowerCase().includes(query));
      
      if (filtered.length > 0) {
        setSuggestionList(filtered);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const applySuggestion = (item: any) => {
    const words = inputText.split(' ');
    words.pop(); // Remove the @query
    const newText = [...words, `@${item.name.split(' (')[0]} `].join(' ').trimStart();
    setInputText(newText);
    setShowSuggestions(false);
  };

  const renderContentWithMentions = (content: string, isOwnMessage: boolean, isAi: boolean) => {
    if (!content) return null;

    const parts = content.split(/(@[\w\d.-]+)/g);
    return (
      <Text style={[
        styles.textMessage,
        isOwnMessage ? styles.ownTextMessage : (isAi ? styles.aiTextMessage : styles.otherTextMessage),
      ]}>
        {parts.map((part, index) => {
          if (part.startsWith('@')) {
            return (
              <Text key={index} style={styles.mentionText}>
                {part}
              </Text>
            );
          }
          return part;
        })}
      </Text>
    );
  };

  const renderMessage = ({ item, index }: any) => {
    const isOwnMessage = item.userId === user?.id;
    const isAi = item.userId === 'AI_ASSISTANT';
    const isInitial = index === 0;
    const showAvatar = isInitial || messages[index - 1].userId !== item.userId;
    const showName = !isOwnMessage && showAvatar;

    return (
      <View style={[
        styles.messageRow,
        isOwnMessage && styles.ownMessageRow,
        !showAvatar && styles.messageRowCompact,
      ]}>
        <View style={[styles.avatarContainer, !showAvatar && styles.avatarHidden]}>
          <View style={[
            styles.avatar,
            isOwnMessage ? styles.ownAvatar : (isAi ? styles.aiAvatar : styles.otherAvatar),
          ]}>
            <Text style={[
              styles.avatarText,
              isOwnMessage ? styles.ownAvatarText : (isAi ? styles.aiAvatarText : styles.otherAvatarText),
            ]}>
              {isAi ? 'AI' : (item.user?.firstName?.[0]?.toUpperCase() || 'U')}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[
            styles.messageContent,
            isOwnMessage ? styles.ownMessageContent : styles.otherMessageContent,
          ]}
          onLongPress={() => setReplyingTo(item)}
          activeOpacity={0.8}
        >
          {showName && (
            <Text style={styles.senderName}>
              {isAi ? 'Hệ thống AI' : `${item.user?.firstName} ${item.user?.lastName}`}
            </Text>
          )}

          {item.type === 'TEXT' ? (
            <View style={[
              styles.textBubble,
              isOwnMessage ? styles.ownTextBubble : (isAi ? styles.aiTextBubble : styles.otherTextBubble),
            ]}>
              {item.replyTo && (
                <View style={[
                  styles.replyContext,
                  isOwnMessage ? styles.ownReplyContext : styles.otherReplyContext
                ]}>
                  <Text style={styles.replySender} numberOfLines={1}>
                    {item.replyTo.userId === user?.id ? 'Bạn' : (item.replyTo.user?.firstName || 'AI')}
                  </Text>
                  <Text style={styles.replyText} numberOfLines={1}>
                    {item.replyTo.content}
                  </Text>
                </View>
              )}
              <ChatMarkdownMessage 
                content={item.content}
                isUser={isOwnMessage}
                fillWidth={isAi || hasComplexMarkdownStructure(item.content)}
              />
            </View>
          ) : item.type === 'RESULT' ? (
            <View style={styles.resultCard}>
              <View style={styles.resultCardHeader}>
                <View style={styles.resultIconContainer}>
                  <Ionicons name="trophy" size={16} color="#fff" />
                </View>
                <View style={styles.resultCardInfo}>
                  <Text style={styles.resultCardLabel}>Kết quả bài tập</Text>
                  <Text style={styles.resultCardTitle} numberOfLines={1}>
                    {item.resource?.exercise?.title || 'Bài tập'}
                  </Text>
                </View>
              </View>
              <View style={styles.resultCardBody}>
                <View style={styles.resultScoreSection}>
                  <Text style={styles.resultScoreLabel}>Điểm số</Text>
                  <Text style={styles.resultScoreValue}>
                    {item.resource?.score?.toFixed(1) || '0'}
                    <Text style={styles.resultScoreTotal}>/10</Text>
                  </Text>
                </View>
                <View style={styles.resultDivider} />
                <View style={styles.resultCorrectSection}>
                  <Text style={styles.resultScoreLabel}>Đúng/Tổng</Text>
                  <Text style={styles.resultCorrectValue}>
                    {item.resource?.correctCount || 0}
                    <Text style={styles.resultCorrectTotal}>/{item.resource?.totalQuestions || 0}</Text>
                  </Text>
                </View>
              </View>
              <View style={styles.resultCardFooter}>
                <Text style={styles.resultCardFooterText}>
                  {item.user?.firstName} {item.user?.lastName}
                </Text>
                <Text style={styles.resultCardFooterText}>
                  {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.resourceCard}>
              <View style={styles.resourceCardHeader}>
                <View style={[
                  styles.resourceIconContainer,
                  item.type === 'DOCUMENT' ? styles.docIcon : styles.exerciseIcon,
                ]}>
                  <Ionicons
                    name={item.type === 'DOCUMENT' ? 'document' : 'clipboard'}
                    size={16}
                    color="#fff"
                  />
                </View>
                <View style={styles.resourceCardInfo}>
                  <Text style={styles.resourceCardLabel}>
                    {item.type === 'DOCUMENT' ? 'Học liệu' : 'Bài tập'}
                  </Text>
                  <Text style={styles.resourceCardTitle} numberOfLines={1}>
                    {item.resource?.title || 'Chưa đặt tên'}
                  </Text>
                </View>
              </View>
              <View style={styles.resourceCardMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name={item.type === 'DOCUMENT' ? 'document-text-outline' : 'list-outline'} size={10} color="#8B5CF6" />
                  <Text style={styles.metaValue}>
                    {item.type === 'DOCUMENT'
                      ? (item.resource?.fileType?.toUpperCase() || 'PDF')
                      : `${item.resource?.questionCount || 0} câu`}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={10} color="#6b7280" />
                  <Text style={styles.metaValue}>
                    {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.resourceCardAction}
                onPress={() => {
                  if (item.type === 'DOCUMENT' && item.resourceId) {
                    navigation.navigate('PDFViewer', { documentId: item.resourceId });
                  } else if (item.resourceId) {
                    navigation.navigate('ExerciseDetail', { exerciseId: item.resourceId });
                  }
                }}
              >
                <Text style={styles.resourceCardActionText}>
                  {item.type === 'DOCUMENT' ? 'Xem tài liệu' : 'Làm bài'}
                </Text>
                <Ionicons name="arrow-forward" size={12} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          </TouchableOpacity>
          <Text style={[
            styles.messageTime,
            isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
          ]}>
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
    );
  };

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text>Chưa đăng nhập</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#8B5CF6" />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle} numberOfLines={1}>{groupName}</Text>
              <View style={styles.onlineIndicator}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Đang kết nối</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => navigation.navigate('StudyGroupDetail', { groupId })}
              style={styles.infoButton}
            >
              <Ionicons name="information-circle-outline" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubble-ellipses-outline" size={28} color="#8B5CF6" />
            </View>
            <Text style={styles.emptyTitle}>Chưa có tin nhắn</Text>
            <Text style={styles.emptySubtitle}>Hãy bắt đầu cuộc trò chuyện!</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item._id || item.id || Math.random().toString()}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.1}
            ListHeaderComponent={
              loadingMore ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color="#8B5CF6" />
                </View>
              ) : null
            }
          />
        )}

        {/* Suggestions Overlay */}
        {showSuggestions && (
          <View style={styles.suggestionOverlay}>
            {suggestionList.map((item, idx) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.suggestionItem, idx < suggestionList.length - 1 && styles.suggestionDivider]}
                onPress={() => applySuggestion(item)}
              >
                <Ionicons name={item.type === 'AI' ? 'sparkles' : 'person'} size={14} color="#8B5CF6" />
                <Text style={styles.suggestionText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          {replyingTo && (
            <View style={styles.replyPreviewContainer}>
              <View style={styles.replyPreviewBadge} />
              <View style={styles.replyPreviewContent}>
                <Text style={styles.replyPreviewTitle}>
                  Đang trả lời {replyingTo.userId === user?.id ? 'chính mình' : (replyingTo.user?.firstName || 'AI')}
                </Text>
                <Text style={styles.replyPreviewText} numberOfLines={1}>
                  {replyingTo.content}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setReplyingTo(null)} style={styles.closeReplyButton}>
                <Ionicons name="close-circle" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Hỏi AI @ai hoặc nhắn tin..."
              placeholderTextColor="#9ca3af"
              value={inputText}
              onChangeText={handleInputChange}
              multiline
              editable={!sending}
              maxLength={1000}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || sending) && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={sending || !inputText.trim()}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={16} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default StudyGroupChatScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f5f9' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiButton: { padding: 4 },
  backButton: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center',
  },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: TYPOGRAPHY.size.h3, fontWeight: TYPOGRAPHY.weight.black, color: '#111827' },
  onlineIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },
  onlineText: { fontSize: TYPOGRAPHY.size.small - 1, fontWeight: TYPOGRAPHY.weight.bold, color: '#9ca3af' },
  infoButton: { padding: 4 },

  // Messages
  messagesList: { flex: 1 },
  messagesContent: { paddingHorizontal: 12, paddingVertical: 12 },
  loadingMore: { paddingVertical: 8, alignItems: 'center' },

  // Message Row
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 8 },
  ownMessageRow: { flexDirection: 'row-reverse' },
  messageRowCompact: { marginTop: 2 },

  // Avatar
  avatarContainer: { width: 24, alignItems: 'center' },
  avatarHidden: { opacity: 0 },
  avatar: { width: 24, height: 24, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  ownAvatar: { backgroundColor: '#8B5CF6' },
  otherAvatar: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  aiAvatar: { backgroundColor: '#8b5cf6' },
  avatarText: { fontSize: 9, fontWeight: '700' },
  ownAvatarText: { color: '#fff' },
  otherAvatarText: { color: '#8B5CF6' },
  aiAvatarText: { color: '#fff' },

  // Message Content
  messageContent: { maxWidth: '78%' },
  ownMessageContent: { alignItems: 'flex-end' },
  otherMessageContent: { alignItems: 'flex-start' },
  senderName: { fontSize: TYPOGRAPHY.size.body - 1, fontWeight: TYPOGRAPHY.weight.bold, color: '#4b5563', marginBottom: 2, marginLeft: 12 },

  // Text Bubble
  textBubble: { borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7 },
  ownTextBubble: { backgroundColor: '#8B5CF6', borderBottomRightRadius: 3 },
  otherTextBubble: { backgroundColor: '#fff', borderBottomLeftRadius: 3, borderWidth: 1, borderColor: '#f3f4f6' },
  aiTextBubble: { backgroundColor: '#f5f3ff', borderBottomLeftRadius: 3, borderWidth: 1, borderColor: '#ddd6fe' },
  textMessage: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  ownTextMessage: { fontSize: TYPOGRAPHY.size.body, color: '#fff', lineHeight: TYPOGRAPHY.size.body * 1.4 },
  otherTextMessage: { fontSize: TYPOGRAPHY.size.body, color: '#1f2937', lineHeight: TYPOGRAPHY.size.body * 1.4 },
  aiTextMessage: { color: '#5b21b6' },

  // Result Card - thu nhỏ
  resultCard: {
    backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden',
    minWidth: 200, maxWidth: 260, borderWidth: 1, borderColor: '#d1fae5',
  },
  resultCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, backgroundColor: '#ecfdf5',
  },
  resultIconContainer: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: '#059669',
    justifyContent: 'center', alignItems: 'center',
  },
  resultCardInfo: { flex: 1 },
  resultCardLabel: { fontSize: 7, fontWeight: '700', color: '#059669', textTransform: 'uppercase', letterSpacing: 0.5 },
  resultCardTitle: { fontSize: 11, fontWeight: '600', color: '#111827' },
  resultCardBody: { padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  resultScoreLabel: { fontSize: 7, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 },
  resultScoreValue: { fontSize: 18, fontWeight: '800', color: '#059669' },
  resultScoreTotal: { fontSize: 10, color: '#9ca3af' },
  resultScoreSection: { alignItems: 'center' },
  resultDivider: { width: 1, height: 30, backgroundColor: '#f3f4f6' },
  resultCorrectSection: { alignItems: 'center' },
  resultCorrectValue: { fontSize: 16, fontWeight: '800', color: '#111827' },
  resultCorrectTotal: { fontSize: 10, color: '#9ca3af' },
  resultCardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#f9fafb',
  },
  resultCardFooterText: { fontSize: 7, fontWeight: '600', color: '#9ca3af' },

  // Resource Card - thu nhỏ
  resourceCard: {
    backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden',
    minWidth: 220, maxWidth: 280, borderWidth: 1, borderColor: '#e5e7eb',
  },
  resourceCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, backgroundColor: '#f9fafb',
  },
  resourceIconContainer: {
    width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center',
  },
  docIcon: { backgroundColor: '#8B5CF6' },
  exerciseIcon: { backgroundColor: '#8B5CF6' },
  resourceCardInfo: { flex: 1 },
  resourceCardLabel: { fontSize: TYPOGRAPHY.size.tiny, fontWeight: TYPOGRAPHY.weight.black, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: 0.5 },
  resourceCardTitle: { fontSize: TYPOGRAPHY.size.small, fontWeight: TYPOGRAPHY.weight.semibold, color: '#111827' },
  resourceCardMeta: {
    flexDirection: 'row', gap: 10, padding: 8, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f3f4f6',
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaValue: { fontSize: TYPOGRAPHY.size.tiny, fontWeight: TYPOGRAPHY.weight.semibold, color: '#374151' },
  resourceCardAction: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 10, backgroundColor: '#8B5CF6',
  },
  resourceCardActionText: { fontSize: TYPOGRAPHY.size.tiny, fontWeight: TYPOGRAPHY.weight.black, color: '#fff', textTransform: 'uppercase', letterSpacing: 1 },

  // Timestamp
  messageTime: { fontSize: TYPOGRAPHY.size.tiny, fontWeight: TYPOGRAPHY.weight.medium, color: '#d1d5db', marginTop: 2, marginLeft: 2 },
  ownMessageTime: { color: 'rgba(255,255,255,0.5)' },
  otherMessageTime: { color: '#9ca3af' },

  // Empty State
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  emptyIcon: {
    width: 48, height: 48, borderRadius: 16, backgroundColor: '#eef2ff',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  emptyTitle: { fontSize: TYPOGRAPHY.size.h3, fontWeight: TYPOGRAPHY.weight.bold, color: '#111827', marginBottom: 4 },
  emptySubtitle: { fontSize: TYPOGRAPHY.size.small, fontWeight: TYPOGRAPHY.weight.medium, color: '#9ca3af', textAlign: 'center' },

  // Input
  inputContainer: {
    backgroundColor: '#fff', paddingHorizontal: 10, paddingTop: 6, paddingBottom: Platform.OS === 'ios' ? 20 : 6,
    borderTopWidth: 1, borderTopColor: '#e5e7eb',
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#f3f4f6',
    borderRadius: 18, paddingHorizontal: 4, paddingVertical: 3,
  },
  input: {
    flex: 1, paddingHorizontal: 8, paddingVertical: 8, fontSize: TYPOGRAPHY.size.body,
    color: '#1f2937', maxHeight: 80, minHeight: 32,
  },
  sendButton: {
    width: 34, height: 34, borderRadius: 14, backgroundColor: '#8B5CF6',
    justifyContent: 'center', alignItems: 'center', marginBottom: 1,
  },
  sendButtonDisabled: { backgroundColor: '#d1d5db' },

  // Suggestions
  suggestionOverlay: {
    position: 'absolute', bottom: 70, left: 10, right: 10,
    backgroundColor: '#fff', borderRadius: 12, elevation: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, zIndex: 100,
    borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 15, paddingVertical: 12,
  },
  suggestionDivider: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  suggestionText: { fontSize: TYPOGRAPHY.size.body, fontWeight: TYPOGRAPHY.weight.semibold, color: '#374151' },

  // Mentions
  mentionText: { color: '#8b5cf6', fontWeight: '700' },

  // Reply Context in Bubble
  replyContext: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 6,
    borderRadius: 8,
    borderLeftWidth: 3,
    marginBottom: 6,
    minWidth: 120,
  },
  ownReplyContext: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderLeftColor: '#fff',
  },
  otherReplyContext: {
    borderLeftColor: '#8B5CF6',
  },
  replySender: {
    fontSize: TYPOGRAPHY.size.tiny,
    fontWeight: TYPOGRAPHY.weight.black,
    color: '#8B5CF6',
    marginBottom: 2,
  },
  replyText: {
    fontSize: TYPOGRAPHY.size.small,
    color: '#4b5563',
  },

  // Reply Preview above Input
  replyPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f9fafb',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 6,
  },
  replyPreviewBadge: {
    width: 3,
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 1.5,
    marginRight: 10,
  },
  replyPreviewContent: {
    flex: 1,
  },
  replyPreviewTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8B5CF6',
    marginBottom: 2,
  },
  replyPreviewText: {
    fontSize: 11,
    color: '#6b7280',
  },
  closeReplyButton: {
    padding: 4,
  },
});
