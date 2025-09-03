// Core data models for the AI HR Bot system

export interface VacancyRequirements {
  technicalSkills: RequiredSkill[];
  experience: ExperienceRequirement[];
  education?: EducationRequirement[];
  languages?: LanguageRequirement[];
  softSkills: string[];
}

export interface RequiredSkill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  mandatory: boolean;
  weight: number; // 1-10
}

export interface ExperienceRequirement {
  domain: string;
  minimumYears: number;
  preferred: boolean;
}

export interface EducationRequirement {
  degree: string;
  field?: string;
  mandatory: boolean;
}

export interface LanguageRequirement {
  language: string;
  level: 'basic' | 'intermediate' | 'advanced' | 'native';
  mandatory: boolean;
}

export interface EvaluationWeights {
  technicalSkills: number; // 0-100, default 50
  communication: number;   // 0-100, default 30
  problemSolving: number;  // 0-100, default 20
}

export interface Vacancy {
  id: number;
  title: string;
  description: string;
  requirements: VacancyRequirements;
  evaluationWeights: EvaluationWeights;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVacancyDto {
  title: string;
  description: string;
  requirements: VacancyRequirements;
  evaluationWeights: EvaluationWeights;
  status?: 'active' | 'inactive';
}

export interface UpdateVacancyDto {
  title?: string;
  description?: string;
  requirements?: VacancyRequirements;
  evaluationWeights?: EvaluationWeights;
  status?: 'active' | 'inactive';
}

export interface Candidate {
  id: number;
  telegramUserId: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  createdAt: Date;
}

export interface CreateCandidateDto {
  telegramUserId: number;
  firstName?: string;
  lastName?: string;
  username?: string;
}

export interface UpdateCandidateDto {
  firstName?: string | undefined;
  lastName?: string | undefined;
  username?: string | undefined;
}

export interface Dialogue {
  id: number;
  candidateId: number;
  vacancyId: number;
  messageType: 'text' | 'audio' | 'system';
  content: string;
  audioFilePath?: string;
  transcription?: string;
  sender: 'candidate' | 'bot';
  createdAt: Date;
}

export interface CreateDialogueDto {
  candidateId: number;
  vacancyId: number;
  messageType: 'text' | 'audio' | 'system';
  content: string;
  audioFilePath?: string;
  transcription?: string;
  sender: 'candidate' | 'bot';
}

export interface UpdateDialogueDto {
  messageType?: 'text' | 'audio' | 'system';
  content?: string;
  audioFilePath?: string;
  transcription?: string;
}

export interface ExtractedSkill {
  name: string;
  confidence: number;
  evidence: string[];
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface ExperienceAnalysis {
  totalYears: number;
  relevantYears: number;
  domains: string[];
  gaps: string[];
}

export interface CommunicationMetrics {
  clarity: number; // 1-10
  completeness: number; // 1-10
  relevance: number; // 1-10
  professionalTone: number; // 1-10
}

export interface RedFlag {
  type: 'contradiction' | 'inconsistency' | 'concern';
  description: string;
  severity: 'low' | 'medium' | 'high';
  evidence: string[];
}

export interface MatchingResult {
  skill: string;
  match: boolean;
  candidateLevel?: string;
  requiredLevel?: string;
  gap?: string;
}

export interface AnalysisData {
  extractedSkills: ExtractedSkill[];
  experienceAnalysis: ExperienceAnalysis;
  communicationMetrics: CommunicationMetrics;
  redFlags: RedFlag[];
  matchingResults: MatchingResult[];
}

export interface Evaluation {
  id: number;
  candidateId: number;
  vacancyId: number;
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  strengths: string[];
  gaps: string[];
  contradictions: string[];
  recommendation: 'proceed' | 'reject' | 'clarify';
  feedback: string;
  analysisData: AnalysisData;
  createdAt: Date;
}

export interface CreateEvaluationDto {
  candidateId: number;
  vacancyId: number;
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  strengths: string[];
  gaps: string[];
  contradictions: string[];
  recommendation: 'proceed' | 'reject' | 'clarify';
  feedback: string;
  analysisData: AnalysisData;
}

export interface UpdateEvaluationDto {
  overallScore?: number;
  technicalScore?: number;
  communicationScore?: number;
  problemSolvingScore?: number;
  strengths?: string[] | undefined;
  gaps?: string[] | undefined;
  contradictions?: string[] | undefined;
  recommendation?: 'proceed' | 'reject' | 'clarify';
  feedback?: string;
  analysisData?: AnalysisData;
}

// Telegram Bot specific types
export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

// User state management for conversation flow
export interface UserState {
  currentVacancyId?: number;
  stage: 'selecting_vacancy' | 'interviewing' | 'completed';
  questionCount: number;
  lastActivity: Date;
}

// Audio processing types
export interface AudioProcessingResult {
  filePath: string;
  transcription: string;
  duration?: number;
  confidence?: number;
}

// LLM Service types
export interface LLMOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Error types
export class DatabaseError extends Error {
  public code: string | undefined;
  public constraint: string | undefined;
  public table: string | undefined;

  constructor(message: string, code?: string, constraint?: string, table?: string) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.constraint = constraint;
    this.table = table;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseError);
    }
  }
}

export interface ValidationError extends Error {
  field: string;
  value: any;
  reason: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Pagination types
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
