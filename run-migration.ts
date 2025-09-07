#!/usr/bin/env tsx

import { AddFileUploadSupportMigration } from './src/database/migrations/002_add_file_upload_support.js';
import { logger } from './src/utils/logger.js';
import { db } from './src/database/connection.js';

async function runMigration() {
  try {
    logger.info('Starting file upload support migration...');
    await AddFileUploadSupportMigration.up();
    logger.info('Migration completed successfully!');
  } catch (error) {
    logger.error('Migration failed', { error });
    process.exit(1);
  } finally {
    // Close database connection
    try {
      await db.end();
    } catch (error) {
      logger.warn('Error closing database connection', { error });
    }
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}
