import express from 'express';
import { CandidateRepository } from '../repositories/CandidateRepository.js';
import { EvaluationRepository } from '../repositories/EvaluationRepository.js';
import { DialogueRepository } from '../repositories/DialogueRepository.js';
import { Candidate, PaginationOptions, PaginatedResponse, ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { db } from '../database/connection.js';

const router = express.Router();
const candidateRepository = new CandidateRepository();
const evaluationRepository = new EvaluationRepository();
const dialogueRepository = new DialogueRepository();

// GET /candidates - List all candidates with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      hasEvaluation,
      recommendation,
      minScore,
      maxScore,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const offset = (pageNum - 1) * limitNum;

    // Build the base query with joins for evaluation data
    let baseQuery = `
      FROM candidates c
      LEFT JOIN evaluations e ON c.id = e.candidate_id
      WHERE 1=1
    `;
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Add search filter
    if (search && typeof search === 'string') {
      baseQuery += ` AND (
        c.first_name ILIKE $${paramIndex} OR 
        c.last_name ILIKE $${paramIndex} OR 
        c.username ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Add evaluation filters
    if (hasEvaluation === 'true') {
      baseQuery += ` AND e.id IS NOT NULL`;
    } else if (hasEvaluation === 'false') {
      baseQuery += ` AND e.id IS NULL`;
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
    const countQuery = `SELECT COUNT(DISTINCT c.id) as total ${baseQuery}`;
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get candidates with evaluation data
    const candidatesQuery = `
      SELECT DISTINCT
        c.id,
        c.telegram_user_id,
        c.first_name,
        c.last_name,
        c.username,
        c.created_at,
        c.updated_at,
        e.overall_score,
        e.recommendation,
        e.created_at as evaluation_created_at
      ${baseQuery}
      ORDER BY c.${sortBy} ${(sortOrder as string).toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limitNum, offset);

    const candidatesResult = await db.query(candidatesQuery, queryParams);
    const candidates = candidatesResult.rows.map(row => ({
      id: row.id,
      telegramUserId: row.telegram_user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      username: row.username,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      latestEvaluation: row.overall_score ? {
        overallScore: row.overall_score,
        recommendation: row.recommendation,
        createdAt: row.evaluation_created_at,
      } : null,
    }));

    const totalPages = Math.ceil(total / limitNum);

    const response: ApiResponse<PaginatedResponse<Candidate & { latestEvaluation?: any }>> = {
      success: true,
      data: {
        data: candidates,
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
    logger.error('Failed to fetch candidates', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'FETCH_CANDIDATES_ERROR',
        message: 'Failed to fetch candidates',
      },
    };

    res.status(500).json(response);
    return;
  }
});

// GET /candidates/:id/evaluations - Get all evaluations for a candidate
router.get('/:id/evaluations', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid candidate ID',
        },
      };
      return res.status(400).json(response);
    }

    const candidate = await candidateRepository.findById(id);
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

    const evaluations = await evaluationRepository.findByCandidateId(id);

    const response: ApiResponse<any[]> = {
      success: true,
      data: evaluations,
    };

    res.json(response);
    return;
  } catch (error) {
    logger.error('Failed to fetch candidate evaluations', {
      error: error instanceof Error ? error.message : 'Unknown error',
      id: req.params.id,
    });

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'FETCH_EVALUATIONS_ERROR',
        message: 'Failed to fetch candidate evaluations',
      },
    };

    res.status(500).json(response);
    return;
  }
});

// GET /candidates/:id/dialogues - Get all dialogues for a candidate
router.get('/:id/dialogues', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid candidate ID',
        },
      };
      return res.status(400).json(response);
    }

    const candidate = await candidateRepository.findById(id);
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

    const { vacancyId, page = '1', limit = '50' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = 'SELECT * FROM dialogues WHERE candidate_id = $1';
    const queryParams: any[] = [id];
    let paramIndex = 2;

    if (vacancyId) {
      query += ` AND vacancy_id = $${paramIndex}`;
      queryParams.push(parseInt(vacancyId as string, 10));
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limitNum, offset);

    const dialogues = await db.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM dialogues WHERE candidate_id = $1';
    const countParams: any[] = [id];
    if (vacancyId) {
      countQuery += ' AND vacancy_id = $2';
      countParams.push(parseInt(vacancyId as string, 10));
    }
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total, 10);

    const totalPages = Math.ceil(total / limitNum);

    const response: ApiResponse<PaginatedResponse<any>> = {
      success: true,
      data: {
        data: dialogues.rows,
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
    logger.error('Failed to fetch candidate dialogues', {
      error: error instanceof Error ? error.message : 'Unknown error',
      id: req.params.id,
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

// GET /candidates/:id - Get single candidate with detailed information
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid candidate ID',
        },
      };
      return res.status(400).json(response);
    }

    const candidate = await candidateRepository.findById(id);
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

    // Get all evaluations for this candidate
    const evaluations = await evaluationRepository.findByCandidateId(id);

    // Get dialogue count
    const dialogueCount = await db.query(
      'SELECT COUNT(*) as count FROM dialogues WHERE candidate_id = $1',
      [id]
    );

    const response: ApiResponse<Candidate & { evaluations: any[], dialogueCount: number }> = {
      success: true,
      data: {
        ...candidate,
        evaluations,
        dialogueCount: parseInt(dialogueCount.rows[0].count, 10),
      },
    };

    res.json(response);
    return;
  } catch (error) {
    logger.error('Failed to fetch candidate', {
      error: error instanceof Error ? error.message : 'Unknown error',
      id: req.params.id,
    });

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'FETCH_CANDIDATE_ERROR',
        message: 'Failed to fetch candidate',
      },
    };

    res.status(500).json(response);
    return;
  }
});

// PUT /candidates/:id - Update candidate information
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid candidate ID',
        },
      };
      return res.status(400).json(response);
    }

    const updateData = req.body;
    const candidate = await candidateRepository.update(id, updateData);
    
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

    const response: ApiResponse<Candidate> = {
      success: true,
      data: candidate,
      message: 'Candidate updated successfully',
    };

    res.json(response);
    return;
  } catch (error) {
    logger.error('Failed to update candidate', {
      error: error instanceof Error ? error.message : 'Unknown error',
      id: req.params.id,
    });

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'UPDATE_CANDIDATE_ERROR',
        message: 'Failed to update candidate',
      },
    };

    res.status(500).json(response);
    return;
  }
});

export default router;
