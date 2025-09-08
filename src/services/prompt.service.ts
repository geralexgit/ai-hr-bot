import { PromptSettingsRepository, PromptSetting } from '../repositories/PromptSettingsRepository.js';
import { logger } from '../utils/logger.js';

export class PromptService {
  private promptSettingsRepository = new PromptSettingsRepository();
  private promptCache = new Map<string, PromptSetting>();
  private lastCacheUpdate = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get a prompt template by name, with caching
   */
  async getPromptTemplate(name: string): Promise<string> {
    try {
      // Check if cache is still valid
      if (Date.now() - this.lastCacheUpdate > this.CACHE_TTL) {
        await this.refreshCache();
      }

      const prompt = this.promptCache.get(name);
      if (!prompt) {
        logger.warn(`Prompt template not found: ${name}, using fallback`);
        return this.getFallbackPrompt(name);
      }

      if (!prompt.isActive) {
        logger.warn(`Prompt template is inactive: ${name}, using fallback`);
        return this.getFallbackPrompt(name);
      }

      return prompt.promptTemplate;
    } catch (error) {
      logger.error(`Error fetching prompt template: ${name}`, { error });
      return this.getFallbackPrompt(name);
    }
  }

  /**
   * Render a prompt template with variables
   */
  renderPrompt(template: string, variables: Record<string, any>): string {
    let renderedPrompt = template;

    // Replace all {{variable}} placeholders with actual values
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      const replacement = value !== undefined && value !== null ? String(value) : '';
      renderedPrompt = renderedPrompt.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
    }

    return renderedPrompt;
  }

  /**
   * Get and render a prompt template in one call
   */
  async getRenderedPrompt(name: string, variables: Record<string, any>): Promise<string> {
    const template = await this.getPromptTemplate(name);
    return this.renderPrompt(template, variables);
  }

  /**
   * Refresh the prompt cache from database
   */
  private async refreshCache(): Promise<void> {
    try {
      const activePrompts = await this.promptSettingsRepository.findActive();
      
      this.promptCache.clear();
      for (const prompt of activePrompts) {
        this.promptCache.set(prompt.name, prompt);
      }
      
      this.lastCacheUpdate = Date.now();
      logger.info(`Refreshed prompt cache with ${activePrompts.length} prompts`);
    } catch (error) {
      logger.error('Error refreshing prompt cache', { error });
    }
  }

  /**
   * Force cache refresh (useful after prompt updates)
   */
  async invalidateCache(): Promise<void> {
    this.lastCacheUpdate = 0;
    await this.refreshCache();
  }

  /**
   * Get fallback prompt templates for when database prompts are unavailable
   */
  private getFallbackPrompt(name: string): string {
    const fallbackPrompts: Record<string, string> = {
      cv_analysis: `Ты — HR-ассистент, анализирующий загруженное резюме кандидата.

{{vacancy_context}}

Файл резюме: {{file_name}}
Содержимое резюме: {{file_content}}

Твоя задача:
1. Проанализируй резюме в контексте конкретной вакансии
2. Извлеки ключевые навыки, опыт работы и образование
3. Оцени соответствие требованиям вакансии
4. Определи сильные стороны и пробелы
5. Задай первый уместный вопрос для углубленного интервью

ВАЖНО: Верни ответ строго ТОЛЬКО в JSON формате с полями:
{
  "analysis": "краткий анализ резюме и соответствия вакансии",
  "strengths": "выявленные сильные стороны кандидата",
  "gaps": "обнаруженные пробелы или области для уточнения",
  "first_question": "первый вопрос для интервью на основе анализа резюме"
}`,

      resume_analysis: `Ты — HR-ассистент.
У тебя есть описание вакансии и резюме кандидата.
1. Извлеки ключевые требования из вакансии.
2. Извлеки ключевые навыки из резюме.
3. Определи совпадения и пробелы.
4. Сгенерируй 5 вопросов для интервью (technical, case study, soft skills).
5. Ответ кандидата приходит из системы распознавания речи, вероятно, содержит ошибки учитывай это при анализе
Верни ответ в JSON с ключами: job_requirements, candidate_skills, matches, gaps, questions.
---
Вакансия:
{{job_description}}

Резюме:
{{resume}}`,

      interview_chat: `Ты — HR-ассистент, проводящий интервью с кандидатом.

{{vacancy_context}}

Контекст разговора:
{{conversation_context}}

Номер вопроса: {{question_count}}

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

Ответ кандидата: {{candidate_message}}`
    };

    return fallbackPrompts[name] || 'Fallback prompt not available. Please configure prompts in the admin panel.';
  }

  /**
   * Get all available prompt names
   */
  async getAvailablePrompts(): Promise<string[]> {
    try {
      const prompts = await this.promptSettingsRepository.findActive();
      return prompts.map(p => p.name);
    } catch (error) {
      logger.error('Error fetching available prompts', { error });
      return Object.keys(this.getFallbackPrompts());
    }
  }

  /**
   * Get all fallback prompt names (for reference)
   */
  private getFallbackPrompts(): Record<string, string> {
    return {
      cv_analysis: 'CV Analysis Prompt',
      resume_analysis: 'Resume Analysis Prompt', 
      interview_chat: 'Interview Chat Prompt'
    };
  }
}
