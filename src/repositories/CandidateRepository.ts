import { BaseRepository } from './BaseRepository.js';
import { Candidate, CreateCandidateDto, UpdateCandidateDto } from '../types/index.js';
import { db } from '../database/connection.js';
import { logger } from '../utils/logger.js';

export class CandidateRepository extends BaseRepository<Candidate, CreateCandidateDto, UpdateCandidateDto> {
  constructor() {
    super('candidates');
  }

  /**
   * Find candidate by Telegram user ID
   */
  async findByTelegramUserId(telegramUserId: number): Promise<Candidate | null> {
    try {
      const result = await db.query(`SELECT * FROM ${this.tableName} WHERE telegram_user_id = $1`, [telegramUserId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Failed to find candidate by Telegram user ID`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        telegramUserId,
      });
      throw error;
    }
  }

  /**
   * Find or create candidate by Telegram user ID
   */
  async findOrCreateByTelegramUserId(telegramUserId: number, firstName?: string, lastName?: string, username?: string): Promise<Candidate> {
    try {
      let candidate = await this.findByTelegramUserId(telegramUserId);
      if (!candidate) {
        const createData: CreateCandidateDto = { telegramUserId };
        if (firstName) createData.firstName = firstName;
        if (lastName) createData.lastName = lastName;
        if (username) createData.username = username;
        
        candidate = await this.create(createData);
      }
      return candidate;
    } catch (error) {
      logger.error(`Failed to find or create candidate by Telegram user ID`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        telegramUserId,
      });
      throw error;
    }
  }

  /**
   * Update candidate information
   */
  async updateByTelegramUserId(telegramUserId: number, data: Partial<CreateCandidateDto>): Promise<Candidate | null> {
    try {
      const candidate = await this.findByTelegramUserId(telegramUserId);
      if (!candidate) {
        return null;
      }
      return await this.update(candidate.id, data as UpdateCandidateDto);
    } catch (error) {
      logger.error(`Failed to update candidate by Telegram user ID`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        telegramUserId,
        data,
      });
      throw error;
    }
  }
}
