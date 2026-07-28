'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { logoutSession, restoreSession, type AuthUser } from '@/lib/auth'
import { clearStoredCustomerProfile } from '@/lib/customer-profile-service'

interface AuthContextType {
  user: AuthUser | null
  login: (user: AuthUser) => void
  logout: (redirectTo?: string) => Promise<void>
  isAuthenticated: boolean
  isLoading: boolean
  isLoggingOut: boolean
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

function clearClientUserCaches() {
  if (typeof window === 'undefined') return

  const keys = ['user', 'currentUser', 'profile', 'avatarUrl', 'accessToken', 'refreshToken']
  keys.forEach((key) => window.localStorage.removeItem(key))
}

function isSameAuthUser(current: AuthUser | null, next: AuthUser) {
  if (!current) return false
  return current.id === next.id
    && current.role === next.role
    && current.name === next.name
    && current.fullName === next.fullName
    && current.email === next.email
    && current.phone === next.phone
    && current.avatarUrl === next.avatarUrl
}

function getSameOriginRedirectUrl(redirectTo: string) {
  if (typeof window === 'undefined') return redirectTo

  try {
    const url = new URL(redirectTo, window.location.origin)
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return '/login'
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const authOperationId = useRef(0)

  const refreshSession = useCallback(async () => {
    const operationId = ++authOperationId.current
    setIsLoading(true)
    try {
      const sessionUser = await restoreSession()
      if (operationId === authOperationId.current) {
        setUser(sessionUser)
      }
    } catch {
      if (operationId === authOperationId.current) {
        clearStoredCustomerProfile()
        clearClientUserCaches()
        setUser(null)
      }
    } finally {
      if (operationId === authOperationId.current) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => void refreshSession())
  }, [refreshSession])

  const login = useCallback((sessionUser: AuthUser) => {
    authOperationId.current += 1
    clearStoredCustomerProfile()
    clearClientUserCaches()
    setUser((current) => isSameAuthUser(current, sessionUser) ? current : sessionUser)
    setIsLoading(false)
    setIsLoggingOut(false)
  }, [])

  const logout = async (redirectTo?: string) => {
    authOperationId.current += 1
    setIsLoggingOut(true)
    try {
      await logoutSession()
      clearStoredCustomerProfile()
      clearClientUserCaches()
      setUser(null)
      setIsLoading(false)

      if (redirectTo && typeof window !== 'undefined') {
        window.location.replace(getSameOriginRedirectUrl(redirectTo))
        return
      }

      window.setTimeout(() => setIsLoggingOut(false), 500)
    } catch {
      clearStoredCustomerProfile()
      clearClientUserCaches()
      setUser(null)
      setIsLoading(false)

      if (redirectTo && typeof window !== 'undefined') {
        window.location.replace(getSameOriginRedirectUrl(redirectTo))
        return
      }

      setIsLoggingOut(false)
      if (typeof window !== 'undefined') {
        window.alert('Không thể đăng xuất an toàn lúc này. Vui lòng kiểm tra kết nối và thử lại.')
      }
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user, isLoading, isLoggingOut, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
