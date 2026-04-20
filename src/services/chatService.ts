import api from './api';

export interface ChatHistoryItem {
    role: 'user' | 'assistant';
    text: string;
}

export const chatWithAssistant = async (
    message: string,
    history: ChatHistoryItem[] = []
): Promise<{ answer: string }> => {
    const response = await api.post('/chat', { message, history });
    return response.data;
};
