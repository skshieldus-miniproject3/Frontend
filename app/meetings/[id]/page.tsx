"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Download, ArrowLeft, CheckCircle2, Clock, User, Mic, LogOut, Edit, Save, X, Star, Trash2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { apiClient } from "@/lib/api"
import { useMeetings } from "@/hooks/useMeetings"
import type { Meeting, UpdateMeetingRequest } from "@/types/api"

export default function MeetingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user, logout } = useAuth()
  const { toggleFavorite, deleteMeeting } = useMeetings({ autoFetch: false })
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  const [editedSummary, setEditedSummary] = useState("")
  const [editedKeywords, setEditedKeywords] = useState("")
  
  // 화자 및 원문 편집 상태
  const [editedSpeakers, setEditedSpeakers] = useState<Meeting['speakers']>([])
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null)
  const [editingSegmentKey, setEditingSegmentKey] = useState<string | null>(null)

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
        
        console.log('📥 회의록 데이터:', meetingData)
        console.log('👥 화자 정보:', meetingData.speakers)
        
        setMeeting({ ...meetingData, isFavorite })
        // 편집 필드 초기화
        setEditedTitle(meetingData.title || "")
        setEditedSummary(meetingData.summary || "")
        setEditedKeywords(meetingData.keywords?.join(", ") || "")
        setEditedSpeakers(meetingData.speakers || [])  // 화자 정보 초기화
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

  const handleDelete = async () => {
    if (!meeting || !params.id) return
    
    const confirmed = window.confirm(
      `"${meeting.title}" 회의록을 삭제하시겠습니까?\n\n삭제된 회의록은 복구할 수 없습니다.`
    )
    
    if (!confirmed) return
    
    try {
      setIsDeleting(true)
      await deleteMeeting(params.id as string)
      alert('✅ 회의록이 삭제되었습니다.')
      router.push('/meetings')
    } catch (error: any) {
      console.error('회의록 삭제 중 오류:', error)
      alert(`❌ 회의록 삭제 실패\n\n${error.message || '알 수 없는 오류가 발생했습니다.'}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditStart = () => {
    setIsEditing(true)
  }

  const handleEditCancel = () => {
    setIsEditing(false)
    setEditingSpeakerId(null)
    setEditingSegmentKey(null)
    // 원래 값으로 복원
    if (meeting) {
      setEditedTitle(meeting.title)
      setEditedSummary(meeting.summary || "")
      setEditedKeywords(meeting.keywords?.join(", ") || "")
      setEditedSpeakers(meeting.speakers || [])
    }
  }

  const handleEditSave = async () => {
    if (!meeting || !params.id) return

    try {
      setIsSaving(true)

      const updateData: UpdateMeetingRequest = {
        title: editedTitle.trim(),
        summary: editedSummary.trim(),
        keywords: editedKeywords.split(",").map(k => k.trim()).filter(k => k.length > 0),
        speakers: editedSpeakers  // 화자 정보 포함
      }

      console.log('📤 회의록 수정 요청:', updateData)

      await apiClient.put(`/meetings/${params.id}`, updateData)
      
      // 업데이트된 회의 정보 다시 가져오기
      const meetingResponse = await apiClient.get<Meeting>(`/meetings/${params.id}`)
      const meetingData = (meetingResponse as any).data || meetingResponse
        setMeeting(meetingData)
        setEditedTitle(meetingData.title || "")
        setEditedSummary(meetingData.summary || "")
        setEditedKeywords(meetingData.keywords?.join(", ") || "")
        setEditedSpeakers(meetingData.speakers || [])
      
      setIsEditing(false)
      setEditingSpeakerId(null)
      setEditingSegmentKey(null)
      alert("✅ 회의록이 성공적으로 수정되었습니다!")
    } catch (error: any) {
      console.error('회의록 수정 중 오류:', error)
      alert(`❌ 회의록 수정 실패\n\n${error.message || '알 수 없는 오류가 발생했습니다.'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // 화자 이름 수정
  const handleSpeakerNameChange = (speakerId: string, newName: string) => {
    setEditedSpeakers(prev => 
      prev.map(speaker => 
        speaker.speakerId === speakerId 
          ? { ...speaker, name: newName }
          : speaker
      )
    )
  }

  // segment text 수정
  const handleSegmentTextChange = (speakerId: string, segmentIndex: number, newText: string) => {
    setEditedSpeakers(prev =>
      prev.map(speaker =>
        speaker.speakerId === speakerId
          ? {
              ...speaker,
              segments: speaker.segments.map((seg, idx) =>
                idx === segmentIndex ? { ...seg, text: newText } : seg
              )
            }
          : speaker
      )
    )
  }

  const handleDownload = (format: "txt" | "md" | "json" | "pdf") => {
    if (!meeting) {
      alert("❌ 회의록 데이터가 없습니다")
      return
    }

    let content = ""
    let filename = ""
    let mimeType = ""

    // 원문 텍스트 생성
    const generateTranscript = () => {
      if (!meeting.speakers || meeting.speakers.length === 0) {
        return "원문 데이터가 없습니다."
      }
      
      return meeting.speakers
        .map(speaker => {
          const speakerName = speaker.name || `화자 ${speaker.speakerId}`
          return speaker.segments
            .map(seg => {
              const minutes = Math.floor(seg.start / 60)
              const seconds = Math.floor(seg.start % 60)
              return `[${minutes}:${seconds.toString().padStart(2, '0')}] ${speakerName}: ${seg.text}`
            })
            .join('\n')
        })
        .join('\n\n')
    }

    switch (format) {
      case "txt":
        content = generateTranscript()
        filename = `${meeting.title}_원문.txt`
        mimeType = "text/plain"
        break
      case "md":
        const keywords = meeting.keywords?.length ? `## 키워드\n${meeting.keywords.map(k => `- ${k}`).join('\n')}\n\n` : ''
        content = `# ${meeting.title}\n\n**날짜:** ${new Date(meeting.date).toLocaleDateString('ko-KR')}\n\n## 요약\n${meeting.summary || '요약 정보가 없습니다.'}\n\n${keywords}## 원문\n${generateTranscript()}`
        filename = `${meeting.title}.md`
        mimeType = "text/markdown"
        break
      case "json":
        content = JSON.stringify(meeting, null, 2)
        filename = `${meeting.title}_전체데이터.json`
        mimeType = "application/json"
        break
      case "pdf":
        handleDownloadPDF()
        return
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadPDF = () => {
    if (!meeting) return
    
    // 브라우저 인쇄 기능 사용 (한글 지원)
    window.print()
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
    <div className="min-h-screen bg-background print:bg-white">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50 no-print">
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
            <div className="flex gap-2 no-print">
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
                  <Button 
                    variant="outline" 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {isDeleting ? "삭제 중..." : "삭제"}
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
                  <Button variant="outline" onClick={() => handleDownload("pdf")} className="border-primary text-primary" title="브라우저 인쇄 기능을 사용합니다">
                    <Download className="w-4 h-4 mr-2" />
                    PDF 출력
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
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">회의 원문 (STT)</h3>
                  {isEditing && (
                    <p className="text-sm text-muted-foreground">
                      💡 화자 이름과 원문을 클릭하여 수정할 수 있습니다
                    </p>
                  )}
                </div>
                {editedSpeakers && editedSpeakers.length > 0 ? (
                  <div className="space-y-6">
                    {editedSpeakers.map((speaker, speakerIndex) => (
                      <div key={speakerIndex} className="space-y-3 p-4 bg-muted/30 rounded-lg">
                        {/* 화자 이름 - 인라인 편집 */}
                        <div className="flex items-center gap-2">
                          {isEditing && editingSpeakerId === speaker.speakerId ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={speaker.name || ""}
                                onChange={(e) => handleSpeakerNameChange(speaker.speakerId, e.target.value)}
                                onBlur={() => setEditingSpeakerId(null)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') setEditingSpeakerId(null)
                                  if (e.key === 'Escape') {
                                    setEditingSpeakerId(null)
                                    if (meeting) setEditedSpeakers(meeting.speakers || [])
                                  }
                                }}
                                placeholder="화자 이름 입력"
                                className="max-w-xs text-sm font-semibold"
                                autoFocus
                              />
                              <span className="text-xs text-muted-foreground">(Enter: 저장, Esc: 취소)</span>
                            </div>
                          ) : (
                            <h4 
                              className={`font-semibold text-sm ${isEditing ? 'cursor-pointer hover:text-primary transition-colors px-2 py-1 rounded hover:bg-muted' : 'text-primary'}`}
                              onClick={() => isEditing && setEditingSpeakerId(speaker.speakerId)}
                            >
                              <User className="w-4 h-4 inline mr-1" />
                              {speaker.name || `화자 ${speaker.speakerId}`}
                              {isEditing && <Edit className="w-3 h-3 inline ml-1 opacity-50" />}
                            </h4>
                          )}
                        </div>
                        
                        {/* Segments - 원문 */}
                        <div className="space-y-2 pl-2">
                          {speaker.segments.map((segment, segmentIndex) => {
                            const segmentKey = `${speaker.speakerId}-${segmentIndex}`
                            const isEditingSegment = editingSegmentKey === segmentKey
                            
                            return (
                              <div key={segmentIndex} className="flex gap-2 items-start">
                                <span className="text-xs text-muted-foreground font-mono min-w-[50px] mt-1">
                                  [{Math.floor(segment.start / 60)}:{String(Math.floor(segment.start % 60)).padStart(2, '0')}]
                                </span>
                                
                                {isEditing && isEditingSegment ? (
                                  <div className="flex-1">
                                    <Textarea
                                      value={segment.text}
                                      onChange={(e) => handleSegmentTextChange(speaker.speakerId, segmentIndex, e.target.value)}
                                      onBlur={() => setEditingSegmentKey(null)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                          setEditingSegmentKey(null)
                                          if (meeting) setEditedSpeakers(meeting.speakers || [])
                                        }
                                      }}
                                      className="text-sm min-h-[60px]"
                                      autoFocus
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Esc: 취소
                                    </p>
                                  </div>
                                ) : (
                                  <p 
                                    className={`text-sm text-muted-foreground leading-relaxed flex-1 ${isEditing ? 'cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors' : ''}`}
                                    onClick={() => isEditing && setEditingSegmentKey(segmentKey)}
                                  >
                                    {segment.text}
                                    {isEditing && <Edit className="w-3 h-3 inline ml-2 opacity-30" />}
                                  </p>
                                )}
                              </div>
                            )
                          })}
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
