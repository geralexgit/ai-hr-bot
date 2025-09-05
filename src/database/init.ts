import { db } from './connection.js';
import { DatabaseSchema } from './schema.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/environment.js';

export class DatabaseInitializer {
  /**
   * Initializes the database connection and schema
   */
  public static async initialize(): Promise<void> {
    try {
      logger.info('Initializing database...');

      // Connect to database
      await db.connect();

      // Initialize schema (tables, indexes, triggers)
      await DatabaseSchema.initialize();

      // Run health check
      const isHealthy = await db.healthCheck();
      if (!isHealthy) {
        throw new Error('Database health check failed');
      }

      logger.info('Database initialized successfully', {
        host: config.database.host,
        port: config.database.port,
        database: config.database.name,
        user: config.database.username,
      });
    } catch (error) {
      logger.error('Database initialization failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Closes the database connection gracefully
   */
  public static async close(): Promise<void> {
    try {
      await db.disconnect();
      logger.info('Database connection closed successfully');
    } catch (error) {
      logger.error('Error closing database connection', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Resets the database (drops all tables and recreates them)
   * WARNING: This will delete all data!
   */
  public static async reset(): Promise<void> {
    try {
      logger.warn('Resetting database - all data will be lost!');

      await DatabaseSchema.dropTables();
      await DatabaseSchema.initialize();

      logger.info('Database reset successfully');
    } catch (error) {
      logger.error('Database reset failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Gets database status and statistics
   */
  public static async getStatus(): Promise<any> {
    try {
      const poolStats = db.getPoolStats();
      const schemaInfo = await DatabaseSchema.getSchemaInfo();
      const isHealthy = await db.healthCheck();

      return {
        connection: {
          isConnected: poolStats.isConnected,
          isHealthy,
        },
        pool: {
          totalCount: poolStats.totalCount,
          idleCount: poolStats.idleCount,
          waitingCount: poolStats.waitingCount,
        },
        schema: schemaInfo,
      };
    } catch (error) {
      logger.error('Failed to get database status', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
