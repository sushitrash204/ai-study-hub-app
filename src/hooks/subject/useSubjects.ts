import { useState, useCallback, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import * as subjectService from '../../services/subjectService';
import { useSubjectStore } from '../../store/subjectStore';
import { useAuthStore } from '../../store/authStore';
import { Subject } from '../../models/Subject';

export type SubjectFetchType = 'PERSONAL' | 'SYSTEM' | 'BOTH';

export const useSubjects = (options: {
    type?: SubjectFetchType;
    autoFetch?: boolean;
    classId?: string | null;
} = {}) => {
    const { type = 'PERSONAL', autoFetch = false, classId = null } = options;

    // Global Stores
    const { isAuthenticated } = useAuthStore();
    const {
        subjects, setSubjects,
        systemSubjects, setSystemSubjects,
        classes, setClasses,
        addSubject, updateSubject, deleteSubject
    } = useSubjectStore();

    // Local UI State
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // --- Core Actions ---
    const fetchAll = useCallback(async (isRefresh = false) => {
        if (!isAuthenticated && type === 'PERSONAL') return;

        isRefresh ? setIsRefreshing(true) : setIsLoading(true);
        try {
            const promises: Promise<any>[] = [];

            if (type === 'PERSONAL' || type === 'BOTH') {
                promises.push(subjectService.getSubjects().then(setSubjects));
            }

            if (type === 'SYSTEM' || type === 'BOTH') {
                promises.push(subjectService.getClasses().then(setClasses));
                promises.push(subjectService.getSystemSubjects(classId || undefined).then(setSystemSubjects));
            }

            await Promise.all(promises);
        } catch (error) {
            console.error('Fetch subjects error:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [isAuthenticated, type, classId, setSubjects, setSystemSubjects, setClasses]);

    const handleSave = useCallback(async (name: string, color: string, targetClassId: string | null = null, editingSubject?: Subject | null) => {
        if (!name.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập tên môn học');
            return false;
        }

        setIsLoading(true);
        try {
            if (editingSubject) {
                const updated = await subjectService.updateSubject(editingSubject.id, name, color);
                updateSubject(updated);
            } else {
                const created = await subjectService.createSubject(name, color, targetClassId || undefined);
                addSubject(created);
            }
            return true;
        } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Không thể lưu môn học');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [addSubject, updateSubject]);

    const handleDelete = useCallback(async (subject: Subject) => {
        Alert.alert(
            'Xác nhận xóa',
            `Xóa môn học: "${subject.name}"?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            await subjectService.deleteSubject(subject.id);
                            deleteSubject(subject.id);
                        } catch (error: any) {
                            Alert.alert('Lỗi', error.message || 'Không thể xóa môn học');
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
        return true;
    }, [deleteSubject]);

    // --- Lifecycle ---
    useEffect(() => {
        if (autoFetch && isAuthenticated) {
            fetchAll();
        }
    }, [autoFetch, isAuthenticated, fetchAll]);

    // --- Output ---
    const state = useMemo(() => ({
        subjects,
        systemSubjects,
        classes,
        isLoading,
        isRefreshing,
        isAuthenticated
    }), [subjects, systemSubjects, classes, isLoading, isRefreshing, isAuthenticated]);

    const actions = useMemo(() => ({
        fetchAll,
        handleSave,
        handleDelete
    }), [fetchAll, handleSave, handleDelete]);

    return { state, actions };
};
