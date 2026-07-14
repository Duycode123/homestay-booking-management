'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { getAuthApiErrorMessage } from '@/lib/auth-api-error'
import {
  AuthError,
  AuthField,
  AuthMobileBrand,
  AuthSubmitButton,
  AuthSuccess,
} from '@/components/auth/AuthField'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const PASSWORD_HAS_LETTER = /[A-Za-z]/
const PASSWORD_HAS_NUMBER = /\d/

export default function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const tokenIsValid = UUID_PATTERN.test(token)
  const passwordRules = {
    validLength: password.length >= 8 && password.length <= 72,
    hasLetter: PASSWORD_HAS_LETTER.test(password),
    hasNumber: PASSWORD_HAS_NUMBER.test(password),
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!tokenIsValid) {
      setError('Liên kết đặt lại mật khẩu bị thiếu hoặc không đúng định dạng.')
      return
    }
    if (!passwordRules.validLength) {
      setError('Mật khẩu phải có từ 8 đến 72 ký tự.')
      return
    }
    if (!passwordRules.hasLetter || !passwordRules.hasNumber) {
      setError('Mật khẩu phải chứa ít nhất một chữ cái và một chữ số.')
      return
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.')
      return
    }
    setIsLoading(true)
    try {
      const response = await api.post('/api/auth/reset-password', { token, newPassword: password })
      if (response.status === 200) {
        setSuccess('Đổi mật khẩu thành công. Hệ thống sẽ chuyển bạn về trang đăng nhập.')
        window.setTimeout(() => router.push('/login'), 1200)
      }
    } catch (err: unknown) {
      setError(getAuthApiErrorMessage(err, 'Liên kết đã hết hạn hoặc không hợp lệ, vui lòng yêu cầu lại.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <AuthMobileBrand />

      <div className="mb-7">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-orange">Bảo mật tài khoản</p>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.025em] text-on-surface">Thiết lập mật khẩu mới</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-on-surface-variant">
          Chọn một mật khẩu riêng biệt, dễ nhớ với bạn và khó đoán với người khác.
        </p>
      </div>

      {error && <AuthError message={error} />}
      {success && <AuthSuccess message={success} />}

      {!tokenIsValid && (
        <div className="mb-6 rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-4 text-xs leading-5 text-on-surface-variant">
          Hãy mở lại liên kết đầy đủ trong email khôi phục. Nếu email đã cũ, bạn nên yêu cầu một liên kết mới.
          <Link
            href="/forgot-password"
            className="mt-3 inline-flex font-display font-semibold text-brand-greenDark underline decoration-brand-orange/50 underline-offset-4 hover:decoration-brand-orange"
          >
            Yêu cầu liên kết mới
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <AuthField
          label="Mật khẩu mới"
          name="new-password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Tối thiểu 8 ký tự"
          icon="lock"
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          ariaDescribedBy="reset-password-requirements"
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-4 text-on-surface-variant/60 transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:text-brand-orange"
            >
              {showPassword ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 1-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              )}
            </button>
          }
        />

        <ul
          id="reset-password-requirements"
          className="grid grid-cols-1 gap-1 text-[11px] text-on-surface-variant sm:grid-cols-3"
          aria-label="Yêu cầu mật khẩu mới"
        >
          <li className={passwordRules.validLength ? 'text-brand-greenLight' : undefined}>
            <span aria-hidden="true">{passwordRules.validLength ? '✓' : '○'}</span> 8–72 ký tự
          </li>
          <li className={passwordRules.hasLetter ? 'text-brand-greenLight' : undefined}>
            <span aria-hidden="true">{passwordRules.hasLetter ? '✓' : '○'}</span> Có chữ cái
          </li>
          <li className={passwordRules.hasNumber ? 'text-brand-greenLight' : undefined}>
            <span aria-hidden="true">{passwordRules.hasNumber ? '✓' : '○'}</span> Có chữ số
          </li>
        </ul>

        <AuthField
          label="Xác nhận mật khẩu mới"
          name="confirm-password"
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Nhập lại mật khẩu mới"
          icon="lock"
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          ariaDescribedBy="reset-password-confirmation"
          ariaInvalid={Boolean(confirmPassword && confirmPassword !== password)}
        />

        {confirmPassword && (
          <p
            id="reset-password-confirmation"
            className={`text-[11px] ${confirmPassword === password ? 'text-brand-greenLight' : 'text-error'}`}
            aria-live="polite"
          >
            {confirmPassword === password ? 'Mật khẩu đã trùng khớp.' : 'Mật khẩu chưa trùng khớp.'}
          </p>
        )}

        <AuthSubmitButton disabled={isLoading || !tokenIsValid || Boolean(success)}>
          {isLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
        </AuthSubmitButton>
      </form>

      <p className="mt-8 border-t border-outline-variant/70 pt-6 text-center text-xs text-on-surface-variant">
        Nhớ ra mật khẩu?{' '}
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="cursor-pointer font-display font-semibold text-brand-greenDark underline-offset-4 transition-colors hover:text-brand-orange hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/35"
        >
          Đăng nhập ngay
        </button>
      </p>
    </div>
  )
}
