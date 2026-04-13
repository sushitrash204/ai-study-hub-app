import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NotificationModel } from '../models/Notification';
import { Notification } from '../types/notification';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onPress?: (id: string) => void;
}

/**
 * NotificationItem Component
 * Hiển thị một thông báo đơn lẻ
 */
export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onPress,
}) => {
  const model = new NotificationModel(notification);
  const priority = model.getPriority();
  const color = model.getColor();
  const icon = model.getIcon();

  const handlePress = () => {
    if (!notification.read) {
      onMarkAsRead?.(notification.id);
    }
    onPress?.(notification.id);
  };

  const getPriorityLabel = () => {
    switch (priority) {
      case 'HIGH': return 'Quan trọng';
      case 'MEDIUM': return 'Thông báo';
      default: return 'Thấp';
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.container,
        !notification.read ? styles.unreadBg : styles.readBg,
        { borderLeftColor: color }
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        {/* Icon */}
        <View
          style={[styles.iconContainer, { backgroundColor: `${color}20` }]}
        >
          <Text style={styles.icon}>{icon}</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                !notification.read ? styles.unreadTitle : styles.readTitle
              ]}
              numberOfLines={1}
            >
              {notification.title}
            </Text>
            {/* Unread indicator */}
            {!notification.read && (
              <View style={[styles.indicator, { backgroundColor: color }]} />
            )}
          </View>

          <Text style={styles.message} numberOfLines={2}>
            {notification.message}
          </Text>

          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              <Text style={styles.time}>{model.formatTime()}</Text>
              <View
                style={[
                  styles.priorityBadge,
                  { backgroundColor: `${color}20` }
                ]}
              >
                <Text style={[styles.priorityText, { color }]}>
                  {getPriorityLabel()}
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              {!notification.read && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    onMarkAsRead?.(notification.id);
                  }}
                  style={styles.markReadButton}
                >
                  <Text style={styles.markReadText}>Đánh dấu đã đọc</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderLeftWidth: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  unreadBg: {
    backgroundColor: '#EFF6FF',
  },
  readBg: {
    backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    fontSize: 14,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '600',
    color: '#111827',
  },
  readTitle: {
    fontWeight: '500',
    color: '#374151',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  message: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  markReadButton: {
    paddingVertical: 4,
  },
  markReadText: {
    fontSize: 12,
    color: '#9333EA',
    fontWeight: '500',
  },
});
