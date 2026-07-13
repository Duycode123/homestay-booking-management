'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER'

interface AuthGuardProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
}

export default function AuthGuard({ allowedRoles, children }: AuthGuardProps) {
  const router = useRouter()
  const { user, isLoading, isLoggingOut } = useAuth()

  useEffect(() => {
    if (isLoading || isLoggingOut) return

    if (!user) {
      const redirectPath =
        typeof window === 'undefined'
          ? '/'
          : `${window.location.pathname}${window.location.search}`

      router.replace(`/login?redirect=${encodeURIComponent(redirectPath)}`)
      return
    }
    if (!allowedRoles.includes(user.role)) {
      router.replace('/?error=unauthorized')
    }
  }, [user, allowedRoles, isLoading, isLoggingOut, router])

  if (isLoading || isLoggingOut || !user) {
    return (
      <div className="min-h-screen bg-background px-4 py-6 text-on-surface">
        <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center">
          <div className="w-full max-w-sm rounded-3xl border border-outline-variant bg-white p-6 shadow-[var(--band-shadow-card)]">
            <div className="h-3 w-24 rounded-full bg-primary-container" />
            <div className="mt-5 h-7 w-40 rounded-full bg-surface-container-high" />
            <div className="mt-4 h-3 w-full rounded-full bg-surface-container-high" />
            <div className="mt-2 h-3 w-2/3 rounded-full bg-surface-container-high" />
          </div>
        </div>
      </div>
    )
  }

  const authorized = allowedRoles.includes(user.role)
  return authorized ? <>{children}</> : null
}
