'use client'

import { useSearchParams } from 'next/navigation'
import { AuthSuccess } from '@/components/auth/AuthField'

export default function RegisterSuccessBanner() {
  const searchParams = useSearchParams()
  if (searchParams.get('registered') !== '1') return null

  return <AuthSuccess message="Đăng ký thành công! Vui lòng đăng nhập để tiếp tục." />
}
