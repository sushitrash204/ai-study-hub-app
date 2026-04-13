// Study Group Shared Results & Leaderboard types

export type SharedResultType = 'EXERCISE_RESULT';

export interface SharedExerciseResult {
    id: string;
    groupId: string;
    userId: string;
    exerciseId: string;
    submissionId: string;
    score: number;
    totalQuestions: number;
    correctCount: number;
    sharedAt: string;
    exercise?: {
        id: string;
        title: string;
        subject?: {
            id: string;
            name: string;
        };
    };
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
    };
}

export interface ShareResultPayload {
    exerciseId: string;
    submissionId: string;
    score: number;
    totalQuestions: number;
    correctCount: number;
}

// Leaderboard types
export interface LeaderboardEntry {
    userId: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
    };
    totalExercises: number;
    averageScore: number;
    bestScore: number;
    rank: number;
}

export type LeaderboardPeriod = 'all' | 'week' | 'month';

export interface LeaderboardFilters {
    period: LeaderboardPeriod;
    exerciseId?: string;
}

export interface LeaderboardResponse {
    entries: LeaderboardEntry[];
    currentUserRank?: LeaderboardEntry;
    totalMembers: number;
}
