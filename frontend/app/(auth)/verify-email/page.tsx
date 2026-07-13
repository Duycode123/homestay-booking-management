'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import AuthBanner from '@/components/auth/AuthBanner'
import {
  AuthError,
  AuthField,
  AuthFormPanel,
  AuthMobileBrand,
  AuthShell,
  AuthSubmitButton,
} from '@/components/auth/AuthField'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const sent = searchParams.get('sent') === '1'
  const initialEmail = searchParams.get('email') ?? ''
  const [email, setEmail] = useState(initialEmail)
  const [status, setStatus] = useState<'idle' | 'checking' | 'success' | 'error'>(
    token ? 'checking' : 'idle',
  )
  const [message, setMessage] = useState(
    sent
      ? 'Tài khoản đã được tạo. Vui lòng kiểm tra email và bấm vào liên kết xác thực trước khi đăng nhập.'
      : '',
  )
  const [error, setError] = useState('')
  const [isResending, setIsResending] = useState(false)

  const canResend = useMemo(() => email.trim().length > 0 && !isResending, [email, isResending])

  useEffect(() => {
    if (!token) return

    let mounted = true
    setStatus('checking')
    setError('')

    api
      .post('/api/auth/verify-email', { token })
      .then(() => {
        if (!mounted) return
        setStatus('success')
        setMessage('Email đã được xác thực thành công. Bạn có thể đăng nhập ngay bây giờ.')
      })
      .catch((err: unknown) => {
        if (!mounted) return
        const axiosErr = err as { response?: { data?: { message?: string } } }
        setStatus('error')
        setError(axiosErr.response?.data?.message || 'Liên kết xác thực không hợp lệ hoặc đã hết hạn.')
      })

    return () => {
      mounted = false
    }
  }, [token])

  async function handleResend(event: FormEvent) {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsResending(true)

    try {
      await api.post('/api/auth/resend-verification-email', { email: email.trim().toLowerCase() })
      setMessage('Hệ thống đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư đến và spam.')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr.response?.data?.message || 'Không thể gửi lại email xác thực. Vui lòng thử lại.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <AuthShell>
      <AuthBanner
        description="Xác thực email giúp bảo vệ tài khoản, giảm đăng ký ảo và đảm bảo thông báo đặt phòng được gửi đúng người."
        bullets={[
          { title: 'Bảo vệ tài khoản', desc: 'Chỉ email thật mới có thể kích hoạt tài khoản.' },
          { title: 'Nhận thông báo', desc: 'Hóa đơn, lịch đặt và hỗ trợ sẽ gửi về email đã xác thực.' },
          { title: 'Giảm gian lận', desc: 'Hạn chế tạo nhiều tài khoản bằng email tạm thời.' },
        ]}
      />

      <AuthFormPanel>
        <AuthMobileBrand />
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold tracking-tight text-on-surface">Xác thực email</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Hoàn tất bước này để kích hoạt tài khoản và đăng nhập.
          </p>
        </div>

        {status === 'checking' && (
          <div className="mb-4 rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
            Đang kiểm tra liên kết xác thực...
          </div>
        )}
        {message && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}
        {error && <AuthError message={error} />}

        {status === 'success' ? (
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="mt-6 flex h-12 w-full cursor-pointer items-center justify-center rounded-lg bg-brand-orange font-display text-sm font-medium text-white shadow-[var(--shadow-card)] transition-all hover:bg-brand-orangeHover active:scale-[0.98]"
          >
            Đăng nhập
          </button>
        ) : (
          <form onSubmit={handleResend} className="space-y-4">
            <AuthField
              label="Email đăng ký"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              icon="email"
            />
            <AuthSubmitButton disabled={!canResend}>
              {isResending ? 'Đang gửi lại...' : 'Gửi lại email xác thực'}
            </AuthSubmitButton>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-on-surface-variant">
          Đã xác thực?{' '}
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="cursor-pointer font-display font-semibold text-brand-orange hover:underline"
          >
            Quay lại đăng nhập
          </button>
        </p>
      </AuthFormPanel>
    </AuthShell>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  )
}
