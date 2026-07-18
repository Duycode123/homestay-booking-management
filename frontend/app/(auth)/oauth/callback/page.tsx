'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getPostLoginPath, getSessionRole } from '@/lib/auth'
import { clearStoredAuthSession, rememberAuthSession } from '@/lib/api'
import { clearStoredCustomerProfile, fetchCurrentUser } from '@/lib/customer-profile-service'

export default function OAuthCallbackPage() {
  const router = useRouter()
  const { login } = useAuth()
  const started = useRef(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (started.current) return
    started.current = true

    const completeLogin = async () => {
      try {
        clearStoredCustomerProfile()
        const sessionUser = await getSessionRole()
        const currentProfile = await fetchCurrentUser(sessionUser)
        rememberAuthSession()
        login({
          ...sessionUser,
          id: currentProfile.id ?? sessionUser.id,
          role: currentProfile.role,
          fullName: currentProfile.fullName,
          name: currentProfile.fullName,
          email: currentProfile.email,
          phone: currentProfile.phone,
          avatarUrl: currentProfile.avatarUrl,
        })
        router.replace(getPostLoginPath(currentProfile.role))
      } catch {
        clearStoredAuthSession()
        clearStoredCustomerProfile()
        setError('Không thể hoàn tất đăng nhập Google. Vui lòng quay lại và thử lại.')
      }
    }

    void completeLogin()
  }, [login, router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f3ec] px-5">
      <section className="w-full max-w-md rounded-[28px] border border-[#dfd3c2] bg-white p-8 text-center shadow-[0_24px_70px_rgba(25,65,52,0.12)]">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f2ed] text-[#164b3d]">
          {error ? '!' : <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#164b3d]/25 border-t-[#164b3d]" />}
        </div>
        <h1 className="font-display text-2xl font-bold text-[#26312d]">
          {error ? 'Đăng nhập chưa hoàn tất' : 'Đang hoàn tất đăng nhập'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#6d746f]">
          {error || 'The Serene Villa đang thiết lập phiên đăng nhập an toàn cho bạn.'}
        </p>
        {error && (
          <button
            type="button"
            onClick={() => router.replace('/login')}
            className="mt-6 w-full rounded-full bg-[#164b3d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#103c31]"
          >
            Quay lại đăng nhập
          </button>
        )}
      </section>
    </main>
  )
}
