// Submission related interfaces

export interface EssayEvaluationItem {
    questionId: string;
    score: number;
    maxPoints: number;
    aiAnswer: string;
    feedback: string;
}

export interface EssayEvaluationResult {
    summary: string;
    totalScore: number;
    maxScore: number;
    scoreOnTen: number;
    items: EssayEvaluationItem[];
}

export interface SubmitAnswer {
    questionId: string;
    answerContent: string | null;
}

export interface SubmissionAnswerData {
    id?: string;
    questionId?: string | null;
    answerContent?: string | null;
    isCorrect?: boolean | null;
    score?: number | string | null;
}

export interface SubmissionData {
    id?: string;
    userId?: string | null;
    score?: number | null;
    status?: 'SUBMITTED' | 'GRADED';
    submittedAt?: string;
    correctCount?: number;
    wrongCount?: number;
    totalCount?: number;
    answers?: SubmissionAnswerData[];
    essayEvaluation?: EssayEvaluationResult | null;
}
