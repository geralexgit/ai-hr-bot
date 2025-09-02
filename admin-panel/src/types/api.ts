// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Vacancy Types
export interface Vacancy {
  id: string
  title: string
  description: string
  requirements: string[]
  skills: Skill[]
  status: 'active' | 'inactive' | 'closed'
  createdAt: string
  updatedAt: string
}

export interface Skill {
  id: string
  name: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  weight: number
}

// Candidate Types
export interface Candidate {
  id: string
  name: string
  email: string
  phone?: string
  resume?: string
  status: 'new' | 'screening' | 'interviewing' | 'offered' | 'hired' | 'rejected'
  vacancyId: string
  createdAt: string
  updatedAt: string
}

// Evaluation Types
export interface Evaluation {
  id: string
  candidateId: string
  vacancyId: string
  score: number
  feedback: string
  recommendations: string[]
  skills: SkillMatch[]
  createdAt: string
}

export interface SkillMatch {
  skillId: string
  skillName: string
  candidateLevel: number
  requiredLevel: number
  match: boolean
}

// Dialogue Types
export interface Dialogue {
  id: string
  candidateId: string
  vacancyId: string
  messages: Message[]
  status: 'active' | 'completed' | 'terminated'
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

// Statistics Types
export interface DashboardStats {
  activeVacancies: number
  totalCandidates: number
  interviewsToday: number
  successRate: number
}

export interface VacancyStats {
  vacancyId: string
  title: string
  totalCandidates: number
  activeCandidates: number
  hiredCandidates: number
  averageScore: number
}

// API Endpoints
export interface ApiEndpoints {
  vacancies: {
    list: () => Promise<ApiResponse<Vacancy[]>>
    get: (id: string) => Promise<ApiResponse<Vacancy>>
    create: (data: Omit<Vacancy, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ApiResponse<Vacancy>>
    update: (id: string, data: Partial<Vacancy>) => Promise<ApiResponse<Vacancy>>
    delete: (id: string) => Promise<ApiResponse<void>>
  }
  candidates: {
    list: (vacancyId?: string) => Promise<ApiResponse<Candidate[]>>
    get: (id: string) => Promise<ApiResponse<Candidate>>
    update: (id: string, data: Partial<Candidate>) => Promise<ApiResponse<Candidate>>
  }
  evaluations: {
    list: (candidateId?: string) => Promise<ApiResponse<Evaluation[]>>
    get: (id: string) => Promise<ApiResponse<Evaluation>>
  }
  stats: {
    dashboard: () => Promise<ApiResponse<DashboardStats>>
    vacancy: (id: string) => Promise<ApiResponse<VacancyStats>>
  }
}
