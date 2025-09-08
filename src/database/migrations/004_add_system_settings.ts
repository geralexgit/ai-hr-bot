import { db } from '../connection.js';
import { logger } from '../../utils/logger.js';

export async function up(): Promise<void> {
  logger.info('Running migration: 004_add_system_settings');

  try {
    // Create system_settings table
    await db.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL DEFAULT 'general',
        value_type VARCHAR(50) NOT NULL DEFAULT 'string' CHECK (value_type IN ('string', 'number', 'boolean', 'json')),
        is_encrypted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_system_settings_key
      ON system_settings(key);
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_system_settings_category
      ON system_settings(category);
    `);

    // Create trigger for updated_at
    await db.query(`
      CREATE TRIGGER update_system_settings_updated_at
      BEFORE UPDATE ON system_settings
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    // Insert default LLM settings
    await db.query(`
      INSERT INTO system_settings (key, value, description, category, value_type) VALUES
      ('llm_provider', 'ollama', 'Current LLM provider (ollama or perplexity)', 'llm', 'string'),
      ('ollama_base_url', 'http://localhost:11434', 'Ollama API base URL', 'llm', 'string'),
      ('ollama_model', 'gemma3n:latest', 'Ollama model to use', 'llm', 'string'),
      ('perplexity_api_key', '', 'Perplexity API key', 'llm', 'string'),
      ('perplexity_model', 'llama-3.1-sonar-small-128k-online', 'Perplexity model to use', 'llm', 'string')
      ON CONFLICT (key) DO NOTHING;
    `);

    logger.info('Migration 004_add_system_settings completed successfully');
  } catch (error) {
    logger.error('Migration 004_add_system_settings failed', { error });
    throw error;
  }
}

export async function down(): Promise<void> {
  logger.info('Rolling back migration: 004_add_system_settings');

  try {
    await db.query('DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;');
    await db.query('DROP INDEX IF EXISTS idx_system_settings_category;');
    await db.query('DROP INDEX IF EXISTS idx_system_settings_key;');
    await db.query('DROP TABLE IF EXISTS system_settings;');

    logger.info('Migration 004_add_system_settings rolled back successfully');
  } catch (error) {
    logger.error('Migration 004_add_system_settings rollback failed', { error });
    throw error;
  }
}
