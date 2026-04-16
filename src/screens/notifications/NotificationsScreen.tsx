import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface Notification {
  id: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'GROUP';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

type FilterType = 'all' | 'unread' | 'important';

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    setTimeout(() => {
      setNotifications([
        {
          id: '1',
          type: 'INFO',
          title: 'Chào mừng bạn đến với Aivora',
          message: 'Khám phá các tính năng học tập thông minh cùng AI.',
          createdAt: new Date().toISOString(),
          read: false,
          priority: 'MEDIUM',
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    Alert.alert(
      'Xác nhận',
      'Đánh dấu tất cả thông báo đã đọc?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý',
          onPress: () => setNotifications(prev => prev.map(n => ({ ...n, read: true }))),
        }
      ]
    );
  };

  const deleteNotification = (id: string) => {
    Alert.alert(
      'Xóa thông báo',
      'Bạn có chắc muốn xóa thông báo này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => setNotifications(prev => prev.filter(n => n.id !== id)),
        }
      ]
    );
  };

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return { color: '#10b981', icon: 'checkmark-circle' };
      case 'WARNING':
        return { color: '#f59e0b', icon: 'warning' };
      case 'ERROR':
        return { color: '#ef4444', icon: 'alert-circle' };
      case 'GROUP':
        return { color: '#8b5cf6', icon: 'people' };
      default:
        return { color: '#6366f1', icon: 'information-circle' };
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'important') return n.type === 'GROUP';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderNotification = ({ item }: { item: Notification }) => {
    const style = getNotificationStyle(item.type);

    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.read && styles.unreadCard]}
        onPress={() => markAsRead(item.id)}
        activeOpacity={0.7}
      >
        {/* Left border */}
        <View style={[styles.leftBorder, { backgroundColor: style.color }]} />

        <View style={styles.notificationContent}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: style.color + '15' }]}>
            <Ionicons name={style.icon as any} size={18} color={style.color} />
          </View>

          {/* Text */}
          <View style={styles.textContent}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, !item.read && styles.unreadTitle]} numberOfLines={1}>
                {item.title}
              </Text>
              {!item.read && <View style={[styles.unreadDot, { backgroundColor: style.color }]} />}
            </View>

            <Text style={styles.message} numberOfLines={2}>
              {item.message}
            </Text>

            <View style={styles.footer}>
              <Text style={styles.time}>
                {new Date(item.createdAt).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>

              <View style={styles.actions}>
                {!item.read && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      markAsRead(item.id);
                    }}
                    style={styles.actionBtn}
                  >
                    <Ionicons name="checkmark" size={16} color="#6366f1" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    deleteNotification(item.id);
                  }}
                  style={styles.actionBtn}
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#1a1a1a" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Thông báo</Text>
            <Text style={styles.headerSubtitle}>
              {notifications.length} thông báo
              {unreadCount > 0 && ` • ${unreadCount} chưa đọc`}
            </Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'unread', label: 'Chưa đọc' },
          { key: 'important', label: 'Quan trọng' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterTab, filter === tab.key && styles.filterTabActive]}
            onPress={() => setFilter(tab.key as FilterType)}
          >
            <Text style={[styles.filterTabText, filter === tab.key && styles.filterTabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {filteredNotifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="notifications-off-outline" size={40} color="#d1d5db" />
          </View>
          <Text style={styles.emptyText}>Không có thông báo</Text>
          <Text style={styles.emptySubtext}>Thông báo sẽ hiện ở đây</Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotification}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  headerSubtitle: { fontSize: 12, color: '#9ca3af', marginTop: 2 },

  // Filter
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterTabActive: { backgroundColor: '#6366f1' },
  filterTabText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  filterTabTextActive: { color: '#fff' },

  // List
  listContent: { padding: 12 },

  // Notification Card
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    overflow: 'hidden',
  },
  unreadCard: {
    backgroundColor: '#eef2ff',
    borderColor: '#c7d2fe',
  },
  leftBorder: {
    width: 3,
    alignSelf: 'stretch',
  },
  notificationContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  textContent: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  title: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  unreadTitle: {
    fontWeight: '700',
    color: '#1a1a1a',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 6,
  },
  message: {
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 16,
    marginBottom: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  time: { fontSize: 11, color: '#d1d5db' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
