// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// Types for candidates data
export interface Candidate {
  id: number
  telegramUserId: number
  firstName?: string
  lastName?: string
  username?: string
  cvFilePath?: string
  cvFileName?: string
  cvFileSize?: number
  cvUploadedAt?: string
  createdAt: string
  vacancy?: {
    id: number
    title: string
  } | null
  evaluation?: {
    id: number
    overallScore: number
    recommendation: 'proceed' | 'reject' | 'clarify'
    evaluationDate: string
  } | null
}

export interface PaginatedCandidatesResponse {
  candidates: Candidate[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
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
export const fetchCandidates = async (page: number = 1, limit: number = 20): Promise<ApiResponse<PaginatedCandidatesResponse>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/candidates?page=${page}&limit=${limit}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const result: ApiResponse<PaginatedCandidatesResponse> = await response.json()
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

// Helper function to format candidate name
export const formatCandidateName = (candidate: Candidate): string => {
  const parts = []
  if (candidate.firstName) parts.push(candidate.firstName)
  if (candidate.lastName) parts.push(candidate.lastName)
  if (parts.length === 0 && candidate.username) {
    return `@${candidate.username}`
  }
  if (parts.length === 0) {
    return `User ${candidate.telegramUserId}`
  }
  return parts.join(' ')
}

// Helper function to get recommendation badge color
export const getRecommendationBadgeColor = (recommendation: 'proceed' | 'reject' | 'clarify'): string => {
  switch (recommendation) {
    case 'proceed':
      return 'bg-green-100 text-green-800'
    case 'reject':
      return 'bg-red-100 text-red-800'
    case 'clarify':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Helper function to generate CV file URL
export const getCvFileUrl = (candidate: Candidate): string | null => {
  if (!candidate.cvFileName || !candidate.cvFilePath) {
    return null
  }
  // Properly encode the filename to handle Cyrillic and special characters
  const encodedFilename = encodeURIComponent(candidate.cvFileName)
  return `${API_BASE_URL}/api/files/cv/${candidate.id}/${encodedFilename}`
}

// Helper function to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
