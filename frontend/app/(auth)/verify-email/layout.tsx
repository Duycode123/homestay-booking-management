import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Xác thực email',
  description: 'Xác thực địa chỉ email để bảo vệ tài khoản The Serene Villa.',
}

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return children
}
