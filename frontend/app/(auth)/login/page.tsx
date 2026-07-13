'use client'

import React, { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getPostLoginPath, loginSession } from '@/lib/auth'
import { clearStoredCustomerProfile, fetchCurrentUser } from '@/lib/customer-profile-service'
import AuthBanner from '@/components/auth/AuthBanner'
import AuthTabs from '@/components/auth/AuthTabs'
import RegisterSuccessBanner from '@/components/auth/RegisterSuccessBanner'
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
      clearStoredCustomerProfile()
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
      <AuthBanner />

      <AuthFormPanel>
        <AuthMobileBrand />
        <AuthTabs active="login" />

        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold tracking-tight text-on-surface">Chào mừng trở lại</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Đăng nhập để tiếp tục đặt phòng homestay của bạn.</p>
        </div>

        <Suspense fallback={null}>
          <RegisterSuccessBanner />
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
          />

          <div className="flex select-none items-center justify-between pt-1 text-xs">
            <label className="flex cursor-pointer items-center gap-2 text-on-surface-variant">
              <input
                id="remember_me"
                name="remember_me"
                type="checkbox"
                className="h-4 w-4 cursor-pointer rounded border-outline accent-brand-orange"
              />
              Ghi nhớ đăng nhập
            </label>
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

        <div className="relative my-6 text-center">
          <hr className="border-outline-variant" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 font-display text-[10px] uppercase tracking-widest text-on-surface-variant">
            Hoặc tiếp tục với
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-outline py-2.5 font-display text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </button>
          <button
            type="button"
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-outline py-2.5 font-display text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low"
          >
            <svg className="h-4 w-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Facebook
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-on-surface-variant">
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
