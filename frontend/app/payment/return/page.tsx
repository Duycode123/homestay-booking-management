import { Suspense } from 'react'
import PaymentReturnStatus from '@/components/payment/PaymentReturnStatus'

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<PaymentReturnFallback />}>
      <PaymentReturnStatus />
    </Suspense>
  )
}

function PaymentReturnFallback() {
  return (
    <main className="min-h-screen bg-[#F5F2EC] px-6 py-10 text-[#1A1C1E]">
      <div className="mx-auto max-w-[720px] rounded-[24px] border border-[#E8E4DC] bg-white p-6 shadow-[0_12px_48px_rgba(26,28,30,0.12)]">
        <p className="font-display text-lg font-semibold">Đang kiểm tra trạng thái thanh toán...</p>
      </div>
    </main>
  )
}
