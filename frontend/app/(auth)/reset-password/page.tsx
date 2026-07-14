import type { Metadata } from 'next'
import { Suspense } from 'react'
import AuthBanner from '@/components/auth/AuthBanner'
import { AuthFormPanel, AuthShell } from '@/components/auth/AuthField'
import ResetPasswordForm from './ResetPasswordForm'

export const metadata: Metadata = {
  title: 'Thiết lập mật khẩu mới',
  robots: { index: false, follow: false },
}

const RESET_BULLETS = [
  { title: 'Liên kết được xác thực', desc: 'Yêu cầu chỉ được xử lý với liên kết khôi phục hợp lệ.' },
  { title: 'Mật khẩu được bảo vệ', desc: 'Thông tin mới được gửi qua kết nối bảo mật đến hệ thống.' },
  { title: 'Trở lại ngay', desc: 'Đăng nhập và tiếp tục quản lý kỳ nghỉ sau khi cập nhật.' },
]

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <AuthBanner
        description="Hoàn tất bước bảo mật cuối cùng để quay lại với hành trình và những kỳ nghỉ đang chờ bạn."
        bullets={RESET_BULLETS}
      />

      <AuthFormPanel>
        <Suspense
          fallback={
            <div className="flex min-h-52 items-center justify-center" role="status">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-outline-variant border-t-brand-orange" aria-hidden="true" />
              <span className="sr-only">Đang tải biểu mẫu đặt lại mật khẩu</span>
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </AuthFormPanel>
    </AuthShell>
  )
}
