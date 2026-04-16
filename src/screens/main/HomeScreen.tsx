import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList,
    StatusBar, ActivityIndicator, RefreshControl, ScrollView, Alert,
    Modal, TextInput, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useSubjects } from '../../hooks/subject/useSubjects';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { Subject } from '../../models/Subject';
import { TYPOGRAPHY } from '../../theme/typography';

const COLORS = [
    '#8B5CF6', '#7C3AED', '#6D28D9', '#C026D3', '#DB2777', // Row 1
    '#3B82F6', '#2563EB', '#1D4ED8', '#60A5FA', '#0EA5E9', // Row 2
    '#10B981', '#059669', '#047857', '#14B8A6', '#06B6D4', // Row 3
    '#F59E0B', '#D97706', '#F97316', '#EA580C', '#EF4444'  // Row 4
];

export default function HomeScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuthStore();

    // UI Logic
    const [activeTab, setActiveTab] = useState<'PERSONAL' | 'SYSTEM'>('PERSONAL');
    const [systemClassId, setSystemClassId] = useState<string | 'INTRO'>('INTRO');
    const [modalVisible, setModalVisible] = useState(false);
    const [editingSubject, setEditingSubject] = useState<any>(null);
    const [subjectName, setSubjectName] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    const [selectedClassIdModal, setSelectedClassIdModal] = useState<string | null>(null);

    // Business Logic Hooks
    const { state: subState, actions: subActions } = useSubjects({
        autoFetch: true,
        type: 'BOTH',
        classId: activeTab === 'SYSTEM' && systemClassId !== 'INTRO' ? systemClassId : null
    });

    // Derived State
    const subjectsToShow = activeTab === 'PERSONAL' ? subState.subjects : subState.systemSubjects;

    // Handlers
    const onRefresh = () => subActions.fetchAll(true);

    const openAddModal = () => {
        setEditingSubject(null);
        setSubjectName('');
        setSelectedColor(COLORS[0]);
        setSelectedClassIdModal(null);
        setModalVisible(true);
    };

    const openEditModal = (subject: any) => {
        setEditingSubject(subject);
        setSubjectName(subject.name);
        setSelectedColor(subject.color);
        setSelectedClassIdModal(null);
        setModalVisible(true);
    };

    const handleSave = async () => {
        const success = await subActions.handleSave(
            subjectName,
            selectedColor,
            selectedClassIdModal,
            editingSubject
        );
        if (success) setModalVisible(false);
    };

    const confirmDelete = async (subject: any) => {
        Alert.alert(
            'Xác nhận xóa',
            `Bạn có chắc muốn xóa môn "${subject.name}" không?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        await subActions.handleDelete(subject);
                        setModalVisible(false);
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header Section */}
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image
                        source={require('../../../assets/icon.png')}
                        style={{ width: 40, height: 40, marginRight: 12, borderRadius: 10 }}
                        resizeMode="contain"
                    />
                    <View>
                        <Text style={styles.greeting}>Xin chào,</Text>
                        <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.notificationBtn}
                    onPress={() => navigation.navigate('Notifications')}
                >
                    <Ionicons name="notifications" size={24} color="#8B5CF6" />
                    <View style={styles.notificationBadge} />
                </TouchableOpacity>
            </View>

            {/* Tab Switcher */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'PERSONAL' && styles.activeTabButton]}
                    onPress={() => setActiveTab('PERSONAL')}
                >
                    <Text style={[styles.tabText, activeTab === 'PERSONAL' && styles.activeTabText]}>Môn của bạn</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'SYSTEM' && styles.activeTabButton]}
                    onPress={() => {
                        setActiveTab('SYSTEM');
                        setSystemClassId('INTRO');
                    }}
                >
                    <Text style={[styles.tabText, activeTab === 'SYSTEM' && styles.activeTabText]}>Hệ thống</Text>
                </TouchableOpacity>
            </View>

            {/* Content Section */}
            <View style={styles.content}>
                {activeTab === 'SYSTEM' && (
                    <View style={styles.gradeContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gradeScroll}>
                            <TouchableOpacity
                                style={[styles.gradeItem, systemClassId === 'INTRO' && styles.selectedGradeItem]}
                                onPress={() => setSystemClassId('INTRO')}
                            >
                                <Text style={[styles.gradeText, systemClassId === 'INTRO' && styles.selectedGradeText]}>Giới thiệu</Text>
                            </TouchableOpacity>
                            {subState.classes.map(cls => (
                                <TouchableOpacity
                                    key={cls.id}
                                    style={[styles.gradeItem, systemClassId === cls.id && styles.selectedGradeItem]}
                                    onPress={() => setSystemClassId(cls.id)}
                                >
                                    <Text style={[styles.gradeText, systemClassId === cls.id && styles.selectedGradeText]}>{cls.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        {activeTab === 'PERSONAL'
                            ? 'Tủ sách cá nhân'
                            : (systemClassId === 'INTRO' ? 'Giới thiệu hệ thống' : 'Học liệu hệ thống')}
                    </Text>
                    {subState.isLoading && <ActivityIndicator size="small" color="#8B5CF6" />}
                </View>

                {activeTab === 'SYSTEM' && systemClassId === 'INTRO' && (
                    <View style={styles.introWrap}>
                        <View style={styles.introHero}>
                            <View style={styles.introBadge}>
                                <Ionicons name="school" size={14} color="#fff" />
                                <Text style={styles.introBadgeText}>Chuẩn chương trình học</Text>
                            </View>
                            <Text style={styles.introTitle}>Bắt đầu từ phần Hệ thống</Text>
                            <Text style={styles.introSubtitle}>Chọn khối lớp để xem bộ môn phù hợp, sau đó mở từng bài học để học theo lộ trình có sẵn.</Text>
                            <TouchableOpacity
                                style={styles.introCta}
                                onPress={() => setSystemClassId(subState.classes[0]?.id || 'INTRO')}
                            >
                                <Text style={styles.introCtaText}>Khám phá ngay</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.introGrid}>
                            <View style={styles.introCard}>
                                <Ionicons name="layers" size={20} color="#2563EB" />
                                <Text style={styles.introCardTitle}>Theo từng khối lớp</Text>
                                <Text style={styles.introCardText}>Nội dung được phân loại rõ ràng theo cấp độ.</Text>
                            </View>
                            <View style={styles.introCard}>
                                <Ionicons name="sparkles" size={20} color="#8B5CF6" />
                                <Text style={styles.introCardTitle}>Nội dung hiện đại</Text>
                                <Text style={styles.introCardText}>Bài học dạng block dễ đọc, dễ theo dõi.</Text>
                            </View>
                        </View>
                    </View>
                )}

                <FlatList
                    style={activeTab === 'SYSTEM' && systemClassId === 'INTRO' ? { display: 'none' } : undefined}
                    data={subjectsToShow}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.cardWrapper]}
                            activeOpacity={0.85}
                            onPress={() => navigation.navigate('SubjectDetail', {
                                subjectId: item.id,
                                subjectName: item.name,
                                subjectColor: item.color,
                                subjectMode: activeTab,
                            })}
                            onLongPress={() => openEditModal(item)}
                        >
                            {/* Glossy Gradient Background */}
                            <View style={[styles.cardBackground, { backgroundColor: item.color || '#8B5CF6' }]}>
                                {/* Glossy Overlay */}
                                <View style={styles.cardGlossyOverlay} />

                                {/* Content */}
                                <View style={styles.cardContent}>
                                    {/* Top Section: Icon + Class Badge */}
                                    <View style={styles.cardTop}>
                                        <View style={styles.cardIcon}>
                                            <Ionicons name="book" size={20} color="#fff" />
                                        </View>
                                        {item.class?.name && (
                                            <View style={styles.classBadge}>
                                                <Text style={styles.classBadgeText}>{item.class.name}</Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Bottom Section: Subject Name */}
                                    <View style={styles.cardBottom}>
                                        <Text style={styles.cardLabel}>Môn học</Text>
                                        <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
                                    </View>
                                </View>

                                {/* Decorative Background Icon */}
                                <View style={styles.cardWatermark}>
                                    <Ionicons name="book" size={80} color="rgba(255,255,255,0.1)" />
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    showsVerticalScrollIndicator={false}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl refreshing={subState.isRefreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        !subState.isLoading ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="book-outline" size={60} color="#C7C7CC" />
                                <Text style={styles.emptyText}>
                                    {activeTab === 'PERSONAL' ? 'Chưa có môn học nào.' : 'Không tìm thấy môn học hệ thống.'}
                                </Text>
                                {activeTab === 'PERSONAL' && <Text style={styles.emptySubText}>Nhấn nút + để thêm mới.</Text>}
                            </View>
                        ) : null
                    }
                />
            </View>

            {/* Edit Modal */}
            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{editingSubject ? 'Sửa môn học' : 'Thêm môn học mới'}</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Tên môn học"
                            value={subjectName}
                            onChangeText={setSubjectName}
                            autoFocus
                        />
                        <View style={styles.colorPicker}>
                            {COLORS.map((c) => (
                                <TouchableOpacity
                                    key={c}
                                    style={[styles.colorDot, { backgroundColor: c }, selectedColor === c && styles.colorDotSelected]}
                                    onPress={() => setSelectedColor(c)}
                                />
                            ))}
                        </View>
                        <View style={styles.modalButtons}>
                            {editingSubject && (
                                <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete(editingSubject)}>
                                    <Text style={styles.deleteButtonText}>Xóa</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                <Text style={styles.saveButtonText}>Lưu</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelButtonText}>Hủy</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Fixed: Only show FAB on PERSONAL tab */}
            {activeTab === 'PERSONAL' && (
                <TouchableOpacity
                    style={styles.fab}
                    activeOpacity={0.9}
                    onPress={openAddModal}
                >
                    <Ionicons name="add" size={32} color="#fff" />
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFA' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 25,
    },
    greeting: { fontSize: TYPOGRAPHY.size.h3, color: '#6B7280', fontWeight: TYPOGRAPHY.weight.medium, marginBottom: 4 },
    userName: { fontSize: TYPOGRAPHY.size.h2 + 2, fontWeight: TYPOGRAPHY.weight.black, color: '#1F2937' },
    content: { flex: 1, paddingHorizontal: 20 },
    tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15, gap: 12 },
    tabButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F2F2F7' },
    activeTabButton: { backgroundColor: '#8B5CF6' },
    tabText: { fontSize: TYPOGRAPHY.size.body, fontWeight: TYPOGRAPHY.weight.black, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 0.5 },
    activeTabText: { color: '#fff' },
    gradeContainer: { paddingVertical: 5, marginBottom: 15 },
    gradeScroll: { paddingRight: 20, gap: 8 },
    gradeItem: {
        paddingHorizontal: 18, paddingVertical: 10, borderRadius: 16, backgroundColor: '#fff',
        borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    selectedGradeItem: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
    gradeText: { fontSize: TYPOGRAPHY.size.body - 1, fontWeight: TYPOGRAPHY.weight.bold, color: '#6B7280' },
    selectedGradeText: { color: '#fff' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    sectionTitle: { fontSize: TYPOGRAPHY.size.h1 - 2, fontWeight: TYPOGRAPHY.weight.bold, color: '#1F2937' },
    introWrap: { marginBottom: 12 },
    introHero: {
        backgroundColor: '#6D28D9',
        borderRadius: 24,
        padding: 18,
        marginBottom: 12,
    },
    introBadge: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginBottom: 10,
    },
    introBadgeText: {
        color: '#FFFFFF',
        fontSize: TYPOGRAPHY.size.tiny,
        fontWeight: TYPOGRAPHY.weight.black,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    introTitle: {
        color: '#FFFFFF',
        fontSize: TYPOGRAPHY.size.h1,
        fontWeight: TYPOGRAPHY.weight.black,
        marginBottom: 8,
    },
    introSubtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: TYPOGRAPHY.size.body,
        lineHeight: TYPOGRAPHY.size.body * 1.4,
        marginBottom: 14,
    },
    introCta: {
        alignSelf: 'flex-start',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    introCtaText: {
        color: '#6D28D9',
        fontSize: TYPOGRAPHY.size.body - 1,
        fontWeight: TYPOGRAPHY.weight.black,
    },
    introGrid: {
        flexDirection: 'row',
        gap: 10,
    },
    introCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 12,
        minHeight: 108,
    },
    introCardTitle: {
        color: '#1F2937',
        fontSize: TYPOGRAPHY.size.body - 1,
        fontWeight: TYPOGRAPHY.weight.black,
        marginTop: 8,
        marginBottom: 4,
    },
    introCardText: {
        color: '#6B7280',
        fontSize: TYPOGRAPHY.size.small,
        lineHeight: TYPOGRAPHY.size.small * 1.5,
        fontWeight: TYPOGRAPHY.weight.medium,
    },
    listContainer: { paddingBottom: 100 },
    row: { justifyContent: 'space-between', paddingHorizontal: 2 },
    cardWrapper: { width: '47.5%', marginBottom: 18, borderRadius: 20, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
    cardBackground: { flex: 1, minHeight: 160, borderRadius: 20, overflow: 'hidden', position: 'relative' },
    cardGlossyOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    cardContent: { flex: 1, padding: 14, justifyContent: 'space-between', zIndex: 1 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    classBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: 'rgba(0,0,0,0.15)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    classBadgeText: { fontSize: TYPOGRAPHY.size.tiny, fontWeight: TYPOGRAPHY.weight.black, color: '#fff', textTransform: 'uppercase', letterSpacing: 1 },
    cardBottom: { marginTop: 8 },
    cardLabel: { fontSize: TYPOGRAPHY.size.tiny, fontWeight: TYPOGRAPHY.weight.black, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
    cardTitle: { fontSize: TYPOGRAPHY.size.h3, fontWeight: TYPOGRAPHY.weight.black, color: '#fff', lineHeight: TYPOGRAPHY.size.h3 * 1.2 },
    cardWatermark: { position: 'absolute', bottom: -10, right: -10, transform: [{ rotate: '-12deg' }] },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { fontSize: TYPOGRAPHY.size.h2, fontWeight: TYPOGRAPHY.weight.semibold, color: '#8E8E93', marginTop: 10 },
    emptySubText: { fontSize: TYPOGRAPHY.size.body, color: '#C7C7CC', marginTop: 5 },
    fab: {
        position: 'absolute', bottom: 30, right: 30, width: 64, height: 64, borderRadius: 32,
        backgroundColor: '#8B5CF6', justifyContent: 'center', alignItems: 'center',
        shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 10,
    },
    avatar: {
        width: 50, height: 50, borderRadius: 25, backgroundColor: '#8B5CF6',
        justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    notificationBtn: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: '#F2F2F7',
        justifyContent: 'center', alignItems: 'center', position: 'relative',
    },
    notificationBadge: {
        position: 'absolute', top: 8, right: 10,
        width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444',
        borderWidth: 2, borderColor: '#F9FAFA',
    },
    cardText: { fontSize: 14, fontWeight: '600', color: '#fff', textAlign: 'center' },
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '85%',
    },
    modalTitle: { fontSize: TYPOGRAPHY.size.h2, fontWeight: TYPOGRAPHY.weight.bold, color: '#111827', marginBottom: 16 },
    modalInput: {
        borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
        fontSize: TYPOGRAPHY.size.body, marginBottom: 16,
    },
    colorPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    colorDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
    colorDotSelected: { borderColor: '#111827' },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    saveButton: { flex: 1, backgroundColor: '#8B5CF6', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
    saveButtonText: { color: '#fff', fontSize: TYPOGRAPHY.size.body, fontWeight: TYPOGRAPHY.weight.semibold },
    cancelButton: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
    cancelButtonText: { color: '#374151', fontSize: TYPOGRAPHY.size.body, fontWeight: TYPOGRAPHY.weight.semibold },
    deleteButton: { backgroundColor: '#EF4444', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16 },
    deleteButtonText: { color: '#fff', fontSize: TYPOGRAPHY.size.body, fontWeight: TYPOGRAPHY.weight.semibold },
});
