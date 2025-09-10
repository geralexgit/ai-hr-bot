import TelegramBot, { Message, CallbackQuery } from 'node-telegram-bot-api';
import { LLMService } from '../services/llm.service.js';
import { ConversationService } from '../services/conversation.service.js';
import { FileStorageService } from '../services/file-storage.service.js';
import { EvaluationService } from '../services/evaluation.service.js';
import { PromptService } from '../services/prompt.service.js';
import { InterviewResultsService } from '../services/interview-results.service.js';
import { i18nService } from '../services/i18n.service.js';
import { VacancyRepository } from '../repositories/VacancyRepository.js';
import { CandidateRepository } from '../repositories/CandidateRepository.js';
import { UserState } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { convertInputToJSON } from '../utils/convertInputToJSON.js';

export class BotHandlers {
    private userStates = new Map<number, UserState>();
    private vacancyRepository = new VacancyRepository();
    private candidateRepository = new CandidateRepository();
    private fileStorageService = new FileStorageService();
    private evaluationService = new EvaluationService();
    private promptService = new PromptService();
    private interviewResultsService = new InterviewResultsService();

    constructor(
        private bot: TelegramBot,
        private llmService: LLMService,
        private conversationService: ConversationService
    ) {
        // Initialize i18n with Russian as default
        i18nService.initialize('ru').catch(err => {
            logger.error('Failed to initialize i18n service', { error: err });
        });

        // Add global error handler for the bot
        this.bot.on('error', (error) => {
            logger.error('Telegram Bot API error', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                timestamp: new Date().toISOString()
            });
        });

        // Add polling error handler
        this.bot.on('polling_error', (error) => {
            logger.error('Telegram Bot polling error', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                timestamp: new Date().toISOString()
            });
        });
    }

    setupHandlers(): void {
        this.bot.onText(/\/start/, this.handleStart.bind(this));
        this.bot.onText(/\/help/, this.handleHelp.bind(this));
        this.bot.onText(/\/clear/, this.handleClear.bind(this));
        this.bot.on('callback_query', this.handleCallbackQuery.bind(this));
        this.bot.on('document', this.handleDocument.bind(this));
        this.bot.on('message', this.handleMessage.bind(this));
    }

    private async handleStart(msg: Message): Promise<void> {
        const chatId = msg.chat.id;
        const userName = msg.from?.first_name || 'User';
        const userId = msg.from?.id;
        const userInfo = {
            id: userId,
            firstName: msg.from?.first_name,
            lastName: msg.from?.last_name,
            username: msg.from?.username,
            languageCode: msg.from?.language_code
        };

        logger.info('User initiated /start command', { 
            chatId, 
            userId,
            userName, 
            userInfo,
            messageId: msg.message_id,
            timestamp: new Date().toISOString()
        });

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
            logger.info('Loading active vacancies for user', { chatId, userId });
            const activeVacancies = await this.vacancyRepository.findActive();
            
            logger.info('Active vacancies loaded', { 
                chatId, 
                userId,
                vacancyCount: activeVacancies.length,
                vacancies: activeVacancies.map(v => ({ id: v.id, title: v.title }))
            });
            
            if (activeVacancies.length === 0) {
                logger.warn('No active vacancies available for user', { chatId, userId });
                this.bot.sendMessage(chatId, i18nService.t('no_vacancies'));
                return;
            }

            // Create inline keyboard with vacancy buttons
            const keyboard = {
                inline_keyboard: activeVacancies.map(vacancy => [{
                    text: vacancy.title,
                    callback_data: `vacancy_${vacancy.id}`
                }])
            };

            logger.info('Sending greeting with vacancy selection', { 
                chatId, 
                userId,
                keyboardOptions: activeVacancies.length
            });
            
            this.bot.sendMessage(chatId, 
                i18nService.t('greeting', { name: userName }), 
                { reply_markup: keyboard }
            );

        } catch (error) {
            logger.error('Error in /start command execution', { 
                chatId, 
                userId,
                userName,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            this.bot.sendMessage(chatId, i18nService.t('error_loading_vacancies'));
        }
    }

    private async registerCandidate(user: any): Promise<void> {
        const userInfo = {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            username: user.username
        };
        
        logger.info('Starting candidate registration process', { 
            telegramUserId: user.id,
            userInfo,
            timestamp: new Date().toISOString()
        });
        
        try {
            const existingCandidate = await this.candidateRepository.findByTelegramUserId(user.id);
            
            if (!existingCandidate) {
                logger.info('Creating new candidate record', { 
                    telegramUserId: user.id,
                    userInfo
                });
                
                await this.candidateRepository.create({
                    telegramUserId: user.id,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    username: user.username
                });
                
                logger.info('New candidate registered successfully', { 
                    telegramUserId: user.id,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    username: user.username
                });
            } else {
                logger.info('Updating existing candidate record', { 
                    telegramUserId: user.id,
                    candidateId: existingCandidate.id,
                    userInfo
                });
                
                // Update candidate info if needed
                await this.candidateRepository.update(existingCandidate.id, {
                    firstName: user.first_name,
                    lastName: user.last_name,
                    username: user.username
                });
                
                logger.info('Existing candidate updated successfully', { 
                    telegramUserId: user.id,
                    candidateId: existingCandidate.id
                });
            }
        } catch (error) {
            logger.error('Error during candidate registration process', { 
                telegramUserId: user.id, 
                userInfo,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
        }
    }

    private async handleCallbackQuery(callbackQuery: CallbackQuery): Promise<void> {
        const chatId = callbackQuery.message?.chat.id;
        const data = callbackQuery.data;
        const userId = callbackQuery.from?.id;
        const userInfo = {
            firstName: callbackQuery.from?.first_name,
            lastName: callbackQuery.from?.last_name,
            username: callbackQuery.from?.username
        };

        logger.info('Callback query received', { 
            chatId, 
            userId,
            userInfo,
            callbackData: data,
            callbackQueryId: callbackQuery.id,
            timestamp: new Date().toISOString()
        });

        try {
            if (!chatId || !data) {
                logger.warn('Invalid callback query - missing chatId or data', { 
                    chatId, 
                    userId,
                    data,
                    callbackQueryId: callbackQuery.id
                });
                await this.bot.answerCallbackQuery(callbackQuery.id, {
                    text: 'Invalid request. Please try again.',
                    show_alert: true
                });
                return;
            }

            // Answer callback query to remove loading state
            await this.bot.answerCallbackQuery(callbackQuery.id);
            logger.info('Callback query answered', { chatId, userId, callbackQueryId: callbackQuery.id });

            if (data.startsWith('vacancy_')) {
                const vacancyId = parseInt(data.replace('vacancy_', ''));
                
                if (isNaN(vacancyId)) {
                    logger.warn('Invalid vacancy ID in callback data', { 
                        chatId, 
                        userId,
                        rawData: data,
                        parsedVacancyId: vacancyId
                    });
                    this.bot.sendMessage(chatId, i18nService.t('vacancy_not_found'));
                    return;
                }

                logger.info('Processing vacancy selection from callback', { 
                    chatId, 
                    userId,
                    vacancyId,
                    rawData: data
                });
                
                await this.handleVacancySelection(chatId, vacancyId, callbackQuery.from);
            } else {
                logger.warn('Unknown callback query data format', { 
                    chatId, 
                    userId,
                    data,
                    callbackQueryId: callbackQuery.id
                });
                this.bot.sendMessage(chatId, 'Unknown action. Please use /start to see available options.');
            }
        } catch (error) {
            logger.error('Error in callback query handler', {
                chatId,
                userId,
                callbackData: data,
                callbackQueryId: callbackQuery.id,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });

            // Try to answer the callback query even if there was an error
            try {
                await this.bot.answerCallbackQuery(callbackQuery.id, {
                    text: 'An error occurred. Please try again.',
                    show_alert: true
                });
            } catch (answerError) {
                logger.error('Failed to answer callback query after error', {
                    callbackQueryId: callbackQuery.id,
                    error: answerError instanceof Error ? answerError.message : String(answerError)
                });
            }

            // Send error message to user if we have a valid chatId
            if (chatId) {
                try {
                    this.bot.sendMessage(chatId, i18nService.t('error_vacancy_selection'));
                } catch (sendError) {
                    logger.error('Failed to send error message to user', {
                        chatId,
                        error: sendError instanceof Error ? sendError.message : String(sendError)
                    });
                }
            }
        }
    }

    private async handleVacancySelection(chatId: number, vacancyId: number, user: any): Promise<void> {
        const userId = user?.id;
        const userInfo = {
            firstName: user?.first_name,
            lastName: user?.last_name,
            username: user?.username
        };
        
        logger.info('Processing vacancy selection', { 
            chatId, 
            userId,
            userInfo,
            vacancyId,
            timestamp: new Date().toISOString()
        });
        
        try {
            const vacancy = await this.vacancyRepository.findById(vacancyId);
            
            if (!vacancy) {
                logger.warn('Vacancy not found during selection', { chatId, userId, vacancyId });
                this.bot.sendMessage(chatId, i18nService.t('vacancy_not_found'));
                return;
            }

            logger.info('Vacancy found, proceeding with selection', { 
                chatId, 
                userId,
                vacancyId,
                vacancyTitle: vacancy.title,
                vacancyDescription: vacancy.description?.substring(0, 100) + '...' // Truncated for logging
            });

            // Update user state
            const previousState = this.userStates.get(chatId);
            const userState = previousState || {
                stage: 'selecting_vacancy',
                questionCount: 0,
                lastActivity: new Date()
            };

            logger.info('Previous user state', { 
                chatId, 
                userId,
                previousState: {
                    stage: previousState?.stage,
                    currentVacancyId: previousState?.currentVacancyId,
                    questionCount: previousState?.questionCount
                }
            });

            userState.currentVacancyId = vacancyId;
            userState.stage = 'interviewing';
            userState.questionCount = 0;
            userState.lastActivity = new Date();
            this.userStates.set(chatId, userState);

            logger.info('User state updated for interview', { 
                chatId, 
                userId,
                newState: {
                    stage: userState.stage,
                    currentVacancyId: userState.currentVacancyId,
                    questionCount: userState.questionCount
                }
            });

            // Clear previous conversation history for this vacancy
            logger.info('Clearing previous conversation history', { chatId, userId, vacancyId });
            await this.conversationService.clearHistory(chatId, vacancyId);

            // Start interview result tracking
            logger.info('Starting interview tracking', { chatId, userId, vacancyId });
            await this.interviewResultsService.startInterview(chatId, vacancyId);

            // Send vacancy info and start interview
            const message = i18nService.t('vacancy_selected', { 
                title: vacancy.title, 
                description: vacancy.description 
            });

            this.bot.sendMessage(chatId, message);
            
            logger.info('Vacancy selection completed successfully', { 
                chatId, 
                userId,
                vacancyId, 
                vacancyTitle: vacancy.title,
                interviewStarted: true
            });

        } catch (error) {
            logger.error('Error during vacancy selection process', { 
                chatId, 
                userId,
                vacancyId, 
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            this.bot.sendMessage(chatId, i18nService.t('error_vacancy_selection'));
        }
    }

    private handleHelp(msg: Message): void {
        const chatId = msg.chat.id;
        const userId = msg.from?.id;
        const userInfo = {
            firstName: msg.from?.first_name,
            lastName: msg.from?.last_name,
            username: msg.from?.username
        };

        logger.info('User requested /help command', { 
            chatId, 
            userId,
            userInfo,
            messageId: msg.message_id,
            timestamp: new Date().toISOString()
        });

        const helpMessage = `${i18nService.t('help_title')}

${i18nService.t('help_features')}

${i18nService.t('help_usage')}

${i18nService.t('help_commands')}`;

        this.bot.sendMessage(chatId, helpMessage);
        
        logger.info('Help message sent to user', { chatId, userId });
    }

    private async handleClear(msg: Message): Promise<void> {
        const chatId = msg.chat.id;
        const userId = msg.from?.id;
        const userInfo = {
            firstName: msg.from?.first_name,
            lastName: msg.from?.last_name,
            username: msg.from?.username
        };

        logger.info('User initiated /clear command', { 
            chatId, 
            userId,
            userInfo,
            messageId: msg.message_id,
            timestamp: new Date().toISOString()
        });

        // Get current user state
        const userState = this.userStates.get(chatId);
        
        logger.info('Current user state before clearing', { 
            chatId, 
            userId,
            userState: {
                stage: userState?.stage,
                currentVacancyId: userState?.currentVacancyId,
                questionCount: userState?.questionCount,
                lastActivity: userState?.lastActivity
            }
        });
        
        // Cancel interview if in progress
        if (userState?.currentVacancyId && userState.stage === 'interviewing') {
            logger.info('Cancelling active interview', { 
                chatId, 
                userId,
                vacancyId: userState.currentVacancyId,
                questionCount: userState.questionCount
            });
            
            await this.interviewResultsService.cancelInterview(
                chatId, 
                userState.currentVacancyId, 
                'Interview cancelled by user command'
            );
            
            logger.info('Interview cancelled successfully', { 
                chatId, 
                userId,
                vacancyId: userState.currentVacancyId
            });
        }

        // Clear user state
        this.userStates.delete(chatId);
        logger.info('User state cleared from memory', { chatId, userId });

        await this.conversationService.clearHistory(chatId);
        logger.info('Conversation history cleared from database', { chatId, userId });

        this.bot.sendMessage(chatId, i18nService.t('history_cleared'));
        
        logger.info('/clear command completed successfully', { chatId, userId });
    }

    private async handleDocument(msg: Message): Promise<void> {
        const chatId = msg.chat.id;
        const document = msg.document;
        const userId = msg.from?.id;
        const userInfo = {
            firstName: msg.from?.first_name,
            lastName: msg.from?.last_name,
            username: msg.from?.username
        };

        logger.info('Document upload initiated', { 
            chatId, 
            userId,
            userInfo,
            messageId: msg.message_id,
            timestamp: new Date().toISOString()
        });

        if (!document) {
            logger.warn('Document upload failed - no document in message', { chatId, userId });
            return;
        }

        logger.info('Document details received', { 
            chatId, 
            userId,
            fileName: document.file_name,
            fileId: document.file_id,
            fileSize: document.file_size,
            mimeType: document.mime_type
        });

        // Check user state
        const userState = this.userStates.get(chatId);
        
        logger.info('Checking user state for document upload', { 
            chatId, 
            userId,
            userState: {
                stage: userState?.stage,
                currentVacancyId: userState?.currentVacancyId,
                questionCount: userState?.questionCount
            }
        });
        
        if (!userState || userState.stage === 'selecting_vacancy') {
            logger.warn('Document upload rejected - user must select vacancy first', { chatId, userId });
            this.bot.sendMessage(chatId, 'Пожалуйста, сначала выберите вакансию с помощью команды /start');
            return;
        }

        if (!userState.currentVacancyId) {
            logger.warn('Document upload rejected - no current vacancy ID', { chatId, userId });
            this.bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, выберите вакансию заново с помощью /start');
            return;
        }

        logger.info('Document upload validation passed', { 
            chatId, 
            userId,
            fileName: document.file_name, 
            fileSize: document.file_size,
            vacancyId: userState.currentVacancyId 
        });

        await this.bot.sendChatAction(chatId, 'upload_document');
        logger.info('Upload document chat action sent', { chatId, userId });

        try {
            logger.info('Starting document validation', { chatId, userId, fileName: document.file_name });
            
            // Validate file
            if (!document.file_name) {
                logger.warn('Document validation failed - no file name', { chatId, userId, fileId: document.file_id });
                this.bot.sendMessage(chatId, 'Не удалось получить имя файла. Попробуйте загрузить файл заново.');
                return;
            }

            if (document.file_size && document.file_size > 10 * 1024 * 1024) {
                logger.warn('Document validation failed - file too large', { 
                    chatId, 
                    userId,
                    fileName: document.file_name,
                    fileSize: document.file_size,
                    maxSize: 10 * 1024 * 1024
                });
                this.bot.sendMessage(chatId, 'Файл слишком большой. Максимальный размер: 10MB');
                return;
            }
            
            logger.info('Document validation passed', { 
                chatId, 
                userId,
                fileName: document.file_name,
                fileSize: document.file_size
            });

            // Get candidate
            logger.info('Looking up candidate in database', { chatId, userId });
            const candidate = await this.candidateRepository.findByTelegramUserId(msg.from?.id || 0);
            if (!candidate) {
                logger.error('Candidate not found in database', { chatId, userId: msg.from?.id });
                this.bot.sendMessage(chatId, 'Произошла ошибка при определении пользователя. Попробуйте /start');
                return;
            }
            
            logger.info('Candidate found in database', { 
                chatId, 
                userId,
                candidateId: candidate.id,
                candidateName: `${candidate.firstName} ${candidate.lastName}`.trim()
            });

            // Download and store file
            logger.info('Starting file download and storage', { 
                chatId, 
                userId,
                fileId: document.file_id,
                fileName: document.file_name,
                candidateId: candidate.id
            });
            
            const fileResult = await this.fileStorageService.downloadTelegramFile(
                this.bot,
                document.file_id,
                document.file_name,
                candidate.id
            );
            
            logger.info('File downloaded and stored successfully', { 
                chatId, 
                userId,
                candidateId: candidate.id,
                filePath: fileResult.filePath,
                fileName: fileResult.fileName,
                fileSize: fileResult.fileSize
            });

            // Update candidate with CV info
            logger.info('Updating candidate record with CV information', { 
                chatId, 
                userId,
                candidateId: candidate.id,
                cvFileName: fileResult.fileName,
                cvFileSize: fileResult.fileSize
            });
            
            await this.candidateRepository.update(candidate.id, {
                cvFilePath: fileResult.filePath,
                cvFileName: fileResult.fileName,
                cvFileSize: fileResult.fileSize,
                cvUploadedAt: new Date()
            });
            
            logger.info('Candidate record updated with CV info', { chatId, userId, candidateId: candidate.id });

            // Store in dialogue history
            const telegramUser = msg.from ? {
                id: msg.from.id,
                first_name: msg.from.first_name,
                ...(msg.from.last_name && { last_name: msg.from.last_name }),
                ...(msg.from.username && { username: msg.from.username })
            } : undefined;

            logger.info('Adding document upload to conversation history', { 
                chatId, 
                userId,
                vacancyId: userState.currentVacancyId,
                fileName: document.file_name
            });

            await this.conversationService.addMessage(
                chatId, 
                'user', 
                `Загружено резюме: ${document.file_name}`,
                telegramUser,
                userState.currentVacancyId,
                'document',
                undefined,
                fileResult.filePath,
                fileResult.fileName,
                fileResult.fileSize
            );
            
            logger.info('Document upload message added to conversation history', { chatId, userId });

            // Try to extract file content for analysis
            logger.info('Attempting to extract file content for analysis', { 
                chatId, 
                userId,
                filePath: fileResult.filePath,
                fileName: fileResult.fileName
            });
            
            let fileContent = '';
            try {
                fileContent = await this.fileStorageService.getFileContent(fileResult.filePath);
                logger.info('File content extracted successfully', { 
                    chatId, 
                    userId,
                    contentLength: fileContent.length,
                    contentPreview: fileContent.substring(0, 200) + '...'
                });
            } catch (error) {
                logger.warn('Could not extract file content for analysis', { 
                    chatId, 
                    userId,
                    filePath: fileResult.filePath, 
                    error: error instanceof Error ? error.message : String(error)
                });
            }

            // Analyze the uploaded CV
            logger.info('Starting CV analysis', { 
                chatId, 
                userId,
                fileName: document.file_name,
                hasContent: fileContent.length > 0
            });
            
            await this.analyzeUploadedCV(chatId, fileContent, document.file_name, userState);

        } catch (error) {
            logger.error('Error during document upload processing', { 
                chatId, 
                userId,
                fileName: document.file_name,
                fileSize: document.file_size,
                vacancyId: userState?.currentVacancyId,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            
            if (error instanceof Error) {
                if (error.message.includes('File extension') || error.message.includes('not allowed')) {
                    logger.warn('Document upload failed - unsupported file format', { 
                        chatId, 
                        userId,
                        fileName: document.file_name,
                        errorMessage: error.message
                    });
                    this.bot.sendMessage(chatId, 'Неподдерживаемый формат файла. Поддерживаются: PDF, DOC, DOCX, TXT');
                } else if (error.message.includes('File size')) {
                    logger.warn('Document upload failed - file too large', { 
                        chatId, 
                        userId,
                        fileName: document.file_name,
                        fileSize: document.file_size,
                        errorMessage: error.message
                    });
                    this.bot.sendMessage(chatId, 'Файл слишком большой. Максимальный размер: 10MB');
                } else {
                    logger.error('Document upload failed - unexpected error', { 
                        chatId, 
                        userId,
                        fileName: document.file_name,
                        errorMessage: error.message
                    });
                    this.bot.sendMessage(chatId, 'Произошла ошибка при загрузке файла. Попробуйте еще раз.');
                }
            } else {
                logger.error('Document upload failed - unknown error type', { 
                    chatId, 
                    userId,
                    fileName: document.file_name,
                    error: String(error)
                });
                this.bot.sendMessage(chatId, 'Произошла ошибка при загрузке файла. Попробуйте еще раз.');
            }
        }
    }

    private async analyzeUploadedCV(chatId: number, fileContent: string, fileName: string, userState: UserState): Promise<void> {
        logger.info('Starting CV analysis process', { 
            chatId, 
            fileName,
            fileContentLength: fileContent.length,
            hasContent: fileContent.length > 0,
            vacancyId: userState.currentVacancyId,
            timestamp: new Date().toISOString()
        });
        
        const stopTyping = this.startTypingIndicator(chatId);
        logger.info('Typing indicator started for CV analysis', { chatId });

        try {
            // Get vacancy information for context
            logger.info('Loading vacancy context for CV analysis', { 
                chatId, 
                vacancyId: userState.currentVacancyId
            });
            
            let vacancyContext = '';
            try {
                const vacancy = await this.vacancyRepository.findById(userState.currentVacancyId!);
                if (vacancy) {
                    vacancyContext = `
Вакансия: ${vacancy.title}
Описание: ${vacancy.description}
Требования: ${JSON.stringify(vacancy.requirements, null, 2)}
Веса оценки: технические навыки ${vacancy.evaluationWeights.technicalSkills}%, коммуникация ${vacancy.evaluationWeights.communication}%, решение задач ${vacancy.evaluationWeights.problemSolving}%
`;
                    
                    logger.info('Vacancy context loaded for CV analysis', { 
                        chatId, 
                        vacancyId: userState.currentVacancyId,
                        vacancyTitle: vacancy.title,
                        contextLength: vacancyContext.length
                    });
                } else {
                    logger.warn('Vacancy not found for CV analysis', { 
                        chatId, 
                        vacancyId: userState.currentVacancyId
                    });
                }
            } catch (error) {
                logger.error('Error loading vacancy context for CV analysis', { 
                    chatId,
                    vacancyId: userState.currentVacancyId, 
                    error: error instanceof Error ? error.message : String(error)
                });
            }

            logger.info('Preparing CV analysis prompt', { 
                chatId, 
                fileName,
                hasVacancyContext: vacancyContext.length > 0,
                hasFileContent: fileContent.length > 0
            });
            
            const prompt = await this.promptService.getRenderedPrompt('cv_analysis', {
                vacancy_context: vacancyContext,
                file_name: fileName,
                file_content: fileContent || '[Содержимое файла не удалось извлечь, но файл был загружен]'
            });
            
            logger.info('CV analysis prompt prepared, sending to LLM', { 
                chatId, 
                promptLength: prompt.length
            });

            const rawOutput = await this.llmService.generate(prompt);
            
            logger.info('LLM response received for CV analysis', { 
                chatId, 
                responseLength: rawOutput.length
            });
            let responseText: string;

            try {
                const data = JSON.parse(rawOutput.replace(/```json|```/g, '').trim());
                responseText = `📄 Анализ вашего резюме:

${data.analysis || 'Резюме получено и проанализировано.'}

✅ Сильные стороны:
${data.strengths || 'Анализ в процессе...'}

⚠️ Области для обсуждения:
${data.gaps || 'Будем обсуждать в ходе интервью.'}

❓ Первый вопрос:
${data.first_question || 'Расскажите подробнее о своем опыте работы.'}`;
            } catch (error) {
                // Fallback if JSON parsing fails
                responseText = `📄 Ваше резюме успешно загружено и проанализировано!

Файл: ${fileName}

Теперь давайте проведем интервью на основе вашего резюме. Расскажите подробнее о своем опыте работы и ключевых достижениях.`;
            }

            // Store the AI response
            await this.conversationService.addMessage(chatId, 'ai', responseText, undefined, userState.currentVacancyId);

            // Update user state
            userState.questionCount++;
            userState.lastActivity = new Date();
            this.userStates.set(chatId, userState);

            stopTyping();
            logger.info('Sending CV analysis response to user', { chatId, responseLength: responseText.length });
            
            await this.bot.sendMessage(chatId, responseText);
            
            logger.info('CV analysis completed successfully', { 
                chatId, 
                fileName, 
                vacancyId: userState.currentVacancyId,
                responseLength: responseText.length,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            stopTyping();
            logger.error('Error during CV analysis process', { 
                chatId, 
                fileName, 
                vacancyId: userState.currentVacancyId,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            
            const fallbackMessage = `📄 Ваше резюме успешно загружено!

Файл: ${fileName}

К сожалению, не удалось выполнить автоматический анализ, но мы можем продолжить интервью. Расскажите о своем опыте работы и ключевых навыках.`;
            
            await this.conversationService.addMessage(chatId, 'ai', fallbackMessage, undefined, userState.currentVacancyId);
            this.bot.sendMessage(chatId, fallbackMessage);
        }
    }

    private async handleMessage(msg: Message): Promise<void> {
        const chatId = msg.chat.id;
        const text = msg.text;
        const userId = msg.from?.id;
        const userInfo = {
            firstName: msg.from?.first_name,
            lastName: msg.from?.last_name,
            username: msg.from?.username
        };

        logger.info('Message received for processing', { 
            chatId, 
            userId,
            userInfo,
            messageId: msg.message_id,
            hasText: !!text,
            textLength: text?.length || 0,
            textPreview: text?.substring(0, 100) + (text && text.length > 100 ? '...' : ''),
            timestamp: new Date().toISOString()
        });

        if (!text || text.startsWith('/')) {
            logger.info('Message ignored - no text or is command', { 
                chatId, 
                userId,
                hasText: !!text,
                isCommand: text?.startsWith('/')
            });
            return;
        }

        // Check user state
        const userState = this.userStates.get(chatId);
        
        logger.info('Checking user state for message processing', { 
            chatId, 
            userId,
            userState: {
                stage: userState?.stage,
                currentVacancyId: userState?.currentVacancyId,
                questionCount: userState?.questionCount,
                lastActivity: userState?.lastActivity
            }
        });
        
        if (!userState || userState.stage === 'selecting_vacancy') {
            logger.warn('Message rejected - user must select vacancy first', { 
                chatId, 
                userId,
                currentStage: userState?.stage || 'no_state'
            });
            this.bot.sendMessage(chatId, 'Пожалуйста, сначала выберите вакансию с помощью команды /start');
            return;
        }

        logger.info('Message processing approved', { 
            chatId, 
            userId,
            textLength: text.length, 
            vacancyId: userState.currentVacancyId,
            currentQuestionCount: userState.questionCount
        });

        // Start typing indicator
        const stopTyping = this.startTypingIndicator(chatId);

        try {
            // Determine message type and route accordingly
            const isResumeAnalysis = text.includes('Вакансия:') && text.includes('Резюме:');
            
            logger.info('Determining message processing route', { 
                chatId, 
                userId,
                isResumeAnalysis,
                messageType: isResumeAnalysis ? 'resume_analysis' : 'chat'
            });
            
            if (isResumeAnalysis) {
                logger.info('Processing as resume analysis message', { chatId, userId });
                await this.handleResumeAnalysis(chatId, text);
            } else {
                logger.info('Processing as chat message', { 
                    chatId, 
                    userId,
                    vacancyId: userState.currentVacancyId
                });
                await this.handleChat(chatId, text, msg.from, userState);
            }
        } catch (error) {
            logger.error('Error during message processing', { 
                chatId, 
                userId,
                textLength: text.length,
                vacancyId: userState?.currentVacancyId,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            this.bot.sendMessage(chatId, 'Произошла ошибка при обработке сообщения. Попробуйте еще раз.');
        } finally {
            // Always stop typing indicator
            logger.info('Stopping typing indicator', { chatId, userId });
            stopTyping();
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
        logger.info('Starting resume analysis processing', { 
            chatId, 
            textLength: text.length,
            textPreview: text.substring(0, 200) + '...',
            timestamp: new Date().toISOString()
        });

        const jobDescriptionMatch = text.match(/Вакансия:\s*(.+?)(?=Резюме:|$)/s);
        const resumeMatch = text.match(/Резюме:\s*(.+)$/s);
        
        logger.info('Resume analysis text parsing results', { 
            chatId, 
            hasJobDescription: !!jobDescriptionMatch,
            hasResume: !!resumeMatch,
            jobDescriptionLength: jobDescriptionMatch?.[1]?.trim().length || 0,
            resumeLength: resumeMatch?.[1]?.trim().length || 0
        });

        if (!jobDescriptionMatch || !resumeMatch) {
            logger.warn('Resume analysis failed - invalid format', { 
                chatId, 
                hasJobDescription: !!jobDescriptionMatch,
                hasResume: !!resumeMatch
            });
            this.bot.sendMessage(chatId, 'Пожалуйста, укажите вакансию и резюме в формате:\nВакансия: [описание]\nРезюме: [текст]');
            return;
        }

        const jobDescription = jobDescriptionMatch[1]?.trim();
        const resume = resumeMatch[1]?.trim();

        if (!jobDescription || !resume) {
            logger.warn('Resume analysis failed - empty content', { 
                chatId, 
                jobDescriptionEmpty: !jobDescription,
                resumeEmpty: !resume
            });
            this.bot.sendMessage(chatId, 'Пожалуйста, укажите вакансию и резюме в формате:\nВакансия: [описание]\nРезюме: [текст]');
            return;
        }
        
        logger.info('Resume analysis content extracted successfully', { 
            chatId, 
            jobDescriptionLength: jobDescription.length,
            resumeLength: resume.length
        });

        const prompt = await this.promptService.getRenderedPrompt('resume_analysis', {
            job_description: jobDescription,
            resume: resume
        });

        logger.info('Sending resume analysis to LLM service', { chatId });
        
        try {
            const rawOutput = await this.llmService.generate(prompt);
            
            logger.info('LLM response received for resume analysis', { 
                chatId, 
                responseLength: rawOutput.length
            });
            
            let jsonOutput;

            try {
                jsonOutput = JSON.parse(rawOutput);
                logger.info('Resume analysis response parsed as JSON', { chatId });
            } catch (e) {
                logger.warn('Resume analysis response not valid JSON, using raw output', { 
                    chatId, 
                    parseError: e instanceof Error ? e.message : String(e)
                });
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

            logger.info('Sending resume analysis response to user', { 
                chatId, 
                responseLength: responseText.length
            });
            
            await this.bot.sendMessage(chatId, responseText);
            
            logger.info('Resume analysis completed successfully', { 
                chatId,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('Error during resume analysis processing', { 
                chatId, 
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                jobDescriptionLength: jobDescription.length,
                resumeLength: resume.length
            });
            this.bot.sendMessage(chatId, 'Ошибка при анализе резюме. Попробуйте еще раз.');
        }
    }

    private async handleChat(chatId: number, message: string, user?: any, userState?: UserState): Promise<void> {
        const userId = user?.id;
        const userInfo = {
            firstName: user?.first_name,
            lastName: user?.last_name,
            username: user?.username
        };
        
        logger.info('Starting chat message processing', { 
            chatId, 
            userId,
            userInfo,
            messageLength: message.length,
            messagePreview: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
            vacancyId: userState?.currentVacancyId,
            currentQuestionCount: userState?.questionCount,
            userStage: userState?.stage,
            timestamp: new Date().toISOString()
        });

        if (!userState?.currentVacancyId) {
            logger.warn('Chat processing failed - no current vacancy', { chatId, userId });
            this.bot.sendMessage(chatId, 'Пожалуйста, сначала выберите вакансию с помощью команды /start');
            return;
        }

        // Update question count
        const previousQuestionCount = userState.questionCount;
        userState.questionCount++;
        userState.lastActivity = new Date();
        this.userStates.set(chatId, userState);
        
        logger.info('Updated user state for chat processing', { 
            chatId, 
            userId,
            previousQuestionCount,
            newQuestionCount: userState.questionCount,
            vacancyId: userState.currentVacancyId
        });

        // Update interview progress
        logger.info('Updating interview progress', { 
            chatId, 
            userId,
            vacancyId: userState.currentVacancyId,
            questionCount: userState.questionCount
        });
        
        await this.interviewResultsService.updateProgress(chatId, userState.currentVacancyId, userState.questionCount);

        // Add user message to conversation history
        logger.info('Adding user message to conversation history', { 
            chatId, 
            userId,
            vacancyId: userState.currentVacancyId,
            messageLength: message.length
        });
        
        await this.conversationService.addMessage(chatId, 'user', message, user, userState.currentVacancyId);
        
        logger.info('Retrieving conversation context', { 
            chatId, 
            userId,
            vacancyId: userState.currentVacancyId,
            contextLimit: 10
        });
        
        const conversationContext = await this.conversationService.getContextString(chatId, 10, userState.currentVacancyId);

        // Get vacancy information for context
        logger.info('Loading vacancy context for prompt', { 
            chatId, 
            userId,
            vacancyId: userState.currentVacancyId
        });
        
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
                
                logger.info('Vacancy context loaded successfully', { 
                    chatId, 
                    userId,
                    vacancyId: userState.currentVacancyId,
                    vacancyTitle: vacancy.title,
                    contextLength: vacancyContext.length
                });
            } else {
                logger.warn('Vacancy not found when loading context', { 
                    chatId, 
                    userId,
                    vacancyId: userState.currentVacancyId
                });
            }
        } catch (error) {
            logger.error('Error loading vacancy context for chat processing', { 
                chatId, 
                userId,
                vacancyId: userState.currentVacancyId, 
                error: error instanceof Error ? error.message : String(error)
            });
        }

        logger.info('Preparing LLM prompt for chat processing', { 
            chatId, 
            userId,
            vacancyId: userState.currentVacancyId,
            questionCount: userState.questionCount,
            hasVacancyContext: vacancyContext.length > 0,
            conversationContextLength: conversationContext.length
        });
        
        const prompt = await this.promptService.getRenderedPrompt('interview_chat', {
            vacancy_context: vacancyContext,
            conversation_context: conversationContext,
            question_count: userState.questionCount,
            candidate_message: message
        });
        
        logger.info('Prompt prepared, starting LLM generation', { 
            chatId, 
            userId,
            promptLength: prompt.length
        });

        const stopTyping = this.startTypingIndicator(chatId);
        logger.info('Typing indicator started', { chatId, userId });

        try {
            logger.info('Sending request to LLM service', { chatId, userId });
            const rawOutput = await this.llmService.generate(prompt);
            
            logger.info('LLM response received', { 
                chatId, 
                userId,
                responseLength: rawOutput.length,
                responsePreview: rawOutput.substring(0, 200) + (rawOutput.length > 200 ? '...' : '')
            });
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

            // Store the formatted response in the database, not the raw JSON
            const formattedResponse = this.toFlatString(responseText);
            
            logger.info('Storing AI response in conversation history', { 
                chatId, 
                userId,
                vacancyId: userState.currentVacancyId,
                responseLength: formattedResponse.length
            });
            
            await this.conversationService.addMessage(chatId, 'ai', formattedResponse, user, userState.currentVacancyId);

            // Check if interview is completed
            const isInterviewComplete = userState.questionCount >= 5;
            
            logger.info('Checking interview completion status', { 
                chatId, 
                userId,
                vacancyId: userState.currentVacancyId,
                currentQuestionCount: userState.questionCount,
                requiredQuestions: 5,
                isComplete: isInterviewComplete
            });
            
            if (isInterviewComplete) {
                userState.stage = 'completed';
                this.userStates.set(chatId, userState);
                
                logger.info('Interview completed, updating user state', { 
                    chatId, 
                    userId,
                    vacancyId: userState.currentVacancyId,
                    finalQuestionCount: userState.questionCount,
                    newStage: 'completed'
                });

                // Stop typing before evaluation as it handles its own typing indicator
                stopTyping();
                logger.info('Typing indicator stopped before evaluation', { chatId, userId });

                // Trigger evaluation after interview completion
                logger.info('Starting evaluation generation process', { 
                    chatId, 
                    userId,
                    vacancyId: userState.currentVacancyId
                });
                
                try {
                    await this.generateAndSendEvaluation(chatId, userState.currentVacancyId!);
                } catch (error) {
                    logger.error('Error generating evaluation after interview completion', { 
                        chatId, 
                        userId,
                        vacancyId: userState.currentVacancyId, 
                        error: error instanceof Error ? error.message : String(error),
                        stack: error instanceof Error ? error.stack : undefined
                    });
                    // Don't let evaluation errors affect the main flow
                    await this.bot.sendMessage(chatId, 
                        'Интервью завершено! Мы обработаем ваши ответы и свяжемся с вами в ближайшее время.'
                    );
                }
            } else {
                logger.info('Interview continuing, sending response to user', { 
                    chatId, 
                    userId,
                    vacancyId: userState.currentVacancyId,
                    remainingQuestions: 5 - userState.questionCount
                });
                
                stopTyping();
                await this.bot.sendMessage(chatId, formattedResponse);
                
                logger.info('Response sent to user', { chatId, userId });
            }
            
            logger.info('Chat message processing completed successfully', { 
                chatId, 
                userId,
                vacancyId: userState.currentVacancyId,
                questionCount: userState.questionCount,
                isInterviewComplete
            });
        } catch (error) {
            stopTyping();
            logger.error('Error during chat message processing', { 
                chatId, 
                userId,
                vacancyId: userState?.currentVacancyId,
                questionCount: userState?.questionCount,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            this.bot.sendMessage(chatId, 'Ошибка при обработке сообщения. Попробуйте еще раз.');
        }
    }

    /**
     * Generate evaluation and send feedback to candidate
     */
    private async generateAndSendEvaluation(chatId: number, vacancyId: number): Promise<void> {
        // Extract user info from state if available
        const userState = this.userStates.get(chatId);
        
        logger.info('Starting evaluation generation process', { 
            chatId, 
            vacancyId,
            userState: {
                stage: userState?.stage,
                questionCount: userState?.questionCount,
                lastActivity: userState?.lastActivity
            },
            timestamp: new Date().toISOString()
        });
        
        const stopTyping = this.startTypingIndicator(chatId);
        logger.info('Typing indicator started for evaluation', { chatId, vacancyId });

        try {
            logger.info('Preparing evaluation data', { chatId, vacancyId });

            // Get user state for session data
            const sessionStartTime = userState?.lastActivity || new Date();
            const sessionEndTime = new Date();
            
            logger.info('Session timing calculated', { 
                chatId, 
                vacancyId,
                sessionStartTime,
                sessionEndTime,
                durationMinutes: Math.round((sessionEndTime.getTime() - sessionStartTime.getTime()) / 60000)
            });

            // Generate evaluation
            logger.info('Calling evaluation service to generate evaluation', { chatId, vacancyId });
            const evaluationResult = await this.evaluationService.generateEvaluation(chatId, vacancyId);
            
            logger.info('Evaluation generated successfully', { 
                chatId, 
                vacancyId,
                evaluationId: evaluationResult.evaluation.id,
                overallScore: evaluationResult.evaluation.overallScore,
                recommendation: evaluationResult.evaluation.recommendation,
                technicalScore: evaluationResult.evaluation.technicalScore,
                communicationScore: evaluationResult.evaluation.communicationScore,
                strengthsCount: evaluationResult.evaluation.strengths.length,
                gapsCount: evaluationResult.evaluation.gaps.length
            });

            // Complete interview and save results to interview_results table
            const interviewData = {
                startTime: sessionStartTime,
                endTime: sessionEndTime,
                totalQuestions: userState?.questionCount || 0,
                totalAnswers: userState?.questionCount || 0,
                completionPercentage: 100
            };
            
            const hrNotes = {
                technicalScore: evaluationResult.evaluation.technicalScore,
                softSkillsScore: evaluationResult.evaluation.communicationScore,
                overallImpression: `Overall Score: ${evaluationResult.evaluation.overallScore}% - ${evaluationResult.evaluation.recommendation}`,
                nextSteps: this.getNextStepsFromRecommendation(evaluationResult.evaluation.recommendation),
                followUpRequired: evaluationResult.evaluation.recommendation === 'clarify',
                interviewerNotes: `Strengths: ${evaluationResult.evaluation.strengths.join(', ')}. Gaps: ${evaluationResult.evaluation.gaps.join(', ')}`
            };
            
            logger.info('Completing interview with results', { 
                chatId, 
                vacancyId,
                evaluationId: evaluationResult.evaluation.id,
                interviewData,
                hrNotes
            });
            
            await this.interviewResultsService.completeInterview(
                chatId, 
                vacancyId, 
                evaluationResult.evaluation.id,
                evaluationResult.feedback,
                interviewData,
                hrNotes
            );
            
            logger.info('Interview completion saved to database', { chatId, vacancyId });

            // Send evaluation feedback to candidate
            logger.info('Sending evaluation feedback to candidate', { 
                chatId, 
                vacancyId,
                feedbackLength: evaluationResult.feedback.length,
                feedbackPreview: evaluationResult.feedback.substring(0, 200) + '...'
            });
            
            await this.bot.sendMessage(chatId, evaluationResult.feedback, {
                parse_mode: 'Markdown'
            });
            
            logger.info('Evaluation feedback sent to candidate', { chatId, vacancyId });

            // Send interview results summary
            logger.info('Generating interview results summary', { chatId, vacancyId });
            const resultsSummary = await this.interviewResultsService.generateResultsSummary(chatId, vacancyId);
            
            logger.info('Interview results summary generated', { 
                chatId, 
                vacancyId,
                summaryLength: resultsSummary.length
            });
            
            // Note: Summary sending is commented out in original code
            // await this.bot.sendMessage(chatId, resultsSummary, {
            //     parse_mode: 'Markdown'
            // });

            // Log successful evaluation
            logger.info('Evaluation process completed successfully', {
                chatId,
                vacancyId,
                evaluationId: evaluationResult.evaluation.id,
                overallScore: evaluationResult.evaluation.overallScore,
                recommendation: evaluationResult.evaluation.recommendation,
                feedbackSent: true,
                interviewCompleted: true,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Evaluation generation failed, sending fallback message', { 
                chatId, 
                vacancyId,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                userQuestionCount: userState?.questionCount
            });
            
            // Send fallback message
            await this.bot.sendMessage(chatId, 
                '🎯 Интервью завершено!\n\n' +
                'Спасибо за участие в собеседовании. Мы тщательно рассмотрим ваши ответы и ' +
                'свяжемся с вами в ближайшее время с результатами.\n\n' +
                'Хорошего дня! 😊'
            );
            
            logger.info('Fallback message sent to candidate', { chatId, vacancyId });

        } finally {
            // Always stop typing indicator
            logger.info('Stopping typing indicator for evaluation', { chatId, vacancyId });
            stopTyping();
            
            logger.info('Evaluation generation process finished', { 
                chatId, 
                vacancyId,
                timestamp: new Date().toISOString()
            });
        }
    }

    private getNextStepsFromRecommendation(recommendation: string): string {
        switch (recommendation) {
            case 'proceed':
                return 'Рекомендуется к прохождению на следующий этап отбора';
            case 'reject':
                return 'Не рекомендуется к дальнейшему рассмотрению';
            case 'clarify':
                return 'Требуется дополнительное собеседование для уточнения компетенций';
            default:
                return 'Результаты будут рассмотрены HR-специалистом';
        }
    }
}
