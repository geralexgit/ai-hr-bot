// Core data model interfaces for the HR Bot system

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
  level: 'high_school' | 'bachelor' | 'master' | 'phd';
  field?: string;
  required: boolean;
}

export interface LanguageRequirement {
  language: string;
  level: 'basic' | 'intermediate' | 'advanced' | 'native';
  required: boolean;
}

export interface EvaluationWeights {
  technicalSkills: number; // 0-100, default 50
  communication: number;   // 0-100, default 30
  problemSolving: number;  // 0-100, default 20
}

export interface Candidate {
  id: number;
  telegramUserId: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  createdAt: Date;
}

export interface Dialogue {
  id: number;
  candidateId: number;
  vacancyId: number;
  messageType: 'text' | 'audio' | 'system';
  content?: string;
  audioFilePath?: string;
  transcription?: string;
  sender: 'candidate' | 'bot';
  createdAt: Date;
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

export interface AnalysisData {
  extractedSkills: ExtractedSkill[];
  experienceAnalysis: ExperienceAnalysis;
  communicationMetrics: CommunicationMetrics;
  redFlags: RedFlag[];
  matchingResults: MatchingResult[];
}

export interface ExtractedSkill {
  name: string;
  confidence: number;
  evidence: string[];
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface ExperienceAnalysis {
  totalYears: number;
  domains: string[];
  relevantExperience: number;
  careerProgression: 'ascending' | 'stable' | 'declining';
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
  skillName: string;
  required: boolean;
  candidateLevel?: string;
  requiredLevel: string;
  match: boolean;
  score: number; // 0-100
}

// DTOs for creating and updating entities
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

export interface CreateCandidateDto {
  telegramUserId: number;
  firstName?: string;
  lastName?: string;
  username?: string;
}

export interface CreateDialogueDto {
  candidateId: number;
  vacancyId: number;
  messageType: 'text' | 'audio' | 'system';
  content?: string;
  audioFilePath?: string;
  transcription?: string;
  sender: 'candidate' | 'bot';
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