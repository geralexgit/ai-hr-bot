import fetch from 'node-fetch';
import { logger } from '../utils/logger.js';

export interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta?: {
      role?: string;
      content?: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class PerplexityService {
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://api.perplexity.ai';

  constructor(apiKey: string, model: string = 'sonar-pro') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generate(prompt: string): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error('Perplexity API key is not configured');
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json() as PerplexityResponse;
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from Perplexity API');
      }

      const choice = data.choices[0];
      if (!choice?.message?.content) {
        throw new Error('Invalid response format from Perplexity API');
      }

      return choice.message.content;
    } catch (error) {
      logger.error('Error calling Perplexity API', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        model: this.model
      });
      throw error;
    }
  }

  /**
   * Test the connection to Perplexity API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.generate('Test connection. Respond with just "OK".');
      return true;
    } catch (error) {
      logger.error('Perplexity connection test failed', { error });
      return false;
    }
  }

  /**
   * Update the model
   */
  setModel(model: string): void {
    this.model = model;
  }

  /**
   * Update the API key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Get current model
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Check if API key is configured
   */
  hasApiKey(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 0;
  }
}
