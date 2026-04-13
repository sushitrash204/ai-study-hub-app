// Exercise related interfaces

export type ExerciseDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type ExerciseStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
export type ExerciseType = 'QUIZ' | 'ESSAY' | 'MIXED';
export type ExercisePublishStatus = 'PRIVATE' | 'DRAFT' | 'PUBLIC';

export interface ExerciseData {
    id: string;
    title: string;
    description?: string;
    status: ExerciseStatus;
    type: ExerciseType;
    difficulty?: ExerciseDifficulty | null;
    dueDate?: string;
    documentId?: string | null;
    lessonId?: string | null;
    publishStatus?: ExercisePublishStatus;
    isSystem: boolean;
    subjectId: string;
    userId: string;
    latestSubmission?: any;
    subject?: {
        id: string;
        name: string;
    } | null;
    questions?: any[];
    submissionHistory?: any[];
}

export interface GenerateExerciseData {
    documentId: string;
    exerciseType: ExerciseType;
    questionCount: number;
    difficulty?: ExerciseDifficulty;
    title?: string;
}

// Extracted from models/Exercise.ts
export interface LatestSubmissionSummary {
    id: string;
    userId?: string | null;
    score: number | null;
    status: 'SUBMITTED' | 'GRADED';
    submittedAt: string;
    correctCount: number;
    wrongCount: number;
    totalCount: number;
}
