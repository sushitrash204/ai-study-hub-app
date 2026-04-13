import { useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as documentService from '../../services/documentService';
import { useDocumentStore } from '../../store/documentStore';

// Dùng type từ service (API response)
type Document = any;

/**
 * Hook quản lý documents - CRUD operations
 * @param options - { autoFetch?: boolean }
 * @returns state & actions để quản lý documents
 */
export const useDocuments = (options: { autoFetch?: boolean } = {}) => {
    const { autoFetch = false } = options;
    const { documents, setDocuments, addDocument, updateDocument, deleteDocument } = useDocumentStore();
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchDocuments = useCallback(async (isRefresh = false) => {
        isRefresh ? setIsRefreshing(true) : setIsLoading(true);
        try {
            const data = await documentService.getAllDocuments();
            setDocuments(data);
        } catch (error: any) {
            console.error('Fetch documents error:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [setDocuments]);

    const fetchDocumentsBySubject = useCallback(async (subjectId: string) => {
        if (!subjectId) return;
        setIsLoading(true);
        try {
            const data = await documentService.getDocumentsBySubject(subjectId);
            setDocuments(data);
        } catch (error: any) {
            console.error('Fetch documents by subject error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [setDocuments]);

    useEffect(() => {
        if (autoFetch) {
            fetchDocuments();
        }
    }, [autoFetch, fetchDocuments]);

    const handleUploadDocument = async (file: any, subjectId: string, title?: string): Promise<boolean> => {
        if (!subjectId) {
            Alert.alert('Lỗi', 'Vui lòng chọn môn học trước khi tải tài liệu.');
            return false;
        }

        try {
            setIsUploading(true);
            const created = await documentService.uploadDocument(file, subjectId, title);
            addDocument(created as any);
            return true;
        } catch (error: any) {
            Alert.alert('Lỗi', 'Không thể tải lên tài liệu: ' + error.message);
            return false;
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteDocument = async (doc: Document): Promise<boolean> => {
        const docTitle = (doc.title || 'tài liệu này').trim();

        return new Promise((resolve) => {
            Alert.alert(
                'Xác nhận xóa',
                `Xóa tài liệu: "${docTitle}"?\n\nNếu có bài tự luận đang dùng tài liệu này để chấm, hệ thống sẽ xóa luôn các bài đó.`,
                [
                    { text: 'Hủy', style: 'cancel', onPress: () => resolve(false) },
                    {
                        text: 'Xóa',
                        style: 'destructive',
                        onPress: async () => {
                            try {
                                setIsLoading(true);
                                const result = await documentService.deleteDocument(doc.id);
                                deleteDocument(doc.id);

                                const deletedEssayCount = Number(result?.deletedEssayExerciseCount || 0);
                                if (deletedEssayCount > 0) {
                                    Alert.alert('Thành công', `Đã xóa tài liệu và ${deletedEssayCount} bài tự luận liên quan.`);
                                } else {
                                    Alert.alert('Thành công', 'Đã xóa tài liệu thành công.');
                                }
                                resolve(true);
                            } catch (error: any) {
                                Alert.alert('Lỗi', error.message || 'Không thể xóa tài liệu');
                                resolve(false);
                            } finally {
                                setIsLoading(false);
                            }
                        }
                    }
                ]
            );
        });
    };

    const handleUpdateTitle = async (doc: Document, newTitle: string): Promise<boolean> => {
        const normalizedTitle = newTitle.trim();
        if (!normalizedTitle) {
            Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề tài liệu.');
            return false;
        }

        try {
            setIsLoading(true);
            const updated = await documentService.updateDocumentTitle(doc.id, normalizedTitle);
            updateDocument(updated as any);
            return true;
        } catch (error: any) {
            Alert.alert('Lỗi', error?.response?.data?.message || error.message || 'Không thể cập nhật tiêu đề.');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const clearDocuments = useCallback(() => {
        setDocuments([]);
    }, [setDocuments]);

    return {
        state: { documents, isLoading, isUploading, isRefreshing },
        actions: {
            fetchDocuments,
            fetchDocumentsBySubject,
            handleUploadDocument,
            handleDeleteDocument,
            handleUpdateTitle,
            clearDocuments
        }
    };
};
