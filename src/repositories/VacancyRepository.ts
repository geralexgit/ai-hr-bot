import { BaseRepository } from './BaseRepository.js';
import { Vacancy, CreateVacancyDto, UpdateVacancyDto } from '../types/index.js';
import { db } from '../database/connection.js';
import { logger } from '../utils/logger.js';

export class VacancyRepository extends BaseRepository<Vacancy, CreateVacancyDto, UpdateVacancyDto> {
  constructor() {
    super('vacancies');
  }

  /**
   * Find all active vacancies
   */
  async findActive(): Promise<Vacancy[]> {
    try {
      const result = await db.query(`SELECT * FROM ${this.tableName} WHERE status = 'active'`);
      return result.rows;
    } catch (error) {
      logger.error(`Failed to find active vacancies`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Find vacancies by status
   */
  async findByStatus(status: 'active' | 'inactive'): Promise<Vacancy[]> {
    try {
      const result = await db.query(`SELECT * FROM ${this.tableName} WHERE status = $1`, [status]);
      return result.rows;
    } catch (error) {
      logger.error(`Failed to find vacancies by status`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        status,
      });
      throw error;
    }
  }

  /**
   * Search vacancies by title or description
   */
  async search(query: string): Promise<Vacancy[]> {
    try {
      const result = await db.query(
        `SELECT * FROM ${this.tableName} WHERE title ILIKE $1 OR description ILIKE $1`,
        [`%${query}%`]
      );
      return result.rows;
    } catch (error) {
      logger.error(`Failed to search vacancies`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        query,
      });
      throw error;
    }
  }
}
