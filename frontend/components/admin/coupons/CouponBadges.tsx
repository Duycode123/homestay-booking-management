import {
  COUPON_EXPIRY_STATUS_LABELS,
  DISCOUNT_TYPE_LABELS,
} from '@/lib/admin/coupons/couponLabels'
import type { CouponExpiryStatus, DiscountType } from '@/lib/admin/coupons/types'

type BadgeSize = 'sm' | 'md'

const sizeClass: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
}

export function CouponTypeBadge({ type, size = 'sm' }: { type: DiscountType; size?: BadgeSize }) {
  return (
    <span
      className={[
        'inline-flex rounded-full bg-primary-container/50 font-display font-semibold uppercase tracking-wide text-brand-orange',
        sizeClass[size],
      ].join(' ')}
    >
      {DISCOUNT_TYPE_LABELS[type]}
    </span>
  )
}

export function CouponExpiryBadge({
  status,
  size = 'sm',
}: {
  status: CouponExpiryStatus
  size?: BadgeSize
}) {
  const tone =
    status === 'ACTIVE'
      ? 'bg-secondary-container/60 text-secondary'
      : status === 'EXPIRED'
        ? 'bg-error-container/50 text-error'
        : 'bg-surface-container text-on-surface-variant'

  return (
    <span className={['inline-flex rounded-full font-display font-semibold', tone, sizeClass[size]].join(' ')}>
      {COUPON_EXPIRY_STATUS_LABELS[status]}
    </span>
  )
}
