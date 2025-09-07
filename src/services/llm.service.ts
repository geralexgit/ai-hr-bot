import { OllamaService } from './ollama.service.js';
import { PerplexityService } from './perplexity.service.js';
import { SystemSettingsRepository } from '../repositories/SystemSettingsRepository.js';
import { logger } from '../utils/logger.js';

export type LLMProvider = 'ollama' | 'perplexity';

export interface LLMConfig {
  provider: LLMProvider;
  ollamaBaseUrl?: string;
  ollamaModel?: string;
  perplexityApiKey?: string;
  perplexityModel?: string;
}

export class LLMService {
  private systemSettingsRepository: SystemSettingsRepository;
  private ollamaService: OllamaService | undefined;
  private perplexityService: PerplexityService | undefined;
  private currentProvider: LLMProvider | undefined;

  constructor() {
    this.systemSettingsRepository = new SystemSettingsRepository();
  }

  /**
   * Initialize the LLM service with current settings
   */
  async initialize(): Promise<void> {
    try {
      const config = await this.loadConfig();
      await this.switchProvider(config.provider, config);
      logger.info('LLM service initialized', { provider: config.provider });
    } catch (error) {
      logger.error('Failed to initialize LLM service', { error });
      throw error;
    }
  }

  /**
   * Load LLM configuration from system settings
   */
  private async loadConfig(): Promise<LLMConfig> {
    try {
      const [
        provider,
        ollamaBaseUrl,
        ollamaModel,
        perplexityApiKey,
        perplexityModel
      ] = await Promise.all([
        this.systemSettingsRepository.getValue<LLMProvider>('llm_provider', 'ollama'),
        this.systemSettingsRepository.getValue('ollama_base_url', 'http://localhost:11434'),
        this.systemSettingsRepository.getValue('ollama_model', 'gemma3n:latest'),
        this.systemSettingsRepository.getValue('perplexity_api_key', ''),
        this.systemSettingsRepository.getValue('perplexity_model', 'llama-3.1-sonar-small-128k-online')
      ]);

      return {
        provider,
        ollamaBaseUrl,
        ollamaModel,
        perplexityApiKey,
        perplexityModel
      };
    } catch (error) {
      logger.error('Error loading LLM configuration', { error });
      // Return default config if settings don't exist yet
      return {
        provider: 'ollama',
        ollamaBaseUrl: 'http://localhost:11434',
        ollamaModel: 'gemma3n:latest',
        perplexityApiKey: '',
        perplexityModel: 'llama-3.1-sonar-small-128k-online'
      };
    }
  }

  /**
   * Switch to a different LLM provider
   */
  async switchProvider(provider: LLMProvider, config?: LLMConfig): Promise<void> {
    try {
      const currentConfig = config || await this.loadConfig();

      if (provider === 'ollama') {
        this.ollamaService = new OllamaService();
        this.currentProvider = 'ollama';
        logger.info('Switched to Ollama provider', { 
          baseUrl: currentConfig.ollamaBaseUrl,
          model: currentConfig.ollamaModel 
        });
      } else if (provider === 'perplexity') {
        if (!currentConfig.perplexityApiKey) {
          throw new Error('Perplexity API key is required');
        }
        this.perplexityService = new PerplexityService(
          currentConfig.perplexityApiKey,
          currentConfig.perplexityModel
        );
        this.currentProvider = 'perplexity';
        logger.info('Switched to Perplexity provider', { 
          model: currentConfig.perplexityModel 
        });
      } else {
        throw new Error(`Unsupported LLM provider: ${provider}`);
      }
    } catch (error) {
      logger.error('Error switching LLM provider', { provider, error });
      throw error;
    }
  }

  /**
   * Generate text using the current LLM provider
   */
  async generate(prompt: string): Promise<string> {
    try {
      if (!this.currentProvider) {
        await this.initialize();
      }

      if (this.currentProvider === 'ollama') {
        if (!this.ollamaService) {
          throw new Error('Ollama service not initialized');
        }
        return await this.ollamaService.generate(prompt);
      } else if (this.currentProvider === 'perplexity') {
        if (!this.perplexityService) {
          throw new Error('Perplexity service not initialized');
        }
        return await this.perplexityService.generate(prompt);
      } else {
        throw new Error('No LLM provider configured');
      }
    } catch (error) {
      logger.error('Error generating text with LLM', { 
        provider: this.currentProvider,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Test the current LLM provider connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.currentProvider) {
        await this.initialize();
      }

      if (this.currentProvider === 'ollama') {
        if (!this.ollamaService) {
          return { success: false, error: 'Ollama service not initialized' };
        }
        await this.ollamaService.generate('Test');
        return { success: true };
      } else if (this.currentProvider === 'perplexity') {
        if (!this.perplexityService) {
          return { success: false, error: 'Perplexity service not initialized' };
        }
        const success = await this.perplexityService.testConnection();
        return success ? { success: true } : { success: false, error: 'Connection test failed' };
      } else {
        return { success: false, error: 'No LLM provider configured' };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get current provider information
   */
  getCurrentProvider(): LLMProvider | undefined {
    return this.currentProvider;
  }

  /**
   * Reload configuration and reinitialize
   */
  async reload(): Promise<void> {
    this.ollamaService = undefined;
    this.perplexityService = undefined;
    this.currentProvider = undefined;
    await this.initialize();
  }
}
