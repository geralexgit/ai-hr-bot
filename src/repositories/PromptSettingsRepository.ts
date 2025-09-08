import { BaseRepository } from './BaseRepository.js';
import { db } from '../database/connection.js';
import { logger } from '../utils/logger.js';

export interface PromptSetting {
  id: number;
  name: string;
  description?: string;
  promptTemplate: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromptSettingDto {
  name: string;
  description?: string;
  promptTemplate: string;
  category: string;
  isActive?: boolean;
}

export interface UpdatePromptSettingDto {
  name?: string;
  description?: string;
  promptTemplate?: string;
  category?: string;
  isActive?: boolean;
}

export class PromptSettingsRepository extends BaseRepository<PromptSetting, CreatePromptSettingDto, UpdatePromptSettingDto> {
  constructor() {
    super('prompt_settings');
  }

  /**
   * Get all prompt settings (override to add ordering)
   */
  override async findAll(): Promise<PromptSetting[]> {
    try {
      const query = `
        SELECT * FROM ${this.tableName}
        ORDER BY category, name
      `;
      
      const result = await db.query(query);
      return result.rows.map(row => this['convertKeysToCamelCase'](row));
    } catch (error) {
      logger.error(`Error fetching all prompt settings`, { error });
      throw error;
    }
  }

  /**
   * Get prompt settings by category
   */
  async findByCategory(category: string): Promise<PromptSetting[]> {
    try {
      const query = `
        SELECT * FROM ${this.tableName}
        WHERE category = $1
        ORDER BY name
      `;
      
      const result = await db.query(query, [category]);
      return result.rows.map(row => this['convertKeysToCamelCase'](row));
    } catch (error) {
      logger.error(`Error fetching prompt settings by category`, { category, error });
      throw error;
    }
  }

  /**
   * Get prompt setting by name
   */
  async findByName(name: string): Promise<PromptSetting | null> {
    try {
      const query = `
        SELECT * FROM ${this.tableName}
        WHERE name = $1
      `;
      
      const result = await db.query(query, [name]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this['convertKeysToCamelCase'](result.rows[0]);
    } catch (error) {
      logger.error(`Error fetching prompt setting by name`, { name, error });
      throw error;
    }
  }

  /**
   * Get only active prompt settings
   */
  async findActive(): Promise<PromptSetting[]> {
    try {
      const query = `
        SELECT * FROM ${this.tableName}
        WHERE is_active = true
        ORDER BY category, name
      `;
      
      const result = await db.query(query);
      return result.rows.map(row => this['convertKeysToCamelCase'](row));
    } catch (error) {
      logger.error(`Error fetching active prompt settings`, { error });
      throw error;
    }
  }


  /**
   * Get all unique categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const query = `
        SELECT DISTINCT category 
        FROM ${this.tableName}
        ORDER BY category
      `;
      
      const result = await db.query(query);
      return result.rows.map(row => row.category);
    } catch (error) {
      logger.error(`Error fetching prompt categories`, { error });
      throw error;
    }
  }
}
