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
    <main className="min-h-screen bg-[#F6F3ED]" aria-busy="true">
      <p className="sr-only" role="status">Đang tải kết quả thanh toán.</p>
    </main>
  )
}
