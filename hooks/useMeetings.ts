"use client"

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api'
import type { 
  Meeting, 
  CreateMeetingRequest, 
  UpdateMeetingRequest,
  PaginationParams,
  PaginatedResponse,
  MeetingStats 
} from '@/types/api'

interface UseMeetingsOptions {
  autoFetch?: boolean
  pagination?: PaginationParams
}

interface UseMeetingsReturn {
  meetings: Meeting[]
  isLoading: boolean
  error: string | null
  stats: MeetingStats | null
  createMeeting: (data: CreateMeetingRequest) => Promise<Meeting>
  updateMeeting: (id: string, data: UpdateMeetingRequest) => Promise<Meeting>
  deleteMeeting: (id: string) => Promise<void>
  refreshMeetings: () => Promise<void>
  uploadAudioFile: (file: File) => Promise<Meeting>
  uploadAudioBlob: (blob: Blob, title: string) => Promise<Meeting>
}

export function useMeetings(options: UseMeetingsOptions = {}): UseMeetingsReturn {
  const { autoFetch = true, pagination } = options
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<MeetingStats | null>(null)

  // 회의 목록 가져오기
  const fetchMeetings = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // 서버 연결 시
      if (process.env.NEXT_PUBLIC_API_URL) {
        const params = new URLSearchParams()
        if (pagination?.page) params.append('page', pagination.page.toString())
        if (pagination?.limit) params.append('limit', pagination.limit.toString())
        if (pagination?.sortBy) params.append('sortBy', pagination.sortBy)
        if (pagination?.sortOrder) params.append('sortOrder', pagination.sortOrder)

        const response = await apiClient.get<PaginatedResponse<Meeting>>(`/meetings?${params}`)
        setMeetings(response.data.data)
      } else {
        // 개발용 로컬 로직 (기존 코드 유지)
        const meetingsStr = localStorage.getItem('meetings')
        if (meetingsStr) {
          const loadedMeetings = JSON.parse(meetingsStr)
          setMeetings(loadedMeetings)

          // 처리 중인 회의 시뮬레이션
          const processingMeetings = loadedMeetings.filter((m: Meeting) => m.status === 'processing')
          if (processingMeetings.length > 0) {
            setTimeout(() => {
              const updatedMeetings = loadedMeetings.map((m: Meeting) =>
                m.status === 'processing' 
                  ? { 
                      ...m, 
                      status: 'completed' as const,
                      summary: '회의 내용이 성공적으로 분석되었습니다.',
                      actionCount: 4,
                      duration: 180,
                    } 
                  : m
              )
              setMeetings(updatedMeetings)
              localStorage.setItem('meetings', JSON.stringify(updatedMeetings))
            }, 5000)
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '회의 목록을 가져오는데 실패했습니다'
      setError(errorMessage)
      console.error('회의 목록 가져오기 실패:', err)
    } finally {
      setIsLoading(false)
    }
  }, [pagination])

  // 통계 정보 가져오기
  const fetchStats = useCallback(async () => {
    try {
      if (process.env.NEXT_PUBLIC_API_URL) {
        const response = await apiClient.get<MeetingStats>('/meetings/stats')
        setStats(response.data)
      } else {
        // 로컬 통계 계산
        const meetingsStr = localStorage.getItem('meetings')
        if (meetingsStr) {
          const loadedMeetings = JSON.parse(meetingsStr)
          const totalMeetings = loadedMeetings.length
          const completedMeetings = loadedMeetings.filter((m: Meeting) => m.status === 'completed').length
          const processingMeetings = loadedMeetings.filter((m: Meeting) => m.status === 'processing').length
          const failedMeetings = loadedMeetings.filter((m: Meeting) => m.status === 'failed').length
          const totalDuration = loadedMeetings.reduce((sum: number, m: Meeting) => sum + (m.duration || 0), 0)
          const totalActionItems = loadedMeetings.reduce((sum: number, m: Meeting) => sum + (m.actionCount || 0), 0)

          setStats({
            totalMeetings,
            totalDuration,
            averageDuration: totalMeetings > 0 ? totalDuration / totalMeetings : 0,
            completedMeetings,
            processingMeetings,
            failedMeetings,
            totalActionItems,
            completedActionItems: 0, // 로컬에서는 추적하지 않음
          })
        }
      }
    } catch (err) {
      console.error('통계 정보 가져오기 실패:', err)
    }
  }, [])

  // 회의 생성
  const createMeeting = useCallback(async (data: CreateMeetingRequest): Promise<Meeting> => {
    try {
      setError(null)

      if (process.env.NEXT_PUBLIC_API_URL) {
        const response = await apiClient.post<{ meeting: Meeting }>('/meetings', data)
        const newMeeting = response.data.meeting
        setMeetings(prev => [newMeeting, ...prev])
        return newMeeting
      } else {
        // 로컬 로직
        const newMeeting: Meeting = {
          id: Date.now().toString(),
          title: data.title,
          date: new Date().toISOString(),
          status: 'processing',
          userId: '1', // 로컬에서는 고정값
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        const meetingsStr = localStorage.getItem('meetings')
        const meetings = meetingsStr ? JSON.parse(meetingsStr) : []
        const updatedMeetings = [newMeeting, ...meetings]
        localStorage.setItem('meetings', JSON.stringify(updatedMeetings))
        setMeetings(updatedMeetings)

        // 처리 완료 시뮬레이션
        setTimeout(() => {
          const completedMeeting = {
            ...newMeeting,
            status: 'completed' as const,
            summary: '회의 내용이 성공적으로 분석되었습니다.',
            actionCount: 4,
            duration: 180,
          }
          const finalMeetings = updatedMeetings.map((m: Meeting) =>
            m.id === newMeeting.id ? completedMeeting : m
          )
          localStorage.setItem('meetings', JSON.stringify(finalMeetings))
          setMeetings(finalMeetings)
        }, 5000)

        return newMeeting
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '회의 생성에 실패했습니다'
      setError(errorMessage)
      throw err
    }
  }, [])

  // 회의 업데이트
  const updateMeeting = useCallback(async (id: string, data: UpdateMeetingRequest): Promise<Meeting> => {
    try {
      setError(null)

      if (process.env.NEXT_PUBLIC_API_URL) {
        const response = await apiClient.put<{ meeting: Meeting }>(`/meetings/${id}`, data)
        const updatedMeeting = response.data.meeting
        setMeetings(prev => prev.map(m => m.id === id ? updatedMeeting : m))
        return updatedMeeting
      } else {
        // 로컬 로직
        const meetingsStr = localStorage.getItem('meetings')
        const meetings = meetingsStr ? JSON.parse(meetingsStr) : []
        const updatedMeetings = meetings.map((m: Meeting) =>
          m.id === id ? { ...m, ...data, updatedAt: new Date().toISOString() } : m
        )
        localStorage.setItem('meetings', JSON.stringify(updatedMeetings))
        setMeetings(updatedMeetings)
        return updatedMeetings.find(m => m.id === id)!
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '회의 업데이트에 실패했습니다'
      setError(errorMessage)
      throw err
    }
  }, [])

  // 회의 삭제
  const deleteMeeting = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null)

      if (process.env.NEXT_PUBLIC_API_URL) {
        await apiClient.delete(`/meetings/${id}`)
        setMeetings(prev => prev.filter(m => m.id !== id))
      } else {
        // 로컬 로직
        const meetingsStr = localStorage.getItem('meetings')
        const meetings = meetingsStr ? JSON.parse(meetingsStr) : []
        const updatedMeetings = meetings.filter((m: Meeting) => m.id !== id)
        localStorage.setItem('meetings', JSON.stringify(updatedMeetings))
        setMeetings(updatedMeetings)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '회의 삭제에 실패했습니다'
      setError(errorMessage)
      throw err
    }
  }, [])

  // 오디오 파일 업로드
  const uploadAudioFile = useCallback(async (file: File): Promise<Meeting> => {
    try {
      setError(null)

      if (process.env.NEXT_PUBLIC_API_URL) {
        const response = await apiClient.uploadFile<{ meeting: Meeting }>('/meetings/upload', file)
        const newMeeting = response.data.meeting
        setMeetings(prev => [newMeeting, ...prev])
        return newMeeting
      } else {
        // 로컬 로직
        const title = file.name.replace(/\.[^/.]+$/, "")
        return createMeeting({ title, audioFile: file })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '파일 업로드에 실패했습니다'
      setError(errorMessage)
      throw err
    }
  }, [createMeeting])

  // 오디오 블롭 업로드
  const uploadAudioBlob = useCallback(async (blob: Blob, title: string): Promise<Meeting> => {
    try {
      setError(null)

      if (process.env.NEXT_PUBLIC_API_URL) {
        // Blob을 File로 변환
        const file = new File([blob], `${title}.webm`, { type: blob.type })
        return uploadAudioFile(file)
      } else {
        // 로컬 로직
        return createMeeting({ title, audioBlob: blob })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '오디오 업로드에 실패했습니다'
      setError(errorMessage)
      throw err
    }
  }, [createMeeting, uploadAudioFile])

  // 데이터 새로고침
  const refreshMeetings = useCallback(async () => {
    await Promise.all([fetchMeetings(), fetchStats()])
  }, [fetchMeetings, fetchStats])

  // 초기 데이터 로드
  useEffect(() => {
    if (autoFetch) {
      refreshMeetings()
    }
  }, [autoFetch, refreshMeetings])

  return {
    meetings,
    isLoading,
    error,
    stats,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    refreshMeetings,
    uploadAudioFile,
    uploadAudioBlob,
  }
}
