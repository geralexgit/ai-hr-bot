// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

// Types for dashboard data
export interface DashboardStats {
  activeVacancies: number;
  totalCandidates: number;
  interviewsToday: number;
  successRate: number;
  totalEvaluations: number;
  recentActivity: {
    newCandidatesThisWeek: number;
    newEvaluationsThisWeek: number;
    activeDialogues: number;
  };
  evaluationBreakdown: {
    proceed: number;
    reject: number;
    clarify: number;
  };
}

export interface RecentCandidate {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  createdAt: string;
  latestEvaluation?: {
    overallScore: number;
    recommendation: 'proceed' | 'reject' | 'clarify';
  };
}

export interface RecentEvaluation {
  id: number;
  overallScore: number;
  recommendation: 'proceed' | 'reject' | 'clarify';
  createdAt: string;
  candidate: {
    firstName: string;
    lastName: string;
    username: string;
  };
  vacancyTitle: string;
}

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

// API Functions
export const fetchDashboardStats = async (): Promise<ApiResponse<DashboardStats>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const result: ApiResponse<DashboardStats> = await response.json()
    return result
  } catch (err) {
    return {
      success: false,
      error: { 
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Network error occurred' 
      }
    }
  }
}

export const fetchRecentCandidates = async (limit = 10): Promise<ApiResponse<RecentCandidate[]>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/recent-candidates?limit=${limit}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const result: ApiResponse<RecentCandidate[]> = await response.json()
    return result
  } catch (err) {
    return {
      success: false,
      error: { 
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Network error occurred' 
      }
    }
  }
}

export const fetchRecentEvaluations = async (limit = 10): Promise<ApiResponse<RecentEvaluation[]>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/recent-evaluations?limit=${limit}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const result: ApiResponse<RecentEvaluation[]> = await response.json()
    return result
  } catch (err) {
    return {
      success: false,
      error: { 
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Network error occurred' 
      }
    }
  }
}
