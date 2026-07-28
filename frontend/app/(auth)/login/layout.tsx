import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Đăng nhập',
  description: 'Đăng nhập tài khoản The Serene Villa để quản lý kỳ lưu trú của bạn.',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
