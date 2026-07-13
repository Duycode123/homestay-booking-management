import type { BookingHistoryItem } from '@/lib/customer-booking-service'

type BookingHistoryStatsProps = {
  bookings: BookingHistoryItem[]
}

export default function BookingHistoryStats({ bookings }: BookingHistoryStatsProps) {
  const pending = bookings.filter((booking) => booking.status === 'PENDING_PAYMENT').length
  const completed = bookings.filter((booking) => booking.status === 'COMPLETED').length
  const cancelled = bookings.filter((booking) => booking.status === 'CANCELLED').length

  const items = [
    { label: 'Tổng đơn', value: bookings.length, tone: 'text-on-surface' },
    { label: 'Chờ thanh toán', value: pending, tone: 'text-brand-orange' },
    { label: 'Hoàn tất', value: completed, tone: 'text-brand-greenLight' },
    { label: 'Đã hủy', value: cancelled, tone: 'text-error' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-outline-variant bg-white/80 px-4 py-3 shadow-[var(--shadow-card)] backdrop-blur-sm"
        >
          <p className="font-display text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            {item.label}
          </p>
          <p className={['mt-1 font-display text-2xl font-bold', item.tone].join(' ')}>{item.value}</p>
        </div>
      ))}
    </div>
  )
}
