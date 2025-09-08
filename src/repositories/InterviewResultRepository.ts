import { BaseRepository } from './BaseRepository.js';
import { InterviewResult, CreateInterviewResultDto, UpdateInterviewResultDto } from '../types/index.js';
import { db } from '../database/connection.js';

export class InterviewResultRepository extends BaseRepository<InterviewResult, CreateInterviewResultDto, UpdateInterviewResultDto> {
  protected override tableName = 'interview_results';
  protected primaryKey = 'id';

  constructor() {
    super('interview_results');
  }

  /**
   * Find interview result by candidate and vacancy
   */
  async findByCandidateAndVacancy(candidateId: number, vacancyId: number): Promise<InterviewResult | null> {
    const query = `
      SELECT 
        id,
        dialogue_id as "dialogueId",
        candidate_id as "candidateId",
        vacancy_id as "vacancyId",
        evaluation_id as "evaluationId",
        interview_status as "interviewStatus",
        total_questions as "totalQuestions",
        total_answers as "totalAnswers",
        interview_duration_minutes as "interviewDurationMinutes",
        completion_percentage as "completionPercentage",
        final_feedback as "finalFeedback",
        interviewer_notes as "interviewerNotes",
        candidate_satisfaction_rating as "candidateSatisfactionRating",
        technical_assessment_score as "technicalAssessmentScore",
        soft_skills_assessment_score as "softSkillsAssessmentScore",
        overall_impression as "overallImpression",
        next_steps as "nextSteps",
        follow_up_required as "followUpRequired",
        follow_up_date as "followUpDate",
        result_data as "resultData",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM ${this.tableName}
      WHERE candidate_id = $1 AND vacancy_id = $2
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const result = await db.query(query, [candidateId, vacancyId]);
    return result.rows[0] || null;
  }

  /**
   * Find interview results by candidate
   */
  async findByCandidate(candidateId: number): Promise<InterviewResult[]> {
    const query = `
      SELECT 
        id,
        dialogue_id as "dialogueId",
        candidate_id as "candidateId",
        vacancy_id as "vacancyId",
        evaluation_id as "evaluationId",
        interview_status as "interviewStatus",
        total_questions as "totalQuestions",
        total_answers as "totalAnswers",
        interview_duration_minutes as "interviewDurationMinutes",
        completion_percentage as "completionPercentage",
        final_feedback as "finalFeedback",
        interviewer_notes as "interviewerNotes",
        candidate_satisfaction_rating as "candidateSatisfactionRating",
        technical_assessment_score as "technicalAssessmentScore",
        soft_skills_assessment_score as "softSkillsAssessmentScore",
        overall_impression as "overallImpression",
        next_steps as "nextSteps",
        follow_up_required as "followUpRequired",
        follow_up_date as "followUpDate",
        result_data as "resultData",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM ${this.tableName}
      WHERE candidate_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await db.query(query, [candidateId]);
    return result.rows;
  }

  /**
   * Find interview results by vacancy
   */
  async findByVacancy(vacancyId: number): Promise<InterviewResult[]> {
    const query = `
      SELECT 
        id,
        dialogue_id as "dialogueId",
        candidate_id as "candidateId",
        vacancy_id as "vacancyId",
        evaluation_id as "evaluationId",
        interview_status as "interviewStatus",
        total_questions as "totalQuestions",
        total_answers as "totalAnswers",
        interview_duration_minutes as "interviewDurationMinutes",
        completion_percentage as "completionPercentage",
        final_feedback as "finalFeedback",
        interviewer_notes as "interviewerNotes",
        candidate_satisfaction_rating as "candidateSatisfactionRating",
        technical_assessment_score as "technicalAssessmentScore",
        soft_skills_assessment_score as "softSkillsAssessmentScore",
        overall_impression as "overallImpression",
        next_steps as "nextSteps",
        follow_up_required as "followUpRequired",
        follow_up_date as "followUpDate",
        result_data as "resultData",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM ${this.tableName}
      WHERE vacancy_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await db.query(query, [vacancyId]);
    return result.rows;
  }

  /**
   * Find interview results by status
   */
  async findByStatus(status: 'completed' | 'in_progress' | 'cancelled'): Promise<InterviewResult[]> {
    const query = `
      SELECT 
        id,
        dialogue_id as "dialogueId",
        candidate_id as "candidateId",
        vacancy_id as "vacancyId",
        evaluation_id as "evaluationId",
        interview_status as "interviewStatus",
        total_questions as "totalQuestions",
        total_answers as "totalAnswers",
        interview_duration_minutes as "interviewDurationMinutes",
        completion_percentage as "completionPercentage",
        final_feedback as "finalFeedback",
        interviewer_notes as "interviewerNotes",
        candidate_satisfaction_rating as "candidateSatisfactionRating",
        technical_assessment_score as "technicalAssessmentScore",
        soft_skills_assessment_score as "softSkillsAssessmentScore",
        overall_impression as "overallImpression",
        next_steps as "nextSteps",
        follow_up_required as "followUpRequired",
        follow_up_date as "followUpDate",
        result_data as "resultData",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM ${this.tableName}
      WHERE interview_status = $1
      ORDER BY created_at DESC
    `;
    
    const result = await db.query(query, [status]);
    return result.rows;
  }

  /**
   * Upsert interview result (create or update based on candidate and vacancy)
   */
  async upsert(candidateId: number, vacancyId: number, data: CreateInterviewResultDto): Promise<InterviewResult> {
    const existing = await this.findByCandidateAndVacancy(candidateId, vacancyId);
    
    if (existing) {
      const updated = await this.update(existing.id, data);
      if (!updated) {
        throw new Error('Failed to update interview result');
      }
      return updated;
    } else {
      return await this.create(data);
    }
  }

  /**
   * Get interview statistics for a vacancy
   */
  async getVacancyStatistics(vacancyId: number): Promise<{
    totalInterviews: number;
    completedInterviews: number;
    inProgressInterviews: number;
    cancelledInterviews: number;
    averageCompletionPercentage: number;
    averageDuration: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_interviews,
        COUNT(CASE WHEN interview_status = 'completed' THEN 1 END) as completed_interviews,
        COUNT(CASE WHEN interview_status = 'in_progress' THEN 1 END) as in_progress_interviews,
        COUNT(CASE WHEN interview_status = 'cancelled' THEN 1 END) as cancelled_interviews,
        COALESCE(AVG(completion_percentage), 0) as avg_completion_percentage,
        COALESCE(AVG(interview_duration_minutes), 0) as avg_duration
      FROM ${this.tableName}
      WHERE vacancy_id = $1
    `;
    
    const result = await db.query(query, [vacancyId]);
    const row = result.rows[0];
    
    return {
      totalInterviews: parseInt(row.total_interviews),
      completedInterviews: parseInt(row.completed_interviews),
      inProgressInterviews: parseInt(row.in_progress_interviews),
      cancelledInterviews: parseInt(row.cancelled_interviews),
      averageCompletionPercentage: parseFloat(row.avg_completion_percentage),
      averageDuration: parseFloat(row.avg_duration)
    };
  }

}
