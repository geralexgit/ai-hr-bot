export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  description?: string;
  category: string;
  valueType: 'string' | 'number' | 'boolean' | 'json';
  isEncrypted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSystemSettingDto {
  key: string;
  value: string;
  description?: string;
  category?: string;
  valueType?: 'string' | 'number' | 'boolean' | 'json';
  isEncrypted?: boolean;
}

export interface UpdateSystemSettingDto {
  value?: string;
  description?: string;
  category?: string;
  valueType?: 'string' | 'number' | 'boolean' | 'json';
  isEncrypted?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  message?: string;
}

export interface LLMTestResult {
  provider: 'ollama' | 'perplexity';
  connected: boolean;
}

const API_BASE_URL = 'http://localhost:3000/api';

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: {
          code: errorData.error?.code || 'HTTP_ERROR',
          message: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
        },
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    
    // Handle different types of network errors
    let errorMessage = 'Network error occurred';
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to server. Please check if the backend is running.';
      } else if (error.message.includes('NetworkError')) {
        errorMessage = 'Network connection failed. Please check your connection.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: errorMessage,
      },
    };
  }
}

export async function fetchSettings(category?: string): Promise<ApiResponse<SystemSetting[]>> {
  const params = category ? `?category=${encodeURIComponent(category)}` : '';
  return apiRequest<SystemSetting[]>(`/settings${params}`);
}

export async function fetchSettingCategories(): Promise<ApiResponse<string[]>> {
  return apiRequest<string[]>('/settings/categories');
}

export async function fetchSettingByKey(key: string): Promise<ApiResponse<SystemSetting>> {
  return apiRequest<SystemSetting>(`/settings/${encodeURIComponent(key)}`);
}

export async function createSetting(data: CreateSystemSettingDto): Promise<ApiResponse<SystemSetting>> {
  return apiRequest<SystemSetting>('/settings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateSetting(key: string, data: UpdateSystemSettingDto): Promise<ApiResponse<SystemSetting>> {
  return apiRequest<SystemSetting>(`/settings/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteSetting(key: string): Promise<ApiResponse<void>> {
  return apiRequest<void>(`/settings/${encodeURIComponent(key)}`, {
    method: 'DELETE',
  });
}

export async function batchUpdateSettings(updates: Array<{ key: string; value: string }>): Promise<ApiResponse<void>> {
  return apiRequest<void>('/settings/batch', {
    method: 'PUT',
    body: JSON.stringify({ updates }),
  });
}

export async function testLLMConnection(): Promise<ApiResponse<LLMTestResult>> {
  return apiRequest<LLMTestResult>('/settings/llm/test', {
    method: 'POST',
  });
}
