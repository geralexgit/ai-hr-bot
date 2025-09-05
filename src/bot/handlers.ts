import TelegramBot, { Message, CallbackQuery } from 'node-telegram-bot-api';
import { OllamaService } from '../services/ollama.service.js';
import { ConversationService } from '../services/conversation.service.js';
import { VacancyRepository } from '../repositories/VacancyRepository.js';
import { CandidateRepository } from '../repositories/CandidateRepository.js';
import { UserState } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { convertInputToJSON } from '../utils/convertInputToJSON.js';

export class BotHandlers {
    private userStates = new Map<number, UserState>();
    private vacancyRepository = new VacancyRepository();
    private candidateRepository = new CandidateRepository();

    constructor(
        private bot: TelegramBot,
        private ollamaService: OllamaService,
        private conversationService: ConversationService
    ) { }

    setupHandlers(): void {
        this.bot.onText(/\/start/, this.handleStart.bind(this));
        this.bot.onText(/\/help/, this.handleHelp.bind(this));
        this.bot.onText(/\/clear/, this.handleClear.bind(this));
        this.bot.on('callback_query', this.handleCallbackQuery.bind(this));
        this.bot.on('message', this.handleMessage.bind(this));
    }

    private async handleStart(msg: Message): Promise<void> {
        const chatId = msg.chat.id;
        const userName = msg.from?.first_name || 'User';

        logger.info('New user started bot', { chatId, userName });

        // Initialize or reset user state
        this.userStates.set(chatId, {
            stage: 'selecting_vacancy',
            questionCount: 0,
            lastActivity: new Date()
        });

        // Register or update candidate in database
        if (msg.from) {
            await this.registerCandidate(msg.from);
        }

        try {
            // Get active vacancies
            const activeVacancies = await this.vacancyRepository.findActive();
            
            if (activeVacancies.length === 0) {
                this.bot.sendMessage(chatId, `Привет, ${userName}! К сожалению, в данный момент нет активных вакансий. Попробуйте позже.`);
                return;
            }

            // Create inline keyboard with vacancy buttons
            const keyboard = {
                inline_keyboard: activeVacancies.map(vacancy => [{
                    text: vacancy.title,
                    callback_data: `vacancy_${vacancy.id}`
                }])
            };

            this.bot.sendMessage(chatId, 
                `Привет, ${userName}! Я HR-ассистент. Выберите вакансию, которая вас интересует:`, 
                { reply_markup: keyboard }
            );

        } catch (error) {
            logger.error('Error loading vacancies', { chatId, error });
            this.bot.sendMessage(chatId, 'Произошла ошибка при загрузке вакансий. Попробуйте позже.');
        }
    }

    private async registerCandidate(user: any): Promise<void> {
        try {
            const existingCandidate = await this.candidateRepository.findByTelegramUserId(user.id);
            
            if (!existingCandidate) {
                await this.candidateRepository.create({
                    telegramUserId: user.id,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    username: user.username
                });
                logger.info('New candidate registered', { telegramUserId: user.id });
            } else {
                // Update candidate info if needed
                await this.candidateRepository.update(existingCandidate.id, {
                    firstName: user.first_name,
                    lastName: user.last_name,
                    username: user.username
                });
            }
        } catch (error) {
            logger.error('Error registering candidate', { telegramUserId: user.id, error });
        }
    }

    private async handleCallbackQuery(callbackQuery: CallbackQuery): Promise<void> {
        const chatId = callbackQuery.message?.chat.id;
        const data = callbackQuery.data;

        if (!chatId || !data) return;

        // Answer callback query to remove loading state
        await this.bot.answerCallbackQuery(callbackQuery.id);

        if (data.startsWith('vacancy_')) {
            const vacancyId = parseInt(data.replace('vacancy_', ''));
            await this.handleVacancySelection(chatId, vacancyId, callbackQuery.from);
        }
    }

    private async handleVacancySelection(chatId: number, vacancyId: number, user: any): Promise<void> {
        try {
            const vacancy = await this.vacancyRepository.findById(vacancyId);
            
            if (!vacancy) {
                this.bot.sendMessage(chatId, 'Вакансия не найдена. Попробуйте выбрать другую.');
                return;
            }

            // Update user state
            const userState = this.userStates.get(chatId) || {
                stage: 'selecting_vacancy',
                questionCount: 0,
                lastActivity: new Date()
            };

            userState.currentVacancyId = vacancyId;
            userState.stage = 'interviewing';
            userState.questionCount = 0;
            userState.lastActivity = new Date();
            this.userStates.set(chatId, userState);

            // Clear previous conversation history for this vacancy
            await this.conversationService.clearHistory(chatId, vacancyId);

            // Send vacancy info and start interview
            const message = `Отлично! Вы выбрали вакансию: "${vacancy.title}"

${vacancy.description}

Теперь давайте проведем интервью. Расскажите о себе и своем опыте работы.`;

            this.bot.sendMessage(chatId, message);
            
            logger.info('Vacancy selected, interview started', { 
                chatId, 
                vacancyId, 
                vacancyTitle: vacancy.title 
            });

        } catch (error) {
            logger.error('Error handling vacancy selection', { chatId, vacancyId, error });
            this.bot.sendMessage(chatId, 'Произошла ошибка при выборе вакансии. Попробуйте еще раз.');
        }
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

        // Check user state
        const userState = this.userStates.get(chatId);
        
        if (!userState || userState.stage === 'selecting_vacancy') {
            this.bot.sendMessage(chatId, 'Пожалуйста, сначала выберите вакансию с помощью команды /start');
            return;
        }

        logger.info('Received message', { chatId, textLength: text.length, vacancyId: userState.currentVacancyId });

        await this.bot.sendChatAction(chatId, 'typing');

        try {
            if (text.includes('Вакансия:') && text.includes('Резюме:')) {
                await this.handleResumeAnalysis(chatId, text);
            } else {
                await this.handleChat(chatId, text, msg.from, userState);
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

    private isValidJSON(str: string): boolean {
        try {
            JSON.parse(str);
            return true;
        } catch {
            return false;
        }
    }

    private toFlatString(input: Record<string, string> | string): string {
        if (this.isValidJSON(String(input))) {
            return Object.values(convertInputToJSON(input)).join(" ");
        }
        return String(input);
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

    private async handleChat(chatId: number, message: string, user?: any, userState?: UserState): Promise<void> {
        logger.info('Processing chat message', { chatId, vacancyId: userState?.currentVacancyId });

        if (!userState?.currentVacancyId) {
            this.bot.sendMessage(chatId, 'Пожалуйста, сначала выберите вакансию с помощью команды /start');
            return;
        }

        // Update question count
        userState.questionCount++;
        userState.lastActivity = new Date();
        this.userStates.set(chatId, userState);

        await this.conversationService.addMessage(chatId, 'user', message, user, userState.currentVacancyId);
        const conversationContext = await this.conversationService.getContextString(chatId, 10, userState.currentVacancyId);

        // Get vacancy information for context
        let vacancyContext = '';
        try {
            const vacancy = await this.vacancyRepository.findById(userState.currentVacancyId);
            if (vacancy) {
                vacancyContext = `
Вакансия: ${vacancy.title}
Описание: ${vacancy.description}
Требования: ${JSON.stringify(vacancy.requirements, null, 2)}
Веса оценки: технические навыки ${vacancy.evaluationWeights.technicalSkills}%, коммуникация ${vacancy.evaluationWeights.communication}%, решение задач ${vacancy.evaluationWeights.problemSolving}%
`;
            }
        } catch (error) {
            logger.error('Error loading vacancy context', { vacancyId: userState.currentVacancyId, error });
        }

        const prompt = `
Ты — HR-ассистент, проводящий интервью с кандидатом.

${vacancyContext}

Контекст разговора:
${conversationContext}

Номер вопроса: ${userState.questionCount}

Твоя задача:
1. Проанализируй ответ кандидата в контексте конкретной вакансии
2. Оцени соответствие требованиям вакансии
3. Задай следующий уместный вопрос или дай обратную связь (не повторяйся)
4. Будь дружелюбным, но профессиональным
5. На 5-м вопросе вежливо попрощайся и дай финальную обратную связь
6. Если это уже 6+ вопрос, вежливо отвечай что интервью закончилось

ВАЖНО: Верни ответ строго ТОЛЬКО в JSON формате с двумя полями:
{
  "feedback": "конструктивная обратная связь для кандидата",
  "next_question": "следующий вопрос для кандидата или пустая строка если интервью закончено"
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

            await this.conversationService.addMessage(chatId, 'ai', rawOutput, user, userState.currentVacancyId);

            // Check if interview is completed
            if (userState.questionCount >= 5) {
                userState.stage = 'completed';
                this.userStates.set(chatId, userState);
            }

            stopTyping();
            await this.bot.sendMessage(chatId, this.toFlatString(responseText));
            logger.info('Chat message processed', { chatId, questionCount: userState.questionCount });
        } catch (error) {
            stopTyping();
            logger.error('Error in chat processing', { chatId, error });
            this.bot.sendMessage(chatId, 'Ошибка при обработке сообщения. Попробуйте еще раз.');
        }
    }
}
