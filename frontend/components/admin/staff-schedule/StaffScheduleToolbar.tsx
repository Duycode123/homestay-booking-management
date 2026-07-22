'use client'

import { IconChevronLeft, IconChevronRight, IconSearch } from '@/components/admin/AdminIcons'

type StaffScheduleToolbarProps = {
  rangeLabel: string
  query: string
  staffId: string
  resultCount: number
  pendingCount: number
  onMove: (direction: -1 | 1) => void
  onThisWeek: () => void
  onNextWeek: () => void
  onQueryChange: (value: string) => void
  onStaffIdChange: (value: string) => void
  isLoading: boolean
}

export default function StaffScheduleToolbar({
  rangeLabel,
  query,
  staffId,
  resultCount,
  pendingCount,
  onMove,
  onThisWeek,
  onNextWeek,
  onQueryChange,
  onStaffIdChange,
  isLoading,
}: StaffScheduleToolbarProps) {
  return (
    <section className="rounded-[22px] border border-[#e2d7ca] bg-[linear-gradient(135deg,#fff_0%,#fbf8f3_100%)] p-4 shadow-[0_14px_40px_rgba(31,54,44,0.07)] sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center overflow-hidden rounded-2xl border border-[#ded3c5] bg-white shadow-sm">
            <button
              type="button"
              onClick={() => onMove(-1)}
              className="flex h-11 w-11 items-center justify-center border-r border-[#e8dfd4] bg-white transition hover:bg-[#faf3ea] hover:text-brand-orange"
              aria-label="Tuần trước"
            >
              <IconChevronLeft className="h-4 w-4" />
            </button>
            <div className="min-w-[190px] px-4 py-1.5 text-center sm:min-w-[230px]">
              <p className="font-display text-sm font-bold text-on-surface">{rangeLabel}</p>
              <p className="text-[11px] text-on-surface-variant">
                {resultCount} ca
                {pendingCount > 0 && (
                  <>
                    {' · '}
                    <span className="font-semibold text-tertiary">{pendingCount} chờ duyệt</span>
                  </>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onMove(1)}
              className="flex h-11 w-11 items-center justify-center border-l border-[#e8dfd4] bg-white transition hover:bg-[#faf3ea] hover:text-brand-orange"
              aria-label="Tuần sau"
            >
              <IconChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onThisWeek}
            className="h-11 rounded-2xl border border-[#ded3c5] bg-white px-4 text-xs font-bold text-on-surface transition hover:border-brand-orange/40 hover:text-brand-orange"
          >
            Tuần này
          </button>
          <button
            type="button"
            onClick={onNextWeek}
            className="h-11 rounded-2xl bg-brand-orange px-4 text-xs font-bold text-white shadow-[0_8px_20px_rgba(184,136,87,0.20)] transition hover:bg-brand-orangeHover"
          >
            Tuần tới
          </button>

        </div>

        <div className="grid w-full gap-2 sm:grid-cols-[minmax(240px,1fr)_150px] xl:max-w-[520px]">
          <label className="relative block">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
            <input
              data-search-input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              disabled={isLoading}
              placeholder="Tìm tên / email nhân viên…"
              className="h-11 w-full rounded-2xl border border-[#ded3c5] bg-white pl-10 pr-4 text-sm font-medium outline-none transition placeholder:text-on-surface-variant/65 focus:border-secondary focus:shadow-[0_0_0_3px_rgba(23,58,49,0.10)] disabled:opacity-60"
            />
          </label>
          <input
            value={staffId}
            onChange={(event) => onStaffIdChange(event.target.value.replace(/[^\d]/g, ''))}
            disabled={isLoading}
            placeholder="Mã nhân viên"
            inputMode="numeric"
            aria-label="Lọc theo mã nhân viên"
            className="h-11 rounded-2xl border border-[#ded3c5] bg-white px-4 text-sm font-medium outline-none transition placeholder:text-on-surface-variant/65 focus:border-secondary focus:shadow-[0_0_0_3px_rgba(23,58,49,0.10)] disabled:opacity-60"
          />
        </div>
      </div>
    </section>
  )
}
