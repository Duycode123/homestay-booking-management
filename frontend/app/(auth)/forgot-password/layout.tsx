import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Khôi phục mật khẩu',
  description: 'Yêu cầu liên kết khôi phục mật khẩu cho tài khoản The Serene Villa.',
}

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
