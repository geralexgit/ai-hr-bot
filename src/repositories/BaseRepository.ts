import { db } from '../database/connection.js';
import { logger } from '../utils/logger.js';

export abstract class BaseRepository<T, CreateDto, UpdateDto> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Find all records
   */
  async findAll(): Promise<T[]> {
    try {
      const result = await db.query(`SELECT * FROM ${this.tableName}`);
      return result.rows;
    } catch (error) {
      logger.error(`Failed to find all records in ${this.tableName}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Find record by ID
   */
  async findById(id: number): Promise<T | null> {
    try {
      const result = await db.query(`SELECT * FROM ${this.tableName} WHERE id = $1`, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Failed to find record by ID in ${this.tableName}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        id,
      });
      throw error;
    }
  }

  /**
   * Create a new record
   */
  async create(data: CreateDto): Promise<T> {
    try {
      const columns = Object.keys(data as object);
      const values = Object.values(data as object);
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');

      const query = `
        INSERT INTO ${this.tableName} (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;

      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error(`Failed to create record in ${this.tableName}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        data,
      });
      throw error;
    }
  }

  /**
   * Update a record by ID
   */
  async update(id: number, data: UpdateDto): Promise<T | null> {
    try {
      const columns = Object.keys(data as object);
      const values = Object.values(data as object);
      const setClause = columns.map((col, index) => `${col} = $${index + 1}`).join(', ');

      const query = `
        UPDATE ${this.tableName}
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${columns.length + 1}
        RETURNING *
      `;

      const result = await db.query(query, [...values, id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Failed to update record in ${this.tableName}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        id,
        data,
      });
      throw error;
    }
  }

  /**
   * Delete a record by ID
   */
  async delete(id: number): Promise<boolean> {
    try {
      const result = await db.query(`DELETE FROM ${this.tableName} WHERE id = $1 RETURNING id`, [id]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error(`Failed to delete record in ${this.tableName}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        id,
      });
      throw error;
    }
  }

  /**
   * Count total records
   */
  async count(): Promise<number> {
    try {
      const result = await db.query(`SELECT COUNT(*) as count FROM ${this.tableName}`);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error(`Failed to count records in ${this.tableName}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
