"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Download, ArrowLeft, CheckCircle2, Clock, User, Mic, LogOut, Edit, Save, X, Star } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { apiClient } from "@/lib/api"
import { useMeetings } from "@/hooks/useMeetings"
import type { Meeting, UpdateMeetingRequest } from "@/types/api"

// Mock data
const mockResult = {
  summary:
    "주간 스프린트 회의에서 베타 버전 출시 일정과 주요 기능 개발 현황을 논의했습니다. 로그인 시스템 리팩토링과 결제 모듈 통합이 주요 안건이었으며, 각 담당자별 마감일이 설정되었습니다.",
  decisions: [
    {
      title: "베타 버전 10월 31일 출시 확정",
      rationale: "현재 개발 진행률과 QA 일정을 고려하여 결정",
      source: "회의 시작 후 5분 경과 시점",
    },
    {
      title: "결제 모듈은 Stripe로 최종 결정",
      rationale: "개발 편의성과 국내외 결제 지원을 고려",
      source: "회의 중반부",
    },
  ],
  actionItems: [
    {
      id: 1,
      title: "로그인 시스템 리팩토링",
      assignee: "모인지",
      dueDate: "2025-10-28",
      priority: "HIGH",
      status: "TODO",
    },
    {
      id: 2,
      title: "Stripe 결제 모듈 통합",
      assignee: "곽병국",
      dueDate: "2025-10-30",
      priority: "HIGH",
      status: "TODO",
    },
    {
      id: 3,
      title: "UI/UX 최종 검토 및 수정",
      assignee: "이석영",
      dueDate: "2025-10-29",
      priority: "MEDIUM",
      status: "TODO",
    },
    {
      id: 4,
      title: "베타 테스트 시나리오 작성",
      assignee: "신재석",
      dueDate: "2025-10-27",
      priority: "MEDIUM",
      status: "TODO",
    },
  ],
  transcript: `[00:00] 곽병국: 안녕하세요, 주간 스프린트 회의 시작하겠습니다.
[00:15] 모인지: 로그인 시스템 리팩토링 진행 중입니다. 이번 주 금요일까지 완료 예정입니다.
[00:45] 곽병국: 좋습니다. 결제 모듈은 Stripe로 최종 결정했습니다.
[01:20] 이석영: UI 검토는 목요일까지 마무리하겠습니다.
[01:50] 신재석: 베타 테스트 시나리오는 수요일까지 작성 완료하겠습니다.
[02:15] 곽병국: 베타 버전은 10월 31일 출시로 확정합니다. 모두 수고하셨습니다.`,
}

export default function MeetingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user, logout } = useAuth()
  const { toggleFavorite } = useMeetings({ autoFetch: false })
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  const [editedSummary, setEditedSummary] = useState("")
  const [editedKeywords, setEditedKeywords] = useState("")

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const response = await apiClient.get<Meeting>(`/meetings/${params.id}`)
        // 백엔드 응답 구조 확인: response.data 또는 response 직접 사용
        const meetingData = (response as any).data || response
        
        // localStorage에서 즐겨찾기 상태 확인
        const favoritesStr = localStorage.getItem('favorites')
        const favorites: string[] = favoritesStr ? JSON.parse(favoritesStr) : []
        const isFavorite = favorites.includes(params.id as string)
        
        setMeeting({ ...meetingData, isFavorite })
        // 편집 필드 초기화
        setEditedTitle(meetingData.title || "")
        setEditedSummary(meetingData.summary || "")
        setEditedKeywords(meetingData.keywords?.join(", ") || "")
      } catch (error) {
        console.error('회의록 상세 정보 가져오기 실패:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchMeeting()
    }
  }, [params.id])

  const handleLogout = () => {
    logout()
  }

  const handleToggleFavorite = async () => {
    if (!meeting || !params.id) return
    try {
      // localStorage에서 즐겨찾기 목록 가져오기
      const favoritesStr = localStorage.getItem('favorites')
      const favorites: string[] = favoritesStr ? JSON.parse(favoritesStr) : []
      
      let newFavorites: string[]
      let isFavorite: boolean
      
      if (favorites.includes(params.id as string)) {
        // 즐겨찾기 해제
        newFavorites = favorites.filter(id => id !== params.id)
        isFavorite = false
      } else {
        // 즐겨찾기 추가
        newFavorites = [...favorites, params.id as string]
        isFavorite = true
      }
      
      // localStorage에 저장
      localStorage.setItem('favorites', JSON.stringify(newFavorites))
      
      // 로컬 상태 업데이트
      setMeeting(prev => prev ? { ...prev, isFavorite } : null)
    } catch (error) {
      console.error('즐겨찾기 설정 실패:', error)
    }
  }

  const handleEditStart = () => {
    setIsEditing(true)
  }

  const handleEditCancel = () => {
    setIsEditing(false)
    // 원래 값으로 복원
    if (meeting) {
      setEditedTitle(meeting.title)
      setEditedSummary(meeting.summary || "")
      setEditedKeywords(meeting.keywords?.join(", ") || "")
    }
  }

  const handleEditSave = async () => {
    if (!meeting || !params.id) return

    try {
      setIsSaving(true)

      const updateData: UpdateMeetingRequest = {
        title: editedTitle.trim(),
        summary: editedSummary.trim(),
        keywords: editedKeywords.split(",").map(k => k.trim()).filter(k => k.length > 0)
      }

      await apiClient.put(`/meetings/${params.id}`, updateData)
      
      // 업데이트된 회의 정보 다시 가져오기
      const meetingResponse = await apiClient.get<Meeting>(`/meetings/${params.id}`)
      const meetingData = (meetingResponse as any).data || meetingResponse
      setMeeting(meetingData)
      setEditedTitle(meetingData.title || "")
      setEditedSummary(meetingData.summary || "")
      setEditedKeywords(meetingData.keywords?.join(", ") || "")
      
      setIsEditing(false)
      alert("✅ 회의록이 성공적으로 수정되었습니다!")
    } catch (error: any) {
      console.error('회의록 수정 중 오류:', error)
      alert(`❌ 회의록 수정 실패\n\n${error.message || '알 수 없는 오류가 발생했습니다.'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownload = (format: "txt" | "md" | "json") => {
    let content = ""
    let filename = ""
    let mimeType = ""

    switch (format) {
      case "txt":
        content = mockResult.transcript
        filename = "회의록_자막.txt"
        mimeType = "text/plain"
        break
      case "md":
        content = `# 회의록\n\n## 요약\n${mockResult.summary}\n\n## 결정사항\n${mockResult.decisions.map((d) => `- **${d.title}**: ${d.rationale}`).join("\n")}\n\n## 액션아이템\n${mockResult.actionItems.map((a) => `- [ ] ${a.title} (담당: ${a.assignee}, 마감: ${a.dueDate})`).join("\n")}`
        filename = "회의록.md"
        mimeType = "text/markdown"
        break
      case "json":
        content = JSON.stringify(mockResult, null, 2)
        filename = "회의록_구조화.json"
        mimeType = "application/json"
        break
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "destructive"
      case "MEDIUM":
        return "default"
      case "LOW":
        return "secondary"
      default:
        return "default"
    }
  }

  if (!user) {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">회의록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">회의록을 찾을 수 없습니다</h2>
          <p className="text-muted-foreground">요청하신 회의록이 존재하지 않습니다.</p>
          <Button onClick={() => router.push("/meetings")}>
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Mic className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-balance">Meeting One-Line</h1>
              <p className="text-xs text-muted-foreground">버튼 한 번으로 회의 → 액션아이템</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user.nickname || user.email}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Back Button */}
          <Button variant="ghost" onClick={() => router.push("/meetings")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로 돌아가기
          </Button>

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="text-3xl font-bold h-auto py-2 mb-2"
                  placeholder="회의 제목"
                />
              ) : (
                <h2 className="text-3xl font-bold">{meeting.title}</h2>
              )}
              <p className="text-muted-foreground mt-1">
                {meeting.date && new Date(meeting.date).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleEditCancel}
                    disabled={isSaving}
                  >
                    <X className="w-4 h-4 mr-2" />
                    취소
                  </Button>
                  <Button 
                    onClick={handleEditSave}
                    disabled={isSaving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "저장 중..." : "저장"}
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleToggleFavorite}
                    className={meeting.isFavorite ? "border-yellow-400" : ""}
                  >
                    <Star className={`w-4 h-4 mr-2 ${meeting.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    {meeting.isFavorite ? "즐겨찾기 해제" : "즐겨찾기"}
                  </Button>
                  <Button variant="outline" onClick={handleEditStart}>
                    <Edit className="w-4 h-4 mr-2" />
                    수정
                  </Button>
                  <Button variant="outline" onClick={() => handleDownload("txt")}>
                    <Download className="w-4 h-4 mr-2" />
                    .txt
                  </Button>
                  <Button variant="outline" onClick={() => handleDownload("md")}>
                    <Download className="w-4 h-4 mr-2" />
                    .md
                  </Button>
                  <Button variant="outline" onClick={() => handleDownload("json")}>
                    <Download className="w-4 h-4 mr-2" />
                    .json
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Summary Card */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3">회의 요약</h3>
            {isEditing ? (
              <Textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                className="min-h-[120px] text-base"
                placeholder="회의 요약을 입력하세요"
              />
            ) : (
              <p className="text-muted-foreground leading-relaxed text-pretty">
                {meeting.summary || "아직 분석이 완료되지 않았습니다."}
              </p>
            )}
          </Card>

          {/* Keywords Card (편집 모드용) */}
          {(isEditing || (meeting.keywords && meeting.keywords.length > 0)) && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3">키워드</h3>
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editedKeywords}
                    onChange={(e) => setEditedKeywords(e.target.value)}
                    placeholder="키워드를 쉼표로 구분하여 입력하세요 (예: 프로젝트, 일정, 마감일)"
                  />
                  <p className="text-xs text-muted-foreground">
                    쉼표(,)로 구분하여 입력해주세요
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {meeting.keywords?.map((keyword, index) => (
                    <Badge key={index} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Tabs */}
          <Tabs defaultValue="decisions" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="decisions">결정사항</TabsTrigger>
              <TabsTrigger value="actions">액션아이템</TabsTrigger>
              <TabsTrigger value="transcript">원문</TabsTrigger>
            </TabsList>

            <TabsContent value="decisions" className="space-y-4">
              {meeting.keywords && meeting.keywords.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">주요 키워드</h4>
                  <div className="flex flex-wrap gap-2">
                    {meeting.keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">아직 분석이 완료되지 않았습니다.</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">액션아이템 기능은 추후 업데이트 예정입니다.</p>
              </Card>
            </TabsContent>

            <TabsContent value="transcript">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">회의 원문 (STT)</h3>
                {meeting.speakers && meeting.speakers.length > 0 ? (
                  <div className="space-y-4">
                    {meeting.speakers.map((speaker, speakerIndex) => (
                      <div key={speakerIndex} className="space-y-2">
                        <h4 className="font-semibold text-sm text-primary">화자 {speaker.speakerId}</h4>
                        <div className="space-y-1 font-mono text-sm">
                          {speaker.segments.map((segment, segmentIndex) => (
                            <p key={segmentIndex} className="text-muted-foreground leading-relaxed">
                              [{Math.floor(segment.start / 60)}:{String(Math.floor(segment.start % 60)).padStart(2, '0')}] {segment.text}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">아직 분석이 완료되지 않았습니다.</p>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
