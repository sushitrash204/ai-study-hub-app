import { create } from 'zustand';
import { NotificationModel } from '../models/Notification';
import { Notification, NotificationPreference, NotificationFilters } from '../types/notification';
import * as notificationService from '../services/notificationService';
import * as notificationSocket from '../services/notificationSocket';

interface NotificationState {
  // State
  notifications: NotificationModel[];
  unreadCount: number;
  preferences: NotificationPreference[];
  loading: boolean;
  error: string | null;
  socketConnected: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  // Actions - Notifications
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (preferences: Array<{ type: string; enabled: boolean }>) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;

  // Actions - Socket
  addNotification: (notification: Notification) => void;
  markNotificationAsReadLocal: (notificationId: string) => void;
  deleteNotificationLocal: (notificationId: string) => void;
  updateUnreadCount: (count: number) => void;

  // Actions - Socket connection
  initializeSocket: (userId: string) => void;
  disconnectSocket: () => void;

  // Actions - Utilities
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  // Initial state
  notifications: [],
  unreadCount: 0,
  preferences: [],
  loading: false,
  error: null,
  socketConnected: false,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },

  // Fetch notifications với filters
  fetchNotifications: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const result = await notificationService.getNotifications(filters);

      // Convert to models
      const notifications = result.notifications.map(n => new NotificationModel(n));

      set({
        notifications,
        loading: false,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to fetch notifications',
      });
    }
  },

  // Fetch unread count
  fetchUnreadCount: async () => {
    try {
      const count = await notificationService.getUnreadCount();
      set({ unreadCount: count });
    } catch (error: any) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  // Fetch preferences
  fetchPreferences: async () => {
    set({ loading: true, error: null });
    try {
      const preferences = await notificationService.getPreferences();
      set({ preferences, loading: false });
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to fetch preferences',
      });
    }
  },

  // Update preferences
  updatePreferences: async (preferences) => {
    set({ loading: true, error: null });
    try {
      const updatedPreferences = await notificationService.updatePreferences(preferences);
      set({ preferences: updatedPreferences, loading: false });
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to update preferences',
      });
    }
  },

  // Mark as read
  markAsRead: async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);

      // Update local state
      get().markNotificationAsReadLocal(notificationId);

      // Gửi qua socket nếu có
      notificationSocket.markNotificationAsRead(notificationId);

      // Refresh unread count
      get().fetchUnreadCount();
    } catch (error: any) {
      console.error('Failed to mark as read:', error);
    }
  },

  // Mark all as read
  markAllAsRead: async () => {
    try {
      await notificationService.markAllAsRead();

      // Update local state - mark all as read
      set((state) => ({
        notifications: state.notifications.map(n => new NotificationModel({ ...n, read: true })),
        unreadCount: 0,
      }));

      // Fetch lại từ server để đồng bộ
      get().fetchUnreadCount();
    } catch (error: any) {
      console.error('Failed to mark all as read:', error);
    }
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);

      // Update local state
      get().deleteNotificationLocal(notificationId);

      // Refresh unread count
      get().fetchUnreadCount();
    } catch (error: any) {
      console.error('Failed to delete notification:', error);
    }
  },

  // Add notification từ socket
  addNotification: (notification) => {
    set((state) => ({
      notifications: [new NotificationModel(notification), ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  // Mark as read local
  markNotificationAsReadLocal: (notificationId) => {
    set((state) => ({
      notifications: state.notifications.map(n =>
        n.id === notificationId ? new NotificationModel({ ...n, read: true }) : n
      ),
    }));
  },

  // Delete local
  deleteNotificationLocal: (notificationId) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== notificationId),
    }));
  },

  // Update unread count
  updateUnreadCount: (count) => {
    set({ unreadCount: count });
  },

  // Initialize socket
  initializeSocket: (userId) => {
    const { addNotification, markNotificationAsReadLocal, deleteNotificationLocal, updateUnreadCount } = get();

    notificationSocket.initializeSocket(userId, {
      onNotification: (notification) => {
        addNotification(notification);
      },
      onNotificationRead: (notificationId) => {
        markNotificationAsReadLocal(notificationId);
      },
      onUnreadCountUpdate: (count) => {
        updateUnreadCount(count);
      },
      onConnected: () => {
        set({ socketConnected: true });
      },
      onDisconnected: () => {
        set({ socketConnected: false });
      },
      onError: (error) => {
        console.error('Socket error:', error);
        set({ socketConnected: false });
      },
    });
  },

  // Disconnect socket
  disconnectSocket: () => {
    notificationSocket.disconnectSocket();
    set({ socketConnected: false });
  },

  // Set loading
  setLoading: (loading) => {
    set({ loading });
  },

  // Set error
  setError: (error) => {
    set({ error });
  },

  // Clear all notifications
  clearNotifications: () => {
    set({
      notifications: [],
      unreadCount: 0,
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    });
  },
}));
