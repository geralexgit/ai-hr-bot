import { db } from './connection.js';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DatabaseMigrator {
  /**
   * Creates migrations table if it doesn't exist
   */
  private static async createMigrationsTable(): Promise<void> {
    await db.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  /**
   * Gets list of applied migrations
   */
  private static async getAppliedMigrations(): Promise<string[]> {
    const result = await db.query('SELECT filename FROM migrations ORDER BY id');
    return result.rows.map(row => row.filename);
  }

  /**
   * Marks a migration as applied
   */
  private static async markMigrationApplied(filename: string): Promise<void> {
    await db.query('INSERT INTO migrations (filename) VALUES ($1)', [filename]);
  }

  /**
   * Gets list of migration files
   */
  private static getMigrationFiles(): string[] {
    const migrationsDir = path.join(__dirname, 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      logger.info('No migrations directory found');
      return [];
    }

    return fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql') || file.endsWith('.ts'))
      .sort();
  }

  /**
   * Split SQL into statements while respecting PostgreSQL function boundaries
   */
  private static splitSQLStatements(sql: string): string[] {
    const statements: string[] = [];
    let currentStatement = '';
    let inDollarQuote = false;
    let dollarQuoteTag = '';
    let i = 0;

    while (i < sql.length) {
      const char = sql[i];
      const nextChars = sql.slice(i, i + 10);

      // Check for start of dollar quote
      if (!inDollarQuote && char === '$') {
        const match = nextChars.match(/^\$([^$]*)\$/);
        if (match) {
          inDollarQuote = true;
          dollarQuoteTag = match[0];
          currentStatement += dollarQuoteTag;
          i += dollarQuoteTag.length;
          continue;
        }
      }

      // Check for end of dollar quote
      if (inDollarQuote && sql.slice(i, i + dollarQuoteTag.length) === dollarQuoteTag) {
        inDollarQuote = false;
        currentStatement += dollarQuoteTag;
        i += dollarQuoteTag.length;
        dollarQuoteTag = '';
        continue;
      }

      // If we're not in a dollar quote and find a semicolon
      if (!inDollarQuote && char === ';') {
        currentStatement += char;
        const trimmed = currentStatement.trim();
        if (trimmed && !trimmed.startsWith('--')) {
          statements.push(trimmed);
        }
        currentStatement = '';
        i++;
        continue;
      }

      currentStatement += char;
      i++;
    }

    // Add any remaining statement
    const trimmed = currentStatement.trim();
    if (trimmed && !trimmed.startsWith('--')) {
      statements.push(trimmed);
    }

    return statements.filter(stmt => stmt.length > 0);
  }

  /**
   * Runs a single migration file
   */
  private static async runMigration(filename: string): Promise<void> {
    const migrationsDir = path.join(__dirname, 'migrations');
    const filePath = path.join(migrationsDir, filename);
    
    logger.info(`Running migration: ${filename}`);
    
    try {
      await db.query('BEGIN');
      
      if (filename.endsWith('.ts')) {
        // Handle TypeScript migration
        const migrationModule = await import(filePath);
        if (typeof migrationModule.up === 'function') {
          await migrationModule.up();
        } else {
          throw new Error(`Migration ${filename} does not export an 'up' function`);
        }
      } else {
        // Handle SQL migration
        const sql = fs.readFileSync(filePath, 'utf8');
        const statements = this.splitSQLStatements(sql);
        
        for (const statement of statements) {
          if (statement.trim()) {
            await db.query(statement);
          }
        }
      }
      
      await db.query('COMMIT');
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
    
    await this.markMigrationApplied(filename);
    logger.info(`Migration completed: ${filename}`);
  }

  /**
   * Runs all pending migrations
   */
  public static async migrate(): Promise<void> {
    try {
      logger.info('Starting database migration...');
      
      await this.createMigrationsTable();
      
      const appliedMigrations = await this.getAppliedMigrations();
      const migrationFiles = this.getMigrationFiles();
      
      const pendingMigrations = migrationFiles.filter(
        file => !appliedMigrations.includes(file)
      );
      
      if (pendingMigrations.length === 0) {
        logger.info('No pending migrations');
        return;
      }
      
      logger.info(`Found ${pendingMigrations.length} pending migrations`);
      
      for (const migration of pendingMigrations) {
        await this.runMigration(migration);
      }
      
      logger.info('All migrations completed successfully');
    } catch (error) {
      logger.error('Migration failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Rollback last migration
   */
  public static async rollback(): Promise<void> {
    try {
      logger.info('Rolling back last migration...');
      
      const result = await db.query(
        'SELECT filename FROM migrations ORDER BY id DESC LIMIT 1'
      );
      
      if (result.rows.length === 0) {
        logger.info('No migrations to rollback');
        return;
      }
      
      const lastMigration = result.rows[0].filename;
      const migrationsDir = path.join(__dirname, 'migrations');
      const filePath = path.join(migrationsDir, lastMigration);
      
      try {
        await db.query('BEGIN');
        
        if (lastMigration.endsWith('.ts')) {
          // Handle TypeScript migration rollback
          const migrationModule = await import(filePath);
          if (typeof migrationModule.down === 'function') {
            await migrationModule.down();
          } else {
            logger.warn(`Migration ${lastMigration} does not export a 'down' function. Skipping rollback logic.`);
          }
        } else {
          logger.warn(`SQL migration rollback not implemented for ${lastMigration}. Manual cleanup may be required.`);
        }
        
        await db.query('COMMIT');
      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }
      
      // Remove from migrations table
      await db.query('DELETE FROM migrations WHERE filename = $1', [lastMigration]);
      
      logger.info(`Rolled back migration: ${lastMigration}`);
    } catch (error) {
      logger.error('Rollback failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Shows migration status
   */
  public static async status(): Promise<void> {
    try {
      await this.createMigrationsTable();
      
      const appliedMigrations = await this.getAppliedMigrations();
      const migrationFiles = this.getMigrationFiles();
      
      logger.info('Migration Status:');
      
      for (const file of migrationFiles) {
        const status = appliedMigrations.includes(file) ? 'APPLIED' : 'PENDING';
        logger.info(`  ${file}: ${status}`);
      }
      
      const pendingCount = migrationFiles.filter(
        file => !appliedMigrations.includes(file)
      ).length;
      
      logger.info(`\nSummary: ${appliedMigrations.length} applied, ${pendingCount} pending`);
    } catch (error) {
      logger.error('Failed to get migration status', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  switch (command) {
    case 'migrate':
      DatabaseMigrator.migrate()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
    case 'rollback':
      DatabaseMigrator.rollback()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
    case 'status':
      DatabaseMigrator.status()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
    default:
      console.log('Usage: node migrate.js [migrate|rollback|status]');
      process.exit(1);
  }
}
