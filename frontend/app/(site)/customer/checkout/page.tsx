import { Suspense } from 'react'
import AuthGuard from '@/components/AuthGuard'
import CheckoutPageClient from '@/components/checkout/CheckoutPageClient'

export default function CustomerCheckoutPage() {
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <AuthGuard allowedRoles={['ADMIN', 'STAFF', 'CUSTOMER']}>
        <CheckoutPageClient />
      </AuthGuard>
    </Suspense>
  )
}

function CheckoutFallback() {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#F6F3ED] px-4 py-6 text-[#242A27] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl rounded-[20px] border border-[#E4DED3] bg-white p-4 shadow-[0_4px_24px_rgba(26,28,30,0.06)] sm:rounded-[24px] sm:p-6">
        <p className="font-display text-lg font-semibold">Đang tải checkout...</p>
      </div>
    </main>
  )
}
