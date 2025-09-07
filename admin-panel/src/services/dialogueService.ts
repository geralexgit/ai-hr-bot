// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// Types for dialogue data
export interface Dialogue {
  id: number
  candidateId: number
  vacancyId: number
  messageType: 'text' | 'audio' | 'system'
  content: string
  audioFilePath?: string
  transcription?: string
  sender: 'candidate' | 'bot'
  createdAt: string
  vacancy?: {
    id: number
    title: string
    description: string
    status: 'active' | 'inactive'
  } | null
}

export interface DialogueHistoryResponse {
  candidate: {
    id: number
    telegramUserId: number
    firstName?: string
    lastName?: string
    username?: string
    createdAt: string
  }
  vacancy?: {
    id: number
    title: string
    description: string
    status: 'active' | 'inactive'
  } | null
  dialogues: Dialogue[]
  totalMessages: number
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
export const fetchCandidateDialogues = async (
  candidateId: number, 
  vacancyId?: number
): Promise<ApiResponse<DialogueHistoryResponse>> => {
  try {
    let url = `${API_BASE_URL}/api/dashboard/candidates/${candidateId}/dialogues`
    if (vacancyId) {
      url += `?vacancyId=${vacancyId}`
    }
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const result: ApiResponse<DialogueHistoryResponse> = await response.json()
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

// Helper function to format message timestamp
export const formatMessageTime = (dateString: string | null | undefined): string => {
  if (!dateString || dateString === 'null' || dateString === 'undefined') {
    return 'Unknown time'
  }

  // Handle different date formats that might come from the database
  let date: Date
  try {
    // Handle ISO string format (from BaseRepository conversion)
    if (dateString.includes('T') && dateString.includes('Z')) {
      date = new Date(dateString)
    } 
    // Handle PostgreSQL timestamp format (YYYY-MM-DD HH:MM:SS.mmm)
    else if (dateString.includes('-') && dateString.includes(':')) {
      // Try parsing as-is first
      date = new Date(dateString)
      
      // If invalid, try converting space to T for ISO format
      if (isNaN(date.getTime())) {
        const isoString = dateString.replace(' ', 'T')
        date = new Date(isoString)
      }
    }
    // Try direct parsing for any other format
    else {
      date = new Date(dateString)
    }
    
    // Final validation
    if (isNaN(date.getTime())) {
      console.warn('Invalid date format:', dateString)
      return 'Invalid date'
    }
  } catch (error) {
    console.warn('Error parsing date:', dateString, error)
    return 'Invalid date'
  }

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  const diffDays = diffHours / 24

  // Handle negative differences (future dates) or very large differences
  if (diffMs < 0 || diffDays > 365) {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`
  } else if (diffHours < 24) {
    const hours = Math.floor(diffHours)
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  } else if (diffDays < 7) {
    const days = Math.floor(diffDays)
    return `${days} day${days === 1 ? '' : 's'} ago`
  } else {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

// Helper function to get message type icon
export const getMessageTypeIcon = (messageType: 'text' | 'audio' | 'system'): string => {
  switch (messageType) {
    case 'text':
      return '💬'
    case 'audio':
      return '🎵'
    case 'system':
      return '⚙️'
    default:
      return '📝'
  }
}

// Helper function to get sender badge style
export const getSenderBadgeStyle = (sender: 'candidate' | 'bot'): string => {
  switch (sender) {
    case 'candidate':
      return 'bg-blue-100 text-blue-800'
    case 'bot':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Helper function to truncate long messages for preview
export const truncateMessage = (content: string, maxLength: number = 100): string => {
  if (content.length <= maxLength) return content
  return content.substring(0, maxLength) + '...'
}

// Helper function to format bot messages that might be stored as JSON
export const formatBotMessage = (content: string): string => {
  if (!content) return ''
  
  // Check if the content looks like JSON
  const trimmedContent = content.trim()
  if (trimmedContent.startsWith('{') && trimmedContent.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmedContent)
      
      // Handle the specific format used by the bot
      if (parsed.feedback || parsed.next_question) {
        let formattedMessage = ''
        
        if (parsed.feedback) {
          formattedMessage += parsed.feedback
        }
        
        if (parsed.next_question) {
          if (formattedMessage) formattedMessage += ' '
          formattedMessage += parsed.next_question
        }
        
        return formattedMessage || content
      }
      
      // Handle other JSON formats by joining values
      const values = Object.values(parsed).filter(v => v && typeof v === 'string')
      if (values.length > 0) {
        return values.join(' ')
      }
    } catch (error) {
      // If JSON parsing fails, return original content
      console.warn('Failed to parse bot message JSON:', error)
    }
  }
  
  return content
}
