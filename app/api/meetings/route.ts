import { NextRequest, NextResponse } from 'next/server'
import type { Meeting, CreateMeetingRequest, PaginatedResponse } from '@/types/api'

// GET /api/meetings - 회의 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // 실제 백엔드 서버가 있다면 여기서 API 호출
    if (process.env.BACKEND_API_URL) {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      })

      const response = await fetch(`${process.env.BACKEND_API_URL}/meetings?${params}`, {
        headers: {
          'Authorization': request.headers.get('Authorization') || '',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        return NextResponse.json(
          { success: false, message: errorData.message || '회의 목록을 가져오는데 실패했습니다.' },
          { status: response.status }
        )
      }

      const data: PaginatedResponse<Meeting> = await response.json()
      return NextResponse.json({ success: true, data })
    }

    // 개발용 모의 응답
    const mockMeetings: Meeting[] = [
      {
        id: '1',
        title: '프로젝트 기획 회의',
        date: new Date(Date.now() - 86400000).toISOString(),
        status: 'completed',
        summary: '프로젝트 일정과 역할 분담에 대해 논의했습니다.',
        actionCount: 3,
        duration: 1800,
        userId: '1',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: '2',
        title: '디자인 리뷰',
        date: new Date(Date.now() - 172800000).toISOString(),
        status: 'processing',
        userId: '1',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 172800000).toISOString(),
      },
    ]

    const paginatedResponse: PaginatedResponse<Meeting> = {
      data: mockMeetings,
      pagination: {
        page,
        limit,
        total: mockMeetings.length,
        totalPages: Math.ceil(mockMeetings.length / limit),
      },
    }

    return NextResponse.json({ success: true, data: paginatedResponse })
  } catch (error) {
    console.error('Meetings GET API error:', error)
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/meetings - 회의 생성
export async function POST(request: NextRequest) {
  try {
    const body: CreateMeetingRequest = await request.json()
    const { title } = body

    if (!title) {
      return NextResponse.json(
        { success: false, message: '회의 제목을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 실제 백엔드 서버가 있다면 여기서 API 호출
    if (process.env.BACKEND_API_URL) {
      const response = await fetch(`${process.env.BACKEND_API_URL}/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return NextResponse.json(
          { success: false, message: errorData.message || '회의 생성에 실패했습니다.' },
          { status: response.status }
        )
      }

      const data = await response.json()
      return NextResponse.json({ success: true, data })
    }

    // 개발용 모의 응답
    const newMeeting: Meeting = {
      id: Date.now().toString(),
      title,
      date: new Date().toISOString(),
      status: 'processing',
      userId: '1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({ 
      success: true, 
      data: { meeting: newMeeting } 
    })
  } catch (error) {
    console.error('Meetings POST API error:', error)
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
