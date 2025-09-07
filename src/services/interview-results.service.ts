import { InterviewResultRepository } from '../repositories/InterviewResultRepository.js';
import { CandidateRepository } from '../repositories/CandidateRepository.js';
import { VacancyRepository } from '../repositories/VacancyRepository.js';
import { ConversationService } from './conversation.service.js';
import { CreateInterviewResultDto, UpdateInterviewResultDto, InterviewResult } from '../types/index.js';
import { logger } from '../utils/logger.js';

export interface InterviewSessionData {
  startTime: Date;
  endTime?: Date;
  totalQuestions: number;
  totalAnswers: number;
  completionPercentage: number;
}

export class InterviewResultsService {
  private interviewResultRepository = new InterviewResultRepository();
  private candidateRepository = new CandidateRepository();
  private vacancyRepository = new VacancyRepository();
  private conversationService = new ConversationService();

  /**
   * Create or update interview result when interview starts
   */
  async startInterview(chatId: number, vacancyId: number): Promise<InterviewResult> {
    try {
      logger.info('Starting interview result tracking', { chatId, vacancyId });

      // Get candidate
      const candidate = await this.candidateRepository.findByTelegramUserId(chatId);
      if (!candidate) {
        throw new Error('Candidate not found');
      }

      // Check if interview result already exists
      const existing = await this.interviewResultRepository.findByCandidateAndVacancy(candidate.id, vacancyId);
      
      if (existing && existing.interviewStatus === 'in_progress') {
        logger.info('Interview already in progress, returning existing result', { 
          chatId, 
          vacancyId, 
          existingId: existing.id 
        });
        return existing;
      }

      const createData: CreateInterviewResultDto = {
        candidateId: candidate.id,
        vacancyId: vacancyId,
        interviewStatus: 'in_progress',
        totalQuestions: 0,
        totalAnswers: 0,
        completionPercentage: 0,
        followUpRequired: false
      };

      const result = await this.interviewResultRepository.upsert(candidate.id, vacancyId, createData);
      
      logger.info('Interview result created/updated for start', { 
        chatId, 
        vacancyId, 
        resultId: result.id 
      });

      return result;
    } catch (error) {
      logger.error('Error starting interview result tracking', { chatId, vacancyId, error });
      throw error;
    }
  }

  /**
   * Update interview progress
   */
  async updateProgress(
    chatId: number, 
    vacancyId: number, 
    questionCount: number, 
    sessionData?: Partial<InterviewSessionData>
  ): Promise<InterviewResult> {
    try {
      // Get candidate
      const candidate = await this.candidateRepository.findByTelegramUserId(chatId);
      if (!candidate) {
        throw new Error('Candidate not found');
      }

      // Get existing interview result
      const existing = await this.interviewResultRepository.findByCandidateAndVacancy(candidate.id, vacancyId);
      if (!existing) {
        throw new Error('Interview result not found');
      }

      // Calculate completion percentage (assuming 5 questions for completion)
      const maxQuestions = 5;
      const completionPercentage = Math.min(Math.round((questionCount / maxQuestions) * 100), 100);

      const updateData: UpdateInterviewResultDto = {
        totalQuestions: questionCount,
        totalAnswers: questionCount, // Assuming each question gets an answer
        completionPercentage: completionPercentage
      };

      // Add duration if session data is available
      if (sessionData?.endTime && sessionData.startTime) {
        updateData.interviewDurationMinutes = Math.round((sessionData.endTime.getTime() - sessionData.startTime.getTime()) / (1000 * 60));
      }

      const result = await this.interviewResultRepository.update(existing.id, updateData);
      if (!result) {
        throw new Error('Failed to update interview progress');
      }
      
      logger.info('Interview progress updated', { 
        chatId, 
        vacancyId, 
        questionCount, 
        completionPercentage 
      });

      return result;
    } catch (error) {
      logger.error('Error updating interview progress', { chatId, vacancyId, questionCount, error });
      throw error;
    }
  }

  /**
   * Complete interview and save final results
   */
  async completeInterview(
    chatId: number, 
    vacancyId: number, 
    evaluationId: number,
    finalFeedback: string,
    sessionData: InterviewSessionData,
    additionalData?: {
      technicalScore?: number;
      softSkillsScore?: number;
      overallImpression?: string;
      nextSteps?: string;
      followUpRequired?: boolean;
      followUpDate?: Date;
      interviewerNotes?: string;
    }
  ): Promise<InterviewResult> {
    try {
      logger.info('Completing interview and saving final results', { 
        chatId, 
        vacancyId, 
        evaluationId 
      });

      // Get candidate
      const candidate = await this.candidateRepository.findByTelegramUserId(chatId);
      if (!candidate) {
        throw new Error('Candidate not found');
      }

      // Calculate interview duration
      const durationMinutes = sessionData.endTime 
        ? Math.round((sessionData.endTime.getTime() - sessionData.startTime.getTime()) / (1000 * 60))
        : undefined;

      // Get conversation history to get dialogue_id
      const conversationHistory = await this.conversationService.getHistory(chatId, vacancyId);
      
      const updateData: UpdateInterviewResultDto = {
        evaluationId: evaluationId,
        interviewStatus: 'completed',
        totalQuestions: sessionData.totalQuestions,
        totalAnswers: sessionData.totalAnswers,
        completionPercentage: sessionData.completionPercentage,
        finalFeedback: finalFeedback,
        followUpRequired: additionalData?.followUpRequired || false,
        resultData: {
          sessionData: sessionData,
          completedAt: new Date(),
          conversationLength: conversationHistory.length
        }
      };

      // Add optional fields if they exist
      if (durationMinutes !== undefined) {
        updateData.interviewDurationMinutes = durationMinutes;
      }
      if (additionalData?.technicalScore !== undefined) {
        updateData.technicalAssessmentScore = additionalData.technicalScore;
      }
      if (additionalData?.softSkillsScore !== undefined) {
        updateData.softSkillsAssessmentScore = additionalData.softSkillsScore;
      }
      if (additionalData?.overallImpression !== undefined) {
        updateData.overallImpression = additionalData.overallImpression;
      }
      if (additionalData?.nextSteps !== undefined) {
        updateData.nextSteps = additionalData.nextSteps;
      }
      if (additionalData?.followUpDate !== undefined) {
        updateData.followUpDate = additionalData.followUpDate;
      }
      if (additionalData?.interviewerNotes !== undefined) {
        updateData.interviewerNotes = additionalData.interviewerNotes;
      }

      // Get existing interview result
      const existing = await this.interviewResultRepository.findByCandidateAndVacancy(candidate.id, vacancyId);
      if (!existing) {
        throw new Error('Interview result not found');
      }

      const result = await this.interviewResultRepository.update(existing.id, updateData);
      if (!result) {
        throw new Error('Failed to update interview completion');
      }
      
      logger.info('Interview completed and final results saved', { 
        chatId, 
        vacancyId, 
        evaluationId,
        resultId: result.id,
        duration: durationMinutes,
        completion: sessionData.completionPercentage
      });

      return result;
    } catch (error) {
      logger.error('Error completing interview and saving results', { 
        chatId, 
        vacancyId, 
        evaluationId, 
        error 
      });
      throw error;
    }
  }

  /**
   * Cancel interview
   */
  async cancelInterview(chatId: number, vacancyId: number, reason?: string): Promise<InterviewResult> {
    try {
      logger.info('Cancelling interview', { chatId, vacancyId, reason });

      // Get candidate
      const candidate = await this.candidateRepository.findByTelegramUserId(chatId);
      if (!candidate) {
        throw new Error('Candidate not found');
      }

      // Get existing interview result
      const existing = await this.interviewResultRepository.findByCandidateAndVacancy(candidate.id, vacancyId);
      if (!existing) {
        throw new Error('Interview result not found');
      }

      const updateData: UpdateInterviewResultDto = {
        interviewStatus: 'cancelled',
        interviewerNotes: reason ? `Interview cancelled: ${reason}` : 'Interview cancelled',
        resultData: {
          cancelledAt: new Date(),
          reason: reason
        }
      };

      const result = await this.interviewResultRepository.update(existing.id, updateData);
      if (!result) {
        throw new Error('Failed to cancel interview');
      }
      
      logger.info('Interview cancelled', { chatId, vacancyId, resultId: result.id });

      return result;
    } catch (error) {
      logger.error('Error cancelling interview', { chatId, vacancyId, error });
      throw error;
    }
  }

  /**
   * Get interview result for candidate and vacancy
   */
  async getInterviewResult(chatId: number, vacancyId: number): Promise<InterviewResult | null> {
    try {
      // Get candidate
      const candidate = await this.candidateRepository.findByTelegramUserId(chatId);
      if (!candidate) {
        return null;
      }

      return await this.interviewResultRepository.findByCandidateAndVacancy(candidate.id, vacancyId);
    } catch (error) {
      logger.error('Error getting interview result', { chatId, vacancyId, error });
      return null;
    }
  }

  /**
   * Get all interview results for a candidate
   */
  async getCandidateInterviewResults(chatId: number): Promise<InterviewResult[]> {
    try {
      // Get candidate
      const candidate = await this.candidateRepository.findByTelegramUserId(chatId);
      if (!candidate) {
        return [];
      }

      return await this.interviewResultRepository.findByCandidate(candidate.id);
    } catch (error) {
      logger.error('Error getting candidate interview results', { chatId, error });
      return [];
    }
  }

  /**
   * Get interview statistics for a vacancy
   */
  async getVacancyStatistics(vacancyId: number) {
    try {
      return await this.interviewResultRepository.getVacancyStatistics(vacancyId);
    } catch (error) {
      logger.error('Error getting vacancy statistics', { vacancyId, error });
      throw error;
    }
  }

  /**
   * Generate interview results summary (🎯 Результаты интервью)
   */
  async generateResultsSummary(chatId: number, vacancyId: number): Promise<string> {
    try {
      const result = await this.getInterviewResult(chatId, vacancyId);
      if (!result) {
        return '🎯 Результаты интервью не найдены.';
      }

      const candidate = await this.candidateRepository.findByTelegramUserId(chatId);
      const vacancy = await this.vacancyRepository.findById(vacancyId);

      let summary = '🎯 **Результаты интервью**\n\n';
      
      if (candidate) {
        summary += `👤 **Кандидат:** ${candidate.firstName} ${candidate.lastName || ''}`.trim() + '\n';
      }
      
      if (vacancy) {
        summary += `💼 **Вакансия:** ${vacancy.title}\n`;
      }
      
      summary += `📊 **Статус:** ${this.translateStatus(result.interviewStatus)}\n`;
      summary += `📈 **Процент завершения:** ${result.completionPercentage}%\n`;
      summary += `❓ **Вопросов задано:** ${result.totalQuestions}\n`;
      summary += `💬 **Ответов получено:** ${result.totalAnswers}\n`;
      
      if (result.interviewDurationMinutes) {
        summary += `⏱️ **Длительность:** ${result.interviewDurationMinutes} мин.\n`;
      }
      
      if (result.technicalAssessmentScore) {
        summary += `🔧 **Технические навыки:** ${result.technicalAssessmentScore}/100\n`;
      }
      
      if (result.softSkillsAssessmentScore) {
        summary += `🤝 **Мягкие навыки:** ${result.softSkillsAssessmentScore}/100\n`;
      }
      
      if (result.overallImpression) {
        summary += `\n💭 **Общее впечатление:**\n${result.overallImpression}\n`;
      }
      
      if (result.finalFeedback) {
        summary += `\n📝 **Финальный отзыв:**\n${result.finalFeedback}\n`;
      }
      
      if (result.nextSteps) {
        summary += `\n🎯 **Следующие шаги:**\n${result.nextSteps}\n`;
      }
      
      if (result.followUpRequired && result.followUpDate) {
        summary += `\n📅 **Требуется дополнительное собеседование:** ${result.followUpDate.toLocaleDateString('ru-RU')}\n`;
      }

      summary += `\n📅 **Дата проведения:** ${result.createdAt.toLocaleDateString('ru-RU')}`;

      return summary;
    } catch (error) {
      logger.error('Error generating results summary', { chatId, vacancyId, error });
      return '🎯 Ошибка при формировании результатов интервью.';
    }
  }

  private translateStatus(status: string): string {
    switch (status) {
      case 'completed':
        return 'Завершено ✅';
      case 'in_progress':
        return 'В процессе ⏳';
      case 'cancelled':
        return 'Отменено ❌';
      default:
        return status;
    }
  }
}
