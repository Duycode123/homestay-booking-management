'use client'

import {
  REVIEW_APPROVAL_STATUS_OPTIONS,
  REVIEW_APPROVAL_STATUS_LABELS,
  REVIEW_RATING_OPTIONS,
  formatReviewRatingLabel,
} from '@/lib/admin/reviews/reviewLabels'
import type { ReviewFilters, ReviewRoomOption } from '@/lib/admin/reviews/types'
import { IconSearch } from '@/components/admin/AdminIcons'

type ReviewFiltersBarProps = {
  filters: ReviewFilters
  rooms: ReviewRoomOption[]
  onChange: (filters: ReviewFilters) => void
  totalElements: number
}

const inputClass =
  'h-11 w-full rounded-xl border border-outline bg-surface-container-lowest px-3 text-sm text-on-surface outline-none transition-all focus:border-brand-orange focus:bg-white focus:ring-2 focus:ring-brand-orange/15'

const labelClass =
  'mb-1.5 block font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant'

export default function ReviewFiltersBar({ filters, rooms, onChange, totalElements }: ReviewFiltersBarProps) {
  const set = (patch: Partial<ReviewFilters>) => onChange({ ...filters, ...patch, page: 0 })

  return (
    <div className="overflow-hidden rounded-2xl border border-outline-variant/80 bg-white shadow-[var(--shadow-card)]">
      <div className="border-b border-outline-variant/60 bg-gradient-to-r from-surface-container-low to-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-sm font-bold text-on-surface">Bộ lọc và tìm kiếm</h2>
            <p className="text-xs text-on-surface-variant">
              <span className="font-semibold text-brand-orange">{totalElements}</span> đánh giá phù hợp
            </p>
          </div>
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
              placeholder="Nội dung, khách hàng, phòng, nhân viên..."
              className={[inputClass, 'pl-10'].join(' ')}
            />
          </div>
        </label>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className={labelClass}>Phòng</span>
            <select
              value={filters.roomId === 'ALL' ? 'ALL' : String(filters.roomId)}
              onChange={(event) =>
                set({ roomId: event.target.value === 'ALL' ? 'ALL' : Number(event.target.value) })
              }
              className={inputClass}
            >
              <option value="ALL">Tất cả phòng</option>
              {rooms.map((room) => (
                <option key={room.roomId} value={room.roomId}>
                  {room.roomName}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Trạng thái</span>
            <select
              value={filters.approvalStatus}
              onChange={(event) =>
                set({ approvalStatus: event.target.value as ReviewFilters['approvalStatus'] })
              }
              className={inputClass}
            >
              {REVIEW_APPROVAL_STATUS_OPTIONS.filter((status) => status !== 'HIDDEN').map((status) => (
                <option key={status} value={status}>
                  {REVIEW_APPROVAL_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Số sao</span>
            <select
              value={filters.rating === 'ALL' ? 'ALL' : String(filters.rating)}
              onChange={(event) =>
                set({ rating: event.target.value === 'ALL' ? 'ALL' : Number(event.target.value) })
              }
              className={inputClass}
            >
              {REVIEW_RATING_OPTIONS.map((rating) => (
                <option key={String(rating)} value={String(rating)}>
                  {formatReviewRatingLabel(rating)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Mã nhân viên</span>
            <input
              type="number"
              min="1"
              value={filters.staffId}
              onChange={(event) => set({ staffId: event.target.value })}
              placeholder="Lọc theo mã nhân viên"
              className={inputClass}
            />
          </label>
        </div>
      </div>
    </div>
  )
}
