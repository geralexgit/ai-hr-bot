// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// Types
export interface PromptSetting {
  id: number
  name: string
  description?: string
  promptTemplate: string
  category: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreatePromptSettingDto {
  name: string
  description?: string
  promptTemplate: string
  category: string
  isActive?: boolean
}

export interface UpdatePromptSettingDto {
  name?: string
  description?: string
  promptTemplate?: string
  category?: string
  isActive?: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: {
    code: string
    message: string
    details?: any
  }
}

// API Functions
export const fetchPromptSettings = async (category?: string, activeOnly?: boolean): Promise<ApiResponse<PromptSetting[]>> => {
  try {
    const params = new URLSearchParams()
    if (category) params.append('category', category)
    if (activeOnly) params.append('active', 'true')
    
    const url = `${API_BASE_URL}/api/prompt-settings${params.toString() ? '?' + params.toString() : ''}`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result: ApiResponse<PromptSetting[]> = await response.json()
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

export const fetchPromptSettingById = async (id: number): Promise<ApiResponse<PromptSetting>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/prompt-settings/${id}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const result: ApiResponse<PromptSetting> = await response.json()
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

export const fetchPromptSettingByName = async (name: string): Promise<ApiResponse<PromptSetting>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/prompt-settings/name/${encodeURIComponent(name)}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const result: ApiResponse<PromptSetting> = await response.json()
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

export const fetchPromptCategories = async (): Promise<ApiResponse<string[]>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/prompt-settings/categories`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const result: ApiResponse<string[]> = await response.json()
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

export const createPromptSetting = async (data: CreatePromptSettingDto): Promise<ApiResponse<PromptSetting>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/prompt-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result: ApiResponse<PromptSetting> = await response.json()
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

export const updatePromptSetting = async (id: number, data: UpdatePromptSettingDto): Promise<ApiResponse<PromptSetting>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/prompt-settings/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result: ApiResponse<PromptSetting> = await response.json()
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

export const deletePromptSetting = async (id: number): Promise<ApiResponse<null>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/prompt-settings/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result: ApiResponse<null> = await response.json()
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
