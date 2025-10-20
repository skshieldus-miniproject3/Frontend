"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Plus, CheckCircle2, Clock, User } from "lucide-react"

interface ResultViewProps {
  onNewMeeting: () => void
}

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

export function ResultView({ onNewMeeting }: ResultViewProps) {
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">회의록 생성 완료</h2>
          <p className="text-muted-foreground mt-1">
            {new Date().toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex gap-2">
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
          <Button onClick={onNewMeeting}>
            <Plus className="w-4 h-4 mr-2" />새 회의
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-3">📋 회의 요약</h3>
        <p className="text-muted-foreground leading-relaxed text-pretty">{mockResult.summary}</p>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="decisions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="decisions">결정사항</TabsTrigger>
          <TabsTrigger value="actions">액션아이템</TabsTrigger>
          <TabsTrigger value="transcript">원문</TabsTrigger>
        </TabsList>

        <TabsContent value="decisions" className="space-y-4">
          {mockResult.decisions.map((decision, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <h4 className="font-semibold text-lg">{decision.title}</h4>
                  <p className="text-muted-foreground text-sm">{decision.rationale}</p>
                  <p className="text-xs text-muted-foreground">📍 출처: {decision.source}</p>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <div className="grid gap-4">
            {mockResult.actionItems.map((item) => (
              <Card key={item.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-lg">{item.title}</h4>
                      <Badge variant={getPriorityColor(item.priority)}>{item.priority}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{item.assignee}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{item.dueDate}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    완료 표시
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="transcript">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">🎙️ 회의 원문 (STT)</h3>
            <div className="space-y-2 font-mono text-sm">
              {mockResult.transcript.split("\n").map((line, index) => (
                <p key={index} className="text-muted-foreground leading-relaxed">
                  {line}
                </p>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
