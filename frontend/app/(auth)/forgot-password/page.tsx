'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
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

const RECOVERY_BULLETS = [
  { title: 'Bảo mật tài khoản', desc: 'Liên kết khôi phục chỉ được gửi đến email đã đăng ký.' },
  { title: 'Quy trình riêng tư', desc: 'Mật khẩu hiện tại của bạn không bao giờ được hiển thị hay gửi qua email.' },
  { title: 'Hỗ trợ tận tâm', desc: 'Đội ngũ vận hành sẵn sàng hỗ trợ nếu bạn gặp khó khăn.' },
]

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')
    try {
      const response = await api.post('/api/auth/forgot-password', { email })
      if (response.status === 200) {
        setMessage('Hệ thống đã gửi liên kết đặt lại mật khẩu vào email của bạn.')
      }
    } catch (err: unknown) {
      setError(getAuthApiErrorMessage(err, 'Không thể xử lý yêu cầu. Vui lòng kiểm tra email và thử lại.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell>
      <AuthBanner
        description="Khôi phục quyền truy cập an toàn để bạn tiếp tục quản lý những kỳ nghỉ đã lên kế hoạch."
        bullets={RECOVERY_BULLETS}
      />

      <AuthFormPanel>
        <AuthMobileBrand />

        <button
          type="button"
          onClick={() => router.push('/login')}
          className="group mb-9 inline-flex cursor-pointer items-center gap-2 rounded-full text-xs font-semibold text-on-surface-variant transition-colors hover:text-brand-greenDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/35"
        >
          <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 19.5-7.5-7.5 7.5-7.5" />
          </svg>
          Quay lại đăng nhập
        </button>

        <div className="mb-7">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-orange">Khôi phục tài khoản</p>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.025em] text-on-surface">Quên mật khẩu?</h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-on-surface-variant">
            Nhập email đã đăng ký. Chúng tôi sẽ gửi cho bạn một liên kết an toàn để thiết lập mật khẩu mới.
          </p>
        </div>

        {message && <AuthSuccess message={message} />}
        {error && <AuthError message={error} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthField
            label="Địa chỉ email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ban@example.com"
            icon="email"
            autoComplete="email"
          />

          <AuthSubmitButton disabled={isLoading}>
            {isLoading ? 'Đang gửi liên kết...' : 'Gửi liên kết khôi phục'}
          </AuthSubmitButton>
        </form>

        <div className="mt-8 border-t border-outline-variant/70 pt-6 text-center text-xs leading-5 text-on-surface-variant">
          Chưa thấy email? Kiểm tra thư mục thư rác hoặc liên hệ đội ngũ hỗ trợ để được trợ giúp.
        </div>
      </AuthFormPanel>
    </AuthShell>
  )
}
