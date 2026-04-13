import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    ActivityIndicator, TouchableOpacity, Alert, FlatList, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as exerciseService from '../../services/exerciseService';

type ExerciseDetail = exerciseService.ExerciseDetail;
type Question = exerciseService.Question;
type SubmissionHistoryItem = exerciseService.SubmissionHistoryItem;
type EssayEvaluationResult = exerciseService.EssayEvaluationResult;

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const shuffleArray = <T,>(arr: T[]): T[] => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

const randomizeQuestionOptions = (questions: Question[]) => {
    return questions.map((question) => {
        if (!Array.isArray(question.options)) {
            return question;
        }

        return {
            ...question,
            options: shuffleArray(question.options),
        };
    });
};

const randomizeQuestions = (questions: Question[]) =>
    randomizeQuestionOptions(shuffleArray(questions));

const mapSubmissionAnswers = (submission?: SubmissionHistoryItem) => {
    const answerMap: Record<string, string> = {};

    for (const answer of submission?.answers ?? []) {
        if (!answer.questionId || answer.answerContent == null) {
            continue;
        }

        answerMap[answer.questionId] = answer.answerContent;
    }

    return answerMap;
};

export default function ExerciseDetailScreen({ route, navigation }: any) {
    const { exerciseId, entryAction } = route.params;
    const isReviewMode = entryAction === 'review';
    const [exercise, setExercise] = useState<ExerciseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Quiz interactive state
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [essayAnswers, setEssayAnswers] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);
    const [essayEvaluation, setEssayEvaluation] = useState<EssayEvaluationResult | null>(null);

    useEffect(() => {
        setLoading(true);
        setSubmitted(false);
        setCurrentIndex(0);
        setUserAnswers({});
        setEssayAnswers({});
        setEssayEvaluation(null);

        (async () => {
            try {
                const data = await exerciseService.getExerciseDetail(exerciseId);
                const latestSubmission = data.submissionHistory?.[0];

                if (isReviewMode && !latestSubmission) {
                    Alert.alert('Chưa có lịch sử', 'Bài này chưa có lần nộp nào để xem lại.');
                    navigation.goBack();
                    return;
                }

                if (data.type === 'QUIZ' && !isReviewMode) {
                    setExercise({
                        ...data,
                        questions: randomizeQuestions(data.questions ?? []),
                    });
                } else {
                    setExercise(data);
                }

                if (isReviewMode && latestSubmission) {
                    const answerMap = mapSubmissionAnswers(latestSubmission);

                    if (data.type === 'QUIZ') {
                        setUserAnswers(answerMap);
                        setSubmitted(true);
                    }
                    // ESSAY review mode renders from submissionHistory directly
                }
            } catch (error: any) {
                Alert.alert('Lỗi', error?.response?.data?.message || error.message || 'Không tải được bài tập.');
                navigation.goBack();
            } finally {
                setLoading(false);
            }
        })();
    }, [exerciseId, entryAction]);

    const questions = exercise?.questions ?? [];
    const isQuiz = exercise?.type === 'QUIZ';

    const reshuffleQuizOptions = () => {
        setExercise((prev) => {
            if (!prev || prev.type !== 'QUIZ') {
                return prev;
            }

            return {
                ...prev,
                questions: randomizeQuestions(prev.questions ?? []),
            };
        });
    };

    const handlePickAnswer = (questionId: string, answer: string) => {
        if (submitted) return;
        setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const submitQuiz = async () => {
        if (submitting) return;

        setSubmitting(true);
        try {
            await exerciseService.submitExercise(exerciseId, {
                answers: questions.map((q) => ({
                    questionId: q.id,
                    answerContent: userAnswers[q.id] ?? null,
                })),
            });
            setExercise((prev) => (prev ? { ...prev, status: 'COMPLETED' } : prev));
            setSubmitted(true);
        } catch (error: any) {
            Alert.alert('Lỗi', error?.response?.data?.message || error.message || 'Không thể nộp bài lúc này.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmit = () => {
        if (submitting) return;

        const unanswered = questions.filter(q => !userAnswers[q.id]);
        if (unanswered.length > 0) {
            Alert.alert(
                'Chưa hoàn thành',
                `Còn ${unanswered.length} câu chưa trả lời. Bạn có muốn nộp không?`,
                [
                    { text: 'Tiếp tục làm', style: 'cancel' },
                    { text: 'Nộp bài', onPress: submitQuiz },
                ]
            );
        } else {
            submitQuiz();
        }
    };

    const handleRetryQuiz = () => {
        reshuffleQuizOptions();
        setSubmitted(false);
        setCurrentIndex(0);
        setUserAnswers({});
    };

    const handleRetryEssay = () => {
        setEssayAnswers({});
        setEssayEvaluation(null);
        setSubmitted(false);
    };

    const formatPoint = (value: number, maxFractionDigits = 2) => {
        return value.toLocaleString('vi-VN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: maxFractionDigits,
        });
    };

    const getQuestionPoint = (question: Question, fallbackPoint: number) => {
        const rawPoint = Number(question.points);
        if (Number.isFinite(rawPoint) && rawPoint > 0) {
            return rawPoint;
        }
        return fallbackPoint;
    };

    const calcCorrectCount = () => {
        let correct = 0;
        for (const q of questions) {
            if (q.correctAnswer && userAnswers[q.id] === q.correctAnswer) {
                correct++;
            }
        }
        return correct;
    };

    const calcScoreOnTen = () => {
        if (!questions.length) {
            return 0;
        }

        const fallbackPoint = 10 / questions.length;
        let earnedPoints = 0;
        let totalPoints = 0;

        for (const q of questions) {
            const point = getQuestionPoint(q, fallbackPoint);
            totalPoints += point;

            if (q.correctAnswer && userAnswers[q.id] === q.correctAnswer) {
                earnedPoints += point;
            }
        }

        if (totalPoints <= 0) {
            return 0;
        }

        return Number(((earnedPoints / totalPoints) * 10).toFixed(2));
    };

    const handleDeleteExercise = () => {
        Alert.alert('Xóa bộ đề', 'Bạn có chắc chắn muốn xóa bộ đề này?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await exerciseService.deleteExercise(exerciseId);
                        Alert.alert('Đã xóa', 'Bộ đề đã được xóa thành công.', [
                            { text: 'OK', onPress: () => navigation.goBack() },
                        ]);
                    } catch (error: any) {
                        Alert.alert('Lỗi', error?.response?.data?.message || error.message || 'Không thể xóa bộ đề.');
                    }
                },
            },
        ]);
    };

    const handleOpenExerciseActions = () => {
        const actionItems: Array<{ text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }> = [];

        if (isQuiz) {
            actionItems.push({ text: 'Làm lại', onPress: handleRetryQuiz });
        } else {
            actionItems.push({ text: 'Làm lại', onPress: handleRetryEssay });
        }

        actionItems.push({ text: 'Xóa bộ đề', style: 'destructive', onPress: handleDeleteExercise });
        actionItems.push({ text: 'Hủy', style: 'cancel' });

        Alert.alert('Tùy chọn bộ đề', 'Bạn muốn thực hiện thao tác nào?', actionItems);
    };

    const handleCompleteEssay = async () => {
        if (submitting) return;

        const unanswered = questions.filter((q) => !(essayAnswers[q.id] || '').trim());

        const submitEssay = async () => {
            setSubmitting(true);
            try {
                const result = await exerciseService.submitExercise(exerciseId, {
                    answers: questions.map((q) => ({
                        questionId: q.id,
                        answerContent: (essayAnswers[q.id] || '').trim() || null,
                    })),
                });
                setExercise((prev) => (prev ? { ...prev, status: 'COMPLETED' } : prev));
                if (result.essayEvaluation) {
                    setEssayEvaluation(result.essayEvaluation);
                } else {
                    Alert.alert('Đã lưu', 'Đã nộp câu trả lời tự luận và lưu kết quả.', [
                        { text: 'OK', onPress: () => navigation.goBack() },
                    ]);
                }
            } catch (error: any) {
                Alert.alert('Lỗi', error?.response?.data?.message || error.message || 'Không thể lưu kết quả lúc này.');
            } finally {
                setSubmitting(false);
            }
        };

        if (unanswered.length > 0) {
            Alert.alert(
                'Chưa hoàn thành',
                `Còn ${unanswered.length} câu chưa nhập nội dung. Bạn vẫn muốn nộp chứ?`,
                [
                    { text: 'Tiếp tục làm', style: 'cancel' },
                    { text: 'Nộp bài', onPress: submitEssay },
                ]
            );
            return;
        }

        submitEssay();
    };

    // ─── Loading ───────────────────────────────────
    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Đang tải...</Text>
                    <View style={{ width: 34 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8B5CF6" />
                </View>
            </SafeAreaView>
        );
    }

    if (!exercise) return null;

    // ─── Score screen after QUIZ submit ───────────
    if (isQuiz && submitted) {
        const correctCount = calcCorrectCount();
        const total = questions.length;
        const scoreOnTen = calcScoreOnTen();
        const scoreText = formatPoint(scoreOnTen);
        const answeredCount = questions.reduce(
            (count, question) => count + (userAnswers[question.id] ? 1 : 0),
            0
        );
        const wrongCount = Math.max(answeredCount - correctCount, 0);
        const unansweredCount = Math.max(total - answeredCount, 0);
        const pct = Math.round((scoreOnTen / 10) * 100);
        const passed = scoreOnTen >= 6;

        const ratioCorrect = total > 0 ? (correctCount / total) * 100 : 0;
        const ratioWrong = total > 0 ? (wrongCount / total) * 100 : 0;
        const ratioSkipped = total > 0 ? (unansweredCount / total) * 100 : 0;

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
            { label: 'Điểm', value: `${scoreText}/10`, tone: '#0F172A' },
            { label: 'Đúng', value: `${correctCount}/${total}`, tone: '#047857' },
            { label: 'Sai', value: String(wrongCount), tone: '#B91C1C' },
            { label: 'Bỏ trống', value: String(unansweredCount), tone: '#475569' },
        ];

        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Kết quả</Text>
                    <TouchableOpacity onPress={handleOpenExerciseActions} style={styles.headerIconBtn}>
                        <Ionicons name="create-outline" size={20} color="#2563EB" />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.resultContent} showsVerticalScrollIndicator={false}>
                    <View style={[styles.scoreHeroCard, { borderColor: performance.accent }]}> 
                        <View style={[styles.heroGlow, { backgroundColor: performance.accentSoft }]} />
                        <View style={[styles.heroIconWrap, { backgroundColor: performance.accentSoft }]}> 
                            <Ionicons name={performance.icon} size={24} color={performance.accent} />
                        </View>
                        <Text style={[styles.heroTierTitle, { color: performance.accentText }]}>{performance.title}</Text>
                        <View style={styles.heroScoreLine}>
                            <Text style={[styles.heroScoreNum, { color: performance.accent }]}>{scoreText}</Text>
                            <Text style={styles.heroScoreDivider}>/</Text>
                            <Text style={styles.heroScoreTotal}>10</Text>
                        </View>
                        <Text style={styles.heroScorePct}>Tương đương {pct}% • Đúng {correctCount}/{total}</Text>
                        <Text style={styles.heroTierMessage}>{performance.message}</Text>

                        <View style={styles.metricGrid}>
                            {scoreChips.map((chip) => (
                                <View key={chip.label} style={styles.metricChip}>
                                    <Text style={styles.metricChipLabel}>{chip.label}</Text>
                                    <Text style={[styles.metricChipValue, { color: chip.tone }]}>{chip.value}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={styles.distributionCard}>
                        <View style={styles.distributionHeader}>
                            <Text style={styles.distributionTitle}>Tỷ lệ đúng / sai</Text>
                            <Text style={styles.distributionHint}>{passed ? 'Đạt yêu cầu' : 'Cần cải thiện'}</Text>
                        </View>
                        <View style={styles.distributionBarTrack}>
                            <View
                                style={[
                                    styles.distributionBarCorrect,
                                    { width: `${Math.max(ratioCorrect, 0)}%` as any },
                                ]}
                            />
                            <View
                                style={[
                                    styles.distributionBarWrong,
                                    { width: `${Math.max(ratioWrong, 0)}%` as any },
                                ]}
                            />
                            {unansweredCount > 0 ? (
                                <View
                                    style={[
                                        styles.distributionBarSkipped,
                                        { width: `${Math.max(ratioSkipped, 0)}%` as any },
                                    ]}
                                />
                            ) : null}
                        </View>
                        <View style={styles.distributionLegendRow}>
                            <View style={styles.distributionLegendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                                <Text style={styles.legendText}>Đúng {correctCount}</Text>
                            </View>
                            <View style={styles.distributionLegendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                                <Text style={styles.legendText}>Sai {wrongCount}</Text>
                            </View>
                            {unansweredCount > 0 ? (
                                <View style={styles.distributionLegendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: '#94A3B8' }]} />
                                    <Text style={styles.legendText}>Bỏ trống {unansweredCount}</Text>
                                </View>
                            ) : null}
                        </View>
                    </View>

                    <Text style={styles.reviewTitle}>Xem lại đáp án</Text>

                    {questions.map((q, idx) => {
                        const picked = userAnswers[q.id];
                        const answered = !!picked;
                        const fallbackPoint = total > 0 ? 10 / total : 0;
                        const questionPoint = getQuestionPoint(q, fallbackPoint);
                        const isCorrect = picked === q.correctAnswer;
                        const stateLabel = !answered ? 'Bỏ trống' : isCorrect ? 'Chính xác' : 'Chưa đúng';

                        const stateChipStyle = !answered
                            ? styles.reviewStateChipSkipped
                            : isCorrect
                                ? styles.reviewStateChipCorrect
                                : styles.reviewStateChipWrong;

                        const stateTextStyle = !answered
                            ? styles.reviewStateTextSkipped
                            : isCorrect
                                ? styles.reviewStateTextCorrect
                                : styles.reviewStateTextWrong;

                        const cardBorderColor = !answered
                            ? '#CBD5E1'
                            : isCorrect
                                ? '#6EE7B7'
                                : '#FCA5A5';

                        return (
                            <View key={q.id} style={[styles.reviewCard, { borderColor: cardBorderColor }]}>
                                <View style={styles.reviewCardHeader}>
                                    <View
                                        style={[
                                            styles.indexBadge,
                                            { backgroundColor: !answered ? '#E2E8F0' : isCorrect ? '#D1FAE5' : '#FEE2E2' },
                                        ]}
                                    >
                                        <Ionicons
                                            name={!answered ? 'remove' : isCorrect ? 'checkmark' : 'close'}
                                            size={14}
                                            color={!answered ? '#475569' : isCorrect ? '#059669' : '#DC2626'}
                                        />
                                    </View>
                                    <View style={styles.reviewHeaderTextWrap}>
                                        <Text style={styles.reviewQuestionText}>{idx + 1}. {q.content}</Text>
                                        <View style={styles.reviewMetaRow}>
                                            <View style={[styles.reviewStateChip, stateChipStyle]}>
                                                <Text style={[styles.reviewStateText, stateTextStyle]}>{stateLabel}</Text>
                                            </View>
                                            <Text style={styles.reviewPointText}>{formatPoint(questionPoint)} điểm</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.answerSummaryRow}>
                                    <View style={styles.answerSummaryItem}>
                                        <Text style={styles.answerSummaryLabel}>Bạn chọn</Text>
                                        <Text style={styles.answerSummaryValue} numberOfLines={2}>
                                            {picked || 'Chưa trả lời'}
                                        </Text>
                                    </View>
                                    <View style={styles.answerSummaryItem}>
                                        <Text style={styles.answerSummaryLabel}>Đáp án đúng</Text>
                                        <Text style={[styles.answerSummaryValue, { color: '#166534' }]} numberOfLines={2}>
                                            {q.correctAnswer || 'Không có'}
                                        </Text>
                                    </View>
                                </View>

                                {(q.options ?? []).map((opt, oi) => {
                                    const isPicked = picked === opt;
                                    const isCorrectOpt = opt === q.correctAnswer;
                                    let bg = '#F9FAFB';
                                    if (isCorrectOpt) bg = '#D1FAE5';
                                    else if (isPicked && !isCorrectOpt) bg = '#FEE2E2';
                                    return (
                                        <View key={oi} style={[styles.reviewOption, { backgroundColor: bg }]}>
                                            <Text style={styles.reviewOptionLabel}>{OPTION_LABELS[oi]}.</Text>
                                            <Text style={styles.reviewOptionText}>{opt}</Text>
                                            {isCorrectOpt && <Ionicons name="checkmark-circle" size={16} color="#059669" />}
                                            {!isCorrectOpt && isPicked && <Ionicons name="close-circle" size={16} color="#DC2626" />}
                                        </View>
                                    );
                                })}
                            </View>
                        );
                    })}

                    <View style={styles.resultActions}>
                        <TouchableOpacity style={[styles.resultActionBtn, styles.resultActionGhost]} onPress={handleRetryQuiz}>
                            <Ionicons name="refresh" size={18} color="#7C3AED" />
                            <Text style={styles.resultActionTextGhost}>Làm lại ngay</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.resultActionBtn, styles.resultActionPrimary]} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={18} color="#fff" />
                            <Text style={styles.resultActionTextPrimary}>Quay về</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // ─── QUIZ interactive ─────────────────────────
    if (isQuiz) {
        const q = questions[currentIndex];
        const picked = userAnswers[q?.id ?? ''];
        const answeredCount = Object.keys(userAnswers).length;
        const fallbackPoint = questions.length > 0 ? 10 / questions.length : 0;
        const currentQuestionPoint = q ? getQuestionPoint(q, fallbackPoint) : 0;

        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle} numberOfLines={1}>{exercise.title}</Text>
                        <Text style={styles.headerProgress}>{currentIndex + 1} / {questions.length}</Text>
                    </View>
                    <TouchableOpacity onPress={handleOpenExerciseActions} style={styles.headerIconBtn}>
                        <Ionicons name="create-outline" size={20} color="#2563EB" />
                    </TouchableOpacity>
                </View>

                {/* Progress bar */}
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${((currentIndex + 1) / questions.length) * 100}%` as any }]} />
                </View>

                <ScrollView contentContainerStyle={styles.quizContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.questionCard}>
                        <View style={styles.questionIndexBadge}>
                            <Text style={styles.questionIndexText}>Câu {currentIndex + 1}</Text>
                        </View>
                        <Text style={styles.questionText}>{q?.content}</Text>
                        <Text style={styles.questionPointHint}>Trọng số: {formatPoint(currentQuestionPoint)} điểm</Text>
                    </View>

                    {(q?.options ?? []).map((opt, oi) => {
                        const isSelected = picked === opt;
                        return (
                            <TouchableOpacity
                                key={oi}
                                style={[styles.optionBtn, isSelected && styles.optionBtnSelected]}
                                onPress={() => handlePickAnswer(q.id, opt)}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                                    <Text style={[styles.optionLabelText, isSelected && { color: '#8B5CF6' }]}>
                                        {OPTION_LABELS[oi]}
                                    </Text>
                                </View>
                                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                                    {opt}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Footer nav */}
                <View style={styles.quizFooter}>
                    <TouchableOpacity
                        style={[styles.navBtn, styles.navBtnOutline, currentIndex === 0 && styles.navBtnDisabled]}
                        onPress={handlePrev}
                        disabled={currentIndex === 0}
                    >
                        <Ionicons name="chevron-back" size={20} color={currentIndex === 0 ? '#D1D5DB' : '#8B5CF6'} />
                        <Text style={[styles.navBtnText, { color: currentIndex === 0 ? '#D1D5DB' : '#8B5CF6' }]}>Trước</Text>
                    </TouchableOpacity>

                    <Text style={styles.answeredHint}>{answeredCount}/{questions.length} đã trả lời</Text>

                    {currentIndex < questions.length - 1 ? (
                        <TouchableOpacity style={[styles.navBtn, styles.navBtnSolid]} onPress={handleNext}>
                            <Text style={[styles.navBtnText, { color: '#fff' }]}>Tiếp</Text>
                            <Ionicons name="chevron-forward" size={20} color="#fff" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.navBtn, styles.navBtnSubmit, submitting && { opacity: 0.7 }]}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Text style={[styles.navBtnText, { color: '#fff' }]}>Nộp bài</Text>
                                    <Ionicons name="checkmark" size={20} color="#fff" />
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </SafeAreaView>
        );
    }

    if (!isQuiz && essayEvaluation && !isReviewMode) {
        const scoreOnTenText = formatPoint(essayEvaluation.scoreOnTen);

        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Kết quả tự luận</Text>
                    <TouchableOpacity onPress={handleOpenExerciseActions} style={styles.headerIconBtn}>
                        <Ionicons name="create-outline" size={20} color="#2563EB" />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.resultContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.essayResultHero}>
                        <Text style={styles.essayResultHeroTitle}>AI đã chấm xong bài của bạn</Text>
                        <View style={styles.heroScoreLine}>
                            <Text style={[styles.heroScoreNum, { color: '#1D4ED8' }]}>{scoreOnTenText}</Text>
                            <Text style={styles.heroScoreDivider}>/</Text>
                            <Text style={styles.heroScoreTotal}>10</Text>
                        </View>
                        <Text style={styles.essayResultHeroMeta}>
                            {formatPoint(essayEvaluation.totalScore)} / {formatPoint(essayEvaluation.maxScore)} điểm thô
                        </Text>
                        <Text style={styles.essayResultSummary}>{essayEvaluation.summary}</Text>
                    </View>

                    <Text style={styles.reviewTitle}>Nhận xét từng câu</Text>

                    {essayEvaluation.items.map((item, idx) => {
                        const question = questions.find((q) => q.id === item.questionId);
                        const userAnswer = essayAnswers[item.questionId] || 'Chưa trả lời';

                        return (
                            <View key={`${item.questionId}-${idx}`} style={styles.essayEvalCard}>
                                <View style={styles.essayEvalHeader}>
                                    <Text style={styles.essayEvalIndex}>Câu {idx + 1}</Text>
                                    <Text style={styles.essayEvalScore}>
                                        {formatPoint(item.score)} / {formatPoint(item.maxPoints)} điểm
                                    </Text>
                                </View>
                                <Text style={styles.essayEvalQuestion}>{question?.content || 'Không tìm thấy nội dung câu hỏi.'}</Text>

                                <Text style={styles.essayEvalLabel}>Bài làm của bạn</Text>
                                <Text style={styles.essayEvalBody}>{userAnswer || 'Chưa trả lời'}</Text>

                                <Text style={styles.essayEvalLabel}>Đáp án gợi ý từ AI</Text>
                                <Text style={styles.essayEvalBody}>{item.aiAnswer}</Text>

                                <Text style={styles.essayEvalLabel}>Nhận xét từ AI</Text>
                                <Text style={styles.essayEvalBody}>{item.feedback}</Text>
                            </View>
                        );
                    })}

                    <View style={styles.resultActions}>
                        <TouchableOpacity
                            style={[styles.resultActionBtn, styles.resultActionGhost]}
                            onPress={handleRetryEssay}
                        >
                            <Ionicons name="refresh" size={18} color="#7C3AED" />
                            <Text style={styles.resultActionTextGhost}>Làm lại</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.resultActionBtn, styles.resultActionGhost]}
                            onPress={() => setEssayEvaluation(null)}
                        >
                            <Ionicons name="create-outline" size={18} color="#7C3AED" />
                            <Text style={styles.resultActionTextGhost}>Sửa &amp; nộp lại</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.resultActions, { marginTop: 8 }]}>
                        <TouchableOpacity
                            style={[styles.resultActionBtn, styles.resultActionPrimary]}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={18} color="#fff" />
                            <Text style={styles.resultActionTextPrimary}>Quay về</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // ─── ESSAY: review mode ───────────────────────
    if (!isQuiz && isReviewMode) {
        const latestSubmission = exercise.submissionHistory?.[0];
        const submissionAnswerMap = mapSubmissionAnswers(latestSubmission);
        const submissionScoreMap: Record<string, number | null> = {};
        for (const ans of latestSubmission?.answers ?? []) {
            if (ans.questionId != null) {
                submissionScoreMap[ans.questionId] = ans.score ?? null;
            }
        }
        const totalScoreOnTen = latestSubmission?.score ?? null;
        const fallbackPoint = questions.length > 0 ? 10 / questions.length : 0;

        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Xem lại tự luận</Text>
                    <TouchableOpacity onPress={handleOpenExerciseActions} style={styles.headerIconBtn}>
                        <Ionicons name="create-outline" size={20} color="#2563EB" />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.resultContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.essayResultHero}>
                        <Text style={styles.essayResultHeroTitle}>Kết quả lần nộp gần nhất</Text>
                        <View style={styles.heroScoreLine}>
                            <Text style={[styles.heroScoreNum, { color: '#1D4ED8' }]}>
                                {totalScoreOnTen != null ? formatPoint(totalScoreOnTen) : '—'}
                            </Text>
                            <Text style={styles.heroScoreDivider}>/</Text>
                            <Text style={styles.heroScoreTotal}>10</Text>
                        </View>
                    </View>

                    <Text style={styles.reviewTitle}>Bài làm của bạn</Text>

                    {questions.map((q, idx) => {
                        const userAnswer = submissionAnswerMap[q.id] || '';
                        const questionScore = submissionScoreMap[q.id];
                        const questionMaxPoints = getQuestionPoint(q, fallbackPoint);

                        return (
                            <View key={q.id} style={styles.essayReviewCard}>
                                <View style={styles.essayEvalHeader}>
                                    <Text style={styles.essayEvalIndex}>Câu {idx + 1}</Text>
                                    <Text style={styles.essayEvalScore}>
                                        {questionScore != null
                                            ? `${formatPoint(questionScore)} / ${formatPoint(questionMaxPoints)} điểm`
                                            : `— / ${formatPoint(questionMaxPoints)} điểm`}
                                    </Text>
                                </View>
                                <Text style={styles.essayEvalQuestion}>{q.content}</Text>
                                <Text style={styles.essayEvalLabel}>Câu trả lời của bạn</Text>
                                <Text style={styles.essayEvalBody}>{userAnswer || 'Chưa trả lời'}</Text>
                            </View>
                        );
                    })}

                    <View style={styles.resultActions}>
                        <TouchableOpacity
                            style={[styles.resultActionBtn, styles.resultActionGhost]}
                            onPress={handleRetryEssay}
                        >
                            <Ionicons name="refresh" size={18} color="#7C3AED" />
                            <Text style={styles.resultActionTextGhost}>Làm lại</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.resultActionBtn, styles.resultActionPrimary]}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={18} color="#fff" />
                            <Text style={styles.resultActionTextPrimary}>Quay về</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // ─── ESSAY: read-only list ────────────────────
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{exercise.title}</Text>
                    <Text style={styles.headerSub}>Tự luận • {questions.length} câu</Text>
                </View>
                <TouchableOpacity onPress={handleOpenExerciseActions} style={styles.headerIconBtn}>
                    <Ionicons name="create-outline" size={20} color="#2563EB" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={questions}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.essayList}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                ListHeaderComponent={
                    <View>
                        {exercise.description ? (
                            <View style={styles.descCard}>
                                <Text style={styles.descText}>{exercise.description}</Text>
                            </View>
                        ) : null}
                        <View style={styles.essayNoticeCard}>
                            <Ionicons name="information-circle-outline" size={18} color="#1D4ED8" />
                            <Text style={styles.essayNoticeText}>
                                {isReviewMode
                                    ? 'Đây là nội dung bạn đã nộp ở lần gần nhất.'
                                    : 'Bài tự luận không có đáp án đúng sẵn. Hãy nhập câu trả lời của bạn, sau đó nộp để lưu kết quả.'}
                            </Text>
                        </View>
                    </View>
                }
                renderItem={({ item, index }) => (
                    <View style={styles.essayCard}>
                        <View style={styles.essayIndexBadge}>
                            <Text style={styles.essayIndexText}>{index + 1}</Text>
                        </View>
                        <View style={styles.essayContentWrap}>
                            <Text style={styles.essayQuestionText}>{item.content}</Text>
                            <TextInput
                                style={styles.essayInput}
                                placeholder="Nhập câu trả lời của bạn..."
                                placeholderTextColor="#9CA3AF"
                                multiline
                                textAlignVertical="top"
                                editable={!isReviewMode}
                                value={essayAnswers[item.id] || ''}
                                onChangeText={(value) => setEssayAnswers((prev) => ({ ...prev, [item.id]: value }))}
                            />
                            <Text style={styles.essayInputHint}>
                                {(essayAnswers[item.id] || '').trim().length} ký tự
                            </Text>
                        </View>
                    </View>
                )}
                ListFooterComponent={isReviewMode ? null : (
                    <TouchableOpacity
                        style={[styles.markDoneBtn, submitting && { opacity: 0.7 }]}
                        onPress={handleCompleteEssay}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                                <Text style={styles.markDoneBtnText}>  Nộp bài tự luận</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    header: {
        height: Constants.statusBarHeight + 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Constants.statusBarHeight,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backBtn: { padding: 5 },
    headerIconBtn: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center' },
    headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', textAlign: 'center' },
    headerProgress: { fontSize: 12, color: '#8B5CF6', fontWeight: '600', marginTop: 2 },
    headerSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Progress bar
    progressBarBg: { height: 4, backgroundColor: '#EDE9FE' },
    progressBarFill: { height: 4, backgroundColor: '#8B5CF6' },

    // Quiz
    quizContent: { padding: 20, paddingBottom: 40 },
    questionCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    questionIndexBadge: {
        backgroundColor: '#EDE9FE',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    questionIndexText: { color: '#7C3AED', fontWeight: '700', fontSize: 13 },
    questionText: { fontSize: 16, lineHeight: 24, fontWeight: '600', color: '#1F2937' },
    questionPointHint: {
        marginTop: 8,
        fontSize: 12,
        color: '#475569',
        fontWeight: '700',
    },
    optionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
    },
    optionBtnSelected: {
        borderColor: '#8B5CF6',
        backgroundColor: '#F5F3FF',
    },
    optionLabel: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    optionLabelSelected: { backgroundColor: '#EDE9FE' },
    optionLabelText: { fontWeight: '700', color: '#6B7280', fontSize: 14 },
    optionText: { flex: 1, fontSize: 15, color: '#374151', lineHeight: 22 },
    optionTextSelected: { color: '#1F2937', fontWeight: '600' },

    // Footer nav
    quizFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    navBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 20,
    },
    navBtnOutline: { borderWidth: 1.5, borderColor: '#8B5CF6' },
    navBtnSolid: { backgroundColor: '#8B5CF6' },
    navBtnSubmit: { backgroundColor: '#10B981' },
    navBtnDisabled: { borderColor: '#E5E7EB' },
    navBtnText: { fontWeight: '700', fontSize: 14 },
    answeredHint: { fontSize: 13, color: '#6B7280', fontWeight: '500' },

    // Result
    resultContent: { padding: 20, paddingBottom: 40 },
    scoreHeroCard: {
        backgroundColor: '#fff',
        borderRadius: 22,
        paddingHorizontal: 18,
        paddingVertical: 20,
        alignItems: 'center',
        marginBottom: 14,
        borderWidth: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    heroGlow: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 88,
        height: 88,
        borderRadius: 44,
        opacity: 0.7,
    },
    heroIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    heroTierTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 8,
    },
    heroScoreLine: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    heroScoreNum: {
        fontSize: 46,
        fontWeight: '900',
        lineHeight: 52,
    },
    heroScoreDivider: {
        marginHorizontal: 4,
        fontSize: 26,
        color: '#94A3B8',
        lineHeight: 34,
        fontWeight: '700',
    },
    heroScoreTotal: {
        fontSize: 28,
        color: '#1E293B',
        lineHeight: 36,
        fontWeight: '700',
        marginBottom: 3,
    },
    heroScorePct: {
        fontSize: 16,
        color: '#475569',
        fontWeight: '700',
        marginTop: 4,
    },
    heroTierMessage: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 20,
        color: '#475569',
        textAlign: 'center',
    },
    metricGrid: {
        width: '100%',
        marginTop: 14,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 10,
    },
    metricChip: {
        width: '47%',
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    metricChipLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '700',
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    metricChipValue: {
        fontSize: 20,
        fontWeight: '900',
        lineHeight: 24,
    },
    distributionCard: {
        backgroundColor: '#fff',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 14,
        marginBottom: 18,
    },
    distributionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    distributionTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
    },
    distributionHint: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '700',
    },
    distributionBarTrack: {
        height: 14,
        borderRadius: 999,
        overflow: 'hidden',
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        marginBottom: 10,
    },
    distributionBarCorrect: {
        height: '100%',
        backgroundColor: '#10B981',
    },
    distributionBarWrong: {
        height: '100%',
        backgroundColor: '#EF4444',
    },
    distributionBarSkipped: {
        height: '100%',
        backgroundColor: '#94A3B8',
    },
    distributionLegendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
    },
    distributionLegendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    legendText: {
        fontSize: 12,
        color: '#334155',
        fontWeight: '700',
    },
    reviewTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 12,
    },
    reviewCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    reviewCardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    reviewHeaderTextWrap: { flex: 1 },
    indexBadge: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 10, marginTop: 2 },
    reviewQuestionText: { fontSize: 14, fontWeight: '700', color: '#0F172A', lineHeight: 21 },
    reviewMetaRow: {
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    reviewStateChip: {
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 4,
        overflow: 'hidden',
    },
    reviewStateText: {
        fontSize: 11,
        fontWeight: '700',
    },
    reviewStateChipCorrect: {
        backgroundColor: '#D1FAE5',
    },
    reviewStateChipWrong: {
        backgroundColor: '#FEE2E2',
    },
    reviewStateChipSkipped: {
        backgroundColor: '#E2E8F0',
    },
    reviewStateTextCorrect: {
        color: '#065F46',
    },
    reviewStateTextWrong: {
        color: '#991B1B',
    },
    reviewStateTextSkipped: {
        color: '#334155',
    },
    reviewPointText: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '700',
    },
    answerSummaryRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 10,
    },
    answerSummaryItem: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    answerSummaryLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748B',
        marginBottom: 3,
        textTransform: 'uppercase',
    },
    answerSummaryValue: {
        fontSize: 13,
        lineHeight: 18,
        color: '#1E293B',
        fontWeight: '700',
    },
    reviewOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 10,
        marginBottom: 6,
    },
    reviewOptionLabel: { fontWeight: '700', color: '#6B7280', marginRight: 8, width: 20 },
    reviewOptionText: { flex: 1, fontSize: 14, color: '#374151' },
    resultActions: {
        marginTop: 6,
        flexDirection: 'row',
        gap: 10,
    },
    resultActionBtn: {
        flex: 1,
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    resultActionGhost: {
        borderWidth: 1.5,
        borderColor: '#C4B5FD',
        backgroundColor: '#F5F3FF',
    },
    resultActionPrimary: {
        backgroundColor: '#7C3AED',
        borderWidth: 1,
        borderColor: '#7C3AED',
    },
    resultActionTextGhost: {
        color: '#6D28D9',
        fontWeight: '800',
        fontSize: 14,
    },
    resultActionTextPrimary: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 14,
    },
    essayResultHero: {
        backgroundColor: '#EFF6FF',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#BFDBFE',
        paddingHorizontal: 16,
        paddingVertical: 18,
        alignItems: 'center',
        marginBottom: 16,
    },
    essayResultHeroTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#1E3A8A',
        marginBottom: 8,
    },
    essayResultHeroMeta: {
        fontSize: 13,
        color: '#1E40AF',
        fontWeight: '700',
        marginTop: 2,
    },
    essayResultSummary: {
        marginTop: 10,
        fontSize: 13,
        color: '#334155',
        lineHeight: 20,
        textAlign: 'center',
    },
    essayEvalCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 12,
    },
    essayReviewCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1.5,
        borderColor: '#DBEAFE',
        marginBottom: 12,
    },
    essayEvalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    essayEvalIndex: {
        fontSize: 13,
        fontWeight: '800',
        color: '#334155',
    },
    essayEvalScore: {
        fontSize: 13,
        fontWeight: '900',
        color: '#1D4ED8',
    },
    essayEvalQuestion: {
        fontSize: 14,
        fontWeight: '700',
        lineHeight: 21,
        color: '#0F172A',
        marginBottom: 10,
    },
    essayEvalLabel: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '800',
        textTransform: 'uppercase',
        marginTop: 8,
        marginBottom: 3,
    },
    essayEvalBody: {
        fontSize: 13,
        lineHeight: 20,
        color: '#1E293B',
    },

    // Essay
    essayList: { padding: 20, paddingBottom: 40 },
    descCard: {
        backgroundColor: '#FFF7ED',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
    },
    descText: { fontSize: 14, color: '#92400E', lineHeight: 22 },
    essayCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
        marginBottom: 14,
        flexDirection: 'row',
        alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    essayContentWrap: { flex: 1 },
    essayIndexBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#EDE9FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        marginTop: 2,
    },
    essayIndexText: { fontWeight: '700', color: '#7C3AED', fontSize: 14 },
    essayQuestionText: { flex: 1, fontSize: 15, lineHeight: 24, color: '#1F2937', fontWeight: '500' },
    essayNoticeCard: {
        marginBottom: 14,
        borderRadius: 14,
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#DBEAFE',
        padding: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    essayNoticeText: {
        flex: 1,
        marginLeft: 8,
        color: '#1E40AF',
        fontSize: 13,
        lineHeight: 19,
        fontWeight: '500',
    },
    essayInput: {
        marginTop: 12,
        minHeight: 108,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#1F2937',
        lineHeight: 20,
    },
    essayInputHint: {
        marginTop: 6,
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'right',
    },
    markDoneBtn: {
        marginTop: 12,
        marginBottom: 8,
        backgroundColor: '#10B981',
        borderRadius: 18,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    markDoneBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
});
