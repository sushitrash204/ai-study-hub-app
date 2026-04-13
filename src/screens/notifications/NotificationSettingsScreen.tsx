import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNotificationPreferences } from '../../hooks/notifications/useNotificationPreferences';
import { NotificationType } from '../../types/notification';

const notificationGroups = [
  {
    name: 'Nhóm học tập',
    icon: '👥',
    types: [
      NotificationType.GROUP_MEMBER_JOINED,
      NotificationType.GROUP_MEMBER_LEFT,
      NotificationType.GROUP_JOIN_REQUEST,
      NotificationType.GROUP_JOIN_ACCEPTED,
      NotificationType.GROUP_JOIN_REJECTED,
      NotificationType.GROUP_RESOURCE_SHARED,
      NotificationType.GROUP_RESULT_SHARED,
      NotificationType.GROUP_INVITATION,
    ],
  },
  {
    name: 'Bài tập',
    icon: '📝',
    types: [
      NotificationType.EXERCISE_READY,
      NotificationType.EXERCISE_GRADED,
      NotificationType.EXERCISE_LOW_SCORE,
      NotificationType.EXERCISE_ACHIEVEMENT,
    ],
  },
  {
    name: 'Tài liệu',
    icon: '📄',
    types: [
      NotificationType.DOCUMENT_READY,
      NotificationType.DOCUMENT_FAILED,
      NotificationType.DOCUMENT_SUMMARY_READY,
      NotificationType.DOCUMENT_SHARED,
    ],
  },
  {
    name: 'Chat & AI',
    icon: '🤖',
    types: [
      NotificationType.AI_RESPONSE_READY,
      NotificationType.CHAT_TIMEOUT,
    ],
  },
  {
    name: 'Hệ thống & Tài khoản',
    icon: '⚙️',
    types: [
      NotificationType.PASSWORD_CHANGED,
      NotificationType.PROFILE_UPDATED,
      NotificationType.NEW_SUBJECT_AVAILABLE,
      NotificationType.SYSTEM_ANNOUNCEMENT,
      NotificationType.WELCOME,
    ],
  },
];

const typeLabels: Record<string, string> = {
  [NotificationType.GROUP_MEMBER_JOINED]: 'Thành viên mới tham gia nhóm',
  [NotificationType.GROUP_MEMBER_LEFT]: 'Thành viên rời nhóm',
  [NotificationType.GROUP_JOIN_REQUEST]: 'Có yêu cầu tham gia nhóm',
  [NotificationType.GROUP_JOIN_ACCEPTED]: 'Yêu cầu tham gia được chấp nhận',
  [NotificationType.GROUP_JOIN_REJECTED]: 'Yêu cầu tham gia bị từ chối',
  [NotificationType.GROUP_RESOURCE_SHARED]: 'Có người chia sẻ tài liệu',
  [NotificationType.GROUP_RESULT_SHARED]: 'Có người chia sẻ kết quả',
  [NotificationType.GROUP_INVITATION]: 'Nhận lời mời vào nhóm',
  [NotificationType.EXERCISE_READY]: 'Tạo bài tập thành công',
  [NotificationType.EXERCISE_GRADED]: 'Bài tập được chấm điểm',
  [NotificationType.EXERCISE_LOW_SCORE]: 'Cảnh báo điểm thấp',
  [NotificationType.EXERCISE_ACHIEVEMENT]: 'Đạt thành tích cao',
  [NotificationType.DOCUMENT_READY]: 'Upload tài liệu thành công',
  [NotificationType.DOCUMENT_FAILED]: 'Xử lý tài liệu thất bại',
  [NotificationType.DOCUMENT_SUMMARY_READY]: 'Tóm tắt tài liệu xong',
  [NotificationType.DOCUMENT_SHARED]: 'Có người chia sẻ tài liệu',
  [NotificationType.AI_RESPONSE_READY]: 'AI phản hồi xong',
  [NotificationType.CHAT_TIMEOUT]: 'Phiên chat hết giờ',
  [NotificationType.PASSWORD_CHANGED]: 'Đổi mật khẩu thành công',
  [NotificationType.PROFILE_UPDATED]: 'Cập nhật profile',
  [NotificationType.NEW_SUBJECT_AVAILABLE]: 'Có môn học hệ thống mới',
  [NotificationType.SYSTEM_ANNOUNCEMENT]: 'Thông báo hệ thống',
  [NotificationType.WELCOME]: 'Chào mừng người dùng mới',
};

export default function NotificationSettingsScreen() {
  const {
    preferences,
    loading,
    error,
    togglePreference,
    toggleAll,
    isTypeEnabled,
  } = useNotificationPreferences();

  const handleToggle = async (type: string, currentEnabled: boolean) => {
    try {
      await togglePreference(type, !currentEnabled);
    } catch (err: any) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi cập nhật');
    }
  };

  const handleToggleAll = async () => {
    const allEnabled = preferences.every(p => p.enabled);
    try {
      await toggleAll(!allEnabled);
    } catch (err: any) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Đang tải cài đặt...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Có lỗi xảy ra: {error}</Text>
      </View>
    );
  }

  const allEnabled = preferences.every(p => p.enabled);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Cài đặt thông báo</Text>
          <Text style={styles.headerSubtitle}>
            Chọn loại thông báo bạn muốn nhận
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleToggleAll}
          style={[
            styles.toggleAllButton,
            allEnabled ? styles.toggleAllOff : styles.toggleAllOn
          ]}
        >
          <Text
            style={[
              styles.toggleAllText,
              allEnabled ? styles.toggleAllTextOff : styles.toggleAllTextOn
            ]}
          >
            {allEnabled ? 'Tắt tất cả' : 'Bật tất cả'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Groups */}
      <View style={styles.groupsContainer}>
        {notificationGroups.map((group) => (
          <View key={group.name} style={styles.group}>
            {/* Group Header */}
            <View style={styles.groupHeader}>
              <Text style={styles.groupHeaderTitle}>
                {group.icon} {group.name}
              </Text>
            </View>

            {/* Group Items */}
            <View style={styles.groupItems}>
              {group.types.map((type) => {
                const pref = preferences.find(p => p.type === type);
                const enabled = pref?.enabled ?? true;

                return (
                  <View key={type} style={styles.groupItem}>
                    <Text style={styles.groupItemLabel}>
                      {typeLabels[type] || type}
                    </Text>
                    <Switch
                      value={enabled}
                      onValueChange={() => handleToggle(type, enabled)}
                      trackColor={{ false: '#D1D5DB', true: '#8B5CF6' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  toggleAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toggleAllOn: {
    backgroundColor: '#8B5CF6',
  },
  toggleAllOff: {
    backgroundColor: '#F3F4F6',
  },
  toggleAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  toggleAllTextOn: {
    color: '#FFFFFF',
  },
  toggleAllTextOff: {
    color: '#374151',
  },
  groupsContainer: {
    padding: 16,
    gap: 16,
  },
  group: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  groupHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  groupHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  groupItems: {
    borderTopWidth: 0,
  },
  groupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  groupItemLabel: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    marginRight: 16,
  },
});
