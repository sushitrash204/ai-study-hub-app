import { useEffect, useState } from 'react';
import { useNotificationStore } from '../../store/notificationStore';
import { useAuthStore } from '../../store/authStore';

/**
 * Hook để lấy số lượng thông báo chưa đọc
 * Tự động polling hoặc dùng socket
 */
export const useUnreadCount = (autoRefresh: boolean = true, intervalMs: number = 30000) => {
  const { unreadCount, fetchUnreadCount, updateUnreadCount } = useNotificationStore();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Fetch unread count
  const refresh = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      await fetchUnreadCount();
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto polling nếu enabled
  useEffect(() => {
    if (!autoRefresh) return;

    // Fetch ngay lập tức
    refresh();

    // Setup polling
    const interval = setInterval(refresh, intervalMs);

    // Cleanup
    return () => clearInterval(interval);
  }, [autoRefresh, intervalMs]);

  return {
    count: unreadCount,
    loading,
    refresh,
    updateCount: updateUnreadCount,
  };
};
