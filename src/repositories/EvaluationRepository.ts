import { BaseRepository } from './BaseRepository.js';
import { Evaluation, CreateEvaluationDto, UpdateEvaluationDto } from '../types/index.js';
import { db } from '../database/connection.js';
import { logger } from '../utils/logger.js';

export class EvaluationRepository extends BaseRepository<Evaluation, CreateEvaluationDto, UpdateEvaluationDto> {
  constructor() {
    super('evaluations');
  }

  /**
   * Find evaluation by candidate and vacancy
   */
  async findByCandidateAndVacancy(candidateId: number, vacancyId: number): Promise<Evaluation | null> {
    try {
      const result = await db.query(
        `SELECT * FROM ${this.tableName} WHERE candidate_id = $1 AND vacancy_id = $2`,
        [candidateId, vacancyId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Failed to find evaluation by candidate and vacancy`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        vacancyId,
      });
      throw error;
    }
  }

  /**
   * Find evaluations by candidate ID
   */
  async findByCandidateId(candidateId: number): Promise<Evaluation[]> {
    try {
      const result = await db.query(`SELECT * FROM ${this.tableName} WHERE candidate_id = $1 ORDER BY created_at DESC`, [candidateId]);
      return result.rows.map(row => this.convertKeysToCamelCase(row));
    } catch (error) {
      logger.error(`Failed to find evaluations by candidate ID`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
      });
      throw error;
    }
  }

  /**
   * Find evaluations by vacancy ID
   */
  async findByVacancyId(vacancyId: number): Promise<Evaluation[]> {
    try {
      const result = await db.query(`SELECT * FROM ${this.tableName} WHERE vacancy_id = $1 ORDER BY created_at DESC`, [vacancyId]);
      return result.rows.map(row => this.convertKeysToCamelCase(row));
    } catch (error) {
      logger.error(`Failed to find evaluations by vacancy ID`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        vacancyId,
      });
      throw error;
    }
  }

  /**
   * Find evaluations by recommendation
   */
  async findByRecommendation(recommendation: 'proceed' | 'reject' | 'clarify'): Promise<Evaluation[]> {
    try {
      const result = await db.query(`SELECT * FROM ${this.tableName} WHERE recommendation = $1 ORDER BY created_at DESC`, [recommendation]);
      return result.rows.map(row => this.convertKeysToCamelCase(row));
    } catch (error) {
      logger.error(`Failed to find evaluations by recommendation`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        recommendation,
      });
      throw error;
    }
  }

  /**
   * Find evaluations with score above threshold
   */
  async findByMinScore(minScore: number): Promise<Evaluation[]> {
    try {
      const result = await db.query(`SELECT * FROM ${this.tableName} WHERE overall_score >= $1 ORDER BY overall_score DESC`, [minScore]);
      return result.rows.map(row => this.convertKeysToCamelCase(row));
    } catch (error) {
      logger.error(`Failed to find evaluations by minimum score`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        minScore,
      });
      throw error;
    }
  }

  /**
   * Get average scores for a vacancy
   */
  async getAverageScoresByVacancy(vacancyId: number): Promise<{
    averageOverall: number;
    averageTechnical: number;
    averageCommunication: number;
    averageProblemSolving: number;
    totalEvaluations: number;
  } | null> {
    try {
      const result = await db.query(
        `SELECT
          AVG(overall_score) as average_overall,
          AVG(technical_score) as average_technical,
          AVG(communication_score) as average_communication,
          AVG(problem_solving_score) as average_problem_solving,
          COUNT(*) as total_evaluations
        FROM ${this.tableName} WHERE vacancy_id = $1`,
        [vacancyId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        averageOverall: parseFloat(row.average_overall) || 0,
        averageTechnical: parseFloat(row.average_technical) || 0,
        averageCommunication: parseFloat(row.average_communication) || 0,
        averageProblemSolving: parseFloat(row.average_problem_solving) || 0,
        totalEvaluations: parseInt(row.total_evaluations, 10),
      };
    } catch (error) {
      logger.error(`Failed to get average scores by vacancy`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        vacancyId,
      });
      throw error;
    }
  }

  /**
   * Get evaluation statistics
   */
  async getStatistics(): Promise<{
    totalEvaluations: number;
    averageOverallScore: number;
    recommendationCounts: { [key: string]: number };
  }> {
    try {
      // Total evaluations and average score
      const statsResult = await db.query(
        `SELECT COUNT(*) as total, AVG(overall_score) as average_score FROM ${this.tableName}`
      );

      // Recommendation counts
      const recommendationResult = await db.query(
        `SELECT recommendation, COUNT(*) as count FROM ${this.tableName} GROUP BY recommendation`
      );

      const recommendationCounts: { [key: string]: number } = {};
      recommendationResult.rows.forEach(row => {
        recommendationCounts[row.recommendation] = parseInt(row.count, 10);
      });

      return {
        totalEvaluations: parseInt(statsResult.rows[0].total, 10),
        averageOverallScore: parseFloat(statsResult.rows[0].average_score) || 0,
        recommendationCounts,
      };
    } catch (error) {
      logger.error(`Failed to get evaluation statistics`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Create or update evaluation (upsert)
   */
  async upsert(candidateId: number, vacancyId: number, data: CreateEvaluationDto): Promise<Evaluation> {
    try {
      const existing = await this.findByCandidateAndVacancy(candidateId, vacancyId);
      if (existing) {
        const updated = await this.update(existing.id, data as UpdateEvaluationDto);
        if (!updated) {
          throw new Error('Failed to update existing evaluation');
        }
        return updated;
      } else {
        return await this.create(data);
      }
    } catch (error) {
      logger.error(`Failed to upsert evaluation`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        vacancyId,
      });
      throw error;
    }
  }
}
