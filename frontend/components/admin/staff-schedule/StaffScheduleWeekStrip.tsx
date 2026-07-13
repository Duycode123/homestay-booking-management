'use client'

import type { AdminShiftRegistration } from '@/lib/admin/staff-schedule/adminShiftRegistrationApi'
import { formatDayNumber, formatWeekday, isToday } from '@/lib/admin/staff-schedule/staffScheduleUtils'

type StaffScheduleWeekStripProps = {
  days: string[]
  registrationsByDate: Record<string, AdminShiftRegistration[]>
  activeDate: string | null
  onSelectDate: (date: string | null) => void
}

export default function StaffScheduleWeekStrip({
  days,
  registrationsByDate,
  activeDate,
  onSelectDate,
}: StaffScheduleWeekStripProps) {
  return (
    <section className="rounded-xl border border-outline-variant bg-white p-3 shadow-[var(--shadow-card)] sm:p-4">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <p className="font-display text-sm font-bold text-on-surface">Tuần làm việc</p>
        <div className="flex items-center gap-3 text-[11px] text-on-surface-variant">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-tertiary" /> Chờ duyệt
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-secondary" /> Đã duyệt
          </span>
          {activeDate && (
            <button
              type="button"
              onClick={() => onSelectDate(null)}
              className="font-semibold text-brand-orange hover:underline"
            >
              Bỏ lọc ngày
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-outline-variant">
        <div className="grid grid-cols-7 divide-x divide-outline-variant">
          {days.map((date) => {
            const items = registrationsByDate[date] ?? []
            const pending = items.filter((item) => item.status === 'PENDING').length
            const approved = items.filter((item) => item.status === 'APPROVED').length
            const isActive = activeDate === date
            const today = isToday(date)

            return (
              <button
                key={date}
                type="button"
                onClick={() => onSelectDate(isActive ? null : date)}
                className={[
                  'flex min-h-[88px] flex-col items-center px-1 py-2.5 text-center transition sm:px-2 sm:py-3',
                  isActive
                    ? 'bg-primary-container/45'
                    : today
                      ? 'bg-primary-container/15 hover:bg-primary-container/25'
                      : 'bg-white hover:bg-surface-container-low',
                ].join(' ')}
              >
                <span
                  className={[
                    'text-[10px] font-bold uppercase tracking-wide',
                    isActive || today ? 'text-brand-orange' : 'text-on-surface-variant',
                  ].join(' ')}
                >
                  {formatWeekday(date)}
                </span>
                <span
                  className={[
                    'mt-1 flex h-7 w-7 items-center justify-center rounded-full font-display text-sm font-bold',
                    isActive
                      ? 'bg-brand-orange text-white'
                      : today
                        ? 'bg-brand-orange/15 text-brand-orange'
                        : 'text-on-surface',
                  ].join(' ')}
                >
                  {formatDayNumber(date).split('/')[0]}
                </span>

                <div className="mt-2 flex min-h-[18px] items-center justify-center gap-1">
                  {pending > 0 && (
                    <span className="rounded bg-tertiary-container px-1.5 py-0.5 text-[10px] font-bold text-on-tertiary-container">
                      {pending}
                    </span>
                  )}
                  {approved > 0 && (
                    <span className="rounded bg-secondary-container/15 px-1.5 py-0.5 text-[10px] font-bold text-secondary">
                      {approved}
                    </span>
                  )}
                  {pending === 0 && approved === 0 && (
                    <span className="text-[10px] text-on-surface-variant/60">·</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function scrollToScheduleDay(date: string) {
  document.getElementById(`schedule-day-${date}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
