"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import type { User, LoginRequest, SignupRequest, LoginResponse, SignupResponse } from '@/types/api'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<void>
  signup: (userData: SignupRequest) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const isAuthenticated = !!user

  // 초기 인증 상태 확인
  useEffect(() => {
    const initAuth = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken')
        if (accessToken) {
          // 토큰이 있으면 사용자 정보 가져오기
          await refreshUser()
        }
      } catch (error) {
        console.error('인증 초기화 실패:', error)
        // 토큰이 유효하지 않으면 제거
        apiClient.clearToken()
        localStorage.removeItem('user')
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  // 사용자 정보 새로고침
  const refreshUser = async () => {
    try {
      const response = await apiClient.get<User>('/auth/me')
      setUser(response.data)
      
      // localStorage에도 저장 (fallback용)
      localStorage.setItem('user', JSON.stringify(response.data))
    } catch (error) {
      console.error('사용자 정보 새로고침 실패:', error)
      throw error
    }
  }

  // 로그인
  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true)
      
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials)
      apiClient.setToken(response.data.accessToken, response.data.refreshToken)
      
      // 사용자 정보 가져오기
      await refreshUser()
    } catch (error) {
      console.error('로그인 실패:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // 회원가입
  const signup = async (userData: SignupRequest) => {
    try {
      setIsLoading(true)
      
      const response = await apiClient.post<SignupResponse>('/auth/signup', userData)
      
      // 회원가입 후 자동 로그인
      await login({
        email: userData.email,
        password: userData.password
      })
    } catch (error) {
      console.error('회원가입 실패:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // 로그아웃
  const logout = async () => {
    try {
      // 서버에 로그아웃 요청
      await apiClient.post('/auth/logout')
    } catch (error) {
      console.error('로그아웃 요청 실패:', error)
    } finally {
      setUser(null)
      apiClient.clearToken()
      localStorage.removeItem('user')
      router.push('/login')
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    signup,
    logout,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// 인증 컨텍스트 훅
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// 인증이 필요한 컴포넌트를 위한 HOC
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push('/login')
      }
    }, [isAuthenticated, isLoading, router])

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      )
    }

    if (!isAuthenticated) {
      return null
    }

    return <Component {...props} />
  }
}
