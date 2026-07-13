import type { BookingStatus, PaymentStatus } from '@/lib/admin/types'
import { BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/admin/bookingLabels'

type BadgeTone = 'default' | 'overlay'

const overlayToneClass = 'border-white/35 bg-black/45 text-white backdrop-blur-sm'

const bookingStyles: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'border-tertiary/25 bg-tertiary-container text-on-tertiary-container',
  PAID: 'border-brand-orange/25 bg-primary-container text-on-primary-container',
  CHECKED_IN: 'border-secondary/25 bg-secondary-container/35 text-secondary',
  COMPLETED: 'border-secondary/20 bg-secondary-container/50 text-on-secondary-container',
  CANCELLED: 'border-error/25 bg-error-container text-on-error-container',
}

const paymentStyles: Record<PaymentStatus, string> = {
  PAID: 'border-secondary/20 bg-secondary-container/50 text-on-secondary-container',
  UNPAID: 'border-error/25 bg-error-container text-on-error-container',
  PENDING: 'border-tertiary/25 bg-tertiary-container text-on-tertiary-container',
}

export function BookingStatusBadge({
  status,
  tone = 'default',
}: {
  status: BookingStatus
  tone?: BadgeTone
}) {
  return (
    <span
      className={[
        'inline-flex rounded-full border px-2.5 py-0.5 font-display text-[10px] font-semibold uppercase tracking-wide',
        tone === 'overlay' ? overlayToneClass : bookingStyles[status],
      ].join(' ')}
    >
      {BOOKING_STATUS_LABELS[status]}
    </span>
  )
}

export function PaymentStatusBadge({
  status,
  tone = 'default',
}: {
  status: PaymentStatus
  tone?: BadgeTone
}) {
  return (
    <span
      className={[
        'inline-flex rounded-full border px-2.5 py-0.5 font-display text-[10px] font-semibold uppercase tracking-wide',
        tone === 'overlay' ? overlayToneClass : paymentStyles[status],
      ].join(' ')}
    >
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  )
}
