import { Suspense } from 'react'
import ResetPasswordForm from './ResetPasswordForm'

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen bg-brand-bgGray font-sans antialiased">
      {/* Left banner */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-brand-greenDark to-brand-greenLight text-white flex-col justify-between p-16 relative overflow-hidden">
        <div className="flex items-center space-x-3 z-10">
          <div className="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 10l12-3M9 14c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm12-4c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide">Homestay Booking</h1>
            <p className="text-xs text-emerald-400/70 tracking-wider uppercase">Workspace Management</p>
          </div>
        </div>

        <div className="max-w-xl my-auto z-10 space-y-6">
          <h2 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
            Đặt phòng homestay <span className="text-brand-orange">đẳng cấp</span>, trải nghiệm âm nhạc tối ưu.
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Hơn 6 phòng homestay sạch sẽ, đầy đủ tiện nghi hiện đại và dịch vụ hỗ trợ chu đáo.
          </p>
          <div className="space-y-3 pt-2 text-sm text-gray-200">
            {['Đặt phòng nhanh chóng trong vòng 30 giây', 'Hệ thống ưu đãi và mã giảm giá thành viên hàng tuần', 'Đội ngũ kỹ thuật viên hỗ trợ vận hành liên tục 24/7'].map((text) => (
              <div key={text} className="flex items-center space-x-3">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-gray-400/50 z-10 tracking-wide">© 2026 Homestay Booking. All rights reserved.</div>
      </div>

      {/* Right form — wrapped in Suspense for useSearchParams */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <Suspense fallback={<div className="text-sm text-gray-400">Đang tải...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
