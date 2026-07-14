import { Suspense } from 'react'
import BookingConfirmationClient from '@/components/booking/BookingConfirmationClient'

export default function RoomBookingConfirmationPage() {
  return (
    <Suspense fallback={<BookingConfirmationFallback />}>
      <BookingConfirmationClient />
    </Suspense>
  )
}

function BookingConfirmationFallback() {
  return (
    <main className="min-h-screen bg-[#F6F3ED] px-6 py-10 text-[#242A27]">
      <div className="mx-auto max-w-7xl rounded-[24px] border border-[#E4DED3] bg-white p-6 shadow-[0_4px_24px_rgba(26,28,30,0.06)]">
        <p className="font-display text-lg font-semibold">Đang tải thông tin đặt phòng...</p>
      </div>
    </main>
  )
}
