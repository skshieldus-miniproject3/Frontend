// Mock 서버 - 실제 API와 동일한 응답 구조
import type { 
  User, 
  LoginRequest, 
  LoginResponse, 
  SignupRequest, 
  SignupResponse, 
  Meeting, 
  CreateMeetingRequest, 
  CreateMeetingResponse,
  UpdateMeetingRequest,
  UpdateMeetingResponse,
  Speaker,
  Segment
} from '@/types/api'

// Mock 데이터 저장소
class MockDataStore {
  private users: User[] = [
    {
      userId: 'test-user-1',
      email: 'test@meeting.com',
      nickname: '테스트 사용자',
      createdAt: new Date().toISOString()
    }
  ]
  private meetings: Meeting[] = [
    {
      meetingId: 'mock-meeting-1',
      title: '프로젝트 기획 회의',
      date: new Date(Date.now() - 86400000).toISOString(),
      status: 'completed',
      summary: '프로젝트 일정과 역할 분담에 대해 논의했습니다. 다음 주까지 디자인 시안을 완성하기로 결정했습니다.',
      keywords: ['프로젝트', '일정', '역할분담', '디자인'],
      speakers: [
        {
          speakerId: 'speaker_1',
          segments: [
            { start: 0, end: 5, text: '안녕하세요, 오늘 회의를 시작하겠습니다.' },
            { start: 5, end: 15, text: '주요 안건은 프로젝트 일정 조정입니다.' }
          ]
        },
        {
          speakerId: 'speaker_2',
          segments: [
            { start: 15, end: 25, text: '네, 이해했습니다. 다음 주까지 완료하겠습니다.' }
          ]
        }
      ],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      meetingId: 'mock-meeting-2',
      title: '디자인 리뷰 미팅',
      date: new Date(Date.now() - 172800000).toISOString(),
      status: 'completed',
      summary: 'UI/UX 디자인 시안에 대한 검토를 진행했습니다. 전반적으로 긍정적인 피드백을 받았습니다.',
      keywords: ['디자인', 'UI', 'UX', '피드백'],
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      meetingId: 'mock-meeting-3',
      title: '주간 스프린트 회고',
      date: new Date(Date.now() - 259200000).toISOString(),
      status: 'processing',
      createdAt: new Date(Date.now() - 259200000).toISOString(),
    }
  ]
  private tokens: Map<string, string> = new Map() // token -> userId

  // 사용자 생성
  createUser(userData: SignupRequest): User {
    const user: User = {
      userId: `user_${Date.now()}`,
      email: userData.email,
      nickname: userData.nickname,
      createdAt: new Date().toISOString()
    }
    this.users.push(user)
    return user
  }

  // 사용자 조회
  getUserByEmail(email: string): User | undefined {
    return this.users.find(u => u.email === email)
  }

  // 닉네임 중복 확인
  isNicknameAvailable(nickname: string): boolean {
    return !this.users.some(u => u.nickname === nickname)
  }

  // 토큰 생성
  generateToken(userId: string): string {
    const token = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.tokens.set(token, userId)
    return token
  }

  // 토큰으로 사용자 조회
  getUserByToken(token: string): User | undefined {
    const userId = this.tokens.get(token)
    if (!userId) return undefined
    return this.users.find(u => u.userId === userId)
  }

  // 회의 생성
  createMeeting(meetingData: CreateMeetingRequest): CreateMeetingResponse {
    const meetingId = `meeting_${Date.now()}`
    const meeting: Meeting = {
      meetingId,
      title: meetingData.title,
      date: meetingData.date,
      status: 'uploaded',
      createdAt: new Date().toISOString()
    }
    this.meetings.push(meeting)
    
    // 3초 후 processing으로 변경
    setTimeout(() => {
      const foundMeeting = this.meetings.find(m => m.meetingId === meetingId)
      if (foundMeeting) {
        foundMeeting.status = 'processing'
      }
    }, 3000)

    // 10초 후 completed로 변경 (AI 분석 완료 시뮬레이션)
    setTimeout(() => {
      const foundMeeting = this.meetings.find(m => m.meetingId === meetingId)
      if (foundMeeting) {
        foundMeeting.status = 'completed'
        foundMeeting.summary = '회의 내용이 성공적으로 분석되었습니다. 주요 안건과 결정사항들이 정리되었습니다.'
        foundMeeting.keywords = ['프로젝트', '일정', '담당자', '마감일']
        foundMeeting.speakers = [
          {
            speakerId: 'speaker_1',
            segments: [
              { start: 0, end: 5, text: '안녕하세요, 오늘 회의를 시작하겠습니다.' },
              { start: 5, end: 15, text: '주요 안건은 프로젝트 일정 조정입니다.' }
            ]
          },
          {
            speakerId: 'speaker_2', 
            segments: [
              { start: 15, end: 25, text: '네, 이해했습니다. 다음 주까지 완료하겠습니다.' }
            ]
          }
        ]
      }
    }, 10000)

    return {
      meetingId,
      status: 'uploaded',
      message: '파일 업로드 완료 및 분석 요청 전송됨'
    }
  }

  // 회의 목록 조회
  getMeetings(page: number = 1, size: number = 10): { content: Meeting[], page: number, size: number, totalPages: number } {
    const startIndex = (page - 1) * size
    const endIndex = startIndex + size
    const content = this.meetings.slice(startIndex, endIndex)
    const totalPages = Math.ceil(this.meetings.length / size)
    
    return { content, page, size, totalPages }
  }

  // 회의 상세 조회
  getMeetingById(meetingId: string): Meeting | undefined {
    return this.meetings.find(m => m.meetingId === meetingId)
  }

  // 회의 수정
  updateMeeting(meetingId: string, data: UpdateMeetingRequest): UpdateMeetingResponse {
    const meeting = this.meetings.find(m => m.meetingId === meetingId)
    if (!meeting) throw new Error('회의를 찾을 수 없습니다')
    
    if (data.title) meeting.title = data.title
    if (data.summary) meeting.summary = data.summary
    if (data.keywords) meeting.keywords = data.keywords
    
    return { message: '수정 완료' }
  }

  // 회의 삭제
  deleteMeeting(meetingId: string): { message: string } {
    const index = this.meetings.findIndex(m => m.meetingId === meetingId)
    if (index === -1) throw new Error('회의를 찾을 수 없습니다')
    
    this.meetings.splice(index, 1)
    return { message: '삭제 완료' }
  }
}

// Mock 서버 인스턴스
const mockStore = new MockDataStore()

// Mock API 클라이언트
export class MockApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    // 초기화 시 localStorage에서 토큰 읽기
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('accessToken')
    }
  }

  setToken(accessToken: string, refreshToken?: string) {
    this.token = accessToken
    // localStorage에도 저장
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken)
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken)
      }
    }
  }

  clearToken() {
    this.token = null
    // localStorage에서도 제거
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  }

  private async mockRequest<T>(endpoint: string, options: RequestInit = {}): Promise<{ data: T }> {
    console.log('[Mock Server] Request:', options.method, endpoint, 'Token:', this.token ? 'Present' : 'None')
    
    // 인증이 필요한 요청인지 확인
    const authRequired = !endpoint.includes('/auth/signup') && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/check-nickname')
    
    if (authRequired && !this.token) {
      console.error('[Mock Server] 인증 필요 - 토큰 없음')
      throw { message: '인증이 필요합니다', status: 401 }
    }

    // 토큰 검증
    if (authRequired && this.token) {
      const user = mockStore.getUserByToken(this.token)
      if (!user) {
        console.error('[Mock Server] 유효하지 않은 토큰:', this.token)
        throw { message: '유효하지 않은 토큰입니다', status: 401 }
      }
      console.log('[Mock Server] 인증 성공:', user.email)
    }

    // 쿼리 스트링 제거하고 순수 경로만 추출
    const cleanEndpoint = endpoint.split('?')[0]
    
    // API 엔드포인트별 처리
    switch (cleanEndpoint) {
      case '/auth/signup':
        if (options.method === 'POST') {
          const body = JSON.parse(options.body as string)
          const existingUser = mockStore.getUserByEmail(body.email)
          if (existingUser) {
            throw { message: '이미 등록된 이메일입니다', status: 409 }
          }
          const user = mockStore.createUser(body)
          const token = mockStore.generateToken(user.userId)
          return { data: { message: '가입 완료' } as T }
        }
        break

      case '/auth/login':
        if (options.method === 'POST') {
          const body = JSON.parse(options.body as string)
          
          // Mock에서는 간단한 비밀번호 검증 (8자 이상이면 통과)
          if (body.password.length < 8) {
            throw { message: '이메일 또는 비밀번호가 올바르지 않습니다', status: 401 }
          }
          
          let user = mockStore.getUserByEmail(body.email)
          
          // 개발 편의를 위해 사용자가 없으면 자동 생성 (Mock 전용)
          if (!user) {
            user = mockStore.createUser({
              email: body.email,
              password: body.password,
              nickname: body.email.split('@')[0]
            })
          }
          
          const token = mockStore.generateToken(user.userId)
          return { data: { accessToken: token, refreshToken: `refresh_${token}` } as T }
        }
        break

      case '/auth/logout':
        if (options.method === 'POST') {
          return { data: { message: '로그아웃 완료' } as T }
        }
        break

      case '/auth/me':
        if (options.method === 'GET') {
          const user = mockStore.getUserByToken(this.token!)
          if (!user) throw { message: '사용자 정보를 찾을 수 없습니다', status: 404 }
          return { data: user as T }
        }
        break

      case '/auth/check-nickname':
        if (options.method === 'GET') {
          // URL 파싱 수정
          const url = new URL(`http://localhost:3000${endpoint}`)
          const nickname = url.searchParams.get('nickname')
          if (!nickname) {
            throw { message: '닉네임이 필요합니다', status: 400 }
          }
          const available = mockStore.isNicknameAvailable(nickname)
          return { data: { available } as T }
        }
        break

      case '/meetings':
        if (options.method === 'GET') {
          console.log('[Mock Server] Getting meetings list')
          const url = new URL(`http://localhost:3000${endpoint}`)
          const page = parseInt(url.searchParams.get('page') || '1')
          const size = parseInt(url.searchParams.get('size') || '10')
          const result = mockStore.getMeetings(page, size)
          console.log('[Mock Server] Meetings found:', result.content.length)
          return { data: result as T }
        } else if (options.method === 'POST') {
          // FormData 처리
          const formData = options.body as FormData
          const title = formData.get('title') as string
          const date = formData.get('date') as string
          const file = formData.get('file') as File
          
          if (!title || !date || !file) {
            throw { message: '필수 필드가 누락되었습니다', status: 400 }
          }
          
          const result = mockStore.createMeeting({ title, date, file })
          return { data: result as T }
        }
        break

      default:
        // 동적 라우트 처리 (/meetings/{id})
        if (cleanEndpoint.startsWith('/meetings/') && cleanEndpoint !== '/meetings') {
          const meetingId = cleanEndpoint.split('/')[2]
          
          if (options.method === 'GET') {
            const meeting = mockStore.getMeetingById(meetingId)
            if (!meeting) {
              throw { message: '회의를 찾을 수 없습니다', status: 404 }
            }
            return { data: meeting as T }
          } else if (options.method === 'PUT') {
            const body = JSON.parse(options.body as string)
            const result = mockStore.updateMeeting(meetingId, body)
            return { data: result as T }
          } else if (options.method === 'DELETE') {
            const result = mockStore.deleteMeeting(meetingId)
            return { data: result as T }
          }
        }
        break
    }

    console.error('[Mock Server] API not found:', cleanEndpoint, options.method)
    throw { message: 'API를 찾을 수 없습니다', status: 404 }
  }

  async get<T>(endpoint: string): Promise<{ data: T }> {
    return this.mockRequest<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<{ data: T }> {
    return this.mockRequest<T>(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data)
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<{ data: T }> {
    return this.mockRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async delete<T>(endpoint: string): Promise<{ data: T }> {
    return this.mockRequest<T>(endpoint, { method: 'DELETE' })
  }

  async checkNickname(nickname: string): Promise<{ available: boolean }> {
    try {
      const result = await this.get<{ available: boolean }>(`/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`)
      return result.data
    } catch (error) {
      // Mock 서버에서 직접 처리
      const available = mockStore.isNicknameAvailable(nickname)
      return { available }
    }
  }

  async requestAnalysis<T>(meetingId: string, filePath: string): Promise<{ data: T }> {
    // Mock에서는 분석 요청을 받았다고 가정
    return { data: { status: 'processing' } as T }
  }
}

// Mock 서버 인스턴스 생성
export const mockApiClient = new MockApiClient('http://localhost:3001')
