/**
 * Enum các loại thông báo (phải khớp với backend)
 */
export enum NotificationType {
  // Study Group
  GROUP_MEMBER_JOINED = 'GROUP_MEMBER_JOINED',
  GROUP_MEMBER_LEFT = 'GROUP_MEMBER_LEFT',
  GROUP_JOIN_REQUEST = 'GROUP_JOIN_REQUEST',
  GROUP_JOIN_ACCEPTED = 'GROUP_JOIN_ACCEPTED',
  GROUP_JOIN_REJECTED = 'GROUP_JOIN_REJECTED',
  GROUP_RESOURCE_SHARED = 'GROUP_RESOURCE_SHARED',
  GROUP_RESULT_SHARED = 'GROUP_RESULT_SHARED',
  GROUP_INVITATION = 'GROUP_INVITATION',

  // Exercises
  EXERCISE_READY = 'EXERCISE_READY',
  EXERCISE_GRADED = 'EXERCISE_GRADED',
  EXERCISE_LOW_SCORE = 'EXERCISE_LOW_SCORE',
  EXERCISE_ACHIEVEMENT = 'EXERCISE_ACHIEVEMENT',

  // Documents
  DOCUMENT_READY = 'DOCUMENT_READY',
  DOCUMENT_FAILED = 'DOCUMENT_FAILED',
  DOCUMENT_SUMMARY_READY = 'DOCUMENT_SUMMARY_READY',
  DOCUMENT_SHARED = 'DOCUMENT_SHARED',

  // Chat & AI
  AI_RESPONSE_READY = 'AI_RESPONSE_READY',
  CHAT_TIMEOUT = 'CHAT_TIMEOUT',

  // System & Account
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  NEW_SUBJECT_AVAILABLE = 'NEW_SUBJECT_AVAILABLE',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
  WELCOME = 'WELCOME',

  // Admin
  ADMIN_NEW_USER = 'ADMIN_NEW_USER',
  ADMIN_SUBJECT_CREATED = 'ADMIN_SUBJECT_CREATED',
  ADMIN_ERROR_ALERT = 'ADMIN_ERROR_ALERT',
}

/**
 * Interface thông báo
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType | string;
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  clicked: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface cài đặt thông báo
 */
export interface NotificationPreference {
  id: string;
  userId: string;
  type: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Response từ API notifications
 */
export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Response unread count
 */
export interface UnreadCountResponse {
  count: number;
}

/**
 * Response preferences
 */
export interface PreferencesResponse {
  preferences: NotificationPreference[];
}

/**
 * Payload để update preferences
 */
export interface UpdatePreferencesPayload {
  preferences: Array<{
    type: string;
    enabled: boolean;
  }>;
}

/**
 * Filter options cho notifications
 */
export interface NotificationFilters {
  page?: number;
  limit?: number;
  read?: boolean;
  type?: string;
}

/**
 * Priority levels
 */
export type NotificationPriority = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Socket events
 */
export interface SocketNotificationEvent {
  notification: Notification;
}

export interface SocketNotificationReadEvent {
  notificationId: string;
}

export interface SocketUnreadCountUpdateEvent {
  count: number;
}
