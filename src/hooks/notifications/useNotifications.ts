import { useEffect, useState, useCallback } from 'react';
import { useNotificationStore } from '../../store/notificationStore';
import { NotificationFilters } from '../../types/notification';

/**
 * Hook chính để quản lý danh sách thông báo
 */
export const useNotifications = (initialFilters: NotificationFilters = {}) => {
  const [filters, setFilters] = useState<NotificationFilters>(initialFilters);

  const {
    notifications,
    loading,
    error,
    pagination,
    fetchNotifications,
    markAsRead,
    deleteNotification,
    markAllAsRead,
    setLoading,
    setError,
  } = useNotificationStore();

  // Fetch notifications khi filters thay đổi
  useEffect(() => {
    fetchNotifications(filters);
  }, [filters, fetchNotifications]);

  // Refresh notifications
  const refresh = useCallback(() => {
    fetchNotifications(filters);
  }, [fetchNotifications, filters]);

  // Load more (phân trang)
  const loadMore = useCallback(() => {
    if (pagination.page < pagination.totalPages && !loading) {
      setFilters(prev => ({
        ...prev,
        page: (prev.page || 1) + 1,
      }));
    }
  }, [pagination, loading]);

  // Filter by read status
  const filterByReadStatus = useCallback((read?: boolean) => {
    setFilters(prev => ({
      ...prev,
      page: 1, // Reset về trang 1
      read,
    }));
  }, []);

  // Filter by type
  const filterByType = useCallback((type?: string) => {
    setFilters(prev => ({
      ...prev,
      page: 1,
      type,
    }));
  }, []);

  // Handle mark as read
  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch (error: any) {
      setError(error.message);
    }
  }, [markAsRead, setError]);

  // Handle delete
  const handleDelete = useCallback(async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
    } catch (error: any) {
      setError(error.message);
    }
  }, [deleteNotification, setError]);

  // Handle mark all as read
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      setLoading(true);
      await markAllAsRead();
      refresh();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [markAllAsRead, refresh, setLoading, setError]);

  return {
    // Data
    notifications,
    loading,
    error,
    pagination,
    filters,

    // Actions
    refresh,
    loadMore,
    filterByReadStatus,
    filterByType,
    markAsRead: handleMarkAsRead,
    deleteNotification: handleDelete,
    markAllAsRead: handleMarkAllAsRead,
  };
};
