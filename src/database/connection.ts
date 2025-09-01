import { Pool, PoolClient, PoolConfig } from 'pg';
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: Pool;
  private isConnected: boolean = false;

  private constructor() {
    const poolConfig: PoolConfig = {
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
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

    this.pool.on('acquire', (client: PoolClient) => {
      logger.debug('Database client acquired from pool');
    });

    this.pool.on('remove', (client: PoolClient) => {
      logger.info('Database client removed from pool', {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
      });
    });

    this.pool.on('error', (err: Error, client: PoolClient) => {
      logger.error('Unexpected error on idle database client', {
        error: err.message,
        stack: err.stack,
      });
    });
  }

  public async connect(): Promise<void> {
    try {
      // Test the connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      this.isConnected = true;
      logger.info('Database connection established successfully', {
        host: config.database.host,
        port: config.database.port,
        database: config.database.name,
        maxConnections: config.database.maxConnections,
      });
    } catch (error) {
      this.isConnected = false;
      logger.error('Failed to connect to database', {
        error: error instanceof Error ? error.message : 'Unknown error',
        host: config.database.host,
        port: config.database.port,
        database: config.database.name,
      });
      throw error;
    }
  }

  public async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    if (!this.isConnected) {
      throw new Error('Database not connected. Call connect() first.');
    }

    const start = Date.now();
    let client: PoolClient | null = null;

    try {
      client = await this.pool.connect();
      const result = await client.query(text, params);
      const duration = Date.now() - start;

      logger.debug('Database query executed', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration,
        rowCount: result.rowCount,
      });

      return result.rows;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error('Database query failed', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        params: params ? JSON.stringify(params).substring(0, 200) : undefined,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    if (!this.isConnected) {
      throw new Error('Database not connected. Call connect() first.');
    }

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      
      logger.debug('Database transaction completed successfully');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Database transaction rolled back', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      client.release();
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.pool.end();
      this.isConnected = false;
      logger.info('Database connection pool closed');
    } catch (error) {
      logger.error('Error closing database connection pool', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public getPoolStatus(): {
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
      await this.query('SELECT 1');
      return true;
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