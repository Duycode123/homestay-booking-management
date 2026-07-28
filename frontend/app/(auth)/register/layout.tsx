import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Đăng ký tài khoản',
  description: 'Tạo tài khoản The Serene Villa để đặt phòng và theo dõi kỳ lưu trú.',
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
