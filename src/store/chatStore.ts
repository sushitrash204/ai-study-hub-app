import { create } from 'zustand';
import { ChatMessage, ActiveDocumentContext } from '../types/chat';

interface ChatState {
    messages: ChatMessage[];
    activeDocument: ActiveDocumentContext | null;
    isSummarizing: boolean;
    isReplying: boolean;
    setMessages: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
    addMessage: (message: ChatMessage) => void;
    setActiveDocument: (doc: ActiveDocumentContext | null) => void;
    setSummarizing: (val: boolean) => void;
    setReplying: (val: boolean) => void;
    clearChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
    messages: [],
    activeDocument: null,
    isSummarizing: false,
    isReplying: false,
    setMessages: (update) => set((state) => ({
        messages: typeof update === 'function' ? update(state.messages) : update
    })),
    addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
    setActiveDocument: (doc) => set({ activeDocument: doc }),
    setSummarizing: (val) => set({ isSummarizing: val }),
    setReplying: (val) => set({ isReplying: val }),
    clearChat: () => set({ messages: [], activeDocument: null })
}));
