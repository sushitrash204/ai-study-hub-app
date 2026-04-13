import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as documentService from '../../services/documentService';
import * as subjectService from '../../services/subjectService';
import { useExercises } from '../exercises/useExercises';
import { Exercise } from '../../models/Exercise';
import { Document } from '../../models/Document';
import { LessonModel } from '../../models/Lesson';

export const useSubjectDetail = (subjectId: string) => {
    const navigation = useNavigation<any>();
    const { state: { exercisesBySubject }, actions: exActions } = useExercises();

    const exercises = exercisesBySubject[subjectId] || [];
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lessons, setLessons] = useState<LessonModel[]>([]);
    const [loadingLessons, setLoadingLessons] = useState(false);

    // Generate from PDF state
    const [genModalVisible, setGenModalVisible] = useState(false);
    const [pdfDocs, setPdfDocs] = useState<Document[]>([]);
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
    const [genType, setGenType] = useState<'QUIZ' | 'ESSAY' | 'MIXED'>('QUIZ');
    const [genCount, setGenCount] = useState(10);
    const [genDifficulty, setGenDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
    const [generating, setGenerating] = useState(false);

    const fetchExercises = useCallback(async () => {
        try {
            await exActions.fetchExercisesBySubject(subjectId, true);
        } catch (error) {
            console.error('Fetch exercises error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [subjectId, exActions]);

    const fetchLessons = useCallback(async () => {
        setLoadingLessons(true);
        try {
            const items = await subjectService.getSubjectLessons(subjectId);
            setLessons(items);
        } catch {
            setLessons([]);
        } finally {
            setLoadingLessons(false);
        }
    }, [subjectId]);

    const openGenModal = useCallback(async () => {
        setSelectedDocId(null);
        setGenType('QUIZ');
        setGenCount(10);
        setGenDifficulty('MEDIUM');
        try {
            const docs = await documentService.getDocumentsBySubject(subjectId);
            const pdfs = docs.filter(
                (d: Document) => (d.fileType || '').toLowerCase() === 'pdf'
            );
            setPdfDocs(pdfs);
        } catch {
            setPdfDocs([]);
        }
        setGenModalVisible(true);
    }, [subjectId]);

    const handleGenerateExercise = useCallback(async () => {
        if (!selectedDocId) {
            Alert.alert('Chưa chọn', 'Vui lòng chọn một tài liệu PDF.');
            return;
        }

        setGenerating(true);
        try {
            const result = await exActions.handleGenerateExercise({
                documentId: selectedDocId,
                exerciseType: genType,
                questionCount: genCount,
                difficulty: genDifficulty,
            });
            setGenModalVisible(false);
            if (result) {
                Alert.alert(
                    'Tạo thành công!',
                    `Bộ đề "${result.title}" đã được tạo.`,
                    [
                        { text: 'Làm ngay', onPress: () => navigation.navigate('ExerciseDetail', { exerciseId: result.id }) },
                        { text: 'Đóng', style: 'cancel' },
                    ]
                );
            }
        } catch (error: any) {
            // Error handled in hook
        } finally {
            setGenerating(false);
        }
    }, [selectedDocId, genType, genCount, genDifficulty, exActions, navigation]);

    const openExerciseActionMenu = useCallback((item: Exercise) => {
        Alert.alert(
            'Tùy chọn bộ đề',
            `Chọn thao tác cho "${item.title}"`,
            [
                {
                    text: 'Xóa bộ đề',
                    style: 'destructive',
                    onPress: () => exActions.handleDeleteExercise(item),
                },
                { text: 'Hủy', style: 'cancel' },
            ]
        );
    }, [exActions]);

    const openExerciseDetail = useCallback((exerciseId: string, entryAction: 'start' | 'review' | 'retry') => {
        navigation.navigate('ExerciseDetail', { exerciseId, entryAction });
    }, [navigation]);

    return {
        state: {
            exercises,
            loading,
            refreshing,
            genModalVisible,
            pdfDocs,
            selectedDocId,
            genType,
            genCount,
            genDifficulty,
            generating,
            lessons,
            loadingLessons,
        },
        actions: {
            fetchExercises,
            fetchLessons,
            openGenModal,
            setGenModalVisible,
            setSelectedDocId,
            setGenType,
            setGenCount,
            setGenDifficulty,
            handleGenerateExercise,
            openExerciseActionMenu,
            openExerciseDetail,
            setRefreshing
        }
    };
};
