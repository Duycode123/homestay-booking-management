'use client'

import { useState } from 'react'
import { formatBookingStatus } from '@/lib/customer-booking-service'
import type { CustomerBookingStatus } from '@/lib/customer-booking-service'
import { IconFilter } from '@/components/customer/CustomerIcons'
import {
  applyBookingDatePreset,
  defaultBookingHistoryFilters,
  hasActiveBookingHistoryFilters,
  type BookingHistoryFilterState,
} from '@/lib/customer/booking-history-filters'

type BookingHistoryFiltersProps = {
  value: BookingHistoryFilterState
  onChange: (filters: BookingHistoryFilterState) => void
  totalCount: number
  filteredCount: number
  disabled?: boolean
}

const STATUS_OPTIONS: Array<{ value: BookingHistoryFilterState['status']; label: string }> = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'PENDING_PAYMENT', label: formatBookingStatus('PENDING_PAYMENT') },
  { value: 'PAID', label: formatBookingStatus('PAID') },
  { value: 'CHECKED_IN', label: formatBookingStatus('CHECKED_IN') },
  { value: 'COMPLETED', label: formatBookingStatus('COMPLETED') },
  { value: 'CANCELLED', label: formatBookingStatus('CANCELLED') },
]

const DATE_PRESETS = [
  { label: '7 ngày', days: 7 },
  { label: '30 ngày', days: 30 },
  { label: '90 ngày', days: 90 },
] as const

const inputClassName =
  'h-11 w-full rounded-xl border border-outline-variant bg-white px-3 text-sm text-on-surface outline-none transition-colors focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 disabled:opacity-60'

export default function BookingHistoryFilters({
  value,
  onChange,
  totalCount,
  filteredCount,
  disabled = false,
}: BookingHistoryFiltersProps) {
  const [expanded, setExpanded] = useState(false)
  const set = (patch: Partial<BookingHistoryFilterState>) => onChange({ ...value, ...patch })
  const isFiltered = hasActiveBookingHistoryFilters(value)

  return (
    <div className="overflow-hidden rounded-[20px] border border-outline-variant bg-gradient-to-br from-white via-surface-container-low/40 to-primary-container/15 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/80 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container text-brand-orange">
            <IconFilter className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-sm font-bold text-on-surface">Bộ lọc</p>
            <p className="text-xs text-on-surface-variant">
              {filteredCount} / {totalCount} đơn đặt phòng
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isFiltered && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(defaultBookingHistoryFilters)}
              className="rounded-lg border border-outline-variant bg-white px-3 py-1.5 font-display text-xs font-semibold text-on-surface-variant transition-colors hover:border-brand-orange/40 hover:text-brand-orange disabled:opacity-60"
            >
              Xóa lọc
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="rounded-lg border border-outline-variant bg-white px-3 py-1.5 font-display text-xs font-semibold text-on-surface-variant transition-colors hover:border-brand-orange/40 hover:text-brand-orange"
            aria-expanded={expanded}
          >
            {expanded ? 'Thu gọn' : 'Mở rộng'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex flex-wrap gap-2">
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset.days}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ ...value, ...applyBookingDatePreset(preset.days) })}
                className="rounded-full border border-outline-variant bg-white px-4 py-2 font-display text-xs font-semibold text-on-surface-variant shadow-sm transition-all hover:-translate-y-px hover:border-brand-orange hover:text-brand-orange hover:shadow-[var(--shadow-card)] disabled:opacity-60"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="block">
              <span className="mb-1.5 block font-display text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Từ ngày
              </span>
              <input
                type="date"
                value={value.startDate}
                max={value.endDate || undefined}
                disabled={disabled}
                onChange={(event) => set({ startDate: event.target.value })}
                className={inputClassName}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block font-display text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Đến ngày
              </span>
              <input
                type="date"
                value={value.endDate}
                min={value.startDate || undefined}
                disabled={disabled}
                onChange={(event) => set({ endDate: event.target.value })}
                className={inputClassName}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block font-display text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Từ giờ
              </span>
              <input
                type="time"
                value={value.startTime}
                disabled={disabled}
                onChange={(event) => set({ startTime: event.target.value })}
                className={inputClassName}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block font-display text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Đến giờ
              </span>
              <input
                type="time"
                value={value.endTime}
                disabled={disabled}
                onChange={(event) => set({ endTime: event.target.value })}
                className={inputClassName}
              />
            </label>

            <label className="block sm:col-span-2 lg:col-span-1">
              <span className="mb-1.5 block font-display text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Trạng thái
              </span>
              <select
                value={value.status}
                disabled={disabled}
                onChange={(event) => set({ status: event.target.value as CustomerBookingStatus | 'ALL' })}
                className={inputClassName}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
