// API 클라이언트 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

// Mock 서버 사용 여부 (환경변수로 제어)
const USE_MOCK_SERVER = process.env.NEXT_PUBLIC_USE_MOCK === 'true' || true // 강제 Mock 활성화

// API 응답 타입
interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

// API 에러 타입
interface ApiError {
  message: string
  status: number
}

// HTTP 클라이언트 클래스
class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    this.token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  }

  // 토큰 설정
  setToken(accessToken: string, refreshToken?: string) {
    this.token = accessToken
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken)
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken)
      }
    }
  }

  // 토큰 제거
  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  }

  // 기본 헤더 설정
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    return headers
  }

  // HTTP 요청 메서드
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw {
          message: errorData.message || 'API 요청 실패',
          status: response.status,
        } as ApiError
      }

      const data = await response.json()
      return data
    } catch (error) {
      if (error instanceof Error) {
        throw {
          message: error.message,
          status: 0,
        } as ApiError
      }
      throw error
    }
  }

  // GET 요청
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  // POST 요청
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // PUT 요청
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // DELETE 요청
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  // 파일 업로드
  async uploadFile<T>(endpoint: string, file: File): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)

    const url = `${this.baseURL}${endpoint}`
    const headers: HeadersInit = {}
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw {
          message: errorData.message || '파일 업로드 실패',
          status: response.status,
        } as ApiError
      }

      const data = await response.json()
      return data
    } catch (error) {
      if (error instanceof Error) {
        throw {
          message: error.message,
          status: 0,
        } as ApiError
      }
      throw error
    }
  }

  // AI 분석 요청
  async requestAnalysis<T>(meetingId: string, filePath: string): Promise<ApiResponse<T>> {
    return this.post<T>('/ai/analyze', {
      meetingId,
      filePath
    })
  }

  // 닉네임 중복 확인
  async checkNickname(nickname: string): Promise<{ available: boolean }> {
    const response = await this.get<{ available: boolean }>(`/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`)
    return response.data
  }
}

// API 클라이언트 인스턴스 생성 (Mock 서버 또는 실제 서버)
import { mockApiClient } from './mock-server'

export const apiClient = USE_MOCK_SERVER ? mockApiClient : new ApiClient(API_BASE_URL)

// API 에러 타입 export
export type { ApiError, ApiResponse }
