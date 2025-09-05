import { Pool, PoolConfig, PoolClient } from 'pg';
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { DatabaseError } from '../types/index.js';

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: Pool;
  private isConnected: boolean = false;

  private constructor() {
    const poolConfig: PoolConfig = {
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.username,
      password: config.database.password,
      ssl: config.database.ssl,
      max: config.database.maxConnections,
      idleTimeoutMillis: config.database.idleTimeoutMillis,
      connectionTimeoutMillis: config.database.connectionTimeoutMillis,
    };

    this.pool = new Pool(poolConfig);
    this.setupEventHandlers();
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  private setupEventHandlers(): void {
    this.pool.on('connect', (client: PoolClient) => {
      logger.info('New database client connected', {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount,
      });
    });

    this.pool.on('error', (err: Error, client: PoolClient) => {
      logger.error('Unexpected database pool error', {
        error: err.message,
        stack: err.stack,
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount,
      });
    });

    this.pool.on('remove', (client: PoolClient) => {
      logger.info('Database client removed from pool', {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount,
      });
    });
  }

  public async connect(): Promise<void> {
    try {
      // Test the connection
      const client = await this.pool.connect();
      logger.info('Database connection established successfully', {
        host: config.database.host,
        port: config.database.port,
        database: config.database.name,
        user: config.database.username,
      });

      // Verify database exists and is accessible
      const result = await client.query('SELECT version()');
      logger.info('Database version check successful', {
        version: result.rows[0].version,
      });

      client.release();
      this.isConnected = true;
    } catch (error) {
      logger.error('Failed to connect to database', {
        error: error instanceof Error ? error.message : 'Unknown error',
        host: config.database.host,
        port: config.database.port,
        database: config.database.name,
        user: config.database.username,
      });
      throw new DatabaseError(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.pool.end();
      this.isConnected = false;
      logger.info('Database connection pool closed successfully');
    } catch (error) {
      logger.error('Error closing database connection pool', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async query<T = any>(
    text: string,
    params?: any[]
  ): Promise<{ rows: T[]; rowCount: number }> {
    const start = Date.now();

    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;

      logger.debug('Database query executed', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        rowCount: result.rowCount,
        paramCount: params?.length || 0,
      });

      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
      };
    } catch (error) {
      const duration = Date.now() - start;

      logger.error('Database query failed', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
        params: params?.map(p => typeof p === 'string' && p.length > 50 ? p.substring(0, 50) + '...' : p),
      });

      if (error instanceof Error) {
        const dbError = new DatabaseError(error.message);
        dbError.code = (error as any).code;
        dbError.constraint = (error as any).constraint;
        dbError.table = (error as any).table;
        throw dbError;
      }

      throw error;
    }
  }

  public async getClient(): Promise<PoolClient> {
    try {
      const client = await this.pool.connect();
      return client;
    } catch (error) {
      logger.error('Failed to get database client from pool', {
        error: error instanceof Error ? error.message : 'Unknown error',
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount,
      });
      throw error;
    }
  }

  public async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Database transaction failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      client.release();
    }
  }

  public getPoolStats(): {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
    isConnected: boolean;
  } {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      isConnected: this.isConnected,
    };
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as health_check');
      return result.rows.length > 0 && result.rows[0].health_check === 1;
    } catch (error) {
      logger.error('Database health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }
}

// Export singleton instance
export const db = DatabaseConnection.getInstance();
