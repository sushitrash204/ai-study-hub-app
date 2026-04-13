import { useEffect, useState } from 'react';
import { useNotificationStore } from '../../store/notificationStore';
import { isSocketConnected } from '../../services/notificationSocket';

/**
 * Hook để quản lý socket connection cho notifications
 */
export const useNotificationSocket = (userId: string | null) => {
  const { socketConnected, initializeSocket, disconnectSocket } = useNotificationStore();
  const [error, setError] = useState<string | null>(null);

  // Initialize socket khi có userId
  useEffect(() => {
    if (!userId) {
      return;
    }

    try {
      initializeSocket(userId);
    } catch (err: any) {
      setError(err.message);
    }

    // Cleanup khi unmount
    return () => {
      disconnectSocket();
    };
  }, [userId, initializeSocket, disconnectSocket]);

  // Check connection status
  const isConnected = isSocketConnected() && socketConnected;

  return {
    connected: isConnected,
    error,
  };
};
