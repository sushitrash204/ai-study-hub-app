import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import * as exerciseService from '../../services/exerciseService';
import { useExerciseStore } from '../../store/exerciseStore';
import { Exercise } from '../../models/Exercise';
import { Submission } from '../../models/Submission';
import { SubmitAnswer, GenerateExerciseData } from '../../types';

/**
 * Hook quản lý exercises - CRUD operations & submissions
 * @returns state & actions để quản lý exercises
 */
export const useExercises = () => {
    const {
        exercisesBySubject,
        currentExerciseDetail,
        isLoading: isStoreLoading,
        setLoading: setStoreLoading,
        setExercises,
        setCurrentExerciseDetail,
        addExercise,
        deleteExercise: deleteExerciseFromStore
    } = useExerciseStore();

    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchExercisesBySubject = useCallback(async (subjectId: string, silent = false) => {
        if (!subjectId) return;
        if (!silent) setStoreLoading(true);
        try {
            const data = await exerciseService.getExercisesBySubject(subjectId);
            setExercises(subjectId, data);
        } catch (error: any) {
            console.error('Fetch exercises error:', error);
        } finally {
            if (!silent) setStoreLoading(false);
        }
    }, [setStoreLoading, setExercises]);

    const fetchAllExercises = useCallback(async (silent = false) => {
        if (!silent) setStoreLoading(true);
        try {
            const data = await exerciseService.getAllExercises();
            // Group by subject
            const grouped: Record<string, any[]> = {};
            data.forEach((ex: any) => {
                if (!grouped[ex.subjectId]) grouped[ex.subjectId] = [];
                grouped[ex.subjectId].push(ex);
            });
            Object.entries(grouped).forEach(([subjectId, exercises]) => {
                setExercises(subjectId, exercises);
            });
        } catch (error: any) {
            console.error('Fetch all exercises error:', error);
        } finally {
            if (!silent) setStoreLoading(false);
        }
    }, [setStoreLoading, setExercises]);

    const fetchExerciseDetail = useCallback(async (exerciseId: string): Promise<any | null> => {
        setIsLoading(true);
        try {
            const data = await exerciseService.getExerciseDetail(exerciseId);
            setCurrentExerciseDetail(data as any);
            return data;
        } catch (error: any) {
            Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể tải chi tiết bài tập');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [setCurrentExerciseDetail]);

    const handleGenerateExercise = useCallback(async (data: GenerateExerciseData): Promise<any | null> => {
        setIsGenerating(true);
        try {
            const result = await exerciseService.generateExerciseFromDocument({
                documentId: data.documentId,
                exerciseType: data.exerciseType === 'MIXED' ? 'QUIZ' : data.exerciseType,
                questionCount: data.questionCount,
                difficulty: data.difficulty,
                title: data.title,
            });
            if (result.subjectId) {
                addExercise(result.subjectId, result as any);
            }
            return result;
        } catch (error: any) {
            Alert.alert('Lỗi', error?.response?.data?.message || error.message || 'Không thể tạo bộ đề.');
            return null;
        } finally {
            setIsGenerating(false);
        }
    }, [addExercise]);

    const handleDeleteExercise = useCallback(async (exercise: any): Promise<boolean> => {
        Alert.alert(
            'Xác nhận xóa',
            `Bạn có chắc muốn xóa bài tập "${exercise.title}"?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsLoading(true);
                            await exerciseService.deleteExercise(exercise.id);
                            deleteExerciseFromStore(exercise.subjectId, exercise.id);
                            Alert.alert('Thành công', 'Đã xóa bài tập thành công.');
                        } catch (error: any) {
                            Alert.alert('Lỗi', error.message || 'Không thể xóa bài tập');
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
        return true;
    }, [deleteExerciseFromStore]);

    const handleSubmitExercise = useCallback(async (
        exerciseId: string,
        answers: SubmitAnswer[]
    ): Promise<any | null> => {
        setIsSubmitting(true);
        try {
            const result = await exerciseService.submitExercise(exerciseId, { answers });

            // Re-fetch exercise detail to update store state dynamically
            await fetchExerciseDetail(exerciseId);

            return result;
        } catch (error: any) {
            Alert.alert('Lỗi nộp bài', error?.response?.data?.message || 'Đã xảy ra lỗi khi nộp bài');
            return null;
        } finally {
            setIsSubmitting(false);
        }
    }, [fetchExerciseDetail]);

    const clearCurrentDetail = useCallback(() => {
        setCurrentExerciseDetail(null);
    }, [setCurrentExerciseDetail]);

    const state = useMemo(() => ({
        exercisesBySubject,
        currentDetail: currentExerciseDetail,
        isStoreLoading,
        isLoading,
        isGenerating,
        isSubmitting
    }), [exercisesBySubject, currentExerciseDetail, isStoreLoading, isLoading, isGenerating, isSubmitting]);

    const actions = useMemo(() => ({
        fetchExercisesBySubject,
        fetchAllExercises,
        fetchExerciseDetail,
        handleGenerateExercise,
        handleDeleteExercise,
        handleSubmitExercise,
        clearCurrentDetail
    }), [fetchExercisesBySubject, fetchAllExercises, fetchExerciseDetail, handleGenerateExercise, handleDeleteExercise, handleSubmitExercise, clearCurrentDetail]);

    return { state, actions };
};
