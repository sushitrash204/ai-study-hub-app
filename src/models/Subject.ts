export class Subject {
    id: string;
    name: string;
    color: string;
    userId: string;
    status: 'PRIVATE' | 'DRAFT' | 'PUBLIC';
    isSystem: boolean;
    classId?: string | null;
    class?: { id?: string; name?: string };
    createdAt?: string;
    updatedAt?: string;

    constructor(data: any) {
        this.id = data?.id || '';
        this.name = data?.name || '';
        this.color = data?.color || '#000000';
        this.userId = data?.userId || '';
        this.status = data?.status || 'PRIVATE';
        this.isSystem = data?.isSystem || false;
        this.classId = data?.classId || null;
        this.class = data?.class;
        this.createdAt = data?.createdAt;
        this.updatedAt = data?.updatedAt;
    }
    getFormattedCreatedAt(): string {
        if (!this.createdAt) return 'Chưa có thông tin';
        return new Date(this.createdAt).toLocaleDateString('vi-VN');
    }
}
