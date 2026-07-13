'use client'

import { formatCurrency } from '@/components/booking/booking-data'
import BookingStatusBadge from '@/components/customer/BookingStatusBadge'
import { IconCalendar, IconChevronRight, IconClock, IconTicket } from '@/components/customer/CustomerIcons'
import type { BookingHistoryItem } from '@/lib/customer-booking-service'

const accentClassName = {
  PENDING_PAYMENT: 'from-brand-orange via-brand-orange/70 to-primary-fixed',
  PAID: 'from-brand-greenLight via-brand-greenLight/70 to-secondary-container/40',
  CHECKED_IN: 'from-brand-greenLight via-brand-greenLight/70 to-secondary-container/40',
  COMPLETED: 'from-brand-greenLight via-brand-greenLight/70 to-secondary-container/40',
  CANCELLED: 'from-error via-error/60 to-error-container',
} satisfies Record<BookingHistoryItem['status'], string>

function parseDateParts(date: string) {
  const [day = '--', month = '--', year = '----'] = date.split('/')
  return { day, monthYear: `${month}/${year}` }
}

type BookingHistoryCardProps = {
  booking: BookingHistoryItem
  onSelect: () => void
}

export default function BookingHistoryCard({ booking, onSelect }: BookingHistoryCardProps) {
  const { day, monthYear } = parseDateParts(booking.date)

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative w-full overflow-hidden rounded-[20px] border border-outline-variant bg-surface-container-low/70 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-orange/35 hover:bg-white hover:shadow-[var(--shadow-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40"
    >
      <div
        aria-hidden
        className={[
          'absolute inset-y-0 left-0 w-1 bg-gradient-to-b opacity-80 transition-opacity group-hover:opacity-100',
          accentClassName[booking.status],
        ].join(' ')}
      />

      <div className="grid gap-4 p-4 pl-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-5 sm:pl-6">
        <div className="flex items-center gap-3 sm:block">
          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-outline-variant bg-white shadow-[var(--shadow-card)] transition-colors group-hover:border-brand-orange/25">
            <span className="font-display text-base font-bold leading-none text-on-surface">{day}</span>
            <span className="mt-0.5 font-display text-[9px] font-semibold uppercase tracking-wide text-on-surface-variant">
              {monthYear}
            </span>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-bold text-on-surface">{booking.roomName}</h2>
            <BookingStatusBadge status={booking.status} />
            {booking.review && (
              <span className="rounded-full border border-brand-orange/20 bg-primary-container px-2.5 py-1 font-display text-[11px] font-bold text-on-primary-container">
                Đã đánh giá
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-on-surface-variant">
            <span className="inline-flex items-center gap-1.5">
              <IconClock className="h-4 w-4 shrink-0 text-brand-orange/80" />
              {booking.startTime} – {booking.endTime}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <IconTicket className="h-4 w-4 shrink-0 text-brand-orange/80" />
              {booking.bookingId}
            </span>
          </div>

          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-on-surface-variant/80 sm:hidden">
            <IconCalendar className="h-3.5 w-3.5" />
            {booking.date}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center sm:gap-2">
          <div className="text-left sm:text-right">
            <p className="font-display text-xl font-bold text-brand-orange">{formatCurrency(booking.totalAmount)}</p>
            <p className="mt-0.5 text-xs font-medium text-on-surface-variant">Tổng thanh toán</p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-white text-on-surface-variant transition-all group-hover:border-brand-orange group-hover:bg-brand-orange group-hover:text-white">
            <IconChevronRight className="h-5 w-5" />
          </span>
        </div>
      </div>
    </button>
  )
}
