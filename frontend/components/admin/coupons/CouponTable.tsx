import {
  formatCouponExpiry,
  formatCouponValue,
} from '@/lib/admin/coupons/couponLabels'
import type { AdminCoupon } from '@/lib/admin/coupons/types'
import { CouponExpiryBadge, CouponTypeBadge } from './CouponBadges'

type CouponTableProps = {
  coupons: AdminCoupon[]
  isLoading: boolean
  selectedId: number | null
  onSelect: (coupon: AdminCoupon) => void
}

export default function CouponTable({ coupons, isLoading, selectedId, onSelect }: CouponTableProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-44 animate-pulse rounded-2xl border border-outline-variant bg-white shadow-[var(--shadow-card)]"
          />
        ))}
      </div>
    )
  }

  if (coupons.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-outline-variant bg-white px-8 py-16 text-center shadow-[var(--shadow-card)]">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container text-lg font-bold text-brand-orange">
          CP
        </div>
        <p className="font-display text-lg font-bold text-on-surface">Không tìm thấy mã giảm giá</p>
        <p className="mt-2 text-sm text-on-surface-variant">
          Thử đổi bộ lọc hoặc tạo mã giảm giá mới.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {coupons.map((coupon) => {
        const active = selectedId === coupon.couponId

        return (
          <button
            key={coupon.couponId}
            type="button"
            onClick={() => onSelect(coupon)}
            className={[
              'group relative overflow-hidden rounded-2xl border bg-white text-left shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]',
              active
                ? 'border-brand-orange ring-2 ring-brand-orange/25'
                : 'border-outline-variant/80 hover:border-brand-orange/30',
            ].join(' ')}
          >
            <div className="relative h-24 bg-gradient-to-br from-brand-orange/15 via-brand-orange/5 to-brand-greenLight/20">
              <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/20 to-transparent" />

              <div className="relative flex h-full items-end justify-between p-4">
                <div>
                  <p className="font-display text-[10px] font-bold uppercase tracking-wider text-brand-orange">
                    #{coupon.couponId}
                  </p>
                  <p className="font-display text-lg font-bold text-on-surface">{coupon.code}</p>
                </div>
                <CouponExpiryBadge status={coupon.expiryStatus} />
              </div>
            </div>

            <div className="space-y-3 p-4 pt-3">
              <div className="flex flex-wrap items-center gap-2">
                <CouponTypeBadge type={coupon.type} />
                <span className="rounded-full bg-surface-container px-2.5 py-1 text-xs font-semibold text-on-surface">
                  {formatCouponValue(coupon.type, coupon.value)}
                </span>
              </div>

              <div className="space-y-1 text-xs text-on-surface-variant">
                <p>
                  Đơn tối thiểu:{' '}
                  {coupon.minOrderValue
                    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
                        coupon.minOrderValue,
                      )
                    : 'Không yêu cầu'}
                </p>
                <p>Hết hạn: {formatCouponExpiry(coupon.expiresAt)}</p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
