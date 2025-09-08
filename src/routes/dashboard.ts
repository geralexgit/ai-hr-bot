import express from 'express';
import { VacancyRepository } from '../repositories/VacancyRepository.js';
import { CandidateRepository } from '../repositories/CandidateRepository.js';
import { EvaluationRepository } from '../repositories/EvaluationRepository.js';
import { DialogueRepository } from '../repositories/DialogueRepository.js';
import { ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { db } from '../database/connection.js';

const router = express.Router();
const vacancyRepository = new VacancyRepository();
const candidateRepository = new CandidateRepository();
const evaluationRepository = new EvaluationRepository();
const dialogueRepository = new DialogueRepository();

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

    // Get interviews today (unique candidate-vacancy dialogue sessions started today)
    const interviewsTodayResult = await db.query(`
      SELECT COUNT(DISTINCT (candidate_id, vacancy_id)) as count 
      FROM dialogues 
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

// GET /dashboard/candidates - Get candidates list with vacancy information
router.get('/candidates', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Get candidates with all their vacancy applications and evaluations
    const candidatesResult = await db.query(`
      SELECT 
        c.id,
        c.telegram_user_id,
        c.first_name,
        c.last_name,
        c.username,
        c.cv_file_path,
        c.cv_file_name,
        c.cv_file_size,
        c.cv_uploaded_at,
        c.created_at,
        COUNT(*) OVER() as total_count
      FROM candidates c
      ORDER BY c.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    // Get all applications (vacancy dialogues) for these candidates
    const candidateIds = candidatesResult.rows.map(row => row.id);
    let applications: any[] = [];
    
    if (candidateIds.length > 0) {
      const applicationsResult = await db.query(`
        SELECT DISTINCT ON (d.candidate_id, d.vacancy_id)
          d.candidate_id,
          d.vacancy_id,
          v.title as vacancy_title,
          e.id as evaluation_id,
          e.overall_score,
          e.recommendation,
          e.created_at as evaluation_date,
          d.created_at as application_date
        FROM dialogues d
        LEFT JOIN vacancies v ON d.vacancy_id = v.id
        LEFT JOIN evaluations e ON d.candidate_id = e.candidate_id AND d.vacancy_id = e.vacancy_id
        WHERE d.candidate_id = ANY($1)
        ORDER BY d.candidate_id, d.vacancy_id, d.created_at DESC
      `, [candidateIds]);
      
      applications = applicationsResult.rows;
    }

    const totalCandidates = candidatesResult.rows.length > 0 
      ? parseInt(candidatesResult.rows[0].total_count, 10) 
      : 0;
    
    const totalPages = Math.ceil(totalCandidates / limit);

    // Group applications by candidate
    const applicationsMap = new Map<number, any[]>();
    applications.forEach(app => {
      if (!applicationsMap.has(app.candidate_id)) {
        applicationsMap.set(app.candidate_id, []);
      }
      applicationsMap.get(app.candidate_id)!.push({
        vacancy: {
          id: app.vacancy_id,
          title: app.vacancy_title,
        },
        evaluation: app.evaluation_id ? {
          id: app.evaluation_id,
          overallScore: app.overall_score,
          recommendation: app.recommendation,
          evaluationDate: app.evaluation_date,
        } : null,
        applicationDate: app.application_date,
      });
    });

    const candidates = candidatesResult.rows.map(row => ({
      id: row.id,
      telegramUserId: row.telegram_user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      username: row.username,
      cvFilePath: row.cv_file_path,
      cvFileName: row.cv_file_name,
      cvFileSize: row.cv_file_size,
      cvUploadedAt: row.cv_uploaded_at,
      createdAt: row.created_at,
      applications: applicationsMap.get(row.id) || [],
      // Keep legacy fields for backward compatibility
      vacancy: applicationsMap.get(row.id)?.[0]?.vacancy || null,
      evaluation: applicationsMap.get(row.id)?.[0]?.evaluation || null,
    }));

    const response: ApiResponse<any> = {
      success: true,
      data: {
        candidates,
        pagination: {
          page,
          limit,
          total: totalCandidates,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    };

    res.json(response);
    return;
  } catch (error) {
    logger.error('Failed to fetch candidates list', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'FETCH_CANDIDATES_ERROR',
        message: 'Failed to fetch candidates list',
      },
    };

    res.status(500).json(response);
    return;
  }
});

// GET /dashboard/candidates/:candidateId/dialogues - Get dialogue history for a candidate
router.get('/candidates/:candidateId/dialogues', async (req, res) => {
  try {
    const candidateId = parseInt(req.params.candidateId);
    const vacancyId = req.query.vacancyId ? parseInt(req.query.vacancyId as string) : null;
    
    if (isNaN(candidateId)) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'INVALID_CANDIDATE_ID',
          message: 'Invalid candidate ID provided',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Verify candidate exists
    const candidate = await candidateRepository.findById(candidateId);
    if (!candidate) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'CANDIDATE_NOT_FOUND',
          message: 'Candidate not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    let dialogues;
    let vacancy = null;

    if (vacancyId) {
      // Get dialogues for specific vacancy
      if (isNaN(vacancyId)) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            code: 'INVALID_VACANCY_ID',
            message: 'Invalid vacancy ID provided',
          },
        };
        res.status(400).json(response);
        return;
      }

      // Verify vacancy exists
      vacancy = await vacancyRepository.findById(vacancyId);
      if (!vacancy) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            code: 'VACANCY_NOT_FOUND',
            message: 'Vacancy not found',
          },
        };
        res.status(404).json(response);
        return;
      }

      dialogues = await dialogueRepository.getConversationHistory(candidateId, vacancyId, 100);
    } else {
      // Get all dialogues for candidate
      dialogues = await dialogueRepository.findByCandidateId(candidateId);
    }

    // Get vacancy information for each dialogue if not already provided
    const vacancyIds = [...new Set(dialogues.map(d => d.vacancyId))];
    const vacancies = await Promise.all(
      vacancyIds.map(id => vacancyRepository.findById(id))
    );
    const vacancyMap = new Map(vacancies.filter(v => v).map(v => [v!.id, v!]));

    // Enrich dialogues with vacancy information
    const enrichedDialogues = dialogues.map(dialogue => ({
      ...dialogue,
      vacancy: vacancyMap.get(dialogue.vacancyId) || null,
    }));

    const response: ApiResponse<any> = {
      success: true,
      data: {
        candidate,
        vacancy,
        dialogues: enrichedDialogues,
        totalMessages: dialogues.length,
      },
    };

    res.json(response);
    return;
  } catch (error) {
    logger.error('Failed to fetch candidate dialogues', {
      error: error instanceof Error ? error.message : 'Unknown error',
      candidateId: req.params.candidateId,
      vacancyId: req.query.vacancyId,
    });

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'FETCH_DIALOGUES_ERROR',
        message: 'Failed to fetch candidate dialogues',
      },
    };

    res.status(500).json(response);
    return;
  }
});

export default router;
