import express from 'express';
import { VacancyRepository } from '../repositories/VacancyRepository.js';
import { CandidateRepository } from '../repositories/CandidateRepository.js';
import { EvaluationRepository } from '../repositories/EvaluationRepository.js';
import { ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { db } from '../database/connection.js';

const router = express.Router();
const vacancyRepository = new VacancyRepository();
const candidateRepository = new CandidateRepository();
const evaluationRepository = new EvaluationRepository();

// GET /dashboard/stats - Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Get active vacancies count
    const activeVacanciesResult = await db.query(
      `SELECT COUNT(*) as count FROM vacancies WHERE status = 'active'`
    );
    const activeVacancies = parseInt(activeVacanciesResult.rows[0].count, 10);

    // Get total candidates count
    const totalCandidatesResult = await db.query(
      `SELECT COUNT(*) as count FROM candidates`
    );
    const totalCandidates = parseInt(totalCandidatesResult.rows[0].count, 10);

    // Get interviews today (evaluations created today)
    const interviewsTodayResult = await db.query(`
      SELECT COUNT(*) as count 
      FROM evaluations 
      WHERE DATE(created_at) = CURRENT_DATE
    `);
    const interviewsToday = parseInt(interviewsTodayResult.rows[0].count, 10);

    // Calculate success rate (proceed recommendations / total evaluations)
    const successRateResult = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE recommendation = 'proceed') as proceed_count,
        COUNT(*) as total_count
      FROM evaluations
    `);
    
    const proceedCount = parseInt(successRateResult.rows[0].proceed_count || '0', 10);
    const totalEvaluations = parseInt(successRateResult.rows[0].total_count || '0', 10);
    const successRate = totalEvaluations > 0 ? Math.round((proceedCount / totalEvaluations) * 100) : 0;

    // Get recent activity (last 10 evaluations with candidate and vacancy info)
    const recentActivityResult = await db.query(`
      SELECT 
        e.id,
        e.overall_score,
        e.recommendation,
        e.created_at,
        c.first_name,
        c.last_name,
        c.username,
        v.title as vacancy_title
      FROM evaluations e
      LEFT JOIN candidates c ON e.candidate_id = c.id
      LEFT JOIN vacancies v ON e.vacancy_id = v.id
      ORDER BY e.created_at DESC
      LIMIT 10
    `);

    // Get evaluation distribution by recommendation
    const evaluationDistributionResult = await db.query(`
      SELECT 
        recommendation,
        COUNT(*) as count
      FROM evaluations
      GROUP BY recommendation
    `);

    // Get average scores by category
    const averageScoresResult = await db.query(`
      SELECT 
        ROUND(AVG(overall_score), 1) as avg_overall,
        ROUND(AVG(technical_score), 1) as avg_technical,
        ROUND(AVG(communication_score), 1) as avg_communication,
        ROUND(AVG(problem_solving_score), 1) as avg_problem_solving
      FROM evaluations
      WHERE overall_score IS NOT NULL
    `);

    const response: ApiResponse<any> = {
      success: true,
      data: {
        activeVacancies,
        totalCandidates,
        interviewsToday,
        successRate,
        recentActivity: recentActivityResult.rows,
        evaluationDistribution: evaluationDistributionResult.rows,
        averageScores: averageScoresResult.rows[0] || {
          avg_overall: 0,
          avg_technical: 0,
          avg_communication: 0,
          avg_problem_solving: 0,
        },
      },
    };

    res.json(response);
    return;
  } catch (error) {
    logger.error('Failed to fetch dashboard statistics', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'FETCH_DASHBOARD_STATS_ERROR',
        message: 'Failed to fetch dashboard statistics',
      },
    };

    res.status(500).json(response);
    return;
  }
});

// GET /dashboard/trends - Get trending data for charts
router.get('/trends', async (req, res) => {
  try {
    // Get evaluations by day for the last 30 days
    const evaluationTrendsResult = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE recommendation = 'proceed') as proceed_count,
        COUNT(*) FILTER (WHERE recommendation = 'reject') as reject_count,
        COUNT(*) FILTER (WHERE recommendation = 'clarify') as clarify_count
      FROM evaluations
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    // Get candidates registered by day for the last 30 days
    const candidateTrendsResult = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM candidates
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    // Get average scores by day for the last 30 days
    const scoreTrendsResult = await db.query(`
      SELECT 
        DATE(created_at) as date,
        ROUND(AVG(overall_score), 1) as avg_score
      FROM evaluations
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        AND overall_score IS NOT NULL
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    const response: ApiResponse<any> = {
      success: true,
      data: {
        evaluationTrends: evaluationTrendsResult.rows,
        candidateTrends: candidateTrendsResult.rows,
        scoreTrends: scoreTrendsResult.rows,
      },
    };

    res.json(response);
    return;
  } catch (error) {
    logger.error('Failed to fetch dashboard trends', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'FETCH_DASHBOARD_TRENDS_ERROR',
        message: 'Failed to fetch dashboard trends',
      },
    };

    res.status(500).json(response);
    return;
  }
});

export default router;
