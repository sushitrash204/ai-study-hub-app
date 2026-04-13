import api from './api';

export interface Document {
    id: string;
    title: string;
    fileUrl: string;
    fileType: string;
    subjectId: string;
    userId: string;
    createdAt?: string;
}

export interface DeleteDocumentResponse {
    message: string;
    deletedDocumentId: string;
    deletedEssayExerciseCount: number;
}

export const getAllDocuments = async () => {
    const response = await api.get('/documents');
    return response.data;
};

export const getDocumentsBySubject = async (subjectId: string) => {
    const response = await api.get(`/documents/subject/${subjectId}`);
    return response.data;
};

export const uploadDocument = async (file: any, subjectId: string, title?: string) => {
    const formData = new FormData();

    const normalizedTitle = typeof title === 'string' ? title.trim() : '';

    // Append metadata first so backend can use title when generating storage file name.
    formData.append('subjectId', subjectId);
    if (normalizedTitle) formData.append('title', normalizedTitle);

    // Create the file object for FormData
    const fileToUpload = {
        uri: file.uri,
        type: file.mimeType || 'application/pdf',
        name: file.name || 'document.pdf',
    };

    formData.append('file', fileToUpload as any);

    const response = await api.post('/documents', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const deleteDocument = async (id: string): Promise<DeleteDocumentResponse> => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
};

export const updateDocumentTitle = async (id: string, title: string): Promise<Document> => {
    const response = await api.patch(`/documents/${id}/title`, { title });
    return response.data;
};

export const summarizeDocument = async (id: string): Promise<{
    documentId: string;
    title: string;
    summary: string;
    sourceLength: number;
}> => {
    const response = await api.post(`/documents/${id}/summarize`);
    return response.data;
};

export const chatWithDocument = async (
    id: string,
    message: string
): Promise<{
    documentId: string;
    title: string;
    answer: string;
    sourceLength: number;
}> => {
    const response = await api.post(`/documents/${id}/chat`, { message });
    return response.data;
};
