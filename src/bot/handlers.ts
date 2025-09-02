import TelegramBot, { Message } from 'node-telegram-bot-api';
import { OllamaService } from '../services/ollama.service.js';
import { ConversationService } from '../services/conversation.service.js';
import { logger } from '../utils/logger.js';

export class BotHandlers {
    constructor(
        private bot: TelegramBot,
        private ollamaService: OllamaService,
        private conversationService: ConversationService
    ) { }

    setupHandlers(): void {
        this.bot.onText(/\/start/, this.handleStart.bind(this));
        this.bot.onText(/\/help/, this.handleHelp.bind(this));
        this.bot.onText(/\/clear/, this.handleClear.bind(this));
        this.bot.on('message', this.handleMessage.bind(this));
    }

    private handleStart(msg: Message): void {
        const chatId = msg.chat.id;
        const userName = msg.from?.first_name || 'User';

        logger.info('New user started bot', { chatId, userName });

        this.bot.sendMessage(chatId, `Привет, ${userName}! Я HR-ассистент. Отправьте мне описание вакансии и резюме для анализа, или просто начните чат для интервью.

Команды:
/start - начать
/help - помощь
/clear - очистить историю разговора`);
    }

    private handleHelp(msg: Message): void {
        const chatId = msg.chat.id;

        this.bot.sendMessage(chatId, `Я HR-ассистент для проведения интервью и анализа резюме.

Для анализа резюме отправьте сообщение в формате:
Вакансия: [описание вакансии]
Резюме: [текст резюме]

Для чата просто отправьте сообщение, и я отвечу как HR-ассистент.

Команды:
/start - начать
/help - помощь
/clear - очистить историю разговора`);
    }

    private async handleClear(msg: Message): Promise<void> {
        const chatId = msg.chat.id;

        await this.conversationService.clearHistory(chatId);
        logger.info('Cleared conversation for chat', { chatId });

        this.bot.sendMessage(chatId, 'История разговора очищена.');
    }

    private async handleMessage(msg: Message): Promise<void> {
        const chatId = msg.chat.id;
        const text = msg.text;

        if (!text || text.startsWith('/')) return;

        logger.info('Received message', { chatId, textLength: text.length });

        await this.bot.sendChatAction(chatId, 'typing');

        try {
            if (text.includes('Вакансия:') && text.includes('Резюме:')) {
                await this.handleResumeAnalysis(chatId, text);
            } else {
                await this.handleChat(chatId, text, msg.from);
            }
        } catch (error) {
            logger.error('Error processing message', { chatId, error });
            this.bot.sendMessage(chatId, 'Произошла ошибка при обработке сообщения. Попробуйте еще раз.');
        }
    }

    private startTypingIndicator(chatId: number): () => void {
        const interval = setInterval(() => {
            this.bot.sendChatAction(chatId, 'typing').catch(err => {
                logger.warn('Failed to send typing indicator', { chatId, error: err.message });
            });
        }, 4000);

        return () => clearInterval(interval);
    }

    private extractFeedbackAndQuestion(jsonStr: string): string {
        try {
            const cleaned = jsonStr.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "");
            const data = JSON.parse(cleaned.trim());
            const feedback = data.feedback || data.feeedback || "";
            const nextQuestion = data.next_question ?? "";

            // Combine feedback and next question with space
            let response = "";
            if (feedback) {
                response += feedback;
            }
            if (nextQuestion) {
                if (response) response += " ";
                response += nextQuestion;
            }

            return response || "Расскажите подробнее о вашем опыте.";
        } catch (error) {
            throw new Error("Invalid JSON string");
        }
    }

    private async handleResumeAnalysis(chatId: number, text: string): Promise<void> {
        logger.info('Processing resume analysis', { chatId });

        const jobDescriptionMatch = text.match(/Вакансия:\s*(.+?)(?=Резюме:|$)/s);
        const resumeMatch = text.match(/Резюме:\s*(.+)$/s);

        if (!jobDescriptionMatch || !resumeMatch) {
            this.bot.sendMessage(chatId, 'Пожалуйста, укажите вакансию и резюме в формате:\nВакансия: [описание]\nРезюме: [текст]');
            return;
        }

        const jobDescription = jobDescriptionMatch[1]?.trim();
        const resume = resumeMatch[1]?.trim();

        if (!jobDescription || !resume) {
            this.bot.sendMessage(chatId, 'Пожалуйста, укажите вакансию и резюме в формате:\nВакансия: [описание]\nРезюме: [текст]');
            return;
        }

        const prompt = `
            Ты — HR-ассистент.
            У тебя есть описание вакансии и резюме кандидата.
            1. Извлеки ключевые требования из вакансии.
            2. Извлеки ключевые навыки из резюме.
            3. Определи совпадения и пробелы.
            4. Сгенерируй 5 вопросов для интервью (technical, case study, soft skills).
            5. Ответ кандидата приходит из системы распознавания речи, вероятно, содержит ошибки учитывай это при анализе
            Верни ответ в JSON с ключами: job_requirements, candidate_skills, matches, gaps, questions.
            ---
            Вакансия:
            ${jobDescription}

            Резюме:
            ${resume}
        `;

        const stopTyping = this.startTypingIndicator(chatId);

        try {
            const rawOutput = await this.ollamaService.generate(prompt);
            let jsonOutput;

            try {
                jsonOutput = JSON.parse(rawOutput);
            } catch (e) {
                jsonOutput = { raw: rawOutput };
            }

            let responseText = 'Анализ резюме:\n\n';

            if (jsonOutput.job_requirements) {
                responseText += `Требования вакансии: ${jsonOutput.job_requirements}\n\n`;
            }
            if (jsonOutput.candidate_skills) {
                responseText += `Навыки кандидата: ${jsonOutput.candidate_skills}\n\n`;
            }
            if (jsonOutput.matches) {
                responseText += `Совпадения: ${jsonOutput.matches}\n\n`;
            }
            if (jsonOutput.gaps) {
                responseText += `Пробелы: ${jsonOutput.gaps}\n\n`;
            }
            if (jsonOutput.questions) {
                responseText += `Вопросы для интервью:\n${jsonOutput.questions.join('\n')}\n\n`;
            }

            if (jsonOutput.raw) {
                responseText = jsonOutput.raw;
            }

            stopTyping();
            await this.bot.sendMessage(chatId, responseText);
            logger.info('Resume analysis completed', { chatId });
        } catch (error) {
            stopTyping();
            logger.error('Error in resume analysis', { chatId, error });
            this.bot.sendMessage(chatId, 'Ошибка при анализе резюме. Попробуйте еще раз.');
        }
    }

    private async handleChat(chatId: number, message: string, user?: any): Promise<void> {
        logger.info('Processing chat message', { chatId });

        await this.conversationService.addMessage(chatId, 'user', message, user);
        const conversationContext = await this.conversationService.getContextString(chatId);

        const prompt = `
Ты — HR-ассистент, проводящий интервью с кандидатом.

Контекст разговора:
${conversationContext}

Твоя задача:
1. Проанализируй ответ кандидата
2. Оцени соответствие требованиям вакансии
3. Задай следующий уместный вопрос или дай обратную связь
4. Будь дружелюбным, но профессиональным

ВАЖНО: Верни ответ ТОЛЬКО в JSON формате с двумя полями:
{
  "feedback": "конструктивная обратная связь для кандидата",
  "next_question": "следующий вопрос для кандидата"
}

Ответ кандидата: ${message}
`;

        const stopTyping = this.startTypingIndicator(chatId);

        try {
            const rawOutput = await this.ollamaService.generate(prompt);
            let responseText: string;
            
            try {
                responseText = this.extractFeedbackAndQuestion(rawOutput);
            } catch (error) {
                // Try to parse rawOutput directly as JSON
                try {
                    const data = JSON.parse(rawOutput.trim());
                    const feedback = data.feedback || data.feeedback || "data";
                    const nextQuestion = data.next_question ?? "";
                    let response = "";
                    if (feedback) {
                        response += feedback;
                    }
                    if (nextQuestion) {
                        if (response) response += " ";
                        response += nextQuestion;
                    }
                    responseText = response || 'Расскажите подробнее о вашем опыте.';
                } catch (e) {
                    responseText = rawOutput.replace(/```json|```/g, '').trim() || 'Расскажите подробнее о вашем опыте.';
                }
            }

            await this.conversationService.addMessage(chatId, 'ai', rawOutput);

            stopTyping();
            console.log({responseText})
            const parsedText = JSON.parse(String(responseText));
            const feedback = parsedText?.feedback || parsedText?.feeedback || "";
            let response = `${feedback} ${parsedText?.next_question}`;
            await this.bot.sendMessage(chatId, response ?? responseText);
            logger.info('Chat message processed', { chatId });
        } catch (error) {
            stopTyping();
            logger.error('Error in chat processing', { chatId, error });
            this.bot.sendMessage(chatId, 'Ошибка при обработке сообщения. Попробуйте еще раз.');
        }
    }
}
