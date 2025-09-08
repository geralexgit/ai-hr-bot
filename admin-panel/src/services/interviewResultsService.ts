const API_BASE_URL = 'http://localhost:3001/api';

export interface InterviewResult {
  id: number;
  dialogueId?: number;
  candidateId: number;
  vacancyId: number;
  evaluationId?: number;
  interviewStatus: 'completed' | 'in_progress' | 'cancelled';
  totalQuestions: number;
  totalAnswers: number;
  interviewDurationMinutes?: number;
  completionPercentage: number;
  finalFeedback?: string;
  interviewerNotes?: string;
  candidateSatisfactionRating?: number;
  technicalAssessmentScore?: number;
  softSkillsAssessmentScore?: number;
  overallImpression?: string;
  nextSteps?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  resultData?: any;
  createdAt: string;
  updatedAt: string;
  candidate?: {
    id: number;
    firstName?: string;
    lastName?: string;
    username?: string;
    telegramUserId: number;
  };
  vacancy?: {
    id: number;
    title: string;
    description?: string;
  };
  evaluation?: {
    id: number;
    overallScore: number;
    recommendation: 'proceed' | 'reject' | 'clarify';
  };
}

export interface PaginatedInterviewResultsResponse {
  data: InterviewResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Fetch all interview results with pagination and filters
export const fetchInterviewResults = async (
  page: number = 1,
  limit: number = 20,
  filters?: {
    candidateId?: number;
    vacancyId?: number;
    status?: string;
  }
): Promise<ApiResponse<PaginatedInterviewResultsResponse>> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters?.candidateId) {
      params.append('candidateId', filters.candidateId.toString());
    }
    if (filters?.vacancyId) {
      params.append('vacancyId', filters.vacancyId.toString());
    }
    if (filters?.status) {
      params.append('status', filters.status);
    }

    const response = await fetch(`${API_BASE_URL}/interview-results?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching interview results:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch interview results',
      },
    };
  }
};

// Fetch interview results for a specific candidate
export const fetchCandidateInterviewResults = async (
  candidateId: number
): Promise<ApiResponse<{ candidate: any; interviewResults: InterviewResult[] }>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/interview-results/candidate/${candidateId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching candidate interview results:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch candidate interview results',
      },
    };
  }
};

// Fetch single interview result
export const fetchInterviewResult = async (
  id: number
): Promise<ApiResponse<InterviewResult>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/interview-results/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching interview result:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch interview result',
      },
    };
  }
};

// Helper function to format interview status
export const formatInterviewStatus = (status: string): string => {
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
};

// Helper function to get status badge color
export const getInterviewStatusBadgeColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Helper function to format candidate name from interview result
export const formatCandidateNameFromResult = (interviewResult: InterviewResult): string => {
  const candidate = interviewResult.candidate;
  if (!candidate) return 'Неизвестный кандидат';

  const parts = [];
  if (candidate.firstName) parts.push(candidate.firstName);
  if (candidate.lastName) parts.push(candidate.lastName);
  
  if (parts.length === 0 && candidate.username) {
    return `@${candidate.username}`;
  }
  
  if (parts.length === 0) {
    return `User ${candidate.telegramUserId}`;
  }
  
  return parts.join(' ');
};

// Helper function to calculate overall assessment score
export const calculateOverallAssessmentScore = (interviewResult: InterviewResult): number | null => {
  const { technicalAssessmentScore, softSkillsAssessmentScore } = interviewResult;
  
  if (technicalAssessmentScore !== undefined && softSkillsAssessmentScore !== undefined) {
    return Math.round((technicalAssessmentScore + softSkillsAssessmentScore) / 2);
  }
  
  if (technicalAssessmentScore !== undefined) {
    return technicalAssessmentScore;
  }
  
  if (softSkillsAssessmentScore !== undefined) {
    return softSkillsAssessmentScore;
  }
  
  return null;
};
