// Subject related interfaces

export type SubjectStatus = 'PRIVATE' | 'DRAFT' | 'PUBLIC';

export interface SubjectData {
    id: string;
    name: string;
    color: string;
    userId: string;
    classId: string | null;
    class?: {
        id: string;
        name: string;
    };
    status: SubjectStatus;
    isSystem: boolean;
    createdAt?: string;
    updatedAt?: string;
}
