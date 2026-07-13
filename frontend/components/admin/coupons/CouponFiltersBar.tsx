'use client'

import {
  COUPON_EXPIRY_STATUS_LABELS,
  COUPON_EXPIRY_STATUS_OPTIONS,
  DISCOUNT_TYPE_LABELS,
  DISCOUNT_TYPE_OPTIONS,
} from '@/lib/admin/coupons/couponLabels'
import type { CouponFilters } from '@/lib/admin/coupons/types'
import { IconSearch } from '@/components/admin/AdminIcons'

type CouponFiltersBarProps = {
  filters: CouponFilters
  onChange: (filters: CouponFilters) => void
  resultCount: number
}

const inputClass =
  'h-11 w-full rounded-xl border border-outline bg-surface-container-lowest px-3 text-sm text-on-surface outline-none transition-all focus:border-brand-orange focus:bg-white focus:ring-2 focus:ring-brand-orange/15'

const labelClass =
  'mb-1.5 block font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant'

export default function CouponFiltersBar({ filters, onChange, resultCount }: CouponFiltersBarProps) {
  const set = (patch: Partial<CouponFilters>) => onChange({ ...filters, ...patch })

  const hasActiveFilters =
    filters.query ||
    filters.type !== 'ALL' ||
    filters.expiryStatus !== 'ALL' ||
    filters.sortBy !== 'code' ||
    filters.sortOrder !== 'asc'

  return (
    <div className="overflow-hidden rounded-2xl border border-outline-variant/80 bg-white shadow-[var(--shadow-card)]">
      <div className="border-b border-outline-variant/60 bg-gradient-to-r from-surface-container-low to-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-sm font-bold text-on-surface">Bộ lọc và tìm kiếm</h2>
            <p className="text-xs text-on-surface-variant">
              <span className="font-semibold text-brand-orange">{resultCount}</span> mã giảm giá phù hợp
            </p>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() =>
                onChange({
                  query: '',
                  type: 'ALL',
                  expiryStatus: 'ALL',
                  sortBy: 'code',
                  sortOrder: 'asc',
                })
              }
              className="rounded-full border border-outline px-3 py-1.5 font-display text-xs font-medium text-brand-orange transition-colors hover:bg-primary-container/30"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4 p-5">
        <label className="block">
          <span className={labelClass}>Tìm kiếm</span>
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="search"
              value={filters.query}
              onChange={(event) => set({ query: event.target.value })}
              placeholder="Mã giảm giá, ID..."
              className={[inputClass, 'pl-10'].join(' ')}
            />
          </div>
        </label>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className={labelClass}>Loại giảm</span>
            <select
              value={filters.type}
              onChange={(event) => set({ type: event.target.value as CouponFilters['type'] })}
              className={inputClass}
            >
              <option value="ALL">Tất cả</option>
              {DISCOUNT_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {DISCOUNT_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Trạng thái</span>
            <select
              value={filters.expiryStatus}
              onChange={(event) => set({ expiryStatus: event.target.value as CouponFilters['expiryStatus'] })}
              className={inputClass}
            >
              <option value="ALL">Tất cả</option>
              {COUPON_EXPIRY_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {COUPON_EXPIRY_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Sắp xếp theo</span>
            <select
              value={filters.sortBy}
              onChange={(event) => set({ sortBy: event.target.value as CouponFilters['sortBy'] })}
              className={inputClass}
            >
              <option value="code">Mã</option>
              <option value="value">Giá trị</option>
              <option value="expiresAt">Hết hạn</option>
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Thứ tự</span>
            <select
              value={filters.sortOrder}
              onChange={(event) => set({ sortOrder: event.target.value as CouponFilters['sortOrder'] })}
              className={inputClass}
            >
              <option value="asc">Tăng dần</option>
              <option value="desc">Giảm dần</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  )
}
