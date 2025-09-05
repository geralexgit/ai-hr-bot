import { BaseRepository } from './BaseRepository.js';
import { Dialogue, CreateDialogueDto, UpdateDialogueDto } from '../types/index.js';
import { db } from '../database/connection.js';
import { logger } from '../utils/logger.js';

export class DialogueRepository extends BaseRepository<Dialogue, CreateDialogueDto, UpdateDialogueDto> {
  constructor() {
    super('dialogues');
  }

  /**
   * Find dialogues by candidate ID
   */
  async findByCandidateId(candidateId: number): Promise<Dialogue[]> {
    try {
      const result = await db.query(`SELECT * FROM ${this.tableName} WHERE candidate_id = $1 ORDER BY created_at ASC`, [candidateId]);
      return result.rows;
    } catch (error) {
      logger.error(`Failed to find dialogues by candidate ID`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
      });
      throw error;
    }
  }

  /**
   * Find dialogues by vacancy ID
   */
  async findByVacancyId(vacancyId: number): Promise<Dialogue[]> {
    try {
      const result = await db.query(`SELECT * FROM ${this.tableName} WHERE vacancy_id = $1 ORDER BY created_at ASC`, [vacancyId]);
      return result.rows;
    } catch (error) {
      logger.error(`Failed to find dialogues by vacancy ID`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        vacancyId,
      });
      throw error;
    }
  }

  /**
   * Find dialogues by candidate and vacancy
   */
  async findByCandidateAndVacancy(candidateId: number, vacancyId: number): Promise<Dialogue[]> {
    try {
      const result = await db.query(
        `SELECT * FROM ${this.tableName} WHERE candidate_id = $1 AND vacancy_id = $2 ORDER BY created_at ASC`,
        [candidateId, vacancyId]
      );
      return result.rows;
    } catch (error) {
      logger.error(`Failed to find dialogues by candidate and vacancy`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        vacancyId,
      });
      throw error;
    }
  }

  /**
   * Find dialogues by message type
   */
  async findByMessageType(messageType: 'text' | 'audio' | 'system'): Promise<Dialogue[]> {
    try {
      const result = await db.query(`SELECT * FROM ${this.tableName} WHERE message_type = $1 ORDER BY created_at ASC`, [messageType]);
      return result.rows;
    } catch (error) {
      logger.error(`Failed to find dialogues by message type`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        messageType,
      });
      throw error;
    }
  }

  /**
   * Find dialogues by sender
   */
  async findBySender(sender: 'candidate' | 'bot'): Promise<Dialogue[]> {
    try {
      const result = await db.query(`SELECT * FROM ${this.tableName} WHERE sender = $1 ORDER BY created_at ASC`, [sender]);
      return result.rows;
    } catch (error) {
      logger.error(`Failed to find dialogues by sender`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        sender,
      });
      throw error;
    }
  }

  /**
   * Get conversation history for a candidate-vacancy pair
   */
  async getConversationHistory(candidateId: number, vacancyId: number, limit: number = 50): Promise<Dialogue[]> {
    try {
      const result = await db.query(
        `SELECT * FROM ${this.tableName} WHERE candidate_id = $1 AND vacancy_id = $2 ORDER BY created_at DESC LIMIT $3`,
        [candidateId, vacancyId, limit]
      );
      return result.rows.reverse(); // Return in chronological order
    } catch (error) {
      logger.error(`Failed to get conversation history`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        vacancyId,
        limit,
      });
      throw error;
    }
  }

  /**
   * Count dialogues for a candidate-vacancy pair
   */
  async countByCandidateAndVacancy(candidateId: number, vacancyId: number): Promise<number> {
    try {
      const result = await db.query(
        `SELECT COUNT(*) as count FROM ${this.tableName} WHERE candidate_id = $1 AND vacancy_id = $2`,
        [candidateId, vacancyId]
      );
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error(`Failed to count dialogues by candidate and vacancy`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        vacancyId,
      });
      throw error;
    }
  }
}
