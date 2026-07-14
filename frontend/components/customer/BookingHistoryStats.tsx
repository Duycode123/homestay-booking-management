import type { BookingHistoryItem } from '@/lib/customer-booking-service'

type StatTone = 'neutral' | 'warning' | 'success' | 'muted'

export default function BookingHistoryStats({ bookings }: { bookings: BookingHistoryItem[] }) {
  const pending = bookings.filter((booking) => booking.status === 'PENDING_PAYMENT').length
  const active = bookings.filter((booking) => booking.status === 'DEPOSIT_PAID' || booking.status === 'PAID' || booking.status === 'CHECKED_IN').length
  const completed = bookings.filter((booking) => booking.status === 'COMPLETED').length

  const items: Array<{ label: string; hint: string; value: number; tone: StatTone; icon: 'all' | 'payment' | 'calendar' | 'check' }> = [
    { label: 'Tổng booking', hint: 'Tất cả kỳ lưu trú', value: bookings.length, tone: 'neutral', icon: 'all' },
    { label: 'Cần thanh toán', hint: 'Booking đang chờ', value: pending, tone: 'warning', icon: 'payment' },
    { label: 'Đang hoạt động', hint: 'Đã cọc hoặc đã trả', value: active, tone: 'success', icon: 'calendar' },
    { label: 'Đã hoàn tất', hint: 'Kỳ lưu trú kết thúc', value: completed, tone: 'muted', icon: 'check' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-[20px] border border-outline-variant bg-white p-4 shadow-[0_12px_34px_rgba(42,45,39,0.07)] sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <span className={['flex h-10 w-10 items-center justify-center rounded-xl', getIconClass(item.tone)].join(' ')}>
              <StatIcon name={item.icon} />
            </span>
            <span className={['font-display text-3xl font-bold', getValueClass(item.tone)].join(' ')}>{item.value}</span>
          </div>
          <p className="mt-4 font-display text-sm font-bold text-on-surface">{item.label}</p>
          <p className="mt-0.5 hidden text-xs text-on-surface-variant sm:block">{item.hint}</p>
        </div>
      ))}
    </div>
  )
}

function getIconClass(tone: StatTone) {
  if (tone === 'warning') return 'bg-[#FFF1DD] text-[#A76A24]'
  if (tone === 'success') return 'bg-[#E7F2EC] text-[#23604B]'
  if (tone === 'muted') return 'bg-[#EEEAE3] text-[#666D67]'
  return 'bg-[#F3E8D9] text-brand-orange'
}

function getValueClass(tone: StatTone) {
  if (tone === 'warning') return 'text-[#A76A24]'
  if (tone === 'success') return 'text-[#23604B]'
  if (tone === 'muted') return 'text-[#666D67]'
  return 'text-on-surface'
}

function StatIcon({ name }: { name: 'all' | 'payment' | 'calendar' | 'check' }) {
  if (name === 'payment') return <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18M7 15h3" /></svg>
  if (name === 'calendar') return <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4m8-4v4M4 10h16" /></svg>
  if (name === 'check') return <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="m8 12 2.7 2.7L16.5 9" strokeLinecap="round" strokeLinejoin="round" /></svg>
  return <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 4h10a2 2 0 0 1 2 2v14l-3-2-4 2-4-2-3 2V6a2 2 0 0 1 2-2Z" /><path d="M9 9h6M9 13h4" strokeLinecap="round" /></svg>
}
