import { OllamaService } from './ollama.service.js';
import { ConversationService } from './conversation.service.js';
import { EvaluationRepository } from '../repositories/EvaluationRepository.js';
import { VacancyRepository } from '../repositories/VacancyRepository.js';
import { CandidateRepository } from '../repositories/CandidateRepository.js';
import { CreateEvaluationDto, AnalysisData } from '../types/index.js';
import { logger } from '../utils/logger.js';

export interface EvaluationResult {
  evaluation: any;
  feedback: string;
}

export class EvaluationService {
  private ollamaService = new OllamaService();
  private conversationService = new ConversationService();
  private evaluationRepository = new EvaluationRepository();
  private vacancyRepository = new VacancyRepository();
  private candidateRepository = new CandidateRepository();

  /**
   * Generate evaluation for a candidate based on their interview conversation
   */
  async generateEvaluation(chatId: number, vacancyId: number): Promise<EvaluationResult> {
    try {
      logger.info('Starting evaluation generation', { chatId, vacancyId });

      // Get candidate
      const candidate = await this.candidateRepository.findByTelegramUserId(chatId);
      if (!candidate) {
        throw new Error('Candidate not found');
      }

      // Get vacancy details
      const vacancy = await this.vacancyRepository.findById(vacancyId);
      if (!vacancy) {
        throw new Error('Vacancy not found');
      }

      // Get conversation history
      const conversationHistory = await this.conversationService.getHistory(chatId, vacancyId);
      
      if (conversationHistory.length === 0) {
        throw new Error('No conversation history found');
      }

      // Prepare conversation text for analysis
      const conversationText = conversationHistory
        .map(msg => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.content}`)
        .join('\n\n');

      // Generate evaluation using LLM
      const evaluationData = await this.analyzeWithLLM(conversationText, vacancy);

      // Create evaluation in database
      const createEvaluationDto: CreateEvaluationDto = {
        candidateId: candidate.id,
        vacancyId: vacancyId,
        overallScore: evaluationData.overallScore,
        technicalScore: evaluationData.technicalScore,
        communicationScore: evaluationData.communicationScore,
        problemSolvingScore: evaluationData.problemSolvingScore,
        strengths: evaluationData.strengths,
        gaps: evaluationData.gaps,
        contradictions: evaluationData.contradictions,
        recommendation: evaluationData.recommendation,
        feedback: evaluationData.feedback,
        analysisData: evaluationData.analysisData
      };

      const evaluation = await this.evaluationRepository.upsert(
        candidate.id, 
        vacancyId, 
        createEvaluationDto
      );

      logger.info('Evaluation generated successfully', {
        chatId,
        vacancyId,
        evaluationId: evaluation.id,
        overallScore: evaluation.overallScore,
        recommendation: evaluation.recommendation
      });

      return {
        evaluation,
        feedback: this.generateCandidateFeedback(evaluationData)
      };

    } catch (error) {
      logger.error('Error generating evaluation', { chatId, vacancyId, error });
      throw error;
    }
  }

  /**
   * Analyze conversation using LLM
   */
  private async analyzeWithLLM(conversationText: string, vacancy: any): Promise<any> {
    const prompt = `
Ты — эксперт HR-аналитик, который анализирует интервью кандидатов на соответствие вакансии.

ВАКАНСИЯ:
Название: ${vacancy.title}
Описание: ${vacancy.description}
Требования: ${JSON.stringify(vacancy.requirements, null, 2)}
Веса оценки: технические навыки ${vacancy.evaluationWeights.technicalSkills}%, коммуникация ${vacancy.evaluationWeights.communication}%, решение задач ${vacancy.evaluationWeights.problemSolving}%

РАЗГОВОР С КАНДИДАТОМ:
${conversationText}

ЗАДАЧА:
Проанализируй интервью и верни СТРОГО в JSON формате:

{
  "overallScore": [число от 0 до 100 - общая оценка],
  "technicalScore": [число от 0 до 100 - технические навыки],
  "communicationScore": [число от 0 до 100 - коммуникация],
  "problemSolvingScore": [число от 0 до 100 - решение задач],
  "strengths": ["сильная сторона 1", "сильная сторона 2", ...],
  "gaps": ["пробел 1", "пробел 2", ...],
  "contradictions": ["противоречие 1", "противоречие 2", ...],
  "recommendation": "proceed|reject|clarify",
  "feedback": "Персонализированная обратная связь для кандидата",
  "analysisData": {
    "keySkills": ["навык1", "навык2", ...],
    "experienceLevel": "junior|middle|senior",
    "matchingResults": [
      {
        "requirement": "название требования",
        "score": [0-100],
        "evidence": "доказательство из разговора",
        "gaps": ["пробел1", ...]
      }
    ]
  }
}

ВАЖНО:
- Оценивай объективно на основе фактических данных из разговора
- Учитывай веса оценки при расчете общего балла
- Давай конструктивную обратную связь
- Рекомендация "proceed" если общий балл >= 70, "reject" если < 50, "clarify" если 50-69
- Все тексты на русском языке
`;

    try {
      const rawOutput = await this.ollamaService.generate(prompt);
      
      // Clean and parse JSON response
      const cleanedOutput = rawOutput.replace(/```json|```/g, '').trim();
      const evaluationData = JSON.parse(cleanedOutput);

      // Validate and set defaults
      return {
        overallScore: Math.max(0, Math.min(100, evaluationData.overallScore || 0)),
        technicalScore: Math.max(0, Math.min(100, evaluationData.technicalScore || 0)),
        communicationScore: Math.max(0, Math.min(100, evaluationData.communicationScore || 0)),
        problemSolvingScore: Math.max(0, Math.min(100, evaluationData.problemSolvingScore || 0)),
        strengths: Array.isArray(evaluationData.strengths) ? evaluationData.strengths : [],
        gaps: Array.isArray(evaluationData.gaps) ? evaluationData.gaps : [],
        contradictions: Array.isArray(evaluationData.contradictions) ? evaluationData.contradictions : [],
        recommendation: ['proceed', 'reject', 'clarify'].includes(evaluationData.recommendation) 
          ? evaluationData.recommendation : 'clarify',
        feedback: evaluationData.feedback || 'Оценка завершена.',
        analysisData: evaluationData.analysisData || {
          keySkills: [],
          experienceLevel: 'middle',
          matchingResults: []
        }
      };

    } catch (error) {
      logger.error('Error parsing LLM evaluation response', { error });
      
      // Return fallback evaluation
      return {
        overallScore: 50,
        technicalScore: 50,
        communicationScore: 50,
        problemSolvingScore: 50,
        strengths: ['Участвовал в интервью'],
        gaps: ['Требуется дополнительный анализ'],
        contradictions: [],
        recommendation: 'clarify',
        feedback: 'Спасибо за участие в интервью. Мы рассмотрим вашу кандидатуру и свяжемся с вами.',
        analysisData: {
          keySkills: [],
          experienceLevel: 'middle',
          matchingResults: []
        }
      };
    }
  }

  /**
   * Generate candidate-friendly feedback
   */
  private generateCandidateFeedback(evaluationData: any): string {
    const { strengths, gaps, recommendation, feedback } = evaluationData;

    let message = `🎯 **Результаты интервью**\n\n`;

    if (strengths.length > 0) {
      message += `✅ **Ваши сильные стороны:**\n`;
      strengths.forEach((strength: string) => {
        message += `• ${strength}\n`;
      });
      message += `\n`;
    }

    if (gaps.length > 0) {
      message += `📋 **Области для развития:**\n`;
      gaps.forEach((gap: string) => {
        message += `• ${gap}\n`;
      });
      message += `\n`;
    }

    message += `💬 **Обратная связь:** ${feedback}\n\n`;

    // Add recommendation-specific message
    switch (recommendation) {
      case 'proceed':
        message += `Мы рассмотрим вашу кандидатуру и свяжемся с вами в ближайшее время для обсуждения следующих шагов.`;
        break;
      case 'reject':
        message += `😔 К сожалению, на данный момент ваша кандидатура не подходит для этой позиции. Спасибо за интерес к нашей компании!`;
        break;
      case 'clarify':
        message += `🤔 Нам нужны дополнительные уточнения. HR-менеджер свяжется с вами для дополнительного собеседования.`;
        break;
    }

    return message;
  }

  /**
   * Check if evaluation exists for candidate and vacancy
   */
  async hasEvaluation(candidateId: number, vacancyId: number): Promise<boolean> {
    try {
      const evaluation = await this.evaluationRepository.findByCandidateAndVacancy(candidateId, vacancyId);
      return evaluation !== null;
    } catch (error) {
      logger.error('Error checking evaluation existence', { candidateId, vacancyId, error });
      return false;
    }
  }
}
