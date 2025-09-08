import express from 'express';
import { InterviewResultRepository } from '../repositories/InterviewResultRepository.js';
import { CandidateRepository } from '../repositories/CandidateRepository.js';
import { VacancyRepository } from '../repositories/VacancyRepository.js';
import { ApiResponse, PaginatedResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { db } from '../database/connection.js';

const router = express.Router();
const interviewResultRepository = new InterviewResultRepository();
const candidateRepository = new CandidateRepository();
const vacancyRepository = new VacancyRepository();

// GET /interview-results - Get all interview results with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    
    // Optional filters
    const candidateId = req.query.candidateId ? parseInt(req.query.candidateId as string) : undefined;
    const vacancyId = req.query.vacancyId ? parseInt(req.query.vacancyId as string) : undefined;
    const status = req.query.status as string;

    // Build query with filters
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (candidateId) {
      whereConditions.push(`ir.candidate_id = $${paramIndex++}`);
      queryParams.push(candidateId);
    }

    if (vacancyId) {
      whereConditions.push(`ir.vacancy_id = $${paramIndex++}`);
      queryParams.push(vacancyId);
    }

    if (status) {
      whereConditions.push(`ir.interview_status = $${paramIndex++}`);
      queryParams.push(status);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM interview_results ir
      ${whereClause}
    `;
    
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get interview results with related data
    const query = `
      SELECT 
        ir.id,
        ir.dialogue_id as "dialogueId",
        ir.candidate_id as "candidateId",
        ir.vacancy_id as "vacancyId",
        ir.evaluation_id as "evaluationId",
        ir.interview_status as "interviewStatus",
        ir.total_questions as "totalQuestions",
        ir.total_answers as "totalAnswers",
        ir.interview_duration_minutes as "interviewDurationMinutes",
        ir.completion_percentage as "completionPercentage",
        ir.final_feedback as "finalFeedback",
        ir.interviewer_notes as "interviewerNotes",
        ir.candidate_satisfaction_rating as "candidateSatisfactionRating",
        ir.technical_assessment_score as "technicalAssessmentScore",
        ir.soft_skills_assessment_score as "softSkillsAssessmentScore",
        ir.overall_impression as "overallImpression",
        ir.next_steps as "nextSteps",
        ir.follow_up_required as "followUpRequired",
        ir.follow_up_date as "followUpDate",
        ir.result_data as "resultData",
        ir.created_at as "createdAt",
        ir.updated_at as "updatedAt",
        -- Candidate info
        c.first_name as "candidateFirstName",
        c.last_name as "candidateLastName",
        c.username as "candidateUsername",
        c.telegram_user_id as "candidateTelegramUserId",
        -- Vacancy info
        v.title as "vacancyTitle",
        v.description as "vacancyDescription",
        -- Evaluation info (if exists)
        e.overall_score as "evaluationOverallScore",
        e.recommendation as "evaluationRecommendation"
      FROM interview_results ir
      LEFT JOIN candidates c ON ir.candidate_id = c.id
      LEFT JOIN vacancies v ON ir.vacancy_id = v.id
      LEFT JOIN evaluations e ON ir.evaluation_id = e.id
      ${whereClause}
      ORDER BY ir.updated_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    queryParams.push(limit, offset);

    const result = await db.query(query, queryParams);
    
    const interviewResults = result.rows.map(row => ({
      id: row.id,
      dialogueId: row.dialogueId,
      candidateId: row.candidateId,
      vacancyId: row.vacancyId,
      evaluationId: row.evaluationId,
      interviewStatus: row.interviewStatus,
      totalQuestions: row.totalQuestions,
      totalAnswers: row.totalAnswers,
      interviewDurationMinutes: row.interviewDurationMinutes,
      completionPercentage: row.completionPercentage,
      finalFeedback: row.finalFeedback,
      interviewerNotes: row.interviewerNotes,
      candidateSatisfactionRating: row.candidateSatisfactionRating,
      technicalAssessmentScore: row.technicalAssessmentScore,
      softSkillsAssessmentScore: row.softSkillsAssessmentScore,
      overallImpression: row.overallImpression,
      nextSteps: row.nextSteps,
      followUpRequired: row.followUpRequired,
      followUpDate: row.followUpDate,
      resultData: row.resultData,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      candidate: {
        id: row.candidateId,
        firstName: row.candidateFirstName,
        lastName: row.candidateLastName,
        username: row.candidateUsername,
        telegramUserId: row.candidateTelegramUserId,
      },
      vacancy: {
        id: row.vacancyId,
        title: row.vacancyTitle,
        description: row.vacancyDescription,
      },
      evaluation: row.evaluationId ? {
        id: row.evaluationId,
        overallScore: row.evaluationOverallScore,
        recommendation: row.evaluationRecommendation,
      } : null,
    }));

    const totalPages = Math.ceil(total / limit);

    const response: ApiResponse<PaginatedResponse<any>> = {
      success: true,
      data: {
        data: interviewResults,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to fetch interview results', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'FETCH_INTERVIEW_RESULTS_ERROR',
        message: 'Failed to fetch interview results',
      },
    };

    res.status(500).json(response);
  }
});

// GET /interview-results/candidate/:candidateId - Get interview results for a specific candidate
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

    const interviewResults = await interviewResultRepository.findByCandidate(candidateId);

    // Enhance with vacancy and evaluation data
    const enhancedResults = await Promise.all(
      interviewResults.map(async (result) => {
        const vacancy = await vacancyRepository.findById(result.vacancyId);
        return {
          ...result,
          candidate,
          vacancy,
        };
      })
    );

    const response: ApiResponse<any> = {
      success: true,
      data: {
        candidate,
        interviewResults: enhancedResults,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to fetch candidate interview results', {
      error: error instanceof Error ? error.message : 'Unknown error',
      candidateId: req.params.candidateId,
    });

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'FETCH_CANDIDATE_INTERVIEW_RESULTS_ERROR',
        message: 'Failed to fetch candidate interview results',
      },
    };

    res.status(500).json(response);
  }
});

// GET /interview-results/:id - Get single interview result with detailed information
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid interview result ID',
        },
      };
      return res.status(400).json(response);
    }

    const interviewResult = await interviewResultRepository.findById(id);
    if (!interviewResult) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'INTERVIEW_RESULT_NOT_FOUND',
          message: 'Interview result not found',
        },
      };
      return res.status(404).json(response);
    }

    // Get related data
    const candidate = await candidateRepository.findById(interviewResult.candidateId);
    const vacancy = await vacancyRepository.findById(interviewResult.vacancyId);

    const response: ApiResponse<any> = {
      success: true,
      data: {
        ...interviewResult,
        candidate,
        vacancy,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to fetch interview result', {
      error: error instanceof Error ? error.message : 'Unknown error',
      id: req.params.id,
    });

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'FETCH_INTERVIEW_RESULT_ERROR',
        message: 'Failed to fetch interview result',
      },
    };

    res.status(500).json(response);
  }
});

export default router;
