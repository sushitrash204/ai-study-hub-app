import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    Alert,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { TYPOGRAPHY } from '../../theme/typography';
import * as documentService from '../../services/documentService';
import * as subjectService from '../../services/subjectService';
import * as chatService from '../../services/chatService';
import ChatMarkdownMessage from '../../components/ChatMarkdownMessage';

interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'ai';
}

interface ActiveDocumentContext {
    id: string;
    title: string;
    summary: string;
}

interface ChatRouteParams {
    summaryDocumentId?: string;
    summaryTitle?: string;
    summaryRequestId?: string;
}

const isPdfDocument = (document: documentService.Document) => {
    return (document.fileType || '').toLowerCase() === 'pdf';
};

const hasComplexMarkdownStructure = (value: string): boolean => {
    const text = String(value || '');
    return /```|`|\n|^\s*[-*+]\s|^\s*\d+\.\s|^\s*>|\$\$|\\\(|\\\[|\\\]|\|.+\|/m.test(text);
};

export default function ChatScreen({ route }: any) {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [activeDocument, setActiveDocument] = useState<ActiveDocumentContext | null>(null);
    const [summarizing, setSummarizing] = useState(false);
    const [replying, setReplying] = useState(false);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
    const [subjectDocuments, setSubjectDocuments] = useState<documentService.Document[]>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [loadingDocuments, setLoadingDocuments] = useState(false);
    const [activatingDocumentId, setActivatingDocumentId] = useState<string | null>(null);

    const handledRequestRef = useRef<string | null>(null);
    const messagesScrollRef = useRef<ScrollView | null>(null);
    const messageSequenceRef = useRef(0);
    const shouldAutoScrollRef = useRef(true);

    const routeParams = (route?.params || {}) as ChatRouteParams;
    const shouldShowQuickAction = !activeDocument && messages.length === 0;

    const buildMessageId = (prefix: string) => {
        messageSequenceRef.current += 1;
        return `${Date.now()}-${prefix}-${messageSequenceRef.current}`;
    };

    const fetchDocumentsForSubject = async (subjectId: string) => {
        setLoadingDocuments(true);
        try {
            const documents = await documentService.getDocumentsBySubject(subjectId);
            const pdfDocuments = Array.isArray(documents)
                ? (documents as documentService.Document[]).filter(isPdfDocument)
                : [];

            setSubjectDocuments(pdfDocuments);
        } catch (error: any) {
            setSubjectDocuments([]);
            Alert.alert('Lỗi', error?.response?.data?.message || error.message || 'Không thể tải danh sách tài liệu.');
        } finally {
            setLoadingDocuments(false);
        }
    };

    const openDocumentPicker = async () => {
        setPickerVisible(true);
        setLoadingSubjects(true);

        try {
            const subjectList = await subjectService.getSubjects();
            const normalizedSubjects = Array.isArray(subjectList) ? subjectList as any[] : [];

            setSubjects(normalizedSubjects);

            const nextSubjectId = normalizedSubjects.some((subject) => subject.id === selectedSubjectId)
                ? selectedSubjectId
                : (normalizedSubjects[0]?.id ?? null);

            setSelectedSubjectId(nextSubjectId);

            if (nextSubjectId) {
                await fetchDocumentsForSubject(nextSubjectId);
            } else {
                setSubjectDocuments([]);
            }
        } catch (error: any) {
            setSubjects([]);
            setSubjectDocuments([]);
            Alert.alert('Lỗi', error?.response?.data?.message || error.message || 'Không thể tải danh sách môn học.');
        } finally {
            setLoadingSubjects(false);
        }
    };

    const activateDocumentContext = async (
        documentId: string,
        title: string,
        source: 'route' | 'picker' = 'picker'
    ) => {
        if (source === 'picker') {
            setPickerVisible(false);
        }

        setMessages((prev) => [
            ...prev,
            {
                id: buildMessageId('u-summary'),
                text: `Tóm tắt giúp mình tài liệu "${title}" nhé.`,
                sender: 'user',
            },
        ]);

        setSummarizing(true);
        setActivatingDocumentId(documentId);

        try {
            const result = await documentService.summarizeDocument(documentId);
            const nextContext: ActiveDocumentContext = {
                id: result.documentId,
                title: result.title || title,
                summary: result.summary,
            };

            setActiveDocument(nextContext);
            setMessages((prev) => [
                ...prev,
                {
                    id: buildMessageId('ai-summary'),
                    sender: 'ai',
                    text:
                        `Mình đã nạp tài liệu "${nextContext.title}".` +
                        '\n\nTóm tắt nhanh:\n' +
                        `${nextContext.summary}` +
                        '\n\nBạn có thể hỏi tiếp theo tài liệu này, hoặc chuyển về trò chuyện chung bất cứ lúc nào.',
                },
            ]);
        } catch (error: any) {
            setMessages((prev) => [
                ...prev,
                {
                    id: buildMessageId('ai-summary-error'),
                    sender: 'ai',
                    text: error?.response?.data?.message || error.message || 'Không thể tóm tắt tài liệu lúc này.',
                },
            ]);
        } finally {
            setSummarizing(false);
            setActivatingDocumentId((current) => (current === documentId ? null : current));
        }
    };

    useEffect(() => {
        const requestId = routeParams.summaryRequestId;
        const documentId = routeParams.summaryDocumentId;
        const title = routeParams.summaryTitle || 'Tài liệu PDF';

        if (!requestId || !documentId) {
            return;
        }

        if (handledRequestRef.current === requestId) {
            return;
        }

        handledRequestRef.current = requestId;
        activateDocumentContext(documentId, title, 'route');
    }, [routeParams.summaryDocumentId, routeParams.summaryRequestId, routeParams.summaryTitle]);

    const clearDocumentContext = () => {
        if (!activeDocument) {
            return;
        }

        Alert.alert('Xóa ngữ cảnh PDF', `Ngừng chat theo tài liệu "${activeDocument.title}"?`, [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa',
                style: 'destructive',
                onPress: () => {
                    setActiveDocument(null);
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: buildMessageId('ai-context-cleared'),
                            sender: 'ai',
                            text: 'Đã chuyển về trò chuyện chung. Bạn có thể tiếp tục hỏi trực tiếp hoặc chọn tài liệu khác theo môn học ngay tại màn này.',
                        },
                    ]);
                },
            },
        ]);
    };

    const openContextMenu = () => {
        if (!activeDocument) {
            openDocumentPicker();
            return;
        }

        Alert.alert('Ngữ cảnh chat', `Đang dùng tài liệu "${activeDocument.title}"`, [
            {
                text: 'Chọn tài liệu khác',
                onPress: () => {
                    openDocumentPicker();
                },
            },
            {
                text: 'Trò chuyện chung',
                onPress: clearDocumentContext,
            },
            {
                text: 'Hủy',
                style: 'cancel',
            },
        ]);
    };

    const startNewChat = () => {
        if (messages.length === 0 && !activeDocument) return;
        setMessages([]);
        setActiveDocument(null);
        messageSequenceRef.current = 0;
        handledRequestRef.current = null;
    };

    const sendMessage = async () => {
        const trimmed = message.trim();
        if (!trimmed || summarizing || replying) {
            return;
        }

        const newUserMsg: ChatMessage = {
            id: buildMessageId('u'),
            text: trimmed,
            sender: 'user',
        };
        setMessages((prev) => [...prev, newUserMsg]);
        setMessage('');

        setReplying(true);
        try {
            const result = activeDocument
                ? await documentService.chatWithDocument(activeDocument.id, trimmed)
                : await chatService.chatWithAssistant(
                    trimmed,
                    messages.slice(-8).map((item) => ({
                        role: item.sender === 'user' ? 'user' as const : 'assistant' as const,
                        text: item.text,
                    }))
                );

            setMessages((prev) => [
                ...prev,
                {
                    id: buildMessageId('ai-answer'),
                    text: result.answer,
                    sender: 'ai',
                },
            ]);
        } catch (error: any) {
            setMessages((prev) => [
                ...prev,
                {
                    id: buildMessageId('ai-error'),
                    text: error?.response?.data?.message || error.message || 'Không thể trả lời câu hỏi lúc này.',
                    sender: 'ai',
                },
            ]);
        } finally {
            setReplying(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                    <View style={styles.iconWrapper}>
                        <Ionicons name="chatbubbles" size={24} color="#fff" />
                    </View>
                    <Text style={styles.title}>AI Chat</Text>
                    {(messages.length > 0 || !!activeDocument) && (
                        <TouchableOpacity style={styles.newChatBtn} onPress={startNewChat}>
                            <Ionicons name="create-outline" size={22} color="#8B5CF6" />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity
                    style={[styles.contextBtn, activeDocument ? styles.contextBtnActive : styles.contextBtnIdle]}
                    onPress={openContextMenu}
                >
                    <Ionicons
                        name={activeDocument ? 'document-text' : 'albums-outline'}
                        size={18}
                        color="#fff"
                    />
                    <Text style={styles.contextBtnText}>{activeDocument ? 'Đang dùng PDF' : 'Chọn PDF'}</Text>
                </TouchableOpacity>
            </View>

            {!!activeDocument && (
                <View style={styles.contextBanner}>
                    <Ionicons name="book-outline" size={16} color="#7C3AED" />
                    <Text numberOfLines={1} style={styles.contextBannerText}>
                        Ngữ cảnh: {activeDocument.title}
                    </Text>
                </View>
            )}

            {shouldShowQuickAction && (
                <View style={styles.quickActionCard}>
                    <View style={styles.quickActionCopy}>
                        <Text style={styles.quickActionTitle}>Bắt đầu trò chuyện chung</Text>
                        <Text style={styles.quickActionText}>Bạn có thể hỏi trực tiếp bất cứ điều gì, hoặc chọn tài liệu PDF theo môn học để chuyển sang trả lời theo ngữ cảnh tài liệu.</Text>
                    </View>
                    <TouchableOpacity style={styles.quickActionButton} onPress={openDocumentPicker}>
                        <Ionicons name="folder-open-outline" size={16} color="#7C3AED" />
                        <Text style={styles.quickActionButtonText}>Chọn tài liệu</Text>
                    </TouchableOpacity>
                </View>
            )}

            <KeyboardAvoidingView
                style={styles.chatContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    ref={messagesScrollRef}
                    contentContainerStyle={[
                        styles.messagesList,
                        messages.length === 0 && styles.messagesListEmpty,
                    ]}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={messages.length > 0}
                    scrollEventThrottle={16}
                    onScroll={({ nativeEvent }) => {
                        const padding = 80;
                        const isNearBottom =
                            nativeEvent.contentOffset.y + nativeEvent.layoutMeasurement.height >=
                            nativeEvent.contentSize.height - padding;
                        shouldAutoScrollRef.current = isNearBottom;
                    }}
                    onContentSizeChange={() => {
                        if (!shouldAutoScrollRef.current) {
                            return;
                        }

                        requestAnimationFrame(() => {
                            messagesScrollRef.current?.scrollToEnd({ animated: true });
                        });
                    }}
                >
                    {messages.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="chatbubble-ellipses-outline" size={60} color="#D1D5DB" />
                            <Text style={styles.emptyText}>
                                {activeDocument
                                    ? 'Tài liệu đã sẵn sàng. Hãy đặt câu hỏi để AI trả lời theo nội dung PDF.'
                                    : 'Bạn có thể trò chuyện chung ngay bây giờ, hoặc chọn tài liệu PDF theo môn học để AI trả lời bám theo tài liệu.'}
                            </Text>
                            {!activeDocument && (
                                <TouchableOpacity style={styles.emptyActionButton} onPress={openDocumentPicker}>
                                    <Ionicons name="book-outline" size={18} color="#7C3AED" />
                                    <Text style={styles.emptyActionButtonText}>Chọn tài liệu theo môn học</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        messages.map((msg) => {
                            const shouldFillWidth = msg.sender === 'ai' || hasComplexMarkdownStructure(msg.text);

                            return (
                                <View
                                    key={msg.id}
                                    style={[
                                        styles.messageBubble,
                                        msg.sender === 'user' ? styles.userBubble : styles.aiBubble
                                    ]}
                                >
                                    <ChatMarkdownMessage
                                        content={msg.text}
                                        isUser={msg.sender === 'user'}
                                        fillWidth={shouldFillWidth}
                                    />
                                </View>
                            );
                        })
                    )}

                    {(summarizing || replying) && (
                        <View style={[styles.messageBubble, styles.aiBubble]}>
                            <View style={styles.loadingRow}>
                                <ActivityIndicator size="small" color="#8B5CF6" />
                                <Text style={styles.loadingText}>{summarizing ? 'Đang tóm tắt tài liệu...' : 'AI đang trả lời...'}</Text>
                            </View>
                        </View>
                    )}
                </ScrollView>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder={activeDocument ? 'Hỏi tiếp về tài liệu hoặc vấn đề liên quan...' : 'Hỏi AI bất kỳ điều gì, hoặc chọn PDF để chat theo tài liệu...'}
                        placeholderTextColor="#9CA3AF"
                        value={message}
                        onChangeText={setMessage}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, (!message.trim() || summarizing || replying) && styles.sendBtnDisabled]}
                        onPress={sendMessage}
                        disabled={!message.trim() || summarizing || replying}
                    >
                        <Ionicons name="send" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            <Modal visible={pickerVisible} animationType="slide" transparent={true} onRequestClose={() => setPickerVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chọn tài liệu theo môn học</Text>
                            <TouchableOpacity onPress={() => setPickerVisible(false)}>
                                <Ionicons name="close" size={24} color="#1C1C1E" />
                            </TouchableOpacity>
                        </View>

                        {loadingSubjects ? (
                            <View style={styles.modalLoaderBox}>
                                <ActivityIndicator size="large" color="#8B5CF6" />
                                <Text style={styles.modalLoaderText}>Đang tải môn học...</Text>
                            </View>
                        ) : subjects.length === 0 ? (
                            <View style={styles.selectorEmptyBox}>
                                <Ionicons name="albums-outline" size={32} color="#9CA3AF" />
                                <Text style={styles.selectorEmptyText}>Bạn chưa có môn học nào để gắn tài liệu.</Text>
                            </View>
                        ) : (
                            <>
                                <Text style={styles.selectorLabel}>Môn học</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subjectChipRow}>
                                    {subjects.map((subject) => {
                                        const isSelected = selectedSubjectId === subject.id;
                                        return (
                                            <TouchableOpacity
                                                key={subject.id}
                                                style={[
                                                    styles.subjectChip,
                                                    isSelected && { backgroundColor: subject.color || '#8B5CF6', borderColor: subject.color || '#8B5CF6' },
                                                ]}
                                                onPress={() => {
                                                    setSelectedSubjectId(subject.id);
                                                    fetchDocumentsForSubject(subject.id);
                                                }}
                                            >
                                                <Text style={[styles.subjectChipText, isSelected && styles.subjectChipTextSelected]}>{subject.name}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>

                                <Text style={styles.selectorLabel}>Tài liệu PDF</Text>
                                {loadingDocuments ? (
                                    <View style={styles.modalLoaderBox}>
                                        <ActivityIndicator size="small" color="#8B5CF6" />
                                        <Text style={styles.modalLoaderText}>Đang tải tài liệu PDF...</Text>
                                    </View>
                                ) : subjectDocuments.length === 0 ? (
                                    <View style={styles.selectorEmptyBox}>
                                        <Ionicons name="document-text-outline" size={32} color="#9CA3AF" />
                                        <Text style={styles.selectorEmptyText}>Môn này chưa có tài liệu PDF. Bạn vẫn có thể trò chuyện chung mà không cần chọn PDF.</Text>
                                    </View>
                                ) : (
                                    <ScrollView style={styles.documentList} showsVerticalScrollIndicator={false}>
                                        {subjectDocuments.map((document) => {
                                            const isActivating = activatingDocumentId === document.id;
                                            return (
                                                <TouchableOpacity
                                                    key={document.id}
                                                    style={styles.documentOption}
                                                    disabled={summarizing || isActivating}
                                                    onPress={() => activateDocumentContext(document.id, document.title, 'picker')}
                                                >
                                                    <View style={styles.documentOptionLeft}>
                                                        <View style={styles.documentOptionIcon}>
                                                            <Ionicons name="document-text" size={18} color="#7C3AED" />
                                                        </View>
                                                        <View style={styles.documentOptionCopy}>
                                                            <Text numberOfLines={1} style={styles.documentOptionTitle}>{document.title}</Text>
                                                            <Text style={styles.documentOptionMeta}>{(document.fileType || 'PDF').toUpperCase()}</Text>
                                                        </View>
                                                    </View>

                                                    {isActivating ? (
                                                        <ActivityIndicator size="small" color="#8B5CF6" />
                                                    ) : (
                                                        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                                                    )}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>
                                )}
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Constants.statusBarHeight + 10,
        paddingBottom: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    newChatBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 6,
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
    title: { fontSize: TYPOGRAPHY.size.h1, fontWeight: TYPOGRAPHY.weight.black, color: '#1F2937' },
    contextBtn: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contextBtnActive: {
        backgroundColor: '#8B5CF6',
    },
    contextBtnIdle: {
        backgroundColor: '#8B5CF6', // Fixed: Changed from Blue (#2563EB) to Purple
    },
    contextBtnText: {
        color: '#fff',
        fontWeight: TYPOGRAPHY.weight.bold,
        marginLeft: 6,
        fontSize: TYPOGRAPHY.size.body - 1,
    },
    quickActionCard: {
        marginHorizontal: 16,
        marginTop: 10,
        marginBottom: 2,
        padding: 14,
        borderRadius: 16,
        backgroundColor: '#F5F3FF',
        borderWidth: 1,
        borderColor: '#DDD6FE',
    },
    quickActionCopy: {
        marginBottom: 12,
    },
    quickActionTitle: {
        fontSize: TYPOGRAPHY.size.h3,
        fontWeight: TYPOGRAPHY.weight.black,
        color: '#1F2937',
        marginBottom: 4,
    },
    quickActionText: {
        fontSize: TYPOGRAPHY.size.body,
        lineHeight: TYPOGRAPHY.size.body * 1.5,
        color: '#4B5563',
    },
    quickActionButton: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#DDD6FE',
    },
    quickActionButtonText: {
        marginLeft: 6,
        fontSize: TYPOGRAPHY.size.small,
        fontWeight: TYPOGRAPHY.weight.black,
        color: '#8B5CF6',
    },
    contextBanner: {
        marginHorizontal: 16,
        marginTop: 10,
        marginBottom: 4,
        backgroundColor: '#F5F3FF',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EDE9FE',
    },
    contextBannerText: {
        marginLeft: 8,
        color: '#8B5CF6',
        fontSize: TYPOGRAPHY.size.body,
        fontWeight: TYPOGRAPHY.weight.semibold,
        flex: 1,
    },
    chatContainer: {
        flex: 1,
    },
    messagesList: {
        flexGrow: 1,
        padding: 20,
        paddingBottom: 24,
    },
    messagesListEmpty: {
        justifyContent: 'center',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        marginTop: 10,
        fontSize: TYPOGRAPHY.size.body,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: TYPOGRAPHY.size.body * 1.5,
    },
    emptyActionButton: {
        marginTop: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: '#F5F3FF',
        borderWidth: 1,
        borderColor: '#EDE9FE',
    },
    emptyActionButtonText: {
        marginLeft: 8,
        color: '#7C3AED',
        fontWeight: '700',
    },
    messageBubble: {
        maxWidth: '96%',
        minWidth: 0,
        flexShrink: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 24,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: '#8B5CF6',
        borderBottomRightRadius: 6,
    },
    aiBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderBottomLeftRadius: 6,
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loadingText: {
        marginLeft: 10,
        color: '#6B7280',
        fontSize: 13,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        alignItems: 'flex-end',
    },
    input: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 12,
        maxHeight: 100,
        fontSize: TYPOGRAPHY.size.body,
        color: '#1F2937',
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#8B5CF6',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
        marginBottom: 2,
    },
    sendBtnDisabled: {
        backgroundColor: '#D1D5DB',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        maxHeight: '82%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 18,
    },
    modalTitle: {
        fontSize: TYPOGRAPHY.size.h2,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: '#111827',
    },
    modalLoaderBox: {
        paddingVertical: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalLoaderText: {
        marginTop: 10,
        fontSize: 13,
        color: '#6B7280',
    },
    selectorLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 10,
    },
    subjectChipRow: {
        paddingBottom: 4,
        marginBottom: 18,
        gap: 8,
    },
    subjectChip: {
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 999,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    subjectChipText: {
        color: '#374151',
        fontSize: 13,
        fontWeight: '600',
    },
    subjectChipTextSelected: {
        color: '#fff',
    },
    selectorEmptyBox: {
        borderRadius: 16,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectorEmptyText: {
        marginTop: 10,
        textAlign: 'center',
        color: '#6B7280',
        lineHeight: 20,
    },
    documentList: {
        maxHeight: 320,
    },
    documentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    documentOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    documentOptionIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#F5F3FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    documentOptionCopy: {
        flex: 1,
    },
    documentOptionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    documentOptionMeta: {
        marginTop: 3,
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
    },
});
