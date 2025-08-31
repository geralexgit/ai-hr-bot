import TelegramBot from 'node-telegram-bot-api';
import { config } from './config/environment.js';
import { logger } from './utils/logger.js';
import { OllamaService } from './services/ollama.service.js';
import { ConversationService } from './services/conversation.service.js';
import { BotHandlers } from './bot/handlers.js';

class TelegramBotApp {
  private bot: TelegramBot;
  private ollamaService: OllamaService;
  private conversationService: ConversationService;
  private handlers: BotHandlers;

  constructor() {
    this.bot = new TelegramBot(config.telegram.token, { polling: true });
    this.ollamaService = new OllamaService();
    this.conversationService = new ConversationService();
    this.handlers = new BotHandlers(this.bot, this.ollamaService, this.conversationService);
  }

  start(): void {
    this.handlers.setupHandlers();
    this.setupGracefulShutdown();
    
    logger.info('Starting Telegram Bot Service', {
      token: config.telegram.token.substring(0, 10) + '...',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      ollamaUrl: config.ollama.baseUrl,
      ollamaModel: config.ollama.model
    });

    console.log('Telegram Bot is running...');
  }

  private setupGracefulShutdown(): void {
    const shutdown = (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);
      this.bot.stopPolling();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
}

const app = new TelegramBotApp();
app.start();