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

      const params = new URLSearchParams()
      if (pagination?.page) params.append('page', pagination.page.toString())
      if (pagination?.limit) params.append('size', pagination.limit.toString())
      if (pagination?.sortBy) params.append('sortBy', pagination.sortBy)
      if (pagination?.sortOrder) params.append('sortOrder', pagination.sortOrder)

      const response = await apiClient.get<{ content: Meeting[], page: number, size: number, totalPages: number }>(`/meetings?${params}`)
      setMeetings(response.data.content)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '회의 목록을 가져오는데 실패했습니다'
      setError(errorMessage)
      console.error('회의 목록 가져오기 실패:', err)
    } finally {
      setIsLoading(false)
    }
  }, [pagination])

  // 통계 정보 가져오기 (API에 통계 엔드포인트가 없으므로 로컬 계산)
  const fetchStats = useCallback(async () => {
    try {
      const totalMeetings = meetings.length
      const completedMeetings = meetings.filter((m: Meeting) => m.status === 'completed').length
      const processingMeetings = meetings.filter((m: Meeting) => m.status === 'processing').length
      const failedMeetings = meetings.filter((m: Meeting) => m.status === 'failed').length
      const totalDuration = meetings.reduce((sum: number, m: Meeting) => sum + (m.duration || 0), 0)
      const totalActionItems = meetings.reduce((sum: number, m: Meeting) => sum + (m.actionCount || 0), 0)

      setStats({
        totalMeetings,
        totalDuration,
        averageDuration: totalMeetings > 0 ? totalDuration / totalMeetings : 0,
        completedMeetings,
        processingMeetings,
        failedMeetings,
        totalActionItems,
        completedActionItems: 0,
      })
    } catch (err) {
      console.error('통계 정보 가져오기 실패:', err)
    }
  }, [meetings])

  // 회의 생성 (파일 업로드)
  const createMeeting = useCallback(async (data: CreateMeetingRequest): Promise<Meeting> => {
    try {
      setError(null)

      const formData = new FormData()
      formData.append('title', data.title)
      formData.append('date', data.date)
      formData.append('file', data.file)

      const response = await apiClient.post<CreateMeetingResponse>('/meetings', formData)
      
      // 새로 생성된 회의 정보로 Meeting 객체 생성
      const newMeeting: Meeting = {
        meetingId: response.data.meetingId,
        title: data.title,
        date: data.date,
        status: response.data.status,
        createdAt: new Date().toISOString(),
      }
      
      setMeetings(prev => [newMeeting, ...prev])
      
      // AI 분석 요청 (백그라운드에서 실행)
      try {
        await apiClient.requestAnalysis<{ status: 'processing' }>(response.data.meetingId, '')
      } catch (analysisError) {
        console.warn('AI 분석 요청 실패:', analysisError)
        // 분석 요청 실패해도 회의 생성은 성공으로 처리
      }
      
      return newMeeting
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

      const response = await apiClient.put<UpdateMeetingResponse>(`/meetings/${id}`, data)
      
      // 업데이트된 회의 정보 가져오기
      const meetingResponse = await apiClient.get<Meeting>(`/meetings/${id}`)
      const updatedMeeting = meetingResponse.data
      
      setMeetings(prev => prev.map(m => m.meetingId === id ? updatedMeeting : m))
      return updatedMeeting
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

      await apiClient.delete(`/meetings/${id}`)
      setMeetings(prev => prev.filter(m => m.meetingId !== id))
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

      const title = file.name.replace(/\.[^/.]+$/, "")
      const date = new Date().toISOString()
      
      return createMeeting({ 
        title, 
        date, 
        file 
      })
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

      // Blob을 File로 변환
      const file = new File([blob], `${title}.webm`, { type: blob.type })
      const date = new Date().toISOString()
      
      return createMeeting({ 
        title, 
        date, 
        file 
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '오디오 업로드에 실패했습니다'
      setError(errorMessage)
      throw err
    }
  }, [createMeeting])

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
