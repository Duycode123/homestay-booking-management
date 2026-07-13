'use client'

import { IconChevronLeft, IconChevronRight, IconRefresh, IconSearch } from '@/components/admin/AdminIcons'

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
  onRefresh: () => void
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
  onRefresh,
  isLoading,
}: StaffScheduleToolbarProps) {
  return (
    <section className="rounded-xl border border-outline-variant bg-white p-3 shadow-[var(--shadow-card)] sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center overflow-hidden rounded-lg border border-outline-variant">
            <button
              type="button"
              onClick={() => onMove(-1)}
              className="flex h-9 w-9 items-center justify-center border-r border-outline-variant bg-surface-container-low transition hover:bg-primary-container/30 hover:text-brand-orange"
              aria-label="Tuần trước"
            >
              <IconChevronLeft className="h-4 w-4" />
            </button>
            <div className="min-w-[180px] px-3 py-1.5 text-center sm:min-w-[220px]">
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
              className="flex h-9 w-9 items-center justify-center border-l border-outline-variant bg-surface-container-low transition hover:bg-primary-container/30 hover:text-brand-orange"
              aria-label="Tuần sau"
            >
              <IconChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onThisWeek}
            className="h-9 rounded-lg border border-outline-variant px-3 text-xs font-semibold text-on-surface transition hover:border-brand-orange/40 hover:text-brand-orange"
          >
            Tuần này
          </button>
          <button
            type="button"
            onClick={onNextWeek}
            className="h-9 rounded-lg bg-brand-orange px-3 text-xs font-bold text-white transition hover:bg-brand-orangeHover"
          >
            Tuần tới
          </button>

          <span className="mx-0.5 hidden h-5 w-px bg-outline-variant sm:block" aria-hidden />

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title="Làm mới"
            aria-label="Làm mới"
            className={[
              'group relative flex h-9 w-9 items-center justify-center rounded-full',
              'bg-primary-container/70 text-brand-orange',
              'shadow-sm ring-1 ring-brand-orange/15',
              'transition-all duration-200',
              'hover:bg-brand-orange hover:text-white hover:shadow-md hover:ring-brand-orange/30',
              'active:scale-95',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-primary-container/70 disabled:hover:text-brand-orange disabled:hover:shadow-sm',
            ].join(' ')}
          >
            <IconRefresh
              className={[
                'h-[15px] w-[15px] transition-transform duration-300',
                isLoading ? 'animate-spin' : 'group-hover:rotate-180',
              ].join(' ')}
            />
          </button>
        </div>

        <div className="grid w-full gap-2 sm:grid-cols-[1fr_120px] lg:max-w-sm">
          <label className="relative block">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Tìm tên / email nhân viên…"
              className="h-9 w-full rounded-lg border border-outline-variant bg-surface-container-low pl-9 pr-3 text-sm outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange"
            />
          </label>
          <input
            value={staffId}
            onChange={(event) => onStaffIdChange(event.target.value.replace(/[^\d]/g, ''))}
            placeholder="Mã nhân viên"
            inputMode="numeric"
            className="h-9 rounded-lg border border-outline-variant bg-surface-container-low px-3 text-sm outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange"
          />
        </div>
      </div>
    </section>
  )
}
