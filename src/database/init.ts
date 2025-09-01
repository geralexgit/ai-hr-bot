import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { db } from './connection.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class DatabaseInitializer {
  public static async initialize(): Promise<void> {
    try {
      logger.info('Starting database initialization...');
      
      // Connect to database
      await db.connect();
      
      // Read and execute schema
      const schemaPath = join(__dirname, 'schema.sql');
      const schema = await readFile(schemaPath, 'utf-8');
      
      // Split schema into individual statements and execute them
      const statements = schema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.trim()) {
          await db.query(statement);
        }
      }
      
      logger.info('Database schema initialized successfully');
      
      // Verify tables were created
      await this.verifyTables();
      
    } catch (error) {
      logger.error('Failed to initialize database', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }
  
  private static async verifyTables(): Promise<void> {
    const expectedTables = ['vacancies', 'candidates', 'dialogues', 'evaluations'];
    
    try {
      const result = await db.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);
      
      const existingTables = result.map((row: any) => row.table_name);
      const missingTables = expectedTables.filter(table => !existingTables.includes(table));
      
      if (missingTables.length > 0) {
        throw new Error(`Missing tables: ${missingTables.join(', ')}`);
      }
      
      logger.info('Database table verification completed', {
        tables: existingTables,
        count: existingTables.length,
      });
      
      // Check if sample data exists
      const vacancyCount = await db.query('SELECT COUNT(*) as count FROM vacancies');
      logger.info('Sample data check', {
        vacancies: vacancyCount[0]?.count || 0,
      });
      
    } catch (error) {
      logger.error('Database table verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
  
  public static async healthCheck(): Promise<{
    connected: boolean;
    tablesExist: boolean;
    poolStatus: any;
  }> {
    try {
      const connected = await db.healthCheck();
      let tablesExist = false;
      
      if (connected) {
        try {
          await db.query('SELECT 1 FROM vacancies LIMIT 1');
          tablesExist = true;
        } catch {
          tablesExist = false;
        }
      }
      
      return {
        connected,
        tablesExist,
        poolStatus: db.getPoolStatus(),
      };
    } catch (error) {
      logger.error('Database health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      return {
        connected: false,
        tablesExist: false,
        poolStatus: db.getPoolStatus(),
      };
    }
  }
}