// 사용자 관련 타입
export interface User {
  id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  token: string
}

export interface SignupRequest {
  name: string
  email: string
  password: string
}

export interface SignupResponse {
  user: User
  token: string
}

// 회의 관련 타입
export interface Meeting {
  id: string
  title: string
  date: string
  status: 'processing' | 'completed' | 'failed'
  summary?: string
  actionCount?: number
  duration?: number
  audioUrl?: string
  transcript?: string
  createdAt: string
  updatedAt: string
  userId: string
}

export interface CreateMeetingRequest {
  title: string
  audioFile?: File
  audioBlob?: Blob
}

export interface CreateMeetingResponse {
  meeting: Meeting
}

export interface UpdateMeetingRequest {
  title?: string
  summary?: string
  actionCount?: number
  duration?: number
  transcript?: string
}

export interface UpdateMeetingResponse {
  meeting: Meeting
}

// API 응답 타입
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface ApiError {
  message: string
  status: number
}

// 페이지네이션 타입
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// 파일 업로드 타입
export interface FileUploadResponse {
  fileUrl: string
  fileName: string
  fileSize: number
  mimeType: string
}

// 녹음 관련 타입
export interface RecordingData {
  blob: Blob
  duration: number
  mimeType: string
}

// 회의 분석 결과 타입
export interface MeetingAnalysis {
  summary: string
  actionItems: ActionItem[]
  keyPoints: string[]
  participants: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  confidence: number
}

export interface ActionItem {
  id: string
  description: string
  assignee?: string
  dueDate?: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed'
}

// 통계 타입
export interface MeetingStats {
  totalMeetings: number
  totalDuration: number
  averageDuration: number
  completedMeetings: number
  processingMeetings: number
  failedMeetings: number
  totalActionItems: number
  completedActionItems: number
}
