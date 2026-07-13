'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

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
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/auth/forgot-password`,
        { email },
      )
      if (response.status === 200) {
        setMessage('Hệ thống đã gửi liên kết đặt lại mật khẩu vào Email của bạn.')
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr.response?.data?.message || 'Không tìm thấy tài khoản với email này.')
    } finally {
      setIsLoading(false)
    }
  }

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

      {/* Right form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[440px] bg-white rounded-2xl border border-gray-100 p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <button type="button" onClick={() => router.push('/login')} className="flex items-center space-x-2 text-xs font-semibold text-gray-500 hover:text-gray-700 mb-8 group cursor-pointer focus:outline-none">
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <span>Quay lại đăng nhập</span>
          </button>

          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Quên mật khẩu?</h3>
            <p className="text-xs text-gray-400 mt-1">Nhập email tài khoản của bạn để nhận liên kết xác thực khôi phục mật khẩu mới.</p>
          </div>

          {message && <div className="mb-4 text-xs text-emerald-600 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">{message}</div>}
          {error && <div className="mb-4 text-xs text-red-500 bg-red-50/50 p-3 rounded-xl border border-red-100">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Địa chỉ Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@company.com" className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-colors" />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-brand-orange hover:bg-brand-orangeHover disabled:bg-gray-300 text-white font-medium py-3 rounded-xl shadow-sm flex items-center justify-center transition-all mt-6 cursor-pointer active:scale-[0.98]">
              <span className="text-sm">{isLoading ? 'Đang gửi mã...' : 'Gửi liên kết xác thực'}</span>
            </button>
          </form>

          <div className="text-center mt-8 text-xs text-gray-400 leading-relaxed">
            Bạn chưa nhận được email? Hãy kiểm tra lại thư mục Hộp thư rác (Spam) hoặc liên hệ đội ngũ hỗ trợ của chúng tôi.
          </div>
        </div>
      </div>
    </div>
  )
}
