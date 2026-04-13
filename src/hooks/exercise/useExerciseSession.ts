import { useState, useCallback, useMemo } from 'react';
import { Exercise } from '../../models/Exercise';
import * as exerciseService from '../../services/exerciseService';
import { Question } from '../../models/Question';
import { useExercises } from '../exercises/useExercises';

export const useExerciseSession = (exercise: Exercise | null) => {
    const { actions: exActions } = useExercises();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
    const [essayAnswers, setEssayAnswers] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [essayEvaluation, setEssayEvaluation] = useState<any>(null);
    const [backendResult, setBackendResult] = useState<any>(null);

    const questions = exercise?.questions ?? [];

    const handlePickAnswer = useCallback((questionId: string, answer: string) => {
        if (submitted) return;
        setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
    }, [submitted]);

    const handlePickClozeAnswer = useCallback((questionId: string, blankIndex: number, answer: string) => {
        if (submitted) return;
        setUserAnswers(prev => {
            const current = (prev[questionId] ? (Array.isArray(prev[questionId]) ? [...prev[questionId]] : []) : []);
            current[blankIndex] = answer;
            return { ...prev, [questionId]: current };
        });
    }, [submitted]);

    const handleNext = useCallback(() => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    }, [currentIndex, questions.length]);

    const handlePrev = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    }, [currentIndex]);

    const submit = useCallback(async () => {
        if (!exercise || submitting) return;

        setSubmitting(true);
        try {
            const answersToSubmit = questions.map((q) => {
                const ans = userAnswers[q.id];
                const essayAns = essayAnswers[q.id];

                if (q.type === 'ESSAY') {
                    return {
                        questionId: q.id,
                        answerContent: (essayAns || '').trim() || null,
                    };
                } else {
                    return {
                        questionId: q.id,
                        answerContent: Array.isArray(ans) ? JSON.stringify(ans) : (ans ?? null),
                    };
                }
            });

            const result = await exActions.handleSubmitExercise(exercise.id, answersToSubmit);
            if (result) {
                setSubmitted(true);
                setBackendResult(result);
                if (result.essayEvaluation) {
                    setEssayEvaluation(result.essayEvaluation);
                }
                return result;
            }
        } catch (error: any) {
            // Error managed in exActions
        } finally {
            setSubmitting(false);
        }
    }, [exercise, submitting, questions, userAnswers, essayAnswers, exActions]);

    const resetSession = useCallback(() => {
        setCurrentIndex(0);
        setUserAnswers({});
        setEssayAnswers({});
        setSubmitted(false);
        setEssayEvaluation(null);
        setBackendResult(null);
    }, []);

    const getQuestionPoint = useCallback((question: Question, fallbackPoint: number) => {
        const rawPoint = Number(question.points);
        if (Number.isFinite(rawPoint) && rawPoint > 0) {
            return rawPoint;
        }
        return fallbackPoint;
    }, []);

    const calcCorrectCount = useCallback(() => {
        let correct = 0;
        for (const q of questions) {
            if (q.isCorrect(userAnswers[q.id])) correct++;
        }
        return correct;
    }, [questions, userAnswers]);

    const calcScoreOnTen = useCallback(() => {
        if (!questions.length) return 0;

        let earnedPoints = 0;
        let totalWeight = 0;
        const fallbackPoint = 10 / questions.length;

        for (const q of questions) {
            const weight = getQuestionPoint(q, fallbackPoint);
            totalWeight += weight;
            const picked = userAnswers[q.id];

            // Đối với Cloze Test, chúng ta tính điểm dựa trên tỉ lệ ô trống đúng
            if (q.type === 'CLOZE_MCQ' || q.type === 'CLOZE_TEXT') {
                const userArr = Array.isArray(picked) ? picked : [];
                const correctArr = q.parsedCorrectAnswers;

                if (correctArr.length > 0) {
                    const clean = (s: any) => String(s || '').trim().toLowerCase().normalize('NFC').replace(/[.,!?;:]+$/, '');
                    let correctBlanks = 0;
                    correctArr.forEach((c: string, i: number) => {
                        if (clean(userArr[i]) === clean(c) && String(userArr[i] || '').trim() !== '') {
                            correctBlanks++;
                        }
                    });
                    earnedPoints += (correctBlanks / correctArr.length) * weight;
                }
            } else if (q.isCorrect(picked)) {
                earnedPoints += weight;
            }
        }

        if (totalWeight <= 0) return 0;
        const finalScore = (earnedPoints / totalWeight) * 10;
        return Number(finalScore.toFixed(2));
    }, [questions, userAnswers, getQuestionPoint]);

    return {
        state: {
            currentIndex,
            userAnswers,
            essayAnswers,
            submitted,
            submitting,
            essayEvaluation,
            backendResult,
            questions,
        },
        actions: {
            handlePickAnswer,
            handlePickClozeAnswer,
            handleNext,
            handlePrev,
            submit,
            resetSession,
            calcCorrectCount,
            calcScoreOnTen,
            setEssayAnswers,
            setEssayEvaluation,
            setBackendResult,
            setCurrentIndex,
            setSubmitted,
            setUserAnswers,
            getQuestionPoint,
            isQuestionCorrect: (q: Question, picked: any) => q.isCorrect(picked),
        }
    };
};
