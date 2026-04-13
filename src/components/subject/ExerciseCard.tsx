import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Exercise } from '../../models/Exercise';

export interface ExerciseCardProps {
    item: Exercise;
    onStart: () => void;
    onReview: () => void;
    onRetry: () => void;
    onActionMenu: () => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
    item,
    onStart,
    onReview,
    onRetry,
    onActionMenu,
}) => {
    const isQuiz = item.isQuiz;
    const isCompleted = item.isCompleted;
    const compactDescription = String(item.description || 'Chưa làm').replace(/\s+/g, ' ').trim();
    const latestSubmission = item.latestSubmission;
    const scoreText = item.formattedScore;
    const correctCount = latestSubmission?.correctCount ?? 0;
    const wrongCount = latestSubmission?.wrongCount ?? 0;
    const totalCount = latestSubmission?.totalCount ?? 0;
    const correctRatio = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;
    const displayWrongCount = Math.max(totalCount - correctCount, 0);
    const wrongRatio = totalCount > 0 ? (displayWrongCount / totalCount) * 100 : 0;
    const submittedTimeText = item.formattedSubmissionTime;

    const showQuizStats = !!(isCompleted && isQuiz && latestSubmission && scoreText !== null);
    const showEssayDone = !!(isCompleted && !isQuiz && latestSubmission);

    return (
        <View style={styles.exerciseCard}>
            <View style={styles.exerciseMetaRow}>
                <View style={[
                    styles.typeBadge,
                    item.type === 'QUIZ' ? styles.typeBadgeQuiz :
                    item.type === 'MIXED' ? styles.typeBadgeMixed :
                    styles.typeBadgeEssay
                ]}>
                    <Text style={[
                        styles.typeBadgeText,
                        item.type === 'MIXED' && styles.typeBadgeMixedText
                    ]}>
                        {item.type === 'QUIZ' ? 'Trắc nghiệm' : item.type === 'MIXED' ? 'Tổng hợp' : 'Tự luận'}
                    </Text>
                </View>
                <Text style={[styles.statusPill, isCompleted ? styles.statusPillDone : styles.statusPillTodo]}>
                    {isCompleted ? 'Đã làm' : 'Chưa làm'}
                </Text>
            </View>

            <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.exerciseDesc} numberOfLines={4}>
                    {compactDescription}
                </Text>

                {showQuizStats && (
                    <View style={styles.resultBlock}>
                        <View style={styles.resultTopRow}>
                            <View style={styles.scoreBadge}>
                                <Ionicons name="stats-chart" size={14} color="#7C3AED" />
                                <Text style={styles.scoreBadgeText}>Điểm {scoreText}/10</Text>
                            </View>
                            <Text style={styles.resultText}>Tổng {totalCount} câu</Text>
                        </View>

                        <View style={styles.quizRatioTrack}>
                            <View style={[styles.quizRatioCorrect, { width: `${Math.max(correctRatio, 0)}%` as any }]} />
                            <View style={[styles.quizRatioWrong, { width: `${Math.max(wrongRatio, 0)}%` as any }]} />
                        </View>

                        <View style={styles.quizRatioMetaRow}>
                            <Text style={styles.quizRatioCorrectText}>Đúng {correctCount}</Text>
                            <Text style={styles.quizRatioWrongText}>Sai {displayWrongCount}</Text>
                        </View>

                        {submittedTimeText ? (
                            <Text style={styles.submissionTimeText}>Nộp lúc {submittedTimeText}</Text>
                        ) : null}
                    </View>
                )}

                {showEssayDone && (
                    <View style={styles.resultBlock}>
                        {scoreText !== null ? (
                            <View style={styles.resultTopRow}>
                                <View style={styles.scoreBadge}>
                                    <Ionicons name="stats-chart" size={14} color="#7C3AED" />
                                    <Text style={styles.scoreBadgeText}>Điểm {scoreText}/10</Text>
                                </View>
                                <Text style={styles.resultText}>Tổng {totalCount} câu</Text>
                            </View>
                        ) : (
                            <Text style={styles.essayDoneText}>Đã nộp bài tự luận</Text>
                        )}
                        {submittedTimeText ? (
                            <Text style={styles.submissionTimeText}>Nộp lúc {submittedTimeText}</Text>
                        ) : null}
                    </View>
                )}
            </View>

            <View style={styles.exerciseFooter}>
                <View style={styles.exerciseActions}>
                    {isCompleted ? (
                        <>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.actionBtnOutline]}
                                onPress={onReview}
                            >
                                <Text style={[styles.actionBtnText, { color: '#8B5CF6' }]}>Xem lại</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.actionBtnSolid]}
                                onPress={onRetry}
                            >
                                <Text style={[styles.actionBtnText, { color: '#fff' }]}>Làm lại</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.actionBtnSolid]}
                            onPress={onStart}
                        >
                            <Text style={[styles.actionBtnText, { color: '#fff' }]}>Bắt đầu</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={styles.actionMenuBtn}
                        onPress={onActionMenu}
                    >
                        <Ionicons name="create-outline" size={18} color="#2563EB" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    exerciseCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#EEF0F4',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    exerciseMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    typeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    typeBadgeQuiz: {
        backgroundColor: '#EDE9FE',
    },
    typeBadgeEssay: {
        backgroundColor: '#DBEAFE',
    },
    typeBadgeMixed: {
        backgroundColor: '#F0FDF4',
    },
    typeBadgeMixedText: {
        color: '#059669',
    },
    typeBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4C1D95',
    },
    statusPill: {
        fontSize: 12,
        fontWeight: '700',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        overflow: 'hidden',
    },
    statusPillDone: {
        color: '#047857',
        backgroundColor: '#D1FAE5',
    },
    statusPillTodo: {
        color: '#6B7280',
        backgroundColor: '#F3F4F6',
    },
    exerciseInfo: { marginBottom: 12 },
    exerciseTitle: { fontSize: 19, fontWeight: '800', color: '#1F2937', marginBottom: 8, lineHeight: 25 },
    exerciseDesc: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
    resultBlock: {
        marginTop: 10,
    },
    resultTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    scoreBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#EDE9FE',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    scoreBadgeText: {
        marginLeft: 6,
        fontSize: 12,
        fontWeight: '700',
        color: '#5B21B6',
    },
    resultText: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '700',
    },
    quizRatioTrack: {
        marginTop: 8,
        height: 10,
        borderRadius: 999,
        overflow: 'hidden',
        flexDirection: 'row',
        backgroundColor: '#E2E8F0',
    },
    quizRatioCorrect: {
        height: '100%',
        backgroundColor: '#10B981',
    },
    quizRatioWrong: {
        height: '100%',
        backgroundColor: '#EF4444',
    },
    quizRatioMetaRow: {
        marginTop: 6,
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
    },
    quizRatioCorrectText: {
        color: '#047857',
        fontSize: 12,
        fontWeight: '700',
    },
    quizRatioWrongText: {
        color: '#B91C1C',
        fontSize: 12,
        fontWeight: '700',
    },
    submissionTimeText: {
        marginTop: 6,
        color: '#64748B',
        fontSize: 12,
        fontWeight: '600',
    },
    essayDoneText: {
        color: '#047857',
        fontWeight: '700',
        fontSize: 13,
    },
    exerciseFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    actionBtn: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    exerciseActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionBtnOutline: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    actionBtnSolid: {
        backgroundColor: '#8B5CF6',
    },
    actionBtnText: {
        fontSize: 14,
        fontWeight: '600',
    },
    actionMenuBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#DBEAFE',
    }
});
