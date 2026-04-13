import io, { Socket } from 'socket.io-client';
import { Notification, SocketNotificationEvent, SocketUnreadCountUpdateEvent } from '../types/notification';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000/api';
const SOCKET_URL = API_URL.replace('/api', '');

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Khởi tạo socket connection
 */
export const initializeSocket = (
  userId: string,
  callbacks: {
    onNotification?: (notification: Notification) => void;
    onNotificationRead?: (notificationId: string) => void;
    onUnreadCountUpdate?: (count: number) => void;
    onError?: (error: any) => void;
    onConnected?: () => void;
    onDisconnected?: () => void;
  }
): Socket | null => {
  try {
    // Nếu đã có socket và đang kết nối, trả về luôn
    if (socket?.connected) {
      return socket;
    }

    // Disconnect socket cũ nếu có
    if (socket) {
      socket.disconnect();
      socket.removeAllListeners();
    }

    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    });

    // Authentication
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket?.id);
      reconnectAttempts = 0;

      // Authenticate với server
      socket?.emit('client:authenticate', { userId });

      callbacks.onConnected?.();
    });

    // Server xác nhận authenticated
    socket.on('server:authenticated', (data: { success: boolean }) => {
      if (data.success) {
        console.log('✅ Socket authenticated');
      }
    });

    // Nhận thông báo mới
    socket.on('server:notification', (data: SocketNotificationEvent) => {
      console.log('📬 New notification received:', data.notification);
      callbacks.onNotification?.(data.notification);
    });

    // Thông báo đã đọc
    socket.on('server:notification_read', (data: { notificationId: string }) => {
      callbacks.onNotificationRead?.(data.notificationId);
    });

    // Thông báo đã xóa
    socket.on('server:notification_deleted', (data: { notificationId: string }) => {
      console.log('🗑️ Notification deleted:', data.notificationId);
    });

    // Cập nhật số chưa đọc
    socket.on('server:unread_count_update', (data: SocketUnreadCountUpdateEvent) => {
      callbacks.onUnreadCountUpdate?.(data.count);
    });

    // Lỗi
    socket.on('error', (error: any) => {
      console.error('❌ Socket error:', error);
      callbacks.onError?.(error);
    });

    // Ngắt kết nối
    socket.on('disconnect', (reason: any) => {
      console.log('🔌 Socket disconnected:', reason);
      callbacks.onDisconnected?.();
    });

    // Kết nối lại thất bại
    socket.on('reconnect_error', (error: any) => {
      reconnectAttempts++;
      console.error(`🔄 Reconnect attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}:`, error.message);

      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('❌ Max reconnection attempts reached');
        callbacks.onError?.(new Error('Max reconnection attempts reached'));
      }
    });

    return socket;
  } catch (error) {
    console.error('❌ Failed to initialize socket:', error);
    return null;
  }
};

/**
 * Đánh dấu thông báo đã đọc qua socket
 */
export const markNotificationAsRead = (notificationId: string): void => {
  if (socket?.connected) {
    socket.emit('client:mark_notification_read', { notificationId });
  }
};

/**
 * Disconnect socket
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket.removeAllListeners();
    socket = null;
    console.log('🔌 Socket disconnected manually');
  }
};

/**
 * Kiểm tra socket đã kết nối chưa
 */
export const isSocketConnected = (): boolean => {
  return socket?.connected ?? false;
};

/**
 * Lấy socket instance (dùng cẩn thận)
 */
export const getSocket = (): Socket | null => {
  return socket;
};
