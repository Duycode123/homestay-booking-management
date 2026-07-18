import { Suspense } from 'react'
import AuthGuard from '@/components/AuthGuard'
import PaymentSessionPageClient from '@/components/payment/PaymentSessionPageClient'

export default function CustomerPaymentPage() {
  return (
    <Suspense fallback={<PaymentPageFallback />}>
      <AuthGuard allowedRoles={['ADMIN', 'STAFF', 'CUSTOMER']}>
        <PaymentSessionPageClient />
      </AuthGuard>
    </Suspense>
  )
}

function PaymentPageFallback() {
  return (
    <main className="min-h-screen bg-[#F6F3ED] px-4 py-8 text-[#242A27]">
      <div className="mx-auto grid max-w-6xl animate-pulse gap-6 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="h-[560px] rounded-[28px] border border-[#E4DED3] bg-white/70" />
        <div className="h-[620px] rounded-[28px] border border-[#E4DED3] bg-white/70" />
      </div>
    </main>
  )
}
