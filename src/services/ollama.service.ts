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
      logger.error('Error calling Ollama API', error);
      throw error;
    }
  }
}