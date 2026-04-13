import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useUnreadCount } from '../hooks/notifications/useUnreadCount';

interface NotificationBadgeProps {
  size?: number;
}

/**
 * NotificationBadge Component
 * Hiển thị số thông báo chưa đọc
 * Dùng trong TabNavigator
 */
export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ size = 18 }) => {
  const { count: unreadCount } = useUnreadCount(true, 30000);

  if (unreadCount === 0) {
    return null;
  }

  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.badgeText, { fontSize: size * 0.6 }]}>
        {unreadCount > 99 ? '99+' : unreadCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: -4,
    right: -4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default NotificationBadge;
