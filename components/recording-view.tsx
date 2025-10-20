"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mic, Square } from "lucide-react"

interface RecordingViewProps {
  onComplete: (blob: Blob) => void
}

export function RecordingView({ onComplete }: RecordingViewProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    startRecording()
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        stream.getTracks().forEach((track) => track.stop())
        onComplete(blob)
      }

      mediaRecorder.start()
      setIsRecording(true)

      intervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("[v0] Failed to start recording:", error)
      alert("마이크 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">회의 녹음 중</h2>
        <p className="text-muted-foreground">회의가 끝나면 중지 버튼을 눌러주세요</p>
      </div>

      <Card className="p-12 text-center space-y-8">
        {/* Recording Animation */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-destructive/20 flex items-center justify-center animate-pulse">
              <div className="w-24 h-24 rounded-full bg-destructive/40 flex items-center justify-center">
                <Mic className="w-12 h-12 text-destructive" />
              </div>
            </div>
            {isRecording && <div className="absolute inset-0 rounded-full border-4 border-destructive animate-ping" />}
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <div className="text-5xl font-mono font-bold tabular-nums">{formatTime(duration)}</div>
          <p className="text-sm text-muted-foreground">녹음 시간</p>
        </div>

        <Button size="lg" variant="destructive" className="text-lg px-8 py-6 h-auto" onClick={stopRecording}>
          <Square className="w-5 h-5 mr-2" />
          회의 종료
        </Button>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>💡 팁: 명확한 음성 인식을 위해 조용한 환경에서 녹음해주세요</p>
      </div>
    </div>
  )
}
