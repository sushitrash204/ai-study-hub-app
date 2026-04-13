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

export class Document {
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

    constructor(data: any) {
        this.id = data?.id || '';
        this.title = data?.title || 'Tài liệu không tên';
        this.fileUrl = data?.fileUrl || '';
        this.fileType = data?.fileType || '';
        this.subjectId = data?.subjectId || '';
        this.lessonId = data?.lessonId ?? null;
        this.status = data?.status;
        this.isSystem = data?.isSystem || false;
        this.userId = data?.userId || '';
        this.createdAt = data?.createdAt;
    }

    get isPdf(): boolean {
        return (this.fileType || '').toLowerCase() === 'pdf';
    }

    get displayFileType(): string {
        return (this.fileType || 'N/A').toUpperCase();
    }

    getFormattedDate(): string {
        if (!this.createdAt) return 'Không rõ ngày';
        return new Date(this.createdAt).toLocaleDateString('vi-VN');
    }
}
