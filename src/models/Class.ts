export class ClassModel {
    id: string;
    name: string;
    description?: string;
    userId: string;
    createdAt?: string;

    constructor(data: any) {
        this.id = data?.id || '';
        this.name = data?.name || '';
        this.description = data?.description;
        this.userId = data?.userId || '';
        this.createdAt = data?.createdAt;
    }

    getFormattedDate(): string {
        if (!this.createdAt) return 'Chưa có thông tin';
        return new Date(this.createdAt).toLocaleDateString('vi-VN');
    }
}
