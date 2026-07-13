import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_OPTIONS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_OPTIONS,
} from '@/lib/admin/bookingLabels'
import { toLocalDateInputValue } from '@/lib/admin/adminBookingApi'
import { IconSearch } from '@/components/admin/AdminIcons'
import type { BookingFilters } from '@/lib/admin/types'

type BookingFiltersBarProps = {
  filters: BookingFilters
  onChange: (filters: BookingFilters) => void
  resultCount: number
}

const labelClass =
  'mb-1.5 block font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant'

const inputClass =
  'h-10 w-full rounded-xl border border-outline bg-white px-3 text-sm text-on-surface outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20'

export default function BookingFiltersBar({ filters, onChange, resultCount }: BookingFiltersBarProps) {
  const set = (patch: Partial<BookingFilters>) => onChange({ ...filters, ...patch })

  const today = toLocalDateInputValue()
  const tomorrowDate = new Date()
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrow = toLocalDateInputValue(tomorrowDate)

  const quickDates: { label: string; value: string }[] = [
    { label: 'Hôm nay', value: today },
    { label: 'Ngày mai', value: tomorrow },
  ]

  const hasActiveFilters =
    Boolean(filters.query) ||
    filters.bookingStatus !== 'ALL' ||
    filters.paymentStatus !== 'ALL' ||
    Boolean(filters.date)

  return (
    <section className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-[var(--shadow-card)]">
      <div className="border-b border-outline-variant bg-gradient-to-r from-brand-greenDark to-brand-greenLight px-4 py-3 text-white sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-sm font-bold">Bộ lọc đơn đặt</h2>
            <p className="text-xs text-inverse-on-surface/75">Lọc theo ngày, trạng thái và khách hàng</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickDates.map((item) => {
              const active = filters.date === item.value
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => set({ date: active ? '' : item.value })}
                  className={[
                    'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                    active
                      ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/30'
                      : 'border border-white/25 bg-white/10 text-white hover:bg-white/20',
                  ].join(' ')}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="space-y-4 bg-gradient-to-b from-surface-container-low/60 to-white p-4 sm:p-5">
        <label className="relative block">
          <span className={labelClass}>Tìm kiếm</span>
          <IconSearch className="pointer-events-none absolute left-3 top-[34px] h-4 w-4 text-on-surface-variant" />
          <input
            type="search"
            value={filters.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder="Mã đơn, tên khách, SĐT..."
            className={`${inputClass} pl-9`}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className={labelClass}>Trạng thái đơn</span>
            <select
              value={filters.bookingStatus}
              onChange={(e) => set({ bookingStatus: e.target.value as BookingFilters['bookingStatus'] })}
              className={inputClass}
            >
              <option value="ALL">Tất cả</option>
              {BOOKING_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {BOOKING_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Thanh toán</span>
            <select
              value={filters.paymentStatus}
              onChange={(e) => set({ paymentStatus: e.target.value as BookingFilters['paymentStatus'] })}
              className={inputClass}
            >
              <option value="ALL">Tất cả</option>
              {PAYMENT_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {PAYMENT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Ngày sử dụng</span>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => set({ date: e.target.value })}
              className={inputClass}
            />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant bg-surface-container-low/50 px-4 py-3 sm:px-5">
        <p className="text-xs text-on-surface-variant">
          <span className="font-display text-sm font-bold text-brand-orange">{resultCount}</span> đơn · nhóm theo ngày
          sử dụng
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onChange({ query: '', bookingStatus: 'ALL', paymentStatus: 'ALL', date: '' })}
            className="rounded-lg border border-brand-orange/30 bg-primary-container/30 px-3 py-1.5 font-display text-xs font-semibold text-brand-orange transition hover:bg-primary-container/50"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>
    </section>
  )
}
