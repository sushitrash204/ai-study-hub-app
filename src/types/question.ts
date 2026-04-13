// Question related interfaces

export type QuestionType = 'MULTIPLE_CHOICE' | 'CLOZE_MCQ' | 'CLOZE_TEXT' | 'ESSAY';

export interface QuestionData {
    id: string;
    exerciseId: string;
    content: string;
    type: QuestionType;
    options: any | null;
    correctAnswer: string | null;
    points: number;
}
