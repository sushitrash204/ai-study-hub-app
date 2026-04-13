import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useChatStore } from '../../store/chatStore';
import * as chatService from '../../services/chatService';
import * as documentService from '../../services/documentService';
import { ChatMessage, ActiveDocumentContext } from '../../types/chat';

let messageSequence = 0;
const buildMessageId = (prefix: string) => {
    messageSequence += 1;
    return `${Date.now()}-${prefix}-${messageSequence}`;
};

export const useChat = () => {
    const store = useChatStore();

    const activateDocumentContext = useCallback(async (
        documentId: string,
        title: string
    ) => {
        store.setMessages((prev) => [
            ...prev,
            {
                id: buildMessageId('u-summary'),
                text: `Tóm tắt giúp mình tài liệu "${title}" nhé.`,
                sender: 'user',
            },
        ]);

        store.setSummarizing(true);

        try {
            const result = await documentService.summarizeDocument(documentId);
            const nextContext: ActiveDocumentContext = {
                id: result.documentId,
                title: result.title || title,
                summary: result.summary,
            };

            store.setActiveDocument(nextContext);
            store.setMessages((prev) => [
                ...prev,
                {
                    id: buildMessageId('ai-summary'),
                    sender: 'bot',
                    text:
                        `Mình đã nạp tài liệu "${nextContext.title}".` +
                        '\n\nTóm tắt nhanh:\n' +
                        `${nextContext.summary}` +
                        '\n\nBạn có thể hỏi tiếp theo tài liệu này, hoặc chuyển về trò chuyện chung bất cứ lúc nào.',
                },
            ]);
        } catch (error: any) {
             store.setMessages((prev) => [
                ...prev,
                {
                    id: buildMessageId('ai-summary-error'),
                    sender: 'bot',
                    text: error?.response?.data?.message || error.message || 'Không thể tóm tắt tài liệu lúc này.',
                },
            ]);
        } finally {
            store.setSummarizing(false);
        }
    }, [store]);

    const clearDocumentContext = useCallback(() => {
        if (!store.activeDocument) return;

        Alert.alert(
            'Xác nhận',
            `Ngừng chat theo tài liệu "${store.activeDocument.title}"?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Ngừng',
                    style: 'destructive',
                    onPress: () => {
                        store.setActiveDocument(null);
                        store.setMessages((prev) => [
                            ...prev,
                            {
                                id: buildMessageId('ai-context-cleared'),
                                sender: 'bot',
                                text: 'Đã chuyển về trò chuyện chung. Bạn có thể tiếp tục hỏi trực tiếp hoặc chọn tài liệu khác theo môn học ngay tại màn này.',
                            },
                        ]);
                    }
                }
            ]
        );
    }, [store]);

    const startNewChat = useCallback(() => {
        store.clearChat();
        messageSequence = 0;
    }, [store]);

    const sendMessage = useCallback(async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || store.isSummarizing || store.isReplying) return;

        const newUserMsg: ChatMessage = {
            id: buildMessageId('u'),
            text: trimmed,
            sender: 'user',
        };
        store.setMessages((prev) => [...prev, newUserMsg]);
        store.setReplying(true);

        try {
            // Get last 8 messages for context matching API requirement
            const history = store.messages.slice(-8).map((item) => ({
                role: item.sender === 'user' ? 'user' as const : 'assistant' as const,
                text: item.text,
            }));

            const result = store.activeDocument
                ? await documentService.chatWithDocument(store.activeDocument.id, trimmed)
                : await chatService.chatWithAssistant(trimmed, history);

            store.setMessages((prev) => [
                ...prev,
                {
                    id: buildMessageId('ai-answer'),
                    text: result.answer,
                    sender: 'bot',
                },
            ]);
        } catch (error: any) {
            store.setMessages((prev) => [
                ...prev,
                {
                    id: buildMessageId('ai-error'),
                    text: error?.response?.data?.message || error.message || 'Không thể trả lời câu hỏi lúc này.',
                    sender: 'bot',
                },
            ]);
        } finally {
            store.setReplying(false);
        }
    }, [store]);

    return {
        state: {
            messages: store.messages,
            activeDocument: store.activeDocument,
            isSummarizing: store.isSummarizing,
            isReplying: store.isReplying
        },
        actions: {
            activateDocumentContext,
            clearDocumentContext,
            startNewChat,
            sendMessage
        }
    };
};
