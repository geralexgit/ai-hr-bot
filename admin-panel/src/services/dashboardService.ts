// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// Types for dashboard data
export interface DashboardStats {
  activeVacancies: number
  totalCandidates: number
  interviewsToday: number
  successRate: number
  recentActivity: RecentActivity[]
  evaluationDistribution: EvaluationDistribution[]
  averageScores: AverageScores
}

export interface RecentActivity {
  id: number
  overall_score: number | null
  recommendation: 'proceed' | 'reject' | 'clarify'
  created_at: string
  first_name: string | null
  last_name: string | null
  username: string | null
  vacancy_title: string
}

export interface EvaluationDistribution {
  recommendation: 'proceed' | 'reject' | 'clarify'
  count: string
}

export interface AverageScores {
  avg_overall: number
  avg_technical: number
  avg_communication: number
  avg_problem_solving: number
}

export interface TrendData {
  evaluationTrends: EvaluationTrend[]
  candidateTrends: CandidateTrend[]
  scoreTrends: ScoreTrend[]
}

export interface EvaluationTrend {
  date: string
  count: string
  proceed_count: string
  reject_count: string
  clarify_count: string
}

export interface CandidateTrend {
  date: string
  count: string
}

export interface ScoreTrend {
  date: string
  avg_score: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
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

export const fetchDashboardTrends = async (): Promise<ApiResponse<TrendData>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/trends`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const result: ApiResponse<TrendData> = await response.json()
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
