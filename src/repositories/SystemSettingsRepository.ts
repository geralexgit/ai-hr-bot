import { BaseRepository } from './BaseRepository.js';
import { db } from '../database/connection.js';
import { logger } from '../utils/logger.js';

export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  description?: string;
  category: string;
  valueType: 'string' | 'number' | 'boolean' | 'json';
  isEncrypted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSystemSettingDto {
  key: string;
  value: string;
  description?: string;
  category?: string;
  valueType?: 'string' | 'number' | 'boolean' | 'json';
  isEncrypted?: boolean;
}

export interface UpdateSystemSettingDto {
  value?: string;
  description?: string;
  category?: string;
  valueType?: 'string' | 'number' | 'boolean' | 'json';
  isEncrypted?: boolean;
}

export class SystemSettingsRepository extends BaseRepository<SystemSetting, CreateSystemSettingDto, UpdateSystemSettingDto> {
  constructor() {
    super('system_settings');
  }

  protected get db() {
    return db;
  }
  /**
   * Find all system settings with proper column mapping
   */
  override async findAll(): Promise<SystemSetting[]> {
    try {
      const result = await this.db.query(`
        SELECT 
          id,
          key,
          value,
          description,
          category,
          value_type as "valueType",
          is_encrypted as "isEncrypted",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM system_settings
        ORDER BY category, key
      `);

      return result.rows;
    } catch (error) {
      logger.error('Error fetching all system settings', { error });
      throw error;
    }
  }

  /**
   * Find settings by category
   */
  async findByCategory(category: string): Promise<SystemSetting[]> {
    try {
      const result = await this.db.query(`
        SELECT 
          id,
          key,
          value,
          description,
          category,
          value_type as "valueType",
          is_encrypted as "isEncrypted",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM system_settings
        WHERE category = $1
        ORDER BY key
      `, [category]);

      return result.rows;
    } catch (error) {
      logger.error('Error fetching system settings by category', { category, error });
      throw error;
    }
  }

  /**
   * Find setting by key
   */
  async findByKey(key: string): Promise<SystemSetting | null> {
    try {
      const result = await this.db.query(`
        SELECT 
          id,
          key,
          value,
          description,
          category,
          value_type as "valueType",
          is_encrypted as "isEncrypted",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM system_settings
        WHERE key = $1
      `, [key]);

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error fetching system setting by key', { key, error });
      throw error;
    }
  }

  /**
   * Get setting value by key with type casting
   */
  async getValue<T = string>(key: string, defaultValue?: T): Promise<T> {
    try {
      const setting = await this.findByKey(key);
      
      if (!setting) {
        if (defaultValue !== undefined) {
          return defaultValue;
        }
        throw new Error(`Setting with key '${key}' not found`);
      }

      // Cast value based on type
      switch (setting.valueType) {
        case 'boolean':
          return (setting.value.toLowerCase() === 'true') as unknown as T;
        case 'number':
          return Number(setting.value) as unknown as T;
        case 'json':
          return JSON.parse(setting.value) as T;
        default:
          return setting.value as unknown as T;
      }
    } catch (error) {
      logger.error('Error getting system setting value', { key, error });
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw error;
    }
  }

  /**
   * Create new system setting
   */
  override async create(data: CreateSystemSettingDto): Promise<SystemSetting> {
    try {
      const result = await this.db.query(`
        INSERT INTO system_settings (
          key, value, description, category, value_type, is_encrypted
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING 
          id,
          key,
          value,
          description,
          category,
          value_type as "valueType",
          is_encrypted as "isEncrypted",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `, [
        data.key,
        data.value,
        data.description || null,
        data.category || 'general',
        data.valueType || 'string',
        data.isEncrypted || false
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating system setting', { data, error });
      throw error;
    }
  }

  /**
   * Update system setting by key
   */
  async updateByKey(key: string, data: UpdateSystemSettingDto): Promise<SystemSetting | null> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.value !== undefined) {
        updates.push(`value = $${paramIndex++}`);
        values.push(data.value);
      }

      if (data.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(data.description);
      }

      if (data.category !== undefined) {
        updates.push(`category = $${paramIndex++}`);
        values.push(data.category);
      }

      if (data.valueType !== undefined) {
        updates.push(`value_type = $${paramIndex++}`);
        values.push(data.valueType);
      }

      if (data.isEncrypted !== undefined) {
        updates.push(`is_encrypted = $${paramIndex++}`);
        values.push(data.isEncrypted);
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(key);

      const result = await this.db.query(`
        UPDATE system_settings 
        SET ${updates.join(', ')}
        WHERE key = $${paramIndex}
        RETURNING 
          id,
          key,
          value,
          description,
          category,
          value_type as "valueType",
          is_encrypted as "isEncrypted",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `, values);

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating system setting', { key, data, error });
      throw error;
    }
  }

  /**
   * Delete system setting by key
   */
  async deleteByKey(key: string): Promise<boolean> {
    try {
      const result = await this.db.query(`
        DELETE FROM system_settings WHERE key = $1
      `, [key]);

      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error deleting system setting', { key, error });
      throw error;
    }
  }

  /**
   * Get all unique categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const result = await this.db.query(`
        SELECT DISTINCT category
        FROM system_settings
        ORDER BY category
      `);

      return result.rows.map((row: any) => row.category);
    } catch (error) {
      logger.error('Error fetching system setting categories', { error });
      throw error;
    }
  }

  /**
   * Batch update multiple settings
   */
  async batchUpdate(updates: Array<{ key: string; value: string }>): Promise<void> {
    try {
      await this.db.query('BEGIN');

      for (const update of updates) {
        const result = await this.updateByKey(update.key, { value: update.value });
        if (!result) {
          throw new Error(`Setting with key '${update.key}' not found`);
        }
      }

      await this.db.query('COMMIT');
    } catch (error) {
      await this.db.query('ROLLBACK');
      logger.error('Error batch updating system settings', { updates, error });
      throw error;
    }
  }
}
