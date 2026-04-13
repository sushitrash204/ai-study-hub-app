import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export interface UserStats {
    totalSubjects: number;
    mySubjects: number;
    totalDocuments: number;
    totalExercises: number;
    completedExercises: number;
    totalGroups: number;
}

export function useStats() {
    const { isAuthenticated, accessToken } = useAuthStore();
    const [stats, setStats] = useState<UserStats>({
        totalSubjects: 0,
        mySubjects: 0,
        totalDocuments: 0,
        totalExercises: 0,
        completedExercises: 0,
        totalGroups: 0
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        if (!isAuthenticated || !accessToken) return;

        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get('/stats/summary');
            setStats(response.data);
        } catch (err: any) {
            console.error('Fetch Stats Error:', err);
            setError(err.message || 'Lỗi khi tải thống kê');
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, accessToken]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return { stats, isLoading, error, refresh: fetchStats };
}
