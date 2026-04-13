export class User {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'USER' | 'ADMIN';

    constructor(data: any) {
        this.id = data?.id || '';
        this.username = data?.username || '';
        this.firstName = data?.firstName || '';
        this.lastName = data?.lastName || '';
        this.email = data?.email || '';
        this.role = data?.role || 'USER';
    }

    isAdmin(): boolean {
        return this.role === 'ADMIN';
    }

    getFullName(): string {
        return `${this.firstName} ${this.lastName}`.trim();
    }
}
