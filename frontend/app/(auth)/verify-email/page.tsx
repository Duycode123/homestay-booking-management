'use client'

import Link from 'next/link'
import { Suspense, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { getAuthApiErrorMessage } from '@/lib/auth-api-error'
import AuthBanner from '@/components/auth/AuthBanner'
import {
  AuthError,
  AuthField,
  AuthFormPanel,
  AuthMobileBrand,
  AuthShell,
  AuthSubmitButton,
  AuthSuccess,
} from '@/components/auth/AuthField'

type VerificationStatus = 'awaiting' | 'checking' | 'success' | 'error'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

let latestVerificationRequest: { key: string; promise: Promise<void> } | null = null

function requestEmailVerification(token: string, attempt: number) {
  const key = `${token}:${attempt}`

  if (latestVerificationRequest?.key !== key) {
    latestVerificationRequest = {
      key,
      promise: api.post('/api/auth/verify-email', { token }).then(() => undefined),
    }
  }

  return latestVerificationRequest.promise
}

function StatusIcon({ status }: { status: VerificationStatus }) {
  if (status === 'checking') {
    return (
      <span
        className="flex h-16 w-16 items-center justify-center rounded-full border border-brand-orange/25 bg-brand-orange/[0.08] text-brand-orange"
        aria-hidden="true"
      >
        <span className="h-7 w-7 animate-spin rounded-full border-2 border-current/20 border-t-current" />
      </span>
    )
  }

  if (status === 'success') {
    return (
      <span
        className="flex h-16 w-16 items-center justify-center rounded-full border border-secondary/20 bg-secondary-container/35 text-secondary"
        aria-hidden="true"
      >
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none">
          <path d="m6.75 12.25 3.35 3.35 7.15-7.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    )
  }

  if (status === 'error') {
    return (
      <span
        className="flex h-16 w-16 items-center justify-center rounded-full border border-error/20 bg-error-container/65 text-error"
        aria-hidden="true"
      >
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 7.8v5.4M12 16.25v.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
    )
  }

  return (
    <span
      className="flex h-16 w-16 items-center justify-center rounded-full border border-outline-variant bg-surface-container-low text-brand-greenDark"
      aria-hidden="true"
    >
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none">
        <path d="M3.75 7.25 10.9 12a2 2 0 0 0 2.2 0l7.15-4.75M5.25 19h13.5a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5.25a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

function ResendVerificationForm({ initialEmail }: { initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isResending, setIsResending] = useState(false)
  const normalizedEmail = email.trim().toLowerCase()
  const emailIsValid = normalizedEmail.length <= 254 && EMAIL_PATTERN.test(normalizedEmail)
  const canResend = useMemo(
    () => emailIsValid && !isResending,
    [emailIsValid, isResending],
  )

  async function handleResend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)

    if (!emailIsValid) {
      setFeedback({ type: 'error', message: 'Vui lòng nhập đúng định dạng email đã dùng để đăng ký.' })
      return
    }

    setIsResending(true)

    try {
      await api.post('/api/auth/resend-verification-email', { email: normalizedEmail })
      setFeedback({
        type: 'success',
        message: 'Email xác thực mới đã được gửi. Hãy kiểm tra cả hộp thư đến và thư rác.',
      })
    } catch (error: unknown) {
      setFeedback({
        type: 'error',
        message: getAuthApiErrorMessage(error, 'Không thể gửi lại email xác thực. Vui lòng thử lại sau.'),
      })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="mt-7 border-t border-outline-variant/70 pt-7">
      <div className="mb-5">
        <h2 className="font-display text-base font-semibold text-on-surface">Bạn chưa nhận được email?</h2>
        <p className="mt-1.5 text-xs leading-5 text-on-surface-variant">
          Nhập lại email đăng ký để nhận một liên kết xác thực mới.
        </p>
      </div>

      {feedback?.type === 'success' && <AuthSuccess message={feedback.message} />}
      {feedback?.type === 'error' && <AuthError message={feedback.message} />}

      <form onSubmit={handleResend} className="space-y-4" noValidate>
        <AuthField
          label="Email đăng ký"
          name="verification-email"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            if (feedback?.type === 'error') setFeedback(null)
          }}
          placeholder="ban@example.com"
          icon="email"
          maxLength={254}
          inputMode="email"
          autoComplete="email"
        />
        <AuthSubmitButton disabled={!canResend}>
          {isResending ? 'Đang gửi email...' : 'Gửi liên kết xác thực mới'}
        </AuthSubmitButton>
      </form>
    </div>
  )
}

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''
  const sent = searchParams.get('sent') === '1'
  const initialEmail = searchParams.get('email')?.trim() ?? ''
  const [status, setStatus] = useState<VerificationStatus>(token ? 'checking' : 'awaiting')
  const [verificationError, setVerificationError] = useState('')
  const [verificationAttempt, setVerificationAttempt] = useState(0)

  useEffect(() => {
    if (!token) {
      setStatus('awaiting')
      return
    }

    if (!UUID_PATTERN.test(token)) {
      setStatus('error')
      setVerificationError('Liên kết xác thực bị thiếu mã hợp lệ. Vui lòng mở lại liên kết đầy đủ trong email.')
      return
    }

    let isActive = true
    setStatus('checking')
    setVerificationError('')

    requestEmailVerification(token, verificationAttempt)
      .then(() => {
        if (isActive) setStatus('success')
      })
      .catch((error: unknown) => {
        if (!isActive) return
        setStatus('error')
        setVerificationError(
          getAuthApiErrorMessage(error, 'Liên kết xác thực không hợp lệ, đã được sử dụng hoặc đã hết hạn.'),
        )
      })

    return () => {
      isActive = false
    }
  }, [token, verificationAttempt])

  const heading = status === 'success'
    ? 'Email đã được xác thực'
    : status === 'checking'
      ? 'Đang xác thực email'
      : status === 'error'
        ? 'Chưa thể xác thực email'
        : sent
          ? 'Kiểm tra hộp thư của bạn'
          : 'Liên kết xác thực bị thiếu'

  const description = status === 'success'
    ? 'Tài khoản của bạn đã sẵn sàng. Bạn có thể đăng nhập và bắt đầu đặt kỳ nghỉ.'
    : status === 'checking'
      ? 'Vui lòng chờ trong giây lát trong khi chúng tôi kiểm tra tính hợp lệ của liên kết.'
      : status === 'error'
        ? 'Liên kết có thể đã hết hạn hoặc gặp lỗi kết nối. Bạn có thể thử lại hoặc yêu cầu liên kết mới.'
        : sent
          ? 'Chúng tôi đã gửi một liên kết xác thực đến email đăng ký. Liên kết có thể mất vài phút để xuất hiện.'
          : 'Hãy mở liên kết đầy đủ trong email xác thực hoặc yêu cầu hệ thống gửi cho bạn một liên kết mới.'

  return (
    <AuthShell>
      <AuthBanner
        description="Xác thực email giúp bảo vệ tài khoản và đảm bảo các thông báo đặt phòng quan trọng đến đúng người."
        bullets={[
          { title: 'Bảo vệ tài khoản', desc: 'Chỉ chủ sở hữu email mới có thể kích hoạt tài khoản.' },
          { title: 'Nhận đúng thông báo', desc: 'Xác nhận đặt phòng và cập nhật hành trình được gửi đúng địa chỉ.' },
          { title: 'Quy trình an toàn', desc: 'Mỗi liên kết xác thực có mã riêng và chỉ nên được sử dụng một lần.' },
        ]}
      />

      <AuthFormPanel>
        <AuthMobileBrand />

        <div aria-live="polite" aria-busy={status === 'checking'}>
          <StatusIcon status={status} />
          <p className="mb-3 mt-7 text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-orange">
            Bảo mật tài khoản
          </p>
          <h1 className="font-editorial text-3xl font-semibold tracking-[-0.025em] text-on-surface">
            {heading}
          </h1>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant">{description}</p>
        </div>

        {status === 'checking' && (
          <p className="sr-only" role="status">Đang kiểm tra liên kết xác thực email.</p>
        )}

        {status === 'success' && (
          <div className="mt-7 space-y-3">
            <Link
              href="/login"
              className="flex h-12 w-full items-center justify-center rounded-full bg-brand-greenDark px-6 font-display text-sm font-semibold text-white shadow-[0_12px_28px_rgba(18,50,39,.16)] transition-[transform,background-color,box-shadow] hover:-translate-y-0.5 hover:bg-brand-greenLight focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-orange/25"
            >
              Đăng nhập ngay
            </Link>
            <Link
              href="/"
              className="flex h-11 w-full items-center justify-center rounded-full text-xs font-semibold text-on-surface-variant transition-colors hover:text-brand-greenDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/30"
            >
              Trở về trang chủ
            </Link>
          </div>
        )}

        {status === 'error' && (
          <>
            <div className="mt-6">
              <AuthError message={verificationError} />
            </div>
            {UUID_PATTERN.test(token) && (
              <button
                type="button"
                onClick={() => setVerificationAttempt((attempt) => attempt + 1)}
                className="flex h-11 w-full items-center justify-center rounded-full border border-brand-greenDark/20 bg-white px-5 font-display text-sm font-semibold text-brand-greenDark transition-colors hover:border-brand-greenDark/40 hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-orange/20"
              >
                Thử xác thực lại
              </button>
            )}
          </>
        )}

        {(status === 'awaiting' || status === 'error') && (
          <ResendVerificationForm initialEmail={initialEmail} />
        )}

        {status !== 'success' && (
          <p className="mt-7 text-center text-xs leading-5 text-on-surface-variant">
            Đã xác thực trước đó?{' '}
            <Link
              href="/login"
              className="font-display font-semibold text-brand-greenDark underline decoration-brand-orange/50 underline-offset-4 hover:decoration-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/30"
            >
              Quay lại đăng nhập
            </Link>
          </p>
        )}
      </AuthFormPanel>
    </AuthShell>
  )
}

function VerifyEmailFallback() {
  return (
    <AuthShell>
      <AuthBanner description="Xác thực email giúp bảo vệ tài khoản và đảm bảo các thông báo đặt phòng quan trọng đến đúng người." />
      <AuthFormPanel>
        <AuthMobileBrand />
        <div className="flex min-h-64 flex-col items-center justify-center text-center" role="status">
          <StatusIcon status="checking" />
          <p className="mt-5 font-display text-sm font-semibold text-on-surface">Đang chuẩn bị trang xác thực</p>
          <p className="mt-2 text-xs text-on-surface-variant">Vui lòng chờ trong giây lát.</p>
        </div>
      </AuthFormPanel>
    </AuthShell>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailContent />
    </Suspense>
  )
}
