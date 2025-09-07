import { db } from '../database/connection.js';
import { logger } from '../utils/logger.js';

export abstract class BaseRepository<T, CreateDto, UpdateDto> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Convert camelCase to snake_case
   */
  protected camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * Convert snake_case to camelCase
   */
  protected snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Convert object keys from camelCase to snake_case
   */
  protected convertKeysToSnakeCase(obj: any): any {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return obj;
    }

    // Handle Date objects specifically
    if (obj instanceof Date) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.convertKeysToSnakeCase(item));
    }

    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[this.camelToSnake(key)] = this.convertKeysToSnakeCase(value);
    }
    return converted;
  }

  /**
   * Convert object keys from snake_case to camelCase
   */
  protected convertKeysToCamelCase(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    // Handle Date objects by converting to ISO string for consistent serialization
    if (obj instanceof Date) {
      return obj.toISOString();
    }

    if (typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.convertKeysToCamelCase(item));
    }

    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Convert Date objects to ISO strings for date fields
      if (value instanceof Date) {
        converted[this.snakeToCamel(key)] = value.toISOString();
      } else {
        converted[this.snakeToCamel(key)] = this.convertKeysToCamelCase(value);
      }
    }
    return converted;
  }

  /**
   * Find all records
   */
  async findAll(): Promise<T[]> {
    try {
      const result = await db.query(`SELECT * FROM ${this.tableName}`);
      return result.rows.map(row => this.convertKeysToCamelCase(row));
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
      return result.rows[0] ? this.convertKeysToCamelCase(result.rows[0]) : null;
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
      const snakeCaseData = this.convertKeysToSnakeCase(data);
      const columns = Object.keys(snakeCaseData);
      const values = Object.values(snakeCaseData);
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');

      const query = `
        INSERT INTO ${this.tableName} (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;

      const result = await db.query(query, values);
      return this.convertKeysToCamelCase(result.rows[0]);
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
      const snakeCaseData = this.convertKeysToSnakeCase(data);
      const columns = Object.keys(snakeCaseData);
      const values = Object.values(snakeCaseData);
      const setClause = columns.map((col, index) => `${col} = $${index + 1}`).join(', ');

      const query = `
        UPDATE ${this.tableName}
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${columns.length + 1}
        RETURNING *
      `;

      const result = await db.query(query, [...values, id]);
      return result.rows[0] ? this.convertKeysToCamelCase(result.rows[0]) : null;
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
