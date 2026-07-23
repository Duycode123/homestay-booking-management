'use client'

import React, { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getPostLoginPath, loginSession } from '@/lib/auth'
import { clearStoredCustomerProfile, fetchCurrentUser } from '@/lib/customer-profile-service'
import { clearStoredAuthSession } from '@/lib/api'
import AuthBanner from '@/components/auth/AuthBanner'
import AuthTabs from '@/components/auth/AuthTabs'
import RegisterSuccessBanner from '@/components/auth/RegisterSuccessBanner'
import OAuthLoginStatusBanner from '@/components/auth/OAuthLoginStatusBanner'
import {
  AuthError,
  AuthField,
  AuthFormPanel,
  AuthMobileBrand,
  AuthShell,
  AuthSubmitButton,
} from '@/components/auth/AuthField'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [formData, setFormData] = useState({ identifier: '', password: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [requiresEmailVerification, setRequiresEmailVerification] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setRequiresEmailVerification(false)

    try {
      const sessionUser = await loginSession(formData.identifier.trim(), formData.password)
      // Login has already succeeded. A transient profile request must not be
      // reported as an invalid email/password error.
      login(sessionUser)
      clearStoredCustomerProfile()
      try {
        const currentProfile = await fetchCurrentUser(sessionUser)
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
      } catch {
        // Account menus retry the profile request after navigation.
      }
      router.replace(getRedirectPath(sessionUser.role))
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr.response?.data?.message || 'Đăng nhập thất bại, vui lòng kiểm tra lại tài khoản.')
      setRequiresEmailVerification(Boolean(axiosErr.response?.data?.message?.toLowerCase().includes('xac thuc email')))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell>
      <AuthBanner
        imageSrc="/images/Login.png"
        imageAlt="Phong cảnh núi rừng và thung lũng trong mây nhìn từ The Serene Villa"
        imagePosition="object-[center_48%]"
      />

      <AuthFormPanel>
        <AuthMobileBrand />
        <AuthTabs active="login" />

        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold tracking-tight text-on-surface">Chào mừng trở lại</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Đăng nhập để tiếp tục đặt phòng homestay của bạn.</p>
        </div>

        <Suspense fallback={null}>
          <RegisterSuccessBanner />
          <OAuthLoginStatusBanner />
        </Suspense>

        {error && <AuthError message={error} />}
        {requiresEmailVerification && (
          <button
            type="button"
            onClick={() => router.push(`/verify-email?email=${encodeURIComponent(formData.identifier.trim())}`)}
            className="mb-4 w-full cursor-pointer rounded-lg border border-brand-orange px-4 py-2.5 font-display text-sm font-semibold text-brand-orange transition-colors hover:bg-brand-orange/5"
          >
            Gửi lại email xác thực
          </button>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthField
            label="Email"
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
            placeholder="Nhập email của bạn"
            icon="user"
            autoComplete="email"
          />

          <AuthField
            label="Mật khẩu"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            placeholder="Nhập mật khẩu của bạn"
            icon="lock"
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3.5 text-on-surface-variant/60 hover:text-on-surface focus:outline-none"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            }
            autoComplete="current-password"
          />

          <div className="flex justify-end pt-1 text-xs">
            <button
              type="button"
              onClick={() => router.push('/forgot-password')}
              className="cursor-pointer font-medium text-brand-orange hover:underline focus:outline-none"
            >
              Quên mật khẩu?
            </button>
          </div>

          <AuthSubmitButton disabled={isLoading}>
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </AuthSubmitButton>
        </form>

        <div className="my-6 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-outline-variant" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">Hoặc</span>
          <span className="h-px flex-1 bg-outline-variant" />
        </div>

        <button
          type="button"
          onClick={() => {
            clearStoredAuthSession()
            clearStoredCustomerProfile()
            window.location.assign('/oauth2/authorization/google')
          }}
          className="flex w-full items-center justify-center gap-3 rounded-full border border-outline-variant bg-white px-5 py-3.5 font-display text-sm font-semibold text-on-surface shadow-sm transition hover:border-brand-orange/50 hover:bg-[#fbf8f3] focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z" />
            <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.43l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
            <path fill="#FBBC05" d="M6.39 13.86A6.02 6.02 0 0 1 6.08 12c0-.65.11-1.28.31-1.86V7.52H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.48l3.35-2.62Z" />
            <path fill="#EA4335" d="M12 6.01c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.62C7.18 7.77 9.39 6.01 12 6.01Z" />
          </svg>
          Tiếp tục với Google
        </button>

        <button
          type="button"
          onClick={() => {
            clearStoredAuthSession()
            clearStoredCustomerProfile()
            window.location.assign('/oauth2/authorization/facebook')
          }}
          className="mt-3 flex w-full items-center justify-center gap-3 rounded-full border border-outline-variant bg-white px-5 py-3.5 font-display text-sm font-semibold text-on-surface shadow-sm transition hover:border-[#1877f2]/50 hover:bg-[#f5f8ff] focus:outline-none focus:ring-2 focus:ring-[#1877f2]/25"
        >
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1877f2] font-sans text-base font-bold leading-none text-white"
            aria-hidden="true"
          >
            f
          </span>
          Tiếp tục với Facebook
        </button>

        <p className="mt-8 border-t border-outline-variant pt-6 text-center text-xs text-on-surface-variant">
          Chưa có tài khoản?{' '}
          <button
            type="button"
            onClick={() => router.push('/register')}
            className="cursor-pointer font-display font-semibold text-brand-orange hover:underline"
          >
            Đăng ký ngay
          </button>
        </p>
      </AuthFormPanel>
    </AuthShell>
  )
}

function getRedirectPath(role: Parameters<typeof getPostLoginPath>[0]) {
  if (typeof window === 'undefined') {
    return getPostLoginPath(role)
  }

  const searchParams = new URLSearchParams(window.location.search)
  const returnUrl = searchParams.get('returnUrl')
  const redirectPath = searchParams.get('redirect')

  if (returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//') && returnUrl !== '/login') {
    return returnUrl
  }

  if (redirectPath && redirectPath.startsWith('/') && !redirectPath.startsWith('//') && redirectPath !== '/login') {
    return redirectPath
  }

  return getPostLoginPath(role)
}
