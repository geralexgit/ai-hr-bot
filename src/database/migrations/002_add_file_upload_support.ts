import { db } from '../connection.js';
import { logger } from '../../utils/logger.js';

/**
 * Migration to add file upload support for CVs and documents
 * Adds CV fields to candidates table and document fields to dialogues table
 */
export class AddFileUploadSupportMigration {
  static async up(): Promise<void> {
    try {
      logger.info('Running migration: Add file upload support');

      // Add CV fields to candidates table
      await db.query(`
        ALTER TABLE candidates 
        ADD COLUMN IF NOT EXISTS cv_file_path VARCHAR(500),
        ADD COLUMN IF NOT EXISTS cv_file_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS cv_file_size INTEGER,
        ADD COLUMN IF NOT EXISTS cv_uploaded_at TIMESTAMP;
      `);

      // Add document fields to dialogues table and update message_type constraint
      await db.query(`
        ALTER TABLE dialogues 
        ADD COLUMN IF NOT EXISTS document_file_path VARCHAR(500),
        ADD COLUMN IF NOT EXISTS document_file_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS document_file_size INTEGER;
      `);

      // Update message_type constraint to include 'document'
      await db.query(`
        ALTER TABLE dialogues 
        DROP CONSTRAINT IF EXISTS dialogues_message_type_check;
      `);

      await db.query(`
        ALTER TABLE dialogues 
        ADD CONSTRAINT dialogues_message_type_check 
        CHECK (message_type IN ('text', 'audio', 'system', 'document'));
      `);

      logger.info('Migration completed: Add file upload support');
    } catch (error) {
      logger.error('Migration failed: Add file upload support', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  static async down(): Promise<void> {
    try {
      logger.info('Rolling back migration: Add file upload support');

      // Remove CV fields from candidates table
      await db.query(`
        ALTER TABLE candidates 
        DROP COLUMN IF EXISTS cv_file_path,
        DROP COLUMN IF EXISTS cv_file_name,
        DROP COLUMN IF EXISTS cv_file_size,
        DROP COLUMN IF EXISTS cv_uploaded_at;
      `);

      // Remove document fields from dialogues table
      await db.query(`
        ALTER TABLE dialogues 
        DROP COLUMN IF EXISTS document_file_path,
        DROP COLUMN IF EXISTS document_file_name,
        DROP COLUMN IF EXISTS document_file_size;
      `);

      // Restore original message_type constraint
      await db.query(`
        ALTER TABLE dialogues 
        DROP CONSTRAINT IF EXISTS dialogues_message_type_check;
      `);

      await db.query(`
        ALTER TABLE dialogues 
        ADD CONSTRAINT dialogues_message_type_check 
        CHECK (message_type IN ('text', 'audio', 'system'));
      `);

      logger.info('Migration rollback completed: Add file upload support');
    } catch (error) {
      logger.error('Migration rollback failed: Add file upload support', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
