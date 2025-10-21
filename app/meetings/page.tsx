"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mic, Upload, LogOut, Loader2, FileText, Clock, CheckCircle2, ListTodo } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useMeetings } from "@/hooks/useMeetings"
import { validateAudioFile } from "@/lib/file-validation"

export default function MeetingsPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { meetings, isLoading, uploadAudioFile } = useMeetings()

  const handleLogout = () => {
    logout()
  }

  const handleNewMeeting = () => {
    router.push("/")
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 파일 검증
      const validation = validateAudioFile(file)
      if (!validation.valid) {
        alert(`❌ 파일 업로드 실패\n\n${validation.error}`)
        e.target.value = '' // 파일 input 초기화
        return
      }

      try {
        await uploadAudioFile(file)
      } catch (error: any) {
        console.error('파일 업로드 실패:', error)
        alert(`❌ 파일 업로드 실패\n\n${error.message || '알 수 없는 오류가 발생했습니다.'}`)
      } finally {
        e.target.value = '' // 파일 input 초기화
      }
    }
  }

  const handleMeetingClick = (meetingId: string) => {
    router.push(`/meetings/${meetingId}`)
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20">
      {/* Header */}
      <header className="border-b border-border/50 bg-card sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push("/")}>
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-balance bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Meeting One-Line
              </h1>
              <p className="text-xs text-muted-foreground font-medium">버튼 한 번으로 회의 → 액션아이템</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold">{user.nickname || user.email}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="font-medium bg-transparent">
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-bold mb-2">회의록 목록</h2>
              <p className="text-muted-foreground text-lg">모든 회의록을 확인하고 관리하세요</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleNewMeeting} size="lg" className="gradient-primary shadow-md font-semibold">
                <Mic className="w-4 h-4 mr-2" />새 회의
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => document.getElementById("file-upload-list")?.click()}
                className="border-2 font-semibold"
              >
                <Upload className="w-4 h-4 mr-2" />
                업로드
              </Button>
              <input
                id="file-upload-list"
                type="file"
                accept="audio/*,.webm,.wav,.mp3,.m4a,.ogg"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>

          {/* Meetings List */}
          {isLoading ? (
            <Card className="p-16 text-center shadow-md">
              <div className="space-y-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 mx-auto flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3">회의록을 불러오는 중...</h3>
                  <p className="text-muted-foreground text-lg">잠시만 기다려주세요</p>
                </div>
              </div>
            </Card>
          ) : meetings.length === 0 ? (
            <Card className="p-16 text-center shadow-md">
              <div className="space-y-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 mx-auto flex items-center justify-center">
                  <FileText className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3">아직 회의록이 없습니다</h3>
                  <p className="text-muted-foreground text-lg">새 회의를 시작하거나 음성 파일을 업로드하세요</p>
                </div>
                <div className="flex gap-3 justify-center pt-4">
                  <Button onClick={handleNewMeeting} size="lg" className="gradient-primary shadow-md font-semibold">
                    <Mic className="w-4 h-4 mr-2" />새 회의 시작
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => document.getElementById("file-upload-list")?.click()}
                    className="border-2 font-semibold"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    파일 업로드
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {meetings.map((meeting) => (
                <Card
                  key={meeting.meetingId}
                  className={`p-8 transition-all shadow-sm ${meeting.status === "completed" ? "cursor-pointer card-hover border-border/50" : "border-border/50"}`}
                  onClick={() => meeting.status === "completed" && handleMeetingClick(meeting.meetingId)}
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-4">
                        <h3 className="text-xl font-bold">{meeting.title}</h3>
                        {meeting.status === "processing" ? (
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-2 px-3 py-1 text-sm font-semibold"
                          >
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            분석 중
                          </Badge>
                        ) : meeting.status === "completed" ? (
                          <Badge className="flex items-center gap-2 px-3 py-1 text-sm font-semibold gradient-primary border-0">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            완료
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center gap-2 px-3 py-1 text-sm font-semibold">
                            업로드됨
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-6 text-sm text-muted-foreground font-medium">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {new Date(meeting.date).toLocaleDateString("ko-KR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {meeting.keywords && meeting.keywords.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">키워드 {meeting.keywords.length}개</span>
                          </div>
                        )}
                      </div>

                      {meeting.status === "processing" ? (
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground font-medium">AI가 회의 내용을 분석 중...</span>
                            <span className="text-primary font-bold">진행 중</span>
                          </div>
                          <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full gradient-primary rounded-full animate-pulse w-2/3 shadow-sm" />
                          </div>
                        </div>
                      ) : meeting.status === "completed" && meeting.summary ? (
                        <p className="text-sm text-muted-foreground text-pretty leading-relaxed bg-muted/50 p-4 rounded-lg">
                          {meeting.summary}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
