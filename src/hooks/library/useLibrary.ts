import { useState, useEffect, useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useExercises } from '../exercises/useExercises';
import { useDocuments } from '../documents/useDocuments';
import { useSubjects } from '../subject/useSubjects';
import { Document } from '../../models/Document';

export interface Section {
    id: string;
    title: string;
    color: string;
    className?: string;
    data: Document[];
}

export const useLibrary = () => {
    const { isAuthenticated } = useAuthStore();
    const { state: { documents, isLoading: docLoading, isUploading, isRefreshing: docRefreshing }, actions: docActions } = useDocuments({ autoFetch: isAuthenticated });

    const { state: { subjects, systemSubjects, classes, isLoading: subLoading, isRefreshing: subRefreshing }, actions: subActions } = useSubjects({
        type: 'BOTH',
        autoFetch: isAuthenticated
    });

    const { actions: exActions } = useExercises();

    const [sections, setSections] = useState<Section[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

    // Document Upload & Edit States
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedUploadSubjectId, setSelectedUploadSubjectId] = useState<string | null>(null);
    const [customTitle, setCustomTitle] = useState('');
    const personalDocuments = useMemo(() => documents.filter((doc) => doc.lessonId === null), [documents]);

    // Group documents into sections by subject
    useEffect(() => {
        if (!subjects || !documents) return;

        const allAvailableSubjects = [...subjects, ...systemSubjects];
        const personalDocuments = documents.filter((doc) => doc.lessonId === null);

        const grouped: Section[] = allAvailableSubjects.map(sub => ({
            id: sub.id,
            title: sub.name || 'Không tên',
            color: sub.color || '#007AFF',
            className: sub.class?.name,
            data: personalDocuments.filter(doc => doc.subjectId === sub.id)
        })).filter(sec => sec.data && sec.data.length > 0);

        setSections(grouped);
    }, [subjects, systemSubjects, documents]);

    // Lọc môn học hiển thị trong Modal tải lên dựa theo lớp đã chọn
    const personalSubjectsForUpload = useMemo(() => {
        return subjects;
    }, [subjects]);

    const handleUpload = useCallback(async (file: any) => {
        if (!selectedUploadSubjectId) {
            Alert.alert('Lỗi', 'Vui lòng chọn môn học trước khi tải tài liệu.');
            return;
        }

        try {
            setModalVisible(false);
            const normalizedTitle = customTitle.trim();

            const success = await docActions.handleUploadDocument(
                file,
                selectedUploadSubjectId,
                normalizedTitle || undefined
            );

            if (success) {
                setCustomTitle('');
                setSelectedUploadSubjectId(null);
                Alert.alert('Thành công', 'Tải lên tài liệu thành công!');
            }
        } catch (error: any) {
            Alert.alert('Lỗi', 'Không thể tải tài liệu: ' + error.message);
        }
    }, [selectedUploadSubjectId, customTitle, docActions]);

    const filteredSections = useMemo(() => {
        let result = sections;
        if (selectedClassId) {
            const classSubjectIds = systemSubjects.filter(s => s.classId === selectedClassId).map(s => s.id);
            result = result.filter(section => classSubjectIds.includes(section.id));
        }
        if (selectedSubjectId) {
            result = result.filter(section => section.id === selectedSubjectId);
        }
        return result;
    }, [sections, selectedSubjectId, selectedClassId, systemSubjects]);

    return {
        state: {
            sections,
            filteredSections,
            personalDocuments,
            selectedSubjectId,
            selectedClassId,
            classes,
            subjects: personalSubjectsForUpload,
            isLoading: docLoading || subLoading || isUploading,
            isRefreshing: docRefreshing || subRefreshing,
            isUploading,
            modalVisible,
            selectedUploadSubjectId,
            customTitle,
            isAuthenticated
        },
        actions: {
            setSelectedSubjectId,
            setSelectedClassId,
            setModalVisible,
            setSelectedUploadSubjectId,
            setCustomTitle,
            handleUpload,
            handleDeleteDocument: docActions.handleDeleteDocument,
            handleUpdateTitle: docActions.handleUpdateTitle,
            onRefresh: () => {
                docActions.fetchDocuments(true);
                subActions.fetchAll(true);
            }
        }
    };
};
