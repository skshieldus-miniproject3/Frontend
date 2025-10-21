"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mic, Square, Download, Upload, Play, Pause } from "lucide-react"

interface RecordingViewProps {
  onComplete: (blob: Blob) => void
}

export function RecordingView({ onComplete }: RecordingViewProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startedRef = useRef(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // 이미 시작했으면 다시 시작하지 않음
    if (startedRef.current) return
    
    startedRef.current = true
    startRecording()
    
    return () => {
      // cleanup 시 타이머와 미디어 스트림 정리
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
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
        setRecordedBlob(blob)
      }

      mediaRecorder.start()
      setIsRecording(true)

      intervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Failed to start recording:", error)
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

  const handleDownload = () => {
    if (!recordedBlob) return
    
    const url = URL.createObjectURL(recordedBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `회의녹음_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handlePlay = () => {
    if (!recordedBlob) return
    
    if (!audioRef.current) {
      const url = URL.createObjectURL(recordedBlob)
      audioRef.current = new Audio(url)
      audioRef.current.onended = () => setIsPlaying(false)
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleUpload = () => {
    if (!recordedBlob) return
    onComplete(recordedBlob)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">{recordedBlob ? '녹음 완료' : '회의 녹음 중'}</h2>
        <p className="text-muted-foreground">
          {recordedBlob 
            ? '녹음된 파일을 다운로드하거나 재생해보세요' 
            : '회의가 끝나면 중지 버튼을 눌러주세요'}
        </p>
      </div>

      <Card className="p-12 text-center space-y-8">
        {/* Recording Animation */}
        {!recordedBlob && (
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
        )}

        {/* Duration */}
        <div className="space-y-2">
          <div className="text-5xl font-mono font-bold tabular-nums">{formatTime(duration)}</div>
          <p className="text-sm text-muted-foreground">
            {recordedBlob ? '총 녹음 시간' : '녹음 시간'}
          </p>
        </div>

        {/* 녹음 중일 때 */}
        {!recordedBlob && (
          <Button size="lg" variant="destructive" className="text-lg px-8 py-6 h-auto" onClick={stopRecording}>
            <Square className="w-5 h-5 mr-2" />
            회의 종료
          </Button>
        )}

        {/* 녹음 완료 후 */}
        {recordedBlob && (
          <div className="space-y-6">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                파일 크기: <span className="font-semibold text-foreground">{formatFileSize(recordedBlob.size)}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                포맷: <span className="font-semibold text-foreground">WEBM (audio/webm)</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" variant="outline" className="text-lg px-6 py-6 h-auto" onClick={handlePlay}>
                {isPlaying ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                {isPlaying ? '일시정지' : '재생'}
              </Button>
              
              <Button size="lg" variant="outline" className="text-lg px-6 py-6 h-auto" onClick={handleDownload}>
                <Download className="w-5 h-5 mr-2" />
                다운로드
              </Button>

              <Button size="lg" className="text-lg px-6 py-6 h-auto gradient-primary" onClick={handleUpload}>
                <Upload className="w-5 h-5 mr-2" />
                분석 요청
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        {!recordedBlob ? (
          <p>💡 팁: 명확한 음성 인식을 위해 조용한 환경에서 녹음해주세요</p>
        ) : (
          <p>💡 팁: 다운로드한 파일을 확인하고, 문제없으면 분석 요청을 눌러주세요</p>
        )}
      </div>
    </div>
  )
}
