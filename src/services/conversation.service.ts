import { db } from '../database/connection.js';
import { logger } from '../utils/logger.js';

export interface ConversationMessage {
    role: 'user' | 'ai';
    content: string;
    timestamp: Date;
}

export interface DialogueRecord {
    id?: number;
    candidate_id?: number;
    vacancy_id?: number;
    message_type: 'text' | 'audio' | 'system' | 'document';
    content: string;
    audio_file_path?: string;
    transcription?: string;
    document_file_path?: string;
    document_file_name?: string;
    document_file_size?: number;
    sender: 'candidate' | 'bot';
    created_at?: Date;
}

export interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
}

export class ConversationService {
    private conversations = new Map<number, ConversationMessage[]>();

    async getHistory(chatId: number, vacancyId?: number): Promise<ConversationMessage[]> {
        try {
            // For in-memory cache, we'll use a composite key if vacancy is specified
            const cacheKey = vacancyId ? `${chatId}_${vacancyId}` : chatId.toString();
            
            // First check in-memory cache
            if (this.conversations.has(chatId) && !vacancyId) {
                return this.conversations.get(chatId)!;
            }

            // Load from database
            let query = `SELECT content, sender, created_at
                         FROM dialogues
                         WHERE candidate_id = (
                             SELECT id FROM candidates WHERE telegram_user_id = $1
                         )`;
            let params: any[] = [chatId];

            if (vacancyId) {
                query += ` AND vacancy_id = $2`;
                params.push(vacancyId);
            }

            query += ` ORDER BY created_at ASC`;

            const result = await db.query(query, params);

            const messages: ConversationMessage[] = result.rows.map(row => ({
                role: row.sender === 'candidate' ? 'user' : 'ai',
                content: row.content,
                timestamp: new Date(row.created_at)
            }));

            // Cache in memory (only if no vacancy filter to maintain backward compatibility)
            if (!vacancyId) {
                this.conversations.set(chatId, messages);
            }
            return messages;
        } catch (error) {
            logger.error('Error loading conversation history from database', { chatId, vacancyId, error });
            return this.conversations.get(chatId) || [];
        }
    }

    async addMessage(
        chatId: number, 
        role: 'user' | 'ai', 
        content: string, 
        user?: TelegramUser, 
        vacancyId?: number,
        messageType: 'text' | 'audio' | 'system' | 'document' = 'text',
        audioFilePath?: string,
        documentFilePath?: string,
        documentFileName?: string,
        documentFileSize?: number
    ): Promise<void> {
        try {
            const message: ConversationMessage = { role, content, timestamp: new Date() };

            // Add to in-memory cache
            const history = this.conversations.get(chatId) || [];
            history.push(message);
            this.conversations.set(chatId, history);

            // Store in database
            await this.ensureCandidateExists(chatId, user);

            const dialogueRecord: DialogueRecord = {
                message_type: messageType,
                content: content,
                sender: role === 'user' ? 'candidate' : 'bot'
            };

            if (audioFilePath) {
                dialogueRecord.audio_file_path = audioFilePath;
            }

            if (documentFilePath) {
                dialogueRecord.document_file_path = documentFilePath;
                if (documentFileName !== undefined) {
                    dialogueRecord.document_file_name = documentFileName;
                }
                if (documentFileSize !== undefined) {
                    dialogueRecord.document_file_size = documentFileSize;
                }
            }

            if (vacancyId) {
                dialogueRecord.vacancy_id = vacancyId;
            }

            await this.saveDialogueToDatabase(chatId, dialogueRecord);

        } catch (error) {
            logger.error('Error adding message to conversation', { chatId, role, error });
            // Still keep in memory even if DB fails
        }
    }

    async clearHistory(chatId: number, vacancyId?: number): Promise<void> {
        try {
            // Clear in-memory cache
            this.conversations.delete(chatId);

            // Clear from database
            let query = `DELETE FROM dialogues
                         WHERE candidate_id = (
                             SELECT id FROM candidates WHERE telegram_user_id = $1
                         )`;
            let params: any[] = [chatId];

            if (vacancyId) {
                query += ` AND vacancy_id = $2`;
                params.push(vacancyId);
            }

            await db.query(query, params);

            logger.info('Conversation history cleared', { chatId, vacancyId });
        } catch (error) {
            logger.error('Error clearing conversation history', { chatId, vacancyId, error });
        }
    }

    async getContextString(chatId: number, maxMessages: number = 10, vacancyId?: number): Promise<string> {
        const history = await this.getHistory(chatId, vacancyId);
        return history
            .slice(-maxMessages)
            .map(msg => `${msg.role === 'user' ? 'Candidate' : 'HR Assistant'}: ${msg.content}`)
            .join('\n');
    }

    private async ensureCandidateExists(telegramUserId: number, user?: TelegramUser): Promise<void> {
        try {
            // Check if candidate exists
            const existing = await db.query(
                'SELECT id FROM candidates WHERE telegram_user_id = $1',
                [telegramUserId]
            );

            if (existing.rows.length === 0) {
                // Create candidate record with user data
                await db.query(
                    'INSERT INTO candidates (telegram_user_id, first_name, last_name, username) VALUES ($1, $2, $3, $4)',
                    [
                        telegramUserId,
                        user?.first_name || null,
                        user?.last_name || null,
                        user?.username || null
                    ]
                );
                logger.info('New candidate created', {
                    telegramUserId,
                    firstName: user?.first_name,
                    lastName: user?.last_name,
                    username: user?.username
                });
            } else if (user && (!existing.rows[0].first_name || !existing.rows[0].last_name || !existing.rows[0].username)) {
                // Update existing candidate if user data is missing
                await db.query(
                    'UPDATE candidates SET first_name = $1, last_name = $2, username = $3 WHERE telegram_user_id = $4',
                    [
                        user.first_name || null,
                        user.last_name || null,
                        user.username || null,
                        telegramUserId
                    ]
                );
                logger.info('Candidate data updated', {
                    telegramUserId,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    username: user.username
                });
            }
        } catch (error) {
            logger.error('Error ensuring candidate exists', { telegramUserId, error });
            throw error;
        }
    }

    private async saveDialogueToDatabase(chatId: number, dialogue: DialogueRecord): Promise<void> {
        try {
            await db.query(
                `INSERT INTO dialogues (candidate_id, vacancy_id, message_type, content, sender, audio_file_path, document_file_path, document_file_name, document_file_size, created_at)
                 VALUES (
                     (SELECT id FROM candidates WHERE telegram_user_id = $1),
                     $2, $3, $4, $5, $6, $7, $8, $9, $10
                 )`,
                [
                    chatId,
                    dialogue.vacancy_id,
                    dialogue.message_type,
                    dialogue.content,
                    dialogue.sender,
                    dialogue.audio_file_path || null,
                    dialogue.document_file_path || null,
                    dialogue.document_file_name || null,
                    dialogue.document_file_size || null,
                    dialogue.created_at || new Date()
                ]
            );
        } catch (error) {
            logger.error('Error saving dialogue to database', { chatId, dialogue, error });
            throw error;
        }
    }
}
