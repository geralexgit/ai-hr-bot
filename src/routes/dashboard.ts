import express from 'express';
import { db } from '../database/connection.js';
import { ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

export interface DashboardStats {
  activeVacancies: number;
  totalCandidates: number;
  interviewsToday: number;
  successRate: number;
  totalEvaluations: number;
  recentActivity: {
    newCandidatesThisWeek: number;
    newEvaluationsThisWeek: number;
    activeDialogues: number;
  };
  evaluationBreakdown: {
    proceed: number;
    reject: number;
    clarify: number;
  };
}

// GET /dashboard/stats - Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    logger.info('Fetching dashboard statistics');

    // Get active vacancies count
    const activeVacanciesResult = await db.query(
      'SELECT COUNT(*) as count FROM vacancies WHERE status = $1',
      ['active']
    );
    const activeVacancies = parseInt(activeVacanciesResult.rows[0].count, 10);

    // Get total candidates count
    const totalCandidatesResult = await db.query(
      'SELECT COUNT(*) as count FROM candidates'
    );
    const totalCandidates = parseInt(totalCandidatesResult.rows[0].count, 10);

    // Get evaluations created today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const interviewsTodayResult = await db.query(
      'SELECT COUNT(*) as count FROM evaluations WHERE created_at >= $1 AND created_at <= $2',
      [todayStart, todayEnd]
    );
    const interviewsToday = parseInt(interviewsTodayResult.rows[0].count, 10);

    // Get total evaluations count
    const totalEvaluationsResult = await db.query(
      'SELECT COUNT(*) as count FROM evaluations'
    );
    const totalEvaluations = parseInt(totalEvaluationsResult.rows[0].count, 10);

    // Get success rate (percentage of "proceed" recommendations)
    const successRateResult = await db.query(`
      SELECT 
        COUNT(CASE WHEN recommendation = 'proceed' THEN 1 END) as proceed_count,
        COUNT(*) as total_count
      FROM evaluations
      WHERE recommendation IS NOT NULL
    `);
    
    const proceedCount = parseInt(successRateResult.rows[0].proceed_count, 10);
    const totalWithRecommendations = parseInt(successRateResult.rows[0].total_count, 10);
    const successRate = totalWithRecommendations > 0 
      ? Math.round((proceedCount / totalWithRecommendations) * 100) 
      : 0;

    // Get recent activity (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const newCandidatesResult = await db.query(
      'SELECT COUNT(*) as count FROM candidates WHERE created_at >= $1',
      [weekAgo]
    );
    const newCandidatesThisWeek = parseInt(newCandidatesResult.rows[0].count, 10);

    const newEvaluationsResult = await db.query(
      'SELECT COUNT(*) as count FROM evaluations WHERE created_at >= $1',
      [weekAgo]
    );
    const newEvaluationsThisWeek = parseInt(newEvaluationsResult.rows[0].count, 10);

    // Get active dialogues (dialogues with activity in last 24 hours)
    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);

    const activeDialoguesResult = await db.query(
      'SELECT COUNT(DISTINCT candidate_id) as count FROM dialogues WHERE created_at >= $1',
      [dayAgo]
    );
    const activeDialogues = parseInt(activeDialoguesResult.rows[0].count, 10);

    // Get evaluation breakdown
    const evaluationBreakdownResult = await db.query(`
      SELECT 
        recommendation,
        COUNT(*) as count
      FROM evaluations 
      WHERE recommendation IS NOT NULL
      GROUP BY recommendation
    `);

    const evaluationBreakdown = {
      proceed: 0,
      reject: 0,
      clarify: 0,
    };

    evaluationBreakdownResult.rows.forEach(row => {
      if (row.recommendation === 'proceed') {
        evaluationBreakdown.proceed = parseInt(row.count, 10);
      } else if (row.recommendation === 'reject') {
        evaluationBreakdown.reject = parseInt(row.count, 10);
      } else if (row.recommendation === 'clarify') {
        evaluationBreakdown.clarify = parseInt(row.count, 10);
      }
    });

    const stats: DashboardStats = {
      activeVacancies,
      totalCandidates,
      interviewsToday,
      successRate,
      totalEvaluations,
      recentActivity: {
        newCandidatesThisWeek,
        newEvaluationsThisWeek,
        activeDialogues,
      },
      evaluationBreakdown,
    };

    const response: ApiResponse<DashboardStats> = {
      success: true,
      data: stats,
    };

    logger.info('Dashboard statistics fetched successfully', { stats });
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

// GET /dashboard/recent-candidates - Get recent candidates
router.get('/recent-candidates', async (req, res) => {
  try {
    const { limit = '10' } = req.query;
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));

    const recentCandidatesResult = await db.query(`
      SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.username,
        c.created_at,
        e.overall_score,
        e.recommendation
      FROM candidates c
      LEFT JOIN evaluations e ON c.id = e.candidate_id
      ORDER BY c.created_at DESC
      LIMIT $1
    `, [limitNum]);

    const candidates = recentCandidatesResult.rows.map(row => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      username: row.username,
      createdAt: row.created_at,
      latestEvaluation: row.overall_score ? {
        overallScore: row.overall_score,
        recommendation: row.recommendation,
      } : null,
    }));

    const response: ApiResponse<any[]> = {
      success: true,
      data: candidates,
    };

    res.json(response);
    return;
  } catch (error) {
    logger.error('Failed to fetch recent candidates', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'FETCH_RECENT_CANDIDATES_ERROR',
        message: 'Failed to fetch recent candidates',
      },
    };

    res.status(500).json(response);
    return;
  }
});

// GET /dashboard/recent-evaluations - Get recent evaluations
router.get('/recent-evaluations', async (req, res) => {
  try {
    const { limit = '10' } = req.query;
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));

    const recentEvaluationsResult = await db.query(`
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
      JOIN candidates c ON e.candidate_id = c.id
      JOIN vacancies v ON e.vacancy_id = v.id
      ORDER BY e.created_at DESC
      LIMIT $1
    `, [limitNum]);

    const evaluations = recentEvaluationsResult.rows.map(row => ({
      id: row.id,
      overallScore: row.overall_score,
      recommendation: row.recommendation,
      createdAt: row.created_at,
      candidate: {
        firstName: row.first_name,
        lastName: row.last_name,
        username: row.username,
      },
      vacancyTitle: row.vacancy_title,
    }));

    const response: ApiResponse<any[]> = {
      success: true,
      data: evaluations,
    };

    res.json(response);
    return;
  } catch (error) {
    logger.error('Failed to fetch recent evaluations', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'FETCH_RECENT_EVALUATIONS_ERROR',
        message: 'Failed to fetch recent evaluations',
      },
    };

    res.status(500).json(response);
    return;
  }
});

export default router;
