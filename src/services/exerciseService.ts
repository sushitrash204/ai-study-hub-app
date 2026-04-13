import api from './api';

export interface Question {
    id: string;
    exerciseId: string;
    content: string;
    options: string[] | null;
    correctAnswer: string | null;
    points?: number | null;
}

export interface SubmitAnswer {
    questionId: string;
    answerContent: string | null;
}

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

export interface ExerciseSubmitResult {
    submissionId: string;
    exerciseId: string;
    // Score is normalized on a 10-point scale.
    score: number | null;
    correctCount: number | null;
    totalQuestions: number;
    submissionStatus: 'SUBMITTED' | 'GRADED';
    exerciseStatus: 'COMPLETED';
    essayEvaluation?: EssayEvaluationResult;
}

export interface LatestSubmissionSummary {
    id: string;
    score: number | null;
    status: 'SUBMITTED' | 'GRADED';
    submittedAt: string;
    correctCount: number;
    wrongCount: number;
    totalCount: number;
}

export interface SubmissionAnswer {
    id: string;
    questionId: string | null;
    answerContent: string | null;
    isCorrect: boolean | null;
    score: number | null;
}

export interface SubmissionHistoryItem extends LatestSubmissionSummary {
    answers: SubmissionAnswer[];
}

export interface ExerciseDetail extends Exercise {
    questions: Question[];
    submissionHistory?: SubmissionHistoryItem[];
}

export interface Exercise {
    id: string;
    title: string;
    description?: string;
    status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
    type: 'QUIZ' | 'ESSAY';
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | null;
    dueDate?: string;
    documentId?: string | null;
    subjectId: string;
    userId: string;
    latestSubmission?: LatestSubmissionSummary;
}

export const getExercisesBySubject = async (subjectId: string) => {
    const response = await api.get(`/exercises/subject/${subjectId}`);
    return response.data;
};

export const getAllExercises = async (): Promise<Exercise[]> => {
    const response = await api.get('/exercises');
    return response.data;
};

export const createExercise = async (data: Partial<Exercise> & { documentId: string }) => {
    const response = await api.post('/exercises', data);
    return response.data;
};

export const deleteExercise = async (id: string) => {
    const response = await api.delete(`/exercises/${id}`);
    return response.data;
};

export const getExerciseDetail = async (id: string): Promise<ExerciseDetail> => {
    const response = await api.get(`/exercises/${id}`);
    return response.data;
};

export const generateExerciseFromDocument = async (data: {
    documentId: string;
    exerciseType: 'QUIZ' | 'ESSAY';
    questionCount: number;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    title?: string;
}): Promise<ExerciseDetail> => {
    const response = await api.post('/exercises/generate-from-document', data);
    return response.data;
};

export const submitExercise = async (
    id: string,
    data: { answers: SubmitAnswer[] }
): Promise<ExerciseSubmitResult> => {
    const response = await api.post(`/exercises/${id}/submit`, data);
    return response.data;
};
