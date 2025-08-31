import { db } from './connection.js';
import { logger } from '../utils/logger.js';

export class DatabaseSchema {
  /**
   * Creates all database tables if they don't exist
   */
  public static async createTables(): Promise<void> {
    try {
      logger.info('Creating database tables...');

      // Create vacancies table
      await db.query(`
        CREATE TABLE IF NOT EXISTS vacancies (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          requirements JSONB NOT NULL,
          evaluation_weights JSONB NOT NULL,
          status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create candidates table
      await db.query(`
        CREATE TABLE IF NOT EXISTS candidates (
          id SERIAL PRIMARY KEY,
          telegram_user_id BIGINT UNIQUE NOT NULL,
          first_name VARCHAR(255),
          last_name VARCHAR(255),
          username VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create dialogues table
      await db.query(`
        CREATE TABLE IF NOT EXISTS dialogues (
          id SERIAL PRIMARY KEY,
          candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
          vacancy_id INTEGER REFERENCES vacancies(id) ON DELETE CASCADE,
          message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('text', 'audio', 'system')),
          content TEXT NOT NULL,
          audio_file_path VARCHAR(500),
          transcription TEXT,
          sender VARCHAR(50) NOT NULL CHECK (sender IN ('candidate', 'bot')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create evaluations table
      await db.query(`
        CREATE TABLE IF NOT EXISTS evaluations (
          id SERIAL PRIMARY KEY,
          candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
          vacancy_id INTEGER REFERENCES vacancies(id) ON DELETE CASCADE,
          overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
          technical_score INTEGER CHECK (technical_score >= 0 AND technical_score <= 100),
          communication_score INTEGER CHECK (communication_score >= 0 AND communication_score <= 100),
          problem_solving_score INTEGER CHECK (problem_solving_score >= 0 AND problem_solving_score <= 100),
          strengths TEXT[],
          gaps TEXT[],
          contradictions TEXT[],
          recommendation VARCHAR(50) CHECK (recommendation IN ('proceed', 'reject', 'clarify')),
          feedback TEXT,
          analysis_data JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(candidate_id, vacancy_id)
        );
      `);

      // Create indexes for better performance
      await this.createIndexes();

      logger.info('Database tables created successfully');
    } catch (error) {
      logger.error('Failed to create database tables', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Creates database indexes for better query performance
   */
  private static async createIndexes(): Promise<void> {
    try {
      logger.info('Creating database indexes...');

      // Index on candidates telegram_user_id for fast lookups
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_candidates_telegram_user_id
        ON candidates(telegram_user_id);
      `);

      // Index on dialogues for candidate and vacancy queries
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_dialogues_candidate_vacancy
        ON dialogues(candidate_id, vacancy_id);
      `);

      // Index on dialogues created_at for chronological ordering
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_dialogues_created_at
        ON dialogues(created_at);
      `);

      // Index on evaluations for candidate and vacancy queries
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_evaluations_candidate_vacancy
        ON evaluations(candidate_id, vacancy_id);
      `);

      // Index on evaluations recommendation for filtering
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_evaluations_recommendation
        ON evaluations(recommendation);
      `);

      // Index on vacancies status for active vacancy queries
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_vacancies_status
        ON vacancies(status);
      `);

      logger.info('Database indexes created successfully');
    } catch (error) {
      logger.error('Failed to create database indexes', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Creates database triggers for automatic timestamp updates
   */
  public static async createTriggers(): Promise<void> {
    try {
      logger.info('Creating database triggers...');

      // Trigger to update updated_at timestamp on vacancies table
      await db.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql';
      `);

      await db.query(`
        CREATE TRIGGER update_vacancies_updated_at
        BEFORE UPDATE ON vacancies
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);

      logger.info('Database triggers created successfully');
    } catch (error) {
      logger.error('Failed to create database triggers', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Initializes the database with tables, indexes, and triggers
   */
  public static async initialize(): Promise<void> {
    try {
      logger.info('Initializing database schema...');

      await this.createTables();
      await this.createTriggers();

      logger.info('Database schema initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database schema', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Drops all tables (useful for testing or resetting)
   */
  public static async dropTables(): Promise<void> {
    try {
      logger.warn('Dropping all database tables...');

      // Drop tables in reverse order due to foreign key constraints
      await db.query('DROP TABLE IF EXISTS evaluations CASCADE;');
      await db.query('DROP TABLE IF EXISTS dialogues CASCADE;');
      await db.query('DROP TABLE IF EXISTS candidates CASCADE;');
      await db.query('DROP TABLE IF EXISTS vacancies CASCADE;');

      // Drop the trigger function
      await db.query('DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;');

      logger.info('Database tables dropped successfully');
    } catch (error) {
      logger.error('Failed to drop database tables', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Gets database schema information
   */
  public static async getSchemaInfo(): Promise<any> {
    try {
      const tables = await db.query(`
        SELECT
          schemaname,
          tablename,
          tableowner,
          tablespace,
          hasindexes,
          hasrules,
          hastriggers,
          rowsecurity
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename;
      `);

      const indexes = await db.query(`
        SELECT
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname;
      `);

      return {
        tables: tables.rows,
        indexes: indexes.rows,
      };
    } catch (error) {
      logger.error('Failed to get database schema information', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
