import { NextRequest, NextResponse } from 'next/server'
import type { SignupRequest, SignupResponse } from '@/types/api'

export async function POST(request: NextRequest) {
  try {
    const body: SignupRequest = await request.json()
    const { name, email, password } = body

    // 입력 검증
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: '모든 필드를 입력해주세요.' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: '비밀번호는 8자 이상이어야 합니다.' },
        { status: 400 }
      )
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: '올바른 이메일 형식을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 실제 백엔드 서버가 있다면 여기서 API 호출
    if (process.env.BACKEND_API_URL) {
      const response = await fetch(`${process.env.BACKEND_API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return NextResponse.json(
          { success: false, message: errorData.message || '회원가입에 실패했습니다.' },
          { status: response.status }
        )
      }

      const data: SignupResponse = await response.json()
      return NextResponse.json({ success: true, data })
    }

    // 개발용 모의 응답
    const mockResponse: SignupResponse = {
      user: {
        id: Date.now().toString(),
        name: name,
        email: email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      token: 'mock-jwt-token-' + Date.now(),
    }

    return NextResponse.json({ success: true, data: mockResponse })
  } catch (error) {
    console.error('Signup API error:', error)
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
