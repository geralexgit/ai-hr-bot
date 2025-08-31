export interface ConversationMessage {
    role: 'user' | 'ai';
    content: string;
    timestamp: Date;
}

export class ConversationService {
    private conversations = new Map<number, ConversationMessage[]>();

    getHistory(chatId: number): ConversationMessage[] {
        return this.conversations.get(chatId) || [];
    }

    addMessage(chatId: number, role: 'user' | 'ai', content: string): void {
        const history = this.getHistory(chatId);
        history.push({ role, content, timestamp: new Date() });
        this.conversations.set(chatId, history);
    }

    clearHistory(chatId: number): void {
        this.conversations.delete(chatId);
    }

    getContextString(chatId: number, maxMessages: number = 10): string {
        const history = this.getHistory(chatId);
        return history
            .slice(-maxMessages)
            .map(msg => `${msg.role === 'user' ? 'Candidate' : 'HR Assistant'}: ${msg.content}`)
            .join('\n');
    }
}