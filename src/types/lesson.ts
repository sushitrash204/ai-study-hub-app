// Lesson related interfaces

export type LessonContentStyle = 'BLOCKS' | 'HTML';
export type LessonStatus = 'DRAFT' | 'PUBLIC';

export interface LessonData {
    id: string;
    title: string;
    description?: string;
    contentStyle: LessonContentStyle;
    content?: any;
    order: number;
    subjectId: string;
    userId: string;
    status: LessonStatus;
    createdAt?: string;
    subject?: {
        name: string;
        color: string;
        classId?: string;
        class?: { name: string };
        isSystem?: boolean
    };
}
