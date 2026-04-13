import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, SectionList,
    TouchableOpacity, ActivityIndicator, RefreshControl, Alert,
    Modal, FlatList, ScrollView, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as documentService from '../../services/documentService';
import * as exerciseService from '../../services/exerciseService';
import * as subjectService from '../../services/subjectService';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
// import { FilterChip } from '../../components/FilterChip';

interface Section {
    id: string;
    title: string;
    color: string;
    data: documentService.Document[];
}

export default function LibraryScreen() {
    const navigation = useNavigation<any>();
    const [sections, setSections] = useState<Section[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filter state
    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

    // Upload state
    const [modalVisible, setModalVisible] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedUploadSubjectId, setSelectedUploadSubjectId] = useState<string | null>(null);
    const [customTitle, setCustomTitle] = useState('');
    const [editingDoc, setEditingDoc] = useState<documentService.Document | null>(null);
    const [editTitleModalVisible, setEditTitleModalVisible] = useState(false);
    const [editingTitle, setEditingTitle] = useState('');
    const [savingEditedTitle, setSavingEditedTitle] = useState(false);

    // Generate exercise modal state
    const [genModalDoc, setGenModalDoc] = useState<documentService.Document | null>(null);
    const [genType, setGenType] = useState<'QUIZ' | 'ESSAY'>('QUIZ');
    const [genCount, setGenCount] = useState(10);
    const [genDifficulty, setGenDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
    const [generating, setGenerating] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [subs, documents] = await Promise.all([
                subjectService.getSubjects(),
                documentService.getAllDocuments()
            ]);

            if (!Array.isArray(subs) || !Array.isArray(documents)) {
                setSections([]);
                setSubjects([]);
                return;
            }

            setSubjects(subs);

            const grouped: Section[] = subs.map((sub: any) => ({
                id: sub.id,
                title: sub.name || 'Không tên',
                color: sub.color || '#007AFF',
                data: documents.filter((doc: any) => doc.subjectId === sub.id)
            })).filter((sec: any) => sec.data && sec.data.length > 0);

            // Add documents without subject if any
            const orphanedDocs = documents.filter((doc: any) => doc && !subs.find((s: any) => s.id === doc.subjectId));
            if (orphanedDocs.length > 0) {
                grouped.push({
                    id: 'other',
                    title: 'Khác',
                    color: '#8E8E93',
                    data: orphanedDocs
                });
            }

            setSections(grouped);
        } catch (error) {
            console.error('Fetch library error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handlePickDocument = async () => {
        if (!selectedUploadSubjectId) {
            Alert.alert('Chưa chọn môn học', 'Vui lòng chọn môn học trước khi tải tài liệu.');
            return;
        }

        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            });

            if (!result.canceled) {
                setUploading(true);
                setModalVisible(false);
                const normalizedTitle = customTitle.trim();

                await documentService.uploadDocument(
                    result.assets[0],
                    selectedUploadSubjectId,
                    normalizedTitle || undefined
                );

                setCustomTitle('');
                setSelectedUploadSubjectId(null);
                Alert.alert('Thành công', 'Tải lên tài liệu thành công!');
                fetchData();
            }
        } catch (error: any) {
            Alert.alert('Lỗi', 'Không thể tải lên tài liệu: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleGenerateExercise = async () => {
        if (!genModalDoc) return;

        setGenerating(true);
        try {
            const result = await exerciseService.generateExerciseFromDocument({
                documentId: genModalDoc.id,
                exerciseType: genType,
                questionCount: genCount,
                difficulty: genDifficulty,
            });
            setGenModalDoc(null);
            Alert.alert(
                'Tạo thành công!',
                `Đã tạo bộ đề "${result.title}" với ${result.questions?.length ?? genCount} câu hỏi.`,
                [
                    { text: 'Xem bộ đề', onPress: () => navigation.navigate('ExerciseDetail', { exerciseId: result.id }) },
                    { text: 'Đóng', style: 'cancel' },
                ]
            );
        } catch (error: any) {
            Alert.alert('Lỗi', error?.response?.data?.message || error.message || 'Không thể tạo bộ đề.');
        } finally {
            setGenerating(false);
        }
    };

    const confirmDelete = (doc: documentService.Document) => {
        const docTitle = (doc.title || 'tài liệu này').trim();

        Alert.alert('Xóa tài liệu', `Bạn có chắc muốn xóa "${docTitle}"?\n\nNếu có bài tự luận đang dùng tài liệu này để chấm, hệ thống sẽ xóa luôn các bài đó.`, [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const result = await documentService.deleteDocument(doc.id);
                        fetchData();

                        const deletedEssayCount = Number(result?.deletedEssayExerciseCount || 0);
                        if (deletedEssayCount > 0) {
                            Alert.alert('Đã xóa', `Đã xóa tài liệu và ${deletedEssayCount} bài tự luận liên quan.`);
                            return;
                        }

                        Alert.alert('Đã xóa', 'Đã xóa tài liệu thành công.');
                    } catch (error: any) {
                        Alert.alert('Lỗi', error.message);
                    }
                }
            }
        ]);
    };

    const openEditTitleModal = (doc: documentService.Document) => {
        setEditingDoc(doc);
        setEditingTitle((doc.title || '').trim());
        setEditTitleModalVisible(true);
    };

    const closeEditTitleModal = (force = false) => {
        if (savingEditedTitle && !force) return;
        setEditTitleModalVisible(false);
        setEditingDoc(null);
        setEditingTitle('');
    };

    const handleSaveEditedTitle = async () => {
        if (!editingDoc) return;

        const normalizedTitle = editingTitle.trim();
        if (!normalizedTitle) {
            Alert.alert('Thiếu tiêu đề', 'Vui lòng nhập tiêu đề tài liệu.');
            return;
        }

        try {
            setSavingEditedTitle(true);
            await documentService.updateDocumentTitle(editingDoc.id, normalizedTitle);

            closeEditTitleModal(true);
            fetchData();
            Alert.alert('Thành công', 'Đã cập nhật tiêu đề tài liệu.');
        } catch (error: any) {
            Alert.alert('Lỗi', error?.response?.data?.message || error.message || 'Không thể cập nhật tiêu đề.');
        } finally {
            setSavingEditedTitle(false);
        }
    };

    const openDocumentActionMenu = (doc: documentService.Document) => {
        const docTitle = (doc.title || 'tài liệu này').trim();

        Alert.alert(
            'Tùy chọn tài liệu',
            `Chọn thao tác cho "${docTitle}"`,
            [
                {
                    text: 'Chỉnh sửa tiêu đề',
                    onPress: () => openEditTitleModal(doc),
                },
                {
                    text: 'Xóa tài liệu',
                    style: 'destructive',
                    onPress: () => confirmDelete(doc),
                },
                {
                    text: 'Hủy',
                    style: 'cancel',
                },
            ]
        );
    };

    const filteredSections = useMemo(() => {
        if (!selectedSubjectId) return sections;
        return sections.filter(section => (section as any).id === selectedSubjectId);
    }, [sections, selectedSubjectId]);

    const renderItem = ({ item }: { item: documentService.Document }) => {
        const isPdf = (item.fileType || '').toLowerCase() === 'pdf';
        return (
            <View style={styles.docCard}>
                <TouchableOpacity
                    style={styles.docItemContent}
                    onLongPress={() => openDocumentActionMenu(item)}
                    onPress={() => navigation.navigate('PDFViewer', { url: item.fileUrl, title: item.title, documentId: item.id })}
                    activeOpacity={0.8}
                >
                    <View style={[styles.iconContainer, { backgroundColor: '#F3F4F6' }]}>
                        <Ionicons
                            name={isPdf ? 'document-text' : 'document'}
                            size={28}
                            color="#8B5CF6"
                        />
                    </View>
                    <View style={styles.docInfo}>
                        <Text style={styles.docTitle}>{item.title || 'Tài liệu không tên'}</Text>
                        <Text style={styles.docType}>{(item.fileType || 'N/A').toUpperCase()}</Text>
                    </View>
                    <TouchableOpacity onPress={() => openDocumentActionMenu(item)} style={styles.actionMenuButton}>
                        <Ionicons name="create-outline" size={20} color="#2563EB" />
                    </TouchableOpacity>
                </TouchableOpacity>

                {isPdf && (
                    <View style={styles.aiActionsRow}>
                        <TouchableOpacity
                            style={styles.aiChip}
                            onPress={() => navigation.navigate('Chat', {
                                summaryDocumentId: item.id,
                                summaryTitle: item.title,
                                summaryRequestId: Date.now().toString(),
                            })}
                        >
                            <Ionicons name="sparkles" size={13} color="#8B5CF6" />
                            <Text style={styles.aiChipText}>Tóm tắt AI</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.aiChip, styles.aiChipGreen]}
                            onPress={() => { setGenModalDoc(item); setGenType('QUIZ'); setGenCount(10); setGenDifficulty('MEDIUM'); }}
                        >
                            <Ionicons name="layers-outline" size={13} color="#059669" />
                            <Text style={[styles.aiChipText, { color: '#059669' }]}>Tạo bộ đề</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    const renderSectionHeader = ({ section: { title, color } }: { section: Section }) => (
        <View style={styles.sectionHeader}>
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                    <View style={styles.iconWrapper}>
                        <Ionicons name="document-text" size={24} color="#fff" />
                    </View>
                    <Text style={styles.title}>Tài liệu</Text>
                </View>
                <TouchableOpacity
                    style={styles.uploadBtn}
                    onPress={() => {
                        setSelectedUploadSubjectId(null);
                        setCustomTitle('');
                        setModalVisible(true);
                    }}
                >
                    <Ionicons name="cloud-upload" size={20} color="#fff" />
                    <Text style={styles.uploadBtnText}>Tải lên</Text>
                </TouchableOpacity>
            </View>

            {/* Subject Filter Chips */}
            <View style={styles.filterContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScroll}
                >
                    <TouchableOpacity
                        style={[styles.filterChip, !selectedSubjectId && styles.filterChipActive]}
                        onPress={() => setSelectedSubjectId(null)}
                    >
                        <Text style={[styles.filterChipText, !selectedSubjectId && styles.filterChipTextActive]}>Tất cả</Text>
                    </TouchableOpacity>

                    {sections.map((section) => (
                        <TouchableOpacity
                            key={(section as any).id}
                            style={[styles.filterChip, selectedSubjectId === (section as any).id && { backgroundColor: section.color }]}
                            onPress={() => setSelectedSubjectId((section as any).id)}
                        >
                            <Text style={[styles.filterChipText, selectedSubjectId === (section as any).id && { color: '#fff' }]}>
                                {section.title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading || uploading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    {uploading && <Text style={styles.uploadingText}>Đang tải lên tài liệu...</Text>}
                </View>
            ) : (
                <SectionList
                    sections={filteredSections}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    renderSectionHeader={renderSectionHeader}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    stickySectionHeadersEnabled={false}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="library-outline" size={60} color="#C7C7CC" />
                            <Text style={styles.emptyText}>
                                {selectedSubjectId ? 'Không có tài liệu cho môn này' : 'Chưa có tài liệu nào'}
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Generate Exercise Modal */}
            <Modal visible={!!genModalDoc} animationType="slide" transparent={true} onRequestClose={() => setGenModalDoc(null)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Tạo bộ đề từ PDF</Text>
                            <TouchableOpacity onPress={() => setGenModalDoc(null)}>
                                <Ionicons name="close" size={24} color="#1C1C1E" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.genDocRow}>
                            <Ionicons name="document-text" size={20} color="#8B5CF6" />
                            <Text style={styles.genDocName} numberOfLines={2}>{genModalDoc?.title}</Text>
                        </View>

                        <Text style={styles.genLabel}>Loại bài tập</Text>
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

                        <Text style={styles.genLabel}>Số câu hỏi: <Text style={{ color: '#8B5CF6', fontWeight: '700' }}>{genCount}</Text></Text>
                        <View style={styles.countGrid}>
                            {[5, 10, 15, 20, 30, 40].map(n => (
                                <TouchableOpacity
                                    key={n}
                                    style={[styles.countChip, genCount === n && styles.countChipSelected]}
                                    onPress={() => setGenCount(n)}
                                >
                                    <Text style={[styles.countChipText, genCount === n && { color: '#fff' }]}>{n} câu</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.genLabel}>Mức độ</Text>
                        <View style={styles.typeSelector}>
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

                        <TouchableOpacity
                            style={[styles.genBtn, generating && { opacity: 0.7 }]}
                            onPress={handleGenerateExercise}
                            disabled={generating}
                        >
                            {generating
                                ? <><ActivityIndicator size="small" color="#fff" /><Text style={styles.genBtnText}>  Đang tạo...</Text></>
                                : <><Ionicons name="sparkles" size={18} color="#fff" /><Text style={styles.genBtnText}>  Tạo bộ đề</Text></>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={modalVisible} animationType="fade" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chọn môn học để tải lên</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#1C1C1E" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={subjects}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.subjectItem,
                                        selectedUploadSubjectId === item.id && styles.subjectItemSelected,
                                    ]}
                                    onPress={() => setSelectedUploadSubjectId(item.id)}
                                >
                                    <View style={[styles.subjectColor, { backgroundColor: item.color }]} />
                                    <Text style={styles.subjectName}>{item.name}</Text>
                                    <Ionicons
                                        name={selectedUploadSubjectId === item.id ? 'checkmark-circle' : 'chevron-forward'}
                                        size={20}
                                        color={selectedUploadSubjectId === item.id ? '#8B5CF6' : '#C7C7CC'}
                                    />
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <Text style={styles.emptySubText}>Bạn cần tạo môn học trước khi tải tài liệu</Text>
                            }
                        />

                        {subjects.length > 0 && (
                            <>
                                <Text style={styles.uploadLabel}>Tiêu đề tài liệu (tùy chọn)</Text>
                                <TextInput
                                    style={styles.uploadInput}
                                    value={customTitle}
                                    onChangeText={setCustomTitle}
                                    placeholder="Ví dụ: Chương 2 - Đạo hàm"
                                    placeholderTextColor="#9CA3AF"
                                    maxLength={120}
                                />
                                <Text style={styles.uploadHint}>Nếu để trống, hệ thống sẽ lấy tên file gốc.</Text>

                                <TouchableOpacity
                                    style={[
                                        styles.pickFileBtn,
                                        !selectedUploadSubjectId && styles.pickFileBtnDisabled,
                                    ]}
                                    disabled={!selectedUploadSubjectId}
                                    onPress={handlePickDocument}
                                >
                                    <Ionicons name="document-attach" size={18} color="#fff" />
                                    <Text style={styles.pickFileBtnText}>Chọn file và tải lên</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            <Modal visible={editTitleModalVisible} animationType="fade" transparent={true} onDismiss={closeEditTitleModal}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chỉnh sửa tiêu đề</Text>
                            <TouchableOpacity onPress={() => closeEditTitleModal()} disabled={savingEditedTitle}>
                                <Ionicons name="close" size={24} color="#1C1C1E" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.uploadLabel}>Tiêu đề tài liệu</Text>
                        <TextInput
                            style={styles.uploadInput}
                            value={editingTitle}
                            onChangeText={setEditingTitle}
                            placeholder="Nhập tiêu đề mới"
                            placeholderTextColor="#9CA3AF"
                            maxLength={120}
                            editable={!savingEditedTitle}
                        />

                        <TouchableOpacity
                            style={[styles.pickFileBtn, savingEditedTitle && styles.pickFileBtnDisabled]}
                            onPress={handleSaveEditedTitle}
                            disabled={savingEditedTitle}
                        >
                            {savingEditedTitle
                                ? <><ActivityIndicator size="small" color="#fff" /><Text style={styles.pickFileBtnText}>  Đang lưu...</Text></>
                                : <><Ionicons name="checkmark" size={18} color="#fff" /><Text style={styles.pickFileBtnText}>  Lưu tiêu đề</Text></>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    header: {
        paddingHorizontal: 20,
        paddingTop: Constants.statusBarHeight + 10,
        paddingBottom: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#8B5CF6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
    uploadBtn: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#8B5CF6',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#8B5CF6',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4
    },
    uploadBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 6,
    },
    filterContainer: {
        paddingVertical: 15,
        backgroundColor: '#FAFAFA',
    },
    filterScroll: {
        paddingHorizontal: 20,
        alignItems: 'center'
    },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    uploadingText: { marginTop: 15, color: '#6B7280', fontWeight: '500' },
    list: { paddingHorizontal: 20, paddingBottom: 20 },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 12,
        backgroundColor: 'transparent',
    },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
    docCard: {
        backgroundColor: '#F9FAFA',
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
    },
    docItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    aiActionsRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 8,
    },
    aiChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F3FF',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#EDE9FE',
    },
    aiChipGreen: {
        backgroundColor: '#F0FDF4',
        borderColor: '#D1FAE5',
    },
    aiChipText: {
        marginLeft: 5,
        fontSize: 12,
        fontWeight: '600',
        color: '#8B5CF6',
    },
    iconContainer: {
        width: 60,
        height: 80,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },
    docInfo: { flex: 1, marginLeft: 16 },
    docTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 6 },
    docType: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
    actionMenuButton: {
        padding: 5,
        marginLeft: 10
    },
    // Generate modal extras
    genDocRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F3FF', borderRadius: 12, padding: 12, marginBottom: 20 },
    genDocName: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '600', color: '#1F2937' },
    genLabel: { fontSize: 14, fontWeight: '600', color: '#3A3A3C', marginBottom: 10 },
    typeSelector: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    typeOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#F2F2F7',
        marginHorizontal: 5,
    },
    typeOptionSelected: { backgroundColor: '#007AFF' },
    typeText: { marginLeft: 8, fontSize: 14, color: '#8E8E93', fontWeight: '500' },
    typeTextSelected: { color: '#fff' },
    countGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    countChip: { width: '30%', paddingVertical: 12, borderRadius: 12, backgroundColor: '#F2F2F7', alignItems: 'center' },
    countChipSelected: { backgroundColor: '#8B5CF6' },
    countChipText: { fontWeight: '700', color: '#3A3A3C', fontSize: 14 },
    genBtn: { flexDirection: 'row', backgroundColor: '#8B5CF6', borderRadius: 16, padding: 16, justifyContent: 'center', alignItems: 'center' },
    genBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    empty: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: '#8E8E93', marginTop: 10, fontSize: 16 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 25,
        maxHeight: '80%'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
    subjectItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderRadius: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7'
    },
    subjectItemSelected: {
        backgroundColor: '#F5F3FF',
        borderBottomColor: '#EDE9FE',
    },
    subjectColor: { width: 12, height: 12, borderRadius: 6, marginRight: 15 },
    subjectName: { flex: 1, fontSize: 16, color: '#3A3A3C', fontWeight: '500' },
    emptySubText: { textAlign: 'center', color: '#8E8E93', padding: 20 },
    uploadLabel: {
        marginTop: 16,
        marginBottom: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    uploadInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: '#111827',
        backgroundColor: '#FFFFFF',
    },
    uploadHint: {
        marginTop: 6,
        fontSize: 12,
        color: '#6B7280',
    },
    pickFileBtn: {
        marginTop: 14,
        borderRadius: 14,
        backgroundColor: '#8B5CF6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 6,
    },
    pickFileBtnDisabled: {
        opacity: 0.5,
    },
    pickFileBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    filterChip: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F2F2F7', marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: '#8B5CF6',
    },
    filterChipText: {
        fontSize: 14, fontWeight: '600', color: '#374151',
    },
    filterChipTextActive: {
        color: '#fff',
    },
});
