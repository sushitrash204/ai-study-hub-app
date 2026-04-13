// User related interfaces

export type UserRole = 'USER' | 'ADMIN';

export interface UserData {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
}
