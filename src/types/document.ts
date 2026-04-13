// Document related interfaces

export interface DocumentData {
    id: string;
    title: string;
    fileUrl: string;
    fileType: string;
    subjectId: string;
    lessonId?: string | null;
    status?: 'PRIVATE' | 'DRAFT' | 'PUBLIC';
    isSystem: boolean;
    userId: string;
    createdAt?: string;
    subject?: {
        id: string;
        name: string;
    } | null;
}

// API Response interfaces (Extracted from models)
export interface DeleteDocumentResponse {
    message: string;
    deletedDocumentId: string;
    deletedEssayExerciseCount: number;
}

export interface DocumentSummary {
    documentId: string;
    title: string;
    summary: string;
    sourceLength: number;
}

export interface DocumentChatResponse {
    documentId: string;
    title: string;
    answer: string;
    sourceLength: number;
}
