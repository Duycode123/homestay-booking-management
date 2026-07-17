'use client'

import { useSearchParams } from 'next/navigation'
import { AuthError } from '@/components/auth/AuthField'

export default function OAuthLoginStatusBanner() {
  const searchParams = useSearchParams()
  if (!searchParams.get('oauthError')) return null

  return <AuthError message="Không thể đăng nhập bằng Google. Vui lòng thử lại hoặc đăng nhập bằng mật khẩu." />
}
