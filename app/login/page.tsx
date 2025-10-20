"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    setTimeout(() => {
      // 테스트 계정 확인
      if (email === "test@meeting.com" && password === "test1234") {
        localStorage.setItem("user", JSON.stringify({ email }))
        router.push("/")
      } else {
        // 회원가입된 계정 확인
        const users = JSON.parse(localStorage.getItem("users") || "[]")
        const user = users.find((u: any) => u.email === email && u.password === password)

        if (user) {
          localStorage.setItem("user", JSON.stringify({ email }))
          router.push("/")
        } else {
          setError("이메일 또는 비밀번호가 올바르지 않습니다")
          setIsLoading(false)
        }
      }
    }, 1000)
  }

  const handleTestLogin = () => {
    setEmail("test@meeting.com")
    setPassword("test1234")
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center">
              <Mic className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">meeting one-line</h1>
          <p className="text-sm text-muted-foreground">회의를 자동으로 기록하고 정리합니다</p>
        </div>

        <Alert>
          <AlertDescription className="text-sm">
            <strong>테스트 계정:</strong>
            <br />
            이메일: test@meeting.com
            <br />
            비밀번호: test1234
            <br />
            <Button variant="link" className="h-auto p-0 text-xs mt-1" onClick={handleTestLogin} type="button">
              테스트 계정으로 자동 입력
            </Button>
          </AlertDescription>
        </Alert>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>로그인</CardTitle>
            <CardDescription>계정에 로그인하여 회의록을 관리하세요</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "로그인 중..." : "로그인"}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                계정이 없으신가요?{" "}
                <Link href="/signup" className="text-primary hover:underline font-medium">
                  회원가입
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
