import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, FlatList,
    TouchableOpacity, ActivityIndicator, RefreshControl,
    Alert, Modal, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as exerciseService from '../../services/exerciseService';
import * as documentService from '../../services/documentService';
import Constants from 'expo-constants';

export default function SubjectDetailScreen({ route, navigation }: any) {
    const { subjectId, subjectName, subjectColor } = route.params;
    const [exercises, setExercises] = useState<exerciseService.Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Generate from PDF state
    const [genModalVisible, setGenModalVisible] = useState(false);
    const [pdfDocs, setPdfDocs] = useState<documentService.Document[]>([]);
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
    const [genType, setGenType] = useState<'QUIZ' | 'ESSAY'>('QUIZ');
    const [genCount, setGenCount] = useState(10);
    const [genDifficulty, setGenDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
    const [generating, setGenerating] = useState(false);

    const fetchExercises = useCallback(async () => {
        try {
            const data = await exerciseService.getExercisesBySubject(subjectId);
            setExercises(data);
        } catch (error) {
            console.error('Fetch exercises error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [subjectId]);

    useEffect(() => {
        navigation.setOptions({
            title: subjectName,
            headerShown: false,
        });
    }, [subjectName, navigation]);

    useFocusEffect(
        useCallback(() => {
            fetchExercises();
        }, [fetchExercises])
    );

    const openGenModal = async () => {
        setSelectedDocId(null);
        setGenType('QUIZ');
        setGenCount(10);
        setGenDifficulty('MEDIUM');
        try {
            const docs = await documentService.getDocumentsBySubject(subjectId);
            const pdfs = (docs as documentService.Document[]).filter(
                (d) => (d.fileType || '').toLowerCase() === 'pdf'
            );
            setPdfDocs(pdfs);
        } catch {
            setPdfDocs([]);
        }
        setGenModalVisible(true);
    };

    const handleGenerateExercise = async () => {
        if (!selectedDocId) {
            Alert.alert('Chưa chọn', 'Vui lòng chọn một tài liệu PDF.');
            return;
        }

        setGenerating(true);
        try {
            const result = await exerciseService.generateExerciseFromDocument({
                documentId: selectedDocId,
                exerciseType: genType,
                questionCount: genCount,
                difficulty: genDifficulty,
            });
            setGenModalVisible(false);
            fetchExercises();
            Alert.alert(
                'Tạo thành công!',
                `Bộ đề "${result.title}" đã được tạo với ${result.questions?.length ?? genCount} câu.`,
                [
                    { text: 'Làm ngay', onPress: () => navigation.navigate('ExerciseDetail', { exerciseId: result.id }) },
                    { text: 'Đóng', style: 'cancel' },
                ]
            );
        } catch (error: any) {
            Alert.alert('Lỗi', error?.response?.data?.message || error.message || 'Không thể tạo bộ đề.');
        } finally {
            setGenerating(false);
        }
    };

    const confirmDeleteExercise = (id: string) => {
        Alert.alert('Xóa bộ đề', 'Bạn có chắc chắn muốn xóa bộ đề này?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await exerciseService.deleteExercise(id);
                        fetchExercises();
                        Alert.alert('Đã xóa', 'Bộ đề đã được xóa thành công.');
                    } catch (error: any) {
                        Alert.alert('Lỗi', error?.response?.data?.message || error.message || 'Không thể xóa bộ đề.');
                    }
                }
            }
        ]);
    };

    const openExerciseActionMenu = (item: exerciseService.Exercise) => {
        Alert.alert(
            'Tùy chọn bộ đề',
            `Chọn thao tác cho "${item.title}"`,
            [
                {
                    text: 'Xóa bộ đề',
                    style: 'destructive',
                    onPress: () => confirmDeleteExercise(item.id),
                },
                { text: 'Hủy', style: 'cancel' },
            ]
        );
    };

    const openExerciseDetail = (exerciseId: string, entryAction: 'start' | 'review' | 'retry') => {
        navigation.navigate('ExerciseDetail', { exerciseId, entryAction });
    };

    const formatSubmissionTime = (submittedAt?: string | null) => {
        if (!submittedAt) return null;
        const date = new Date(submittedAt);
        if (Number.isNaN(date.getTime())) return null;

        return date.toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
        });
    };

    const formatScoreToTen = (score?: number | null) => {
        if (score == null || !Number.isFinite(score)) {
            return null;
        }

        const normalized = score > 10 ? score / 10 : score;
        const bounded = Math.max(0, Math.min(10, normalized));

        return bounded.toLocaleString('vi-VN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });
    };

    const renderExercise = ({ item }: { item: exerciseService.Exercise }) => {
        const isQuiz = item.type === 'QUIZ';
        const isCompleted = item.status === 'COMPLETED';
        const compactDescription = String(item.description || 'Chưa làm').replace(/\s+/g, ' ').trim();
        const latestSubmission = item.latestSubmission;
        const scoreText = formatScoreToTen(latestSubmission?.score ?? null);
        const correctCount = latestSubmission?.correctCount ?? 0;
        const wrongCount = latestSubmission?.wrongCount ?? 0;
        const totalCount = latestSubmission?.totalCount ?? 0;
        const correctRatio = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;
        const wrongRatio = totalCount > 0 ? (wrongCount / totalCount) * 100 : 0;
        const submittedTimeText = formatSubmissionTime(latestSubmission?.submittedAt ?? null);

        const showQuizStats = !!(isCompleted && isQuiz && latestSubmission && scoreText !== null);
        const showEssayDone = !!(isCompleted && !isQuiz && latestSubmission);

        return (
            <View style={styles.exerciseCard}>
                <View style={styles.exerciseMetaRow}>
                    <View style={[styles.typeBadge, isQuiz ? styles.typeBadgeQuiz : styles.typeBadgeEssay]}>
                        <Text style={styles.typeBadgeText}>{isQuiz ? 'Trắc nghiệm' : 'Tự luận'}</Text>
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
                                <Text style={styles.quizRatioWrongText}>Sai {wrongCount}</Text>
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
                                    onPress={() => openExerciseDetail(item.id, 'review')}
                                >
                                    <Text style={[styles.actionBtnText, { color: '#8B5CF6' }]}>Xem lại</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.actionBtnSolid]}
                                    onPress={() => openExerciseDetail(item.id, 'retry')}
                                >
                                    <Text style={[styles.actionBtnText, { color: '#fff' }]}>Làm lại</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.actionBtnSolid]}
                                onPress={() => openExerciseDetail(item.id, 'start')}
                            >
                                <Text style={[styles.actionBtnText, { color: '#fff' }]}>Bắt đầu</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={styles.actionMenuBtn}
                            onPress={() => openExerciseActionMenu(item)}
                        >
                            <Ionicons name="create-outline" size={18} color="#2563EB" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    const completedCount = exercises.filter(e => e.status === 'COMPLETED').length;
    const totalCount = exercises.length;
    const progressPerc = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
    <View style={{ flex: 1 }}>
        <SafeAreaView style={styles.container}>
            <View style={[styles.header, { backgroundColor: '#fff' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{subjectName}</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Learning Progress Section */}
            <View style={styles.progressContainer}>
                <Text style={styles.progressTitle}>TIẾN ĐỘ HỌC TẬP</Text>
                <View style={styles.progressTextRow}>
                    <View>
                        <Text style={styles.progressText}>Tổng số bài học: <Text style={styles.progressHighlight}>{totalCount}</Text></Text>
                        <Text style={styles.progressText}>Đã hoàn thành: <Text style={styles.progressHighlight}>{completedCount} ({progressPerc}%)</Text></Text>
                    </View>
                    <Text style={styles.progressPercText}>{progressPerc}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${progressPerc}%` }]} />
                </View>
            </View>

            <FlatList
                data={exercises}
                renderItem={renderExercise}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchExercises} />}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.empty}>
                            <Ionicons name="document-text-outline" size={60} color="#C7C7CC" />
                            <Text style={styles.emptyText}>Chưa có bài tập nào cho môn này</Text>
                        </View>
                    ) : (
                        <ActivityIndicator size="large" color={subjectColor} style={{ marginTop: 50 }} />
                    )
                }
            />
        </SafeAreaView >

        {/* Generate from PDF FAB */}
        <TouchableOpacity
            style={[styles.fab, { backgroundColor: subjectColor || '#8B5CF6' }]}
            onPress={openGenModal}
        >
            <Ionicons name="sparkles" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Generate Exercise Modal */}
        <Modal visible={genModalVisible} animationType="slide" transparent={true} onRequestClose={() => setGenModalVisible(false)}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <Text style={styles.modalTitle}>Tạo bộ đề từ PDF</Text>
                        <TouchableOpacity onPress={() => setGenModalVisible(false)}>
                            <Ionicons name="close" size={24} color="#1C1C1E" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Chọn tài liệu PDF</Text>
                    {pdfDocs.length === 0 ? (
                        <View style={{ padding: 16, backgroundColor: '#FFF7ED', borderRadius: 12, marginBottom: 20 }}>
                            <Text style={{ color: '#92400E', fontSize: 14 }}>Chưa có tài liệu PDF nào cho môn này. Hãy tải lên từ màn Tài liệu trước.</Text>
                        </View>
                    ) : (
                        <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                            {pdfDocs.map((doc) => (
                                <TouchableOpacity
                                    key={doc.id}
                                    style={[styles.docPickerItem, selectedDocId === doc.id && styles.docPickerItemSelected]}
                                    onPress={() => setSelectedDocId(doc.id)}
                                >
                                    <Ionicons name="document-text" size={18} color={selectedDocId === doc.id ? '#8B5CF6' : '#6B7280'} />
                                    <Text style={[styles.docPickerText, selectedDocId === doc.id && { color: '#8B5CF6', fontWeight: '700' }]} numberOfLines={1}>{doc.title}</Text>
                                    {selectedDocId === doc.id && <Ionicons name="checkmark-circle" size={18} color="#8B5CF6" />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}

                    <Text style={[styles.label, { marginTop: 16 }]}>Loại bài tập</Text>
                    <View style={styles.typeSelector}>
                        <TouchableOpacity
                            style={[styles.typeOption, genType === 'QUIZ' && styles.typeOptionSelected]}
                            onPress={() => setGenType('QUIZ')}
                        >
                            <Ionicons name="radio-button-on" size={16} color={genType === 'QUIZ' ? '#fff' : '#8E8E93'} />
                            <Text style={[styles.typeText, genType === 'QUIZ' && styles.typeTextSelected]}>Trắc nghiệm</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.typeOption, genType === 'ESSAY' && styles.typeOptionSelected]}
                            onPress={() => setGenType('ESSAY')}
                        >
                            <Ionicons name="create-outline" size={16} color={genType === 'ESSAY' ? '#fff' : '#8E8E93'} />
                            <Text style={[styles.typeText, genType === 'ESSAY' && styles.typeTextSelected]}>Tự luận</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Số câu hỏi: <Text style={{ color: '#8B5CF6', fontWeight: '700' }}>{genCount}</Text></Text>
                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                        {[5, 10, 15, 20].map(n => (
                            <TouchableOpacity
                                key={n}
                                style={[styles.countChip, genCount === n && styles.countChipSelected]}
                                onPress={() => setGenCount(n)}
                            >
                                <Text style={[styles.countChipText, genCount === n && { color: '#fff' }]}>{n}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Mức độ</Text>
                    <View style={[styles.typeSelector, { marginBottom: 24 }]}>
                        {([['EASY', 'Dễ'], ['MEDIUM', 'Trung bình'], ['HARD', 'Khó']] as const).map(([val, label]) => (
                            <TouchableOpacity
                                key={val}
                                style={[styles.typeOption, genDifficulty === val && styles.typeOptionSelected,
                                    genDifficulty === val && val === 'EASY' && { backgroundColor: '#059669' },
                                    genDifficulty === val && val === 'MEDIUM' && { backgroundColor: '#D97706' },
                                    genDifficulty === val && val === 'HARD' && { backgroundColor: '#DC2626' },
                                ]}
                                onPress={() => setGenDifficulty(val)}
                            >
                                <Text style={[styles.typeText, genDifficulty === val && styles.typeTextSelected]}>{label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.modalButtons}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setGenModalVisible(false)}>
                            <Text style={styles.cancelBtnText}>Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.saveBtn, { backgroundColor: subjectColor || '#8B5CF6', opacity: generating ? 0.7 : 1 }]}
                            onPress={handleGenerateExercise}
                            disabled={generating}
                        >
                            {generating
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <Text style={styles.saveBtnText}>Tạo bộ đề</Text>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    </View>
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
        paddingTop: Constants.statusBarHeight
    },
    headerTitle: { color: '#1F2937', fontSize: 20, fontWeight: 'bold' },
    backButton: { padding: 5, marginLeft: -5 },

    // Progress UI
    progressContainer: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FAFAFA',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    progressTitle: {
        color: '#8B5CF6',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    progressTextRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 15,
    },
    progressText: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    progressHighlight: {
        fontWeight: 'bold',
        color: '#1F2937',
    },
    progressPercText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#8B5CF6',
        borderRadius: 3,
    },

    list: { padding: 20, paddingBottom: 120 },
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
    },

    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#9CA3AF', marginTop: 10 },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },
    docPickerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: '#F9FAFB',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
    },
    docPickerItemSelected: {
        borderColor: '#8B5CF6',
        backgroundColor: '#F5F3FF',
    },
    docPickerText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: '#374151',
    },
    countChip: {
        flex: 1,
        padding: 10,
        borderRadius: 12,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
    },
    countChipSelected: { backgroundColor: '#8B5CF6' },
    countChipText: { fontWeight: '700', color: '#3A3A3C', fontSize: 15 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 25, padding: 25 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 25, textAlign: 'center' },
    label: { fontSize: 14, fontWeight: '600', color: '#3A3A3C', marginBottom: 8 },
    input: { backgroundColor: '#F2F2F7', padding: 15, borderRadius: 12, marginBottom: 20, fontSize: 16 },
    typeSelector: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    typeOption: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        padding: 12, borderRadius: 12, backgroundColor: '#F2F2F7', marginHorizontal: 5
    },
    typeOptionSelected: { backgroundColor: '#007AFF' },
    typeText: { marginLeft: 8, fontSize: 14, color: '#8E8E93', fontWeight: '500' },
    typeTextSelected: { color: '#fff' },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
    cancelBtn: { padding: 15, flex: 1, alignItems: 'center' },
    cancelBtnText: { color: '#FF3B30', fontWeight: 'bold' },
    saveBtn: { padding: 15, flex: 1, alignItems: 'center', borderRadius: 12 },
    saveBtnText: { color: '#fff', fontWeight: 'bold' }
});
