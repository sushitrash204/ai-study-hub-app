import { Notification, NotificationType, NotificationPriority } from '../types/notification';

/**
 * Model class chuẩn hóa dữ liệu thông báo từ API
 */
export class NotificationModel implements Notification {
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

  constructor(data: Partial<Notification>) {
    this.id = data?.id || '';
    this.userId = data?.userId || '';
    this.type = data?.type || '';
    this.title = data?.title || '';
    this.message = data?.message || '';
    this.data = data?.data || {};
    this.read = data?.read ?? false;
    this.clicked = data?.clicked ?? false;
    this.createdAt = data?.createdAt || '';
    this.updatedAt = data?.updatedAt || '';
  }

  /**
   * Kiểm tra thông báo chưa đọc
   */
  isUnread(): boolean {
    return !this.read;
  }

  /**
   * Kiểm tra thông báo có gần đây không (trong 24h)
   */
  isRecent(hours: number = 24): boolean {
    const now = new Date();
    const created = new Date(this.createdAt);
    const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return diffHours <= hours;
  }

  /**
   * Lấy mức độ ưu tiên
   */
  getPriority(): NotificationPriority {
    const highPriorityTypes = [
      NotificationType.GROUP_JOIN_REQUEST,
      NotificationType.EXERCISE_GRADED,
      NotificationType.EXERCISE_LOW_SCORE,
      NotificationType.DOCUMENT_FAILED,
      NotificationType.PASSWORD_CHANGED,
      NotificationType.SYSTEM_ANNOUNCEMENT,
      NotificationType.ADMIN_ERROR_ALERT,
    ];

    const mediumPriorityTypes = [
      NotificationType.GROUP_MEMBER_JOINED,
      NotificationType.GROUP_JOIN_ACCEPTED,
      NotificationType.GROUP_JOIN_REJECTED,
      NotificationType.GROUP_RESOURCE_SHARED,
      NotificationType.GROUP_RESULT_SHARED,
      NotificationType.GROUP_INVITATION,
      NotificationType.EXERCISE_READY,
      NotificationType.EXERCISE_ACHIEVEMENT,
      NotificationType.DOCUMENT_READY,
      NotificationType.DOCUMENT_SUMMARY_READY,
      NotificationType.DOCUMENT_SHARED,
      NotificationType.AI_RESPONSE_READY,
      NotificationType.NEW_SUBJECT_AVAILABLE,
      NotificationType.WELCOME,
    ];

    if (highPriorityTypes.includes(this.type as NotificationType)) return 'HIGH';
    if (mediumPriorityTypes.includes(this.type as NotificationType)) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Lấy màu theo priority
   */
  getColor(): string {
    const priority = this.getPriority();
    switch (priority) {
      case 'HIGH': return '#EF4444';    // Đỏ
      case 'MEDIUM': return '#F59E0B';  // Cam
      default: return '#3B82F6';        // Xanh
    }
  }

  /**
   * Format thời gian hiển thị
   */
  formatTime(): string {
    const now = new Date();
    const created = new Date(this.createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHour < 24) return `${diffHour} giờ trước`;
    if (diffDay < 7) return `${diffDay} ngày trước`;

    return created.toLocaleDateString('vi-VN');
  }

  /**
   * Lấy icon theo loại thông báo
   */
  getIcon(): string {
    const iconMap: Record<string, string> = {
      [NotificationType.GROUP_MEMBER_JOINED]: '👤',
      [NotificationType.GROUP_MEMBER_LEFT]: '🚪',
      [NotificationType.GROUP_JOIN_REQUEST]: '❓',
      [NotificationType.GROUP_JOIN_ACCEPTED]: '✅',
      [NotificationType.GROUP_JOIN_REJECTED]: '❌',
      [NotificationType.GROUP_RESOURCE_SHARED]: '📎',
      [NotificationType.GROUP_RESULT_SHARED]: '🏆',
      [NotificationType.GROUP_INVITATION]: '✉️',
      [NotificationType.EXERCISE_READY]: '📝',
      [NotificationType.EXERCISE_GRADED]: '📊',
      [NotificationType.EXERCISE_LOW_SCORE]: '⚠️',
      [NotificationType.EXERCISE_ACHIEVEMENT]: '🎉',
      [NotificationType.DOCUMENT_READY]: '✅',
      [NotificationType.DOCUMENT_FAILED]: '❌',
      [NotificationType.DOCUMENT_SUMMARY_READY]: '📄',
      [NotificationType.DOCUMENT_SHARED]: '🔗',
      [NotificationType.AI_RESPONSE_READY]: '🤖',
      [NotificationType.CHAT_TIMEOUT]: '⏰',
      [NotificationType.PASSWORD_CHANGED]: '🔒',
      [NotificationType.PROFILE_UPDATED]: '👤',
      [NotificationType.NEW_SUBJECT_AVAILABLE]: '📚',
      [NotificationType.SYSTEM_ANNOUNCEMENT]: '📢',
      [NotificationType.WELCOME]: '👋',
      [NotificationType.ADMIN_NEW_USER]: '👥',
      [NotificationType.ADMIN_SUBJECT_CREATED]: '📚',
      [NotificationType.ADMIN_ERROR_ALERT]: '🚨',
    };

    return iconMap[this.type] || '🔔';
  }
}
