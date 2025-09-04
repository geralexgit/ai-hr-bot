// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

// Types matching the backend structure
export interface VacancyRequirements {
  technicalSkills: RequiredSkill[]
  experience: ExperienceRequirement[]
  education?: EducationRequirement[]
  languages?: LanguageRequirement[]
  softSkills: string[]
}

export interface RequiredSkill {
  name: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  mandatory: boolean
  weight: number // 1-10
}

export interface ExperienceRequirement {
  domain: string
  minimumYears: number
  preferred: boolean
}

export interface EducationRequirement {
  degree: string
  field?: string
  mandatory: boolean
}

export interface LanguageRequirement {
  language: string
  level: 'basic' | 'intermediate' | 'advanced' | 'native'
  mandatory: boolean
}

export interface EvaluationWeights {
  technicalSkills: number // 0-100, default 50
  communication: number   // 0-100, default 30
  problemSolving: number  // 0-100, default 20
}

export interface Vacancy {
  id: number
  title: string
  description: string
  requirements: VacancyRequirements
  evaluationWeights: EvaluationWeights
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface CreateVacancyDto {
  title: string
  description: string
  requirements: VacancyRequirements
  evaluationWeights: EvaluationWeights
  status?: 'active' | 'inactive'
}

export interface UpdateVacancyDto {
  title?: string
  description?: string
  requirements?: VacancyRequirements
  evaluationWeights?: EvaluationWeights
  status?: 'active' | 'inactive'
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
export const fetchVacancies = async (): Promise<ApiResponse<Vacancy[]>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/vacancies`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const result: ApiResponse<Vacancy[]> = await response.json()
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

export const fetchVacancyById = async (id: number): Promise<ApiResponse<Vacancy>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/vacancies/${id}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const result: ApiResponse<Vacancy> = await response.json()
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

export const createVacancy = async (vacancyData: CreateVacancyDto): Promise<ApiResponse<Vacancy>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/vacancies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vacancyData),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result: ApiResponse<Vacancy> = await response.json()
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

export const updateVacancy = async (id: number, vacancyData: UpdateVacancyDto): Promise<ApiResponse<Vacancy>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/vacancies/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vacancyData),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result: ApiResponse<Vacancy> = await response.json()
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

export const deleteVacancy = async (id: number): Promise<ApiResponse<null>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/vacancies/${id}`, {
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
