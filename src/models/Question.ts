export class Question {
    id: string;
    exerciseId: string;
    content: string;
    type: 'MULTIPLE_CHOICE' | 'CLOZE_MCQ' | 'CLOZE_TEXT' | 'ESSAY';
    options: any | null;
    correctAnswer: string | null;
    points: number;

    constructor(data: any) {
        this.id = data?.id || '';
        this.exerciseId = data?.exerciseId || '';
        this.content = data?.content || '';
        this.type = data?.type || 'MULTIPLE_CHOICE';
        this.options = data?.options || null;
        this.correctAnswer = data?.correctAnswer || null;
        this.points = Number(data?.points) || 1;
    }

    isCorrect(userAnswer: any): boolean {
        if (this.type === 'ESSAY') return false;
        if (!this.correctAnswer) return false;

        const clean = (s: any) => String(s || '')
            .trim()
            .toLowerCase()
            .normalize('NFC')
            .replace(/[.,!?;:]+$/, '');

        if (this.type === 'CLOZE_MCQ' || this.type === 'CLOZE_TEXT') {
            const userArr = Array.isArray(userAnswer) ? userAnswer : [];
            let correctArr: any[] = [];

            try {
                correctArr = Array.isArray(this.correctAnswer)
                    ? this.correctAnswer
                    : JSON.parse(String(this.correctAnswer || '[]'));
            } catch {
                correctArr = String(this.correctAnswer || '')
                    .split(',')
                    .map(s => s.trim());
            }

            if (correctArr.length === 0) return false;

            let correctBlanks = 0;
            correctArr.forEach((c: string, i: number) => {
                if (clean(userArr[i]) === clean(c) && String(userArr[i] || '').trim() !== '') {
                    correctBlanks++;
                }
            });

            return correctBlanks === correctArr.length;
        }

        return clean(userAnswer) === clean(this.correctAnswer);
    }

    get parsedCorrectAnswers(): string[] {
        if (!this.correctAnswer) return [];
        try {
            const parsed = JSON.parse(this.correctAnswer);
            return Array.isArray(parsed) ? parsed : [String(parsed)];
        } catch {
            return String(this.correctAnswer).split(',').map(s => s.trim());
        }
    }


    get parsedOptions(): any {
        if (typeof this.options === 'string') {
            try {
                return JSON.parse(this.options);
            } catch {
                return this.options;
            }
        }
        return this.options;
    }
}
