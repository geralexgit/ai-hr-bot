import express from 'express';
import { EvaluationRepository } from '../repositories/EvaluationRepository.js';
import { CandidateRepository } from '../repositories/CandidateRepository.js';
import { VacancyRepository } from '../repositories/VacancyRepository.js';
import { Evaluation, PaginationOptions, PaginatedResponse, ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { db } from '../database/connection.js';

const router = express.Router();
const evaluationRepository = new EvaluationRepository();
const candidateRepository = new CandidateRepository();
const vacancyRepository = new VacancyRepository();

// GET /evaluations - List all evaluations with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      candidateId,
      vacancyId,
      recommendation,
      minScore,
      maxScore,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const offset = (pageNum - 1) * limitNum;

    // Build the base query with joins for candidate and vacancy data
    let baseQuery = `
      FROM evaluations e
      LEFT JOIN candidates c ON e.candidate_id = c.id
      LEFT JOIN vacancies v ON e.vacancy_id = v.id
      WHERE 1=1
    `;
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Add filters
    if (candidateId) {
      baseQuery += ` AND e.candidate_id = $${paramIndex}`;
      queryParams.push(parseInt(candidateId as string, 10));
      paramIndex++;
    }

    if (vacancyId) {
      baseQuery += ` AND e.vacancy_id = $${paramIndex}`;
      queryParams.push(parseInt(vacancyId as string, 10));
      paramIndex++;
    }

    if (recommendation && ['proceed', 'reject', 'clarify'].includes(recommendation as string)) {
      baseQuery += ` AND e.recommendation = $${paramIndex}`;
      queryParams.push(recommendation);
      paramIndex++;
    }

    if (minScore) {
      baseQuery += ` AND e.overall_score >= $${paramIndex}`;
      queryParams.push(parseInt(minScore as string, 10));
      paramIndex++;
    }

    if (maxScore) {
      baseQuery += ` AND e.overall_score <= $${paramIndex}`;
      queryParams.push(parseInt(maxScore as string, 10));
      paramIndex++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get evaluations with candidate and vacancy data
    const evaluationsQuery = `
      SELECT 
        e.id,
        e.candidate_id,
        e.vacancy_id,
        e.overall_score,
        e.technical_score,
        e.communication_score,
        e.problem_solving_score,
        e.strengths,
        e.gaps,
        e.contradictions,
        e.recommendation,
        e.feedback,
        e.analysis_data,
        e.created_at,
        e.updated_at,
        c.first_name as candidate_first_name,
        c.last_name as candidate_last_name,
        c.username as candidate_username,
        v.title as vacancy_title
      ${baseQuery}
      ORDER BY e.${sortBy} ${(sortOrder as string).toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limitNum, offset);

    const evaluationsResult = await db.query(evaluationsQuery, queryParams);
    const evaluations = evaluationsResult.rows.map(row => ({
      id: row.id,
      candidateId: row.candidate_id,
      vacancyId: row.vacancy_id,
      overallScore: row.overall_score,
      technicalScore: row.technical_score,
      communicationScore: row.communication_score,
      problemSolvingScore: row.problem_solving_score,
      strengths: row.strengths,
      gaps: row.gaps,
      contradictions: row.contradictions,
      recommendation: row.recommendation,
      feedback: row.feedback,
      analysisData: row.analysis_data,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      candidate: {
        id: row.candidate_id,
        firstName: row.candidate_first_name,
        lastName: row.candidate_last_name,
        username: row.candidate_username,
      },
      vacancy: {
        id: row.vacancy_id,
        title: row.vacancy_title,
      },
    }));

    const totalPages = Math.ceil(total / limitNum);

    const response: ApiResponse<PaginatedResponse<Evaluation & { candidate: any, vacancy: any }>> = {
      success: true,
      data: {
        data: evaluations,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
    };

    res.json(response);
    return;
  } catch (error) {
    logger.error('Failed to fetch evaluations', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'FETCH_EVALUATIONS_ERROR',
        message: 'Failed to fetch evaluations',
      },
    };

    res.status(500).json(response);
    return;
  }
});

// GET /evaluations/statistics - Get evaluation statistics
router.get('/statistics/overview', async (req, res) => {
  try {
    const stats = await evaluationRepository.getStatistics();

    // Get additional statistics
    const scoreDistribution = await db.query(`
      SELECT 
        CASE 
          WHEN overall_score >= 80 THEN 'excellent'
          WHEN overall_score >= 60 THEN 'good'
          WHEN overall_score >= 40 THEN 'fair'
          ELSE 'poor'
        END as score_range,
        COUNT(*) as count
      FROM evaluations 
      GROUP BY score_range
      ORDER BY 
        CASE score_range
          WHEN 'excellent' THEN 1
          WHEN 'good' THEN 2
          WHEN 'fair' THEN 3
          WHEN 'poor' THEN 4
        END
    `);

    const recentEvaluations = await db.query(`
      SELECT 
        e.overall_score,
        e.recommendation,
        e.created_at,
        c.first_name,
        c.last_name,
        v.title as vacancy_title
      FROM evaluations e
      LEFT JOIN candidates c ON e.candidate_id = c.id
      LEFT JOIN vacancies v ON e.vacancy_id = v.id
      ORDER BY e.created_at DESC
      LIMIT 10
    `);

    const response: ApiResponse<any> = {
      success: true,
      data: {
        ...stats,
        scoreDistribution: scoreDistribution.rows,
        recentEvaluations: recentEvaluations.rows,
      },
    };

    res.json(response);
    return;
  } catch (error) {
    logger.error('Failed to fetch evaluation statistics', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'FETCH_STATISTICS_ERROR',
        message: 'Failed to fetch evaluation statistics',
      },
    };

    res.status(500).json(response);
    return;
  }
});

// GET /evaluations/:id - Get single evaluation with detailed information
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid evaluation ID',
        },
      };
      return res.status(400).json(response);
    }

    const evaluation = await evaluationRepository.findById(id);
    if (!evaluation) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'EVALUATION_NOT_FOUND',
          message: 'Evaluation not found',
        },
      };
      return res.status(404).json(response);
    }

    // Get candidate and vacancy details
    const candidate = await candidateRepository.findById(evaluation.candidateId);
    const vacancy = await vacancyRepository.findById(evaluation.vacancyId);

    const response: ApiResponse<Evaluation & { candidate: any, vacancy: any }> = {
      success: true,
      data: {
        ...evaluation,
        candidate,
        vacancy,
      },
    };

    res.json(response);
    return;
  } catch (error) {
    logger.error('Failed to fetch evaluation', {
      error: error instanceof Error ? error.message : 'Unknown error',
      id: req.params.id,
    });

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'FETCH_EVALUATION_ERROR',
        message: 'Failed to fetch evaluation',
      },
    };

    res.status(500).json(response);
    return;
  }
});

// GET /evaluations/vacancy/:vacancyId - Get evaluations for a specific vacancy
router.get('/vacancy/:vacancyId', async (req, res) => {
  try {
    const vacancyId = parseInt(req.params.vacancyId);
    if (isNaN(vacancyId)) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid vacancy ID',
        },
      };
      return res.status(400).json(response);
    }

    const vacancy = await vacancyRepository.findById(vacancyId);
    if (!vacancy) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VACANCY_NOT_FOUND',
          message: 'Vacancy not found',
        },
      };
      return res.status(404).json(response);
    }

    const evaluations = await evaluationRepository.findByVacancyId(vacancyId);
    const averageScores = await evaluationRepository.getAverageScoresByVacancy(vacancyId);

    const response: ApiResponse<any> = {
      success: true,
      data: {
        vacancy,
        evaluations,
        averageScores,
      },
    };

    res.json(response);
    return;
  } catch (error) {
    logger.error('Failed to fetch vacancy evaluations', {
      error: error instanceof Error ? error.message : 'Unknown error',
      vacancyId: req.params.vacancyId,
    });

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'FETCH_VACANCY_EVALUATIONS_ERROR',
        message: 'Failed to fetch vacancy evaluations',
      },
    };

    res.status(500).json(response);
    return;
  }
});

// GET /evaluations/candidate/:candidateId - Get evaluations for a specific candidate
router.get('/candidate/:candidateId', async (req, res) => {
  try {
    const candidateId = parseInt(req.params.candidateId);
    if (isNaN(candidateId)) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid candidate ID',
        },
      };
      return res.status(400).json(response);
    }

    const candidate = await candidateRepository.findById(candidateId);
    if (!candidate) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'CANDIDATE_NOT_FOUND',
          message: 'Candidate not found',
        },
      };
      return res.status(404).json(response);
    }

    const evaluations = await evaluationRepository.findByCandidateId(candidateId);

    const response: ApiResponse<any> = {
      success: true,
      data: {
        candidate,
        evaluations,
      },
    };

    res.json(response);
    return;
  } catch (error) {
    logger.error('Failed to fetch candidate evaluations', {
      error: error instanceof Error ? error.message : 'Unknown error',
      candidateId: req.params.candidateId,
    });

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'FETCH_CANDIDATE_EVALUATIONS_ERROR',
        message: 'Failed to fetch candidate evaluations',
      },
    };

    res.status(500).json(response);
    return;
  }
});

// PUT /evaluations/:id - Update evaluation
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid evaluation ID',
        },
      };
      return res.status(400).json(response);
    }

    const updateData = req.body;
    const evaluation = await evaluationRepository.update(id, updateData);
    
    if (!evaluation) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'EVALUATION_NOT_FOUND',
          message: 'Evaluation not found',
        },
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<Evaluation> = {
      success: true,
      data: evaluation,
      message: 'Evaluation updated successfully',
    };

    res.json(response);
    return;
  } catch (error) {
    logger.error('Failed to update evaluation', {
      error: error instanceof Error ? error.message : 'Unknown error',
      id: req.params.id,
    });

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'UPDATE_EVALUATION_ERROR',
        message: 'Failed to update evaluation',
      },
    };

    res.status(500).json(response);
    return;
  }
});

// DELETE /evaluations/:id - Delete evaluation
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid evaluation ID',
        },
      };
      return res.status(400).json(response);
    }

    const deleted = await evaluationRepository.delete(id);
    if (!deleted) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'EVALUATION_NOT_FOUND',
          message: 'Evaluation not found',
        },
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'Evaluation deleted successfully',
    };

    res.json(response);
    return;
  } catch (error) {
    logger.error('Failed to delete evaluation', {
      error: error instanceof Error ? error.message : 'Unknown error',
      id: req.params.id,
    });

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'DELETE_EVALUATION_ERROR',
        message: 'Failed to delete evaluation',
      },
    };

    res.status(500).json(response);
    return;
  }
});

export default router;
