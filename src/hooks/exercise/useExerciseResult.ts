import { useMemo } from 'react';
import * as exerciseService from '../../services/exerciseService';
type Question = exerciseService.Question;

interface ExerciseSessionState {
    userAnswers: Record<string, any>;
    essayEvaluation?: {
        scoreOnTen: number;
        items: any[];
    } | null;
    questions: Question[];
}

interface SessionActions {
    calcCorrectCount: () => number;
    calcScoreOnTen: () => number;
}

/**
 * A hook to compute derived result metrics from the exercise session.
 * This keeps the UI component clean of heavy calculation logic.
 */
export const useExerciseResult = (session: ExerciseSessionState, actions: SessionActions) => {
    const { userAnswers, questions, essayEvaluation } = session;

    const results = useMemo(() => {
        const total = questions.length;
        const correctCount = actions.calcCorrectCount();
        const scoreOnTen = essayEvaluation ? essayEvaluation.scoreOnTen : actions.calcScoreOnTen();
        
        const answeredCount = questions.reduce(
            (count, q) => count + (userAnswers[q.id] ? 1 : 0),
            0
        );

        const wrongCount = Math.max(total - correctCount, 0);
        const pct = total > 0 ? Math.round((scoreOnTen / 10) * 100) : 0;
        const passed = scoreOnTen >= 6;

        const ratioCorrect = total > 0 ? (correctCount / total) * 100 : 0;
        const ratioWrong = total > 0 ? (wrongCount / total) * 100 : 0;

        const performance = scoreOnTen >= 8.5
            ? {
                title: 'Bứt phá ấn tượng',
                message: 'Bạn nắm bài rất chắc. Giữ nhịp này để đạt điểm tuyệt đối.',
                icon: 'sparkles' as const,
                accent: '#0284C7',
                accentSoft: '#E0F2FE',
                accentText: '#075985',
            }
            : scoreOnTen >= 6
                ? {
                    title: 'Vượt mốc an toàn',
                    message: 'Bạn đã đạt yêu cầu. Làm lại để tối ưu tốc độ và độ chính xác nhé.',
                    icon: 'trending-up' as const,
                    accent: '#16A34A',
                    accentSoft: '#DCFCE7',
                    accentText: '#166534',
                }
                : {
                    title: 'Tăng tốc lần nữa',
                    message: 'Bạn đang tiến bộ. Xem lại phần sai và làm lại ngay để lên hạng.',
                    icon: 'flash' as const,
                    accent: '#EA580C',
                    accentSoft: '#FFEDD5',
                    accentText: '#9A3412',
                };

        const scoreChips = [
            { label: 'Điểm số', value: `${scoreOnTen.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}/10`, tone: '#0F172A' },
            { label: 'Đã đúng', value: `${correctCount}/${total}`, tone: '#047857' },
            { label: 'Lỗi sai', value: String(wrongCount), tone: '#B91C1C' },
        ];

        return {
            total,
            correctCount,
            scoreOnTen,
            answeredCount,
            wrongCount,
            pct,
            passed,
            ratioCorrect,
            ratioWrong,
            performance,
            scoreChips
        };
    }, [questions, userAnswers, essayEvaluation, actions]);

    return results;
};
