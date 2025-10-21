import { NextRequest, NextResponse } from 'next/server'
import type { LoginRequest, LoginResponse } from '@/types/api'

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    const { email, password } = body

    // 입력 검증
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 실제 백엔드 서버가 있다면 여기서 API 호출
    if (process.env.BACKEND_API_URL) {
      const response = await fetch(`${process.env.BACKEND_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return NextResponse.json(
          { success: false, message: errorData.message || '로그인에 실패했습니다.' },
          { status: response.status }
        )
      }

      const data: LoginResponse = await response.json()
      return NextResponse.json({ success: true, data })
    }

    // 개발용 모의 응답
    if (email === 'test@meeting.com' && password === 'test1234') {
      const mockResponse: LoginResponse = {
        accessToken: 'mock-access-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
      }

      return NextResponse.json({ success: true, data: mockResponse })
    }

    return NextResponse.json(
      { success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
