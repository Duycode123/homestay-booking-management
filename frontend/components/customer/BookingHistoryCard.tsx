'use client'

import Link from 'next/link'
import { formatCurrency } from '@/components/booking/booking-data'
import BookingStatusBadge from '@/components/customer/BookingStatusBadge'
import { IconCalendar, IconChevronRight, IconClock, IconTicket } from '@/components/customer/CustomerIcons'
import type { BookingHistoryItem } from '@/lib/customer-booking-service'

const accentClassName = {
  PENDING_PAYMENT: 'bg-[#B8844E]',
  DEPOSIT_PAID: 'bg-[#2E755C]',
  PAID: 'bg-[#2E755C]',
  CHECKED_IN: 'bg-[#2E755C]',
  COMPLETED: 'bg-[#718078]',
  CANCELLED: 'bg-[#C9515F]',
} satisfies Record<BookingHistoryItem['status'], string>

function parseDateParts(date: string) {
  const [day = '--', month = '--', year = '----'] = date.split('/')
  return { day, monthYear: `${month}/${year}` }
}

export default function BookingHistoryCard({ booking, onSelect }: { booking: BookingHistoryItem; onSelect: () => void }) {
  const { day, monthYear } = parseDateParts(booking.date)
  const paymentHref = buildPaymentHref(booking)

  return (
    <article className="group relative overflow-hidden rounded-[22px] border border-outline-variant bg-white shadow-[0_10px_34px_rgba(42,45,39,0.06)] transition duration-300 hover:-translate-y-0.5 hover:border-brand-orange/30 hover:shadow-[0_18px_44px_rgba(42,45,39,0.1)]">
      <span aria-hidden className={['absolute inset-y-0 left-0 w-1', accentClassName[booking.status]].join(' ')} />

      <div className="grid gap-5 p-4 pl-5 sm:grid-cols-[76px_1fr_auto] sm:items-center sm:p-5 sm:pl-6">
        <div className="flex items-center gap-3 sm:block">
          <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border border-outline-variant bg-[#FBF8F3]">
            <span className="font-editorial text-2xl leading-none text-on-surface">{day}</span>
            <span className="mt-1 text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">{monthYear}</span>
          </div>
          <div className="sm:hidden">
            <BookingStatusBadge status={booking.status} />
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-bold text-on-surface sm:text-xl">{booking.roomName}</h3>
            <span className="hidden sm:inline-flex"><BookingStatusBadge status={booking.status} /></span>
            {booking.review && <span className="rounded-full bg-[#F5E9D9] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#916234]">Đã đánh giá</span>}
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-on-surface-variant">
            <span className="inline-flex items-center gap-1.5"><IconClock className="h-4 w-4 text-brand-orange" />{booking.startTime} – {booking.endTime}</span>
            <span className="inline-flex items-center gap-1.5"><IconTicket className="h-4 w-4 text-brand-orange" />{booking.bookingId}</span>
            <span className="inline-flex items-center gap-1.5 sm:hidden"><IconCalendar className="h-4 w-4 text-brand-orange" />{booking.date}</span>
          </div>

          {booking.paymentMethod && <p className="mt-2 text-xs font-medium text-on-surface-variant">{booking.paymentMethod}</p>}
        </div>

        <div className="flex flex-col gap-3 border-t border-outline-variant/70 pt-4 sm:min-w-[200px] sm:items-end sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
          <div className="text-left sm:text-right">
            <p className="text-xs font-medium text-on-surface-variant">Tổng tiền</p>
            <p className="mt-1 font-display text-2xl font-bold text-brand-orange">{formatCurrency(booking.totalAmount)}</p>
          </div>
          <div className="flex w-full gap-2 sm:justify-end">
            {paymentHref && (
              <Link href={paymentHref} className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-brand-orange px-4 font-display text-xs font-bold text-white transition hover:bg-brand-orangeHover sm:flex-none">
                Thanh toán ngay
              </Link>
            )}
            <button type="button" onClick={onSelect} className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-outline-variant bg-white px-4 font-display text-xs font-bold text-on-surface transition hover:border-brand-orange/50 hover:text-brand-orange sm:flex-none">
              Xem chi tiết <IconChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

function buildPaymentHref(booking: BookingHistoryItem) {
  if (booking.status !== 'PENDING_PAYMENT') return null

  const params = new URLSearchParams({ bookingId: booking.bookingId, paymentOption: 'deposit' })
  if (booking.backendBookingId) params.set('backendBookingId', String(booking.backendBookingId))
  return `/customer/checkout?${params.toString()}`
}
