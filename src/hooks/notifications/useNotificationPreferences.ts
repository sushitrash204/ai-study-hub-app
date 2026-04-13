import { useEffect, useCallback } from 'react';
import { useNotificationStore } from '../../store/notificationStore';

/**
 * Hook để quản lý notification preferences
 */
export const useNotificationPreferences = () => {
  const {
    preferences,
    loading,
    error,
    fetchPreferences,
    updatePreferences,
    setError,
  } = useNotificationStore();

  // Fetch preferences khi mount
  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // Toggle một preference
  const togglePreference = useCallback(async (type: string, enabled: boolean) => {
    try {
      await updatePreferences([{ type, enabled }]);
    } catch (err: any) {
      setError(err.message);
    }
  }, [updatePreferences, setError]);

  // Toggle tất cả
  const toggleAll = useCallback(async (enabled: boolean) => {
    try {
      const allTypes = preferences.map(p => p.type);
      await updatePreferences(allTypes.map(type => ({ type, enabled })));
    } catch (err: any) {
      setError(err.message);
    }
  }, [preferences, updatePreferences, setError]);

  // Check nếu một loại thông báo có được bật không
  const isTypeEnabled = useCallback((type: string) => {
    const pref = preferences.find(p => p.type === type);
    return pref?.enabled ?? true; // Mặc định là enabled nếu không có
  }, [preferences]);

  return {
    // Data
    preferences,
    loading,
    error,

    // Actions
    togglePreference,
    toggleAll,
    isTypeEnabled,
    refresh: fetchPreferences,
  };
};
