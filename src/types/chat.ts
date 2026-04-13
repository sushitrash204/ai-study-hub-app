// Chat related interfaces

export type ChatRole = 'user' | 'assistant';
export type ChatSender = 'user' | 'bot';

export interface ChatHistoryItem {
    role: ChatRole;
    text: string;
}

export interface ChatResponse {
    answer: string;
}

export interface ChatMessage {
    id: string;
    text: string;
    sender: ChatSender;
    createdAt?: Date;
}

export interface ActiveDocumentContext {
    id: string;
    title: string;
    summary: string;
}
