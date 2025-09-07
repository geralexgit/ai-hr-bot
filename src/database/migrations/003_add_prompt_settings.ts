import { db } from '../connection.js';
import { logger } from '../../utils/logger.js';

export async function up(): Promise<void> {
  logger.info('Running migration: 003_add_prompt_settings');

  try {
    // Create prompt_settings table
    await db.query(`
      CREATE TABLE IF NOT EXISTS prompt_settings (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        prompt_template TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index for faster lookups
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_prompt_settings_name
      ON prompt_settings(name);
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_prompt_settings_category
      ON prompt_settings(category);
    `);

    // Create trigger for updated_at
    await db.query(`
      CREATE TRIGGER update_prompt_settings_updated_at
      BEFORE UPDATE ON prompt_settings
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    // Insert default prompts
    await db.query(`
      INSERT INTO prompt_settings (name, description, prompt_template, category) VALUES
      (
        'cv_analysis',
        'Prompt for analyzing uploaded CV/resume files',
        'Ты — HR-ассистент, анализирующий загруженное резюме кандидата.

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
}',
        'cv_analysis'
      ),
      (
        'resume_analysis',
        'Prompt for analyzing resume text provided in chat',
        'Ты — HR-ассистент.
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
{{resume}}',
        'resume_analysis'
      ),
      (
        'interview_chat',
        'Prompt for conducting interview conversations with candidates',
        'Ты — HR-ассистент, проводящий интервью с кандидатом.

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

Ответ кандидата: {{candidate_message}}',
        'interview'
      )
      ON CONFLICT (name) DO NOTHING;
    `);

    logger.info('Migration 003_add_prompt_settings completed successfully');
  } catch (error) {
    logger.error('Migration 003_add_prompt_settings failed', { error });
    throw error;
  }
}

export async function down(): Promise<void> {
  logger.info('Rolling back migration: 003_add_prompt_settings');

  try {
    await db.query('DROP TRIGGER IF EXISTS update_prompt_settings_updated_at ON prompt_settings;');
    await db.query('DROP INDEX IF EXISTS idx_prompt_settings_category;');
    await db.query('DROP INDEX IF EXISTS idx_prompt_settings_name;');
    await db.query('DROP TABLE IF EXISTS prompt_settings;');

    logger.info('Migration 003_add_prompt_settings rolled back successfully');
  } catch (error) {
    logger.error('Migration 003_add_prompt_settings rollback failed', { error });
    throw error;
  }
}
