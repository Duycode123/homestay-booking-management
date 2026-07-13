import { formatBookingStatus } from '@/lib/customer-booking-service'
import type { CustomerBookingStatus } from '@/lib/customer-booking-service'

const toneClassName = {
  PENDING_PAYMENT: 'border-brand-orange/25 bg-primary-container text-on-primary-container',
  PAID: 'border-secondary-container/30 bg-secondary-container/10 text-secondary-container',
  CHECKED_IN: 'border-secondary-container/30 bg-secondary-container/10 text-secondary-container',
  COMPLETED: 'border-secondary-container/30 bg-secondary-container/10 text-brand-greenLight',
  CANCELLED: 'border-error/20 bg-error-container text-on-error-container',
} satisfies Record<CustomerBookingStatus, string>

const dotClassName = {
  PENDING_PAYMENT: 'bg-brand-orange',
  PAID: 'bg-brand-greenLight',
  CHECKED_IN: 'bg-brand-greenLight',
  COMPLETED: 'bg-brand-greenLight',
  CANCELLED: 'bg-error',
} satisfies Record<CustomerBookingStatus, string>

export default function BookingStatusBadge({ status }: { status: CustomerBookingStatus }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-wide',
        toneClassName[status],
      ].join(' ')}
    >
      <span className={['h-1.5 w-1.5 rounded-full', dotClassName[status]].join(' ')} aria-hidden />
      {formatBookingStatus(status)}
    </span>
  )
}
