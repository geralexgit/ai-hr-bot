import fetch from 'node-fetch';
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';

export interface OllamaResponse {
  response: string;
}

export class OllamaService {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = config.ollama.baseUrl;
    this.model = config.ollama.model;
  }

  async generate(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as OllamaResponse
      
      return data.response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Handle connection errors specifically
      if (error instanceof Error && (
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('fetch failed') ||
        error.message.includes('connect ECONNREFUSED')
      )) {
        logger.warn('Ollama service is not available', { baseUrl: this.baseUrl, error: errorMessage });
        throw new Error(`Ollama service is not running or not accessible at ${this.baseUrl}`);
      }
      
      logger.error('Error calling Ollama API', { error: errorMessage, baseUrl: this.baseUrl });
      throw error;
    }
  }

  /**
   * Test if Ollama service is available
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000)
      });

      return response.ok;
    } catch (error) {
      logger.warn('Ollama connection test failed', { 
        baseUrl: this.baseUrl, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }
}