import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { LessonBlock, LessonModel } from '../../models/Lesson';
import { Exercise } from '../../models/Exercise';
import { Document } from '../../models/Document';
import { getSubjectLessonDetail } from '../../services/subjectService';
import { getExercisesBySubject } from '../../services/exerciseService';
import { getDocumentsBySubject } from '../../services/documentService';
import MathView from '../../components/MathView';
import QuestionContentRenderer from '../../components/exercise/QuestionContentRenderer';

const BlockRenderer = ({ block }: { block: LessonBlock }) => {
    if (block.type === 'header') {
        return (
            <View style={styles.blockCard}>
                <QuestionContentRenderer 
                    content={block.data?.text || 'Tiêu đề'} 
                    textStyle={styles.headerText} 
                />
            </View>
        );
    }

    if (block.type === 'image') {
        return (
            <View style={styles.blockCard}>
                {block.data?.url ? (
                    <Image source={{ uri: block.data.url }} style={styles.lessonImage} resizeMode="cover" />
                ) : (
                    <View style={styles.imageFallback}>
                        <Text style={styles.imageFallbackText}>Chưa có hình ảnh</Text>
                    </View>
                )}
                {!!block.data?.caption && <Text style={styles.imageCaption}>{block.data.caption}</Text>}
            </View>
        );
    }

    if (block.type === 'math') {
        const expr = block.data?.expression || '';
        return (
            <View style={styles.blockCard}>
                <MathView latex={expr} isUser={false} fallbackText={expr || '[Công thức trống]'} />
            </View>
        );
    }

    if (block.type === 'quote') {
        return (
            <View style={styles.blockCard}>
                <Text style={styles.quoteText}>"{block.data?.text || 'Trích dẫn'}"</Text>
                {!!block.data?.author && <Text style={styles.quoteAuthor}>- {block.data.author}</Text>}
            </View>
        );
    }

    if (block.type === 'bullet_list') {
        const items = Array.isArray(block.data?.items) ? block.data?.items || [] : [];
        return (
            <View style={styles.blockCard}>
                {items.length > 0 ? items.map((item, index) => (
                    <View key={`item-${index}`} style={styles.listItemRow}>
                        <Text style={styles.listBullet}>•</Text>
                        <Text style={styles.listItemText}>{item}</Text>
                    </View>
                )) : <Text style={styles.paragraphText}>Chưa có nội dung danh sách</Text>}
            </View>
        );
    }

    if (block.type === 'callout') {
        const tone = block.data?.tone || 'info';
        const toneStyle = tone === 'warning'
            ? styles.calloutWarning
            : tone === 'success'
                ? styles.calloutSuccess
                : styles.calloutInfo;

        return (
            <View style={[styles.blockCard, toneStyle]}>
                <QuestionContentRenderer 
                    content={block.data?.text || 'Nội dung ghi chú'} 
                    textStyle={styles.paragraphText} 
                />
            </View>
        );
    }

    if (block.type === 'divider') {
        return <View style={styles.divider} />;
    }

    return (
        <View style={styles.blockCard}>
            <QuestionContentRenderer 
                content={block.data?.text || ''} 
                textStyle={styles.paragraphText} 
            />
        </View>
    );
};

export default function LessonDetailScreen({ route, navigation }: any) {
    const { subjectId, lessonId, lessonTitle } = route.params;

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lesson, setLesson] = useState<LessonModel | null>(null);
    const [relatedLoading, setRelatedLoading] = useState(false);
    const [relatedExercises, setRelatedExercises] = useState<Exercise[]>([]);
    const [relatedDocuments, setRelatedDocuments] = useState<Document[]>([]);

    const fetchLesson = async (isRefreshing: boolean = false) => {
        if (isRefreshing) setRefreshing(true);
        else setLoading(true);

        try {
            const data = await getSubjectLessonDetail(subjectId, lessonId);
            setLesson(data);
        } catch {
            setLesson(null);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchRelated = async (lessonData: LessonModel) => {
        if (!lessonData?.subjectId || !lessonData?.id) {
            setRelatedExercises([]);
            setRelatedDocuments([]);
            return;
        }

        setRelatedLoading(true);
        try {
            const [exerciseList, documentList] = await Promise.all([
                getExercisesBySubject(lessonData.subjectId),
                getDocumentsBySubject(lessonData.subjectId),
            ]);

            setRelatedExercises(exerciseList.filter((exercise: any) => exercise.lessonId === lessonData.id));
            setRelatedDocuments(documentList.filter((document: any) => document.lessonId === lessonData.id));
        } catch {
            setRelatedExercises([]);
            setRelatedDocuments([]);
        } finally {
            setRelatedLoading(false);
        }
    };

    useEffect(() => {
        navigation.setOptions({ title: lessonTitle || 'Bài học', headerShown: false });
        void fetchLesson(false);
    }, [lessonId]);

    useEffect(() => {
        if (!lesson) {
            setRelatedExercises([]);
            setRelatedDocuments([]);
            return;
        }

        void fetchRelated(lesson);
    }, [lesson]);

    const blocks = useMemo(() => {
        if (!lesson?.content || !Array.isArray(lesson.content)) return [] as LessonBlock[];
        const sourceBlocks = lesson.content;
        const lessonTitleNormalized = String(lesson.title || '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ');

        return sourceBlocks.filter((block, index) => {
            if (index === 0 && block.type === 'header') {
                const blockHeaderNormalized = String(block.data?.text || '')
                    .trim()
                    .toLowerCase()
                    .replace(/\s+/g, ' ');

                if (blockHeaderNormalized && blockHeaderNormalized === lessonTitleNormalized) {
                    return false;
                }
            }

            return true;
        });
    }, [lesson]);

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color="#8B5CF6" />
                </View>
            </SafeAreaView>
        );
    }

    if (!lesson) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Bài học</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.emptyWrap}>
                    <Text style={styles.emptyTitle}>Không tìm thấy bài học</Text>
                    <Text style={styles.emptySub}>Bài học có thể đã bị xóa hoặc bạn không có quyền xem.</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{lesson.title}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchLesson(true)} />}
                showsVerticalScrollIndicator={false}
            >
                {!!lesson.description && <Text style={styles.description}>{lesson.description}</Text>}

                {blocks.length > 0 ? (
                    <View style={styles.blocksWrap}>
                        {blocks.map((block, idx) => (
                            <BlockRenderer key={block.id || `block-${idx}`} block={block} />
                        ))}
                    </View>
                ) : (
                    <View style={styles.blockCard}>
                        <Text style={styles.paragraphText}>Bài học chưa có nội dung.</Text>
                    </View>
                )}

                <View style={styles.relatedSectionWrap}>
                    <View style={styles.relatedHeaderRow}>
                        <Text style={styles.relatedSectionLabel}>BÀI TẬP VẬN DỤNG</Text>
                        {relatedLoading && <ActivityIndicator size="small" color="#8B5CF6" />}
                    </View>

                    {relatedExercises.length > 0 ? (
                        relatedExercises.map((exercise) => (
                            <TouchableOpacity
                                key={exercise.id}
                                style={styles.relatedCard}
                                activeOpacity={0.88}
                                onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: exercise.id })}
                            >
                                <View style={styles.relatedCardIconWrap}>
                                    <Ionicons name="book-outline" size={16} color="#8B5CF6" />
                                </View>
                                <View style={styles.relatedCardContent}>
                                    <Text style={styles.relatedCardType}>Bài tập</Text>
                                    <Text style={styles.relatedCardTitle} numberOfLines={2}>{exercise.title}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.relatedEmptyCard}>
                            <Text style={styles.relatedEmptyText}>Chưa có bài tập vận dụng.</Text>
                        </View>
                    )}
                </View>

                <View style={styles.relatedSectionWrap}>
                    <View style={styles.relatedHeaderRow}>
                        <Text style={styles.relatedSectionLabel}>TÀI LIỆU THAM KHẢO</Text>
                        {relatedLoading && <ActivityIndicator size="small" color="#8B5CF6" />}
                    </View>

                    {relatedDocuments.length > 0 ? (
                        relatedDocuments.map((doc) => (
                            <View key={doc.id} style={styles.documentCard}>
                                <View style={styles.documentCardTop}>
                                    <View style={styles.relatedCardIconWrap}>
                                        <Ionicons name="document-text-outline" size={16} color="#8B5CF6" />
                                    </View>
                                    <View style={styles.relatedCardContent}>
                                        <Text style={styles.relatedCardType}>Tài liệu</Text>
                                        <Text style={styles.relatedCardTitle} numberOfLines={2}>{doc.title}</Text>
                                        <Text style={styles.documentMeta}>{doc.displayFileType} • {doc.getFormattedDate()}</Text>
                                    </View>
                                </View>

                                <View style={styles.documentActions}>
                                    <TouchableOpacity
                                        style={styles.documentActionButton}
                                        onPress={() => navigation.navigate('PDFViewer', { url: doc.fileUrl, title: doc.title, documentId: doc.id })}
                                    >
                                        <Ionicons name="eye-outline" size={14} color="#1F2937" />
                                        <Text style={styles.documentActionText}>Xem</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.documentActionButton, styles.documentActionPrimary]}
                                        onPress={() => navigation.navigate('MainTabs', {
                                            screen: 'Chat',
                                            params: {
                                                summaryDocumentId: doc.id,
                                                summaryTitle: doc.title,
                                                summaryRequestId: Date.now().toString(),
                                            },
                                        })}
                                    >
                                        <Ionicons name="sparkles-outline" size={14} color="#FFFFFF" />
                                        <Text style={styles.documentActionPrimaryText}>Tóm tắt</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.relatedEmptyCard}>
                            <Text style={styles.relatedEmptyText}>Chưa có tài liệu tham khảo.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFA' },
    header: {
        height: Constants.statusBarHeight + 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Constants.statusBarHeight,
        backgroundColor: '#FFFFFF',
    },
    backButton: { padding: 5, marginLeft: -5 },
    headerTitle: { color: '#1F2937', fontSize: 18, fontWeight: '700', maxWidth: '80%' },
    content: { padding: 16, paddingBottom: 24 },
    description: { color: '#4B5563', fontSize: 15, lineHeight: 22, marginBottom: 12 },
    blocksWrap: { gap: 10 },
    blockCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        padding: 14,
    },
    headerText: { fontSize: 24, fontWeight: '800', color: '#1F2937', lineHeight: 30 },
    paragraphText: { fontSize: 16, color: '#1F2937', lineHeight: 24 },
    lessonImage: { width: '100%', height: 220, borderRadius: 12, backgroundColor: '#EEF2FF' },
    imageFallback: {
        width: '100%',
        height: 160,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#CBD5E1',
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageFallbackText: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
    imageCaption: { marginTop: 8, color: '#6B7280', fontSize: 13, fontStyle: 'italic' },
    quoteText: { fontSize: 18, color: '#374151', fontStyle: 'italic', lineHeight: 26, fontWeight: '600' },
    quoteAuthor: { marginTop: 6, fontSize: 13, color: '#6B7280', fontWeight: '700' },
    listItemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
    listBullet: { marginRight: 8, color: '#4B5563', fontSize: 16, lineHeight: 24 },
    listItemText: { flex: 1, color: '#1F2937', fontSize: 16, lineHeight: 24 },
    calloutInfo: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
    calloutSuccess: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
    calloutWarning: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
    divider: { height: 1, backgroundColor: '#D1D5DB', marginVertical: 4 },
    relatedSectionWrap: { marginTop: 16, gap: 10 },
    relatedHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    relatedSectionLabel: { color: '#8B5CF6', fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
    relatedCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    relatedCardIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#F5F3FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    relatedCardContent: { flex: 1 },
    relatedCardType: { color: '#8B5CF6', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    relatedCardTitle: { color: '#1F2937', fontSize: 14, fontWeight: '700', marginTop: 2 },
    relatedEmptyCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#E5E7EB',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    relatedEmptyText: { color: '#6B7280', fontSize: 13, fontWeight: '500' },
    documentCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 14,
        padding: 12,
        gap: 10,
    },
    documentCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    documentMeta: { marginTop: 4, color: '#6B7280', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
    documentActions: { flexDirection: 'row', gap: 8 },
    documentActionButton: {
        flex: 1,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
    },
    documentActionPrimary: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
    documentActionText: { color: '#1F2937', fontSize: 12, fontWeight: '700' },
    documentActionPrimaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
    emptyTitle: { color: '#1F2937', fontSize: 22, fontWeight: '800', marginBottom: 8 },
    emptySub: { color: '#6B7280', fontSize: 14, textAlign: 'center' },
});
