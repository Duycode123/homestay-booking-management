'use client'

import type { AdminShiftRegistration } from '@/lib/admin/staff-schedule/adminShiftRegistrationApi'
import {
  formatDayNumber,
  formatWeekday,
  isSameMonth,
  isToday,
  isWeekend,
  parseDate,
  staffInitials,
  type CalendarMode,
} from '@/lib/admin/staff-schedule/staffScheduleUtils'

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

type StaffScheduleCalendarProps = {
  mode: CalendarMode
  days: string[]
  anchorDate: Date
  registrationsByDate: Record<string, AdminShiftRegistration[]>
  selectedIds: Set<number>
  isLoading: boolean
  onOpenDay: (date: string) => void
}

export default function StaffScheduleCalendar({
  mode,
  days,
  anchorDate,
  registrationsByDate,
  selectedIds,
  isLoading,
  onOpenDay,
}: StaffScheduleCalendarProps) {
  if (isLoading) {
    return (
      <div
        className={
          mode === 'week'
            ? 'grid gap-3 md:grid-cols-7'
            : 'grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7'
        }
      >
        {Array.from({ length: mode === 'week' ? 7 : Math.min(days.length, 35) }).map((_, index) => (
          <div
            key={index}
            className="h-44 animate-pulse rounded-2xl border border-outline-variant bg-gradient-to-br from-white to-surface-container-low"
          />
        ))}
      </div>
    )
  }

  const totalRegistrations = days.reduce(
    (sum, date) => sum + (registrationsByDate[date]?.length ?? 0),
    0,
  )

  return (
    <div className="space-y-4">
      {totalRegistrations === 0 && (
        <div className="rounded-2xl border border-dashed border-outline-variant bg-white px-6 py-10 text-center shadow-[var(--shadow-card)]">
          <p className="font-display text-lg font-bold text-on-surface">Chưa có đăng ký ca trong kỳ này</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-on-surface-variant">
            Dùng nút Tuần tới hoặc mũi tên để xem kỳ khác. Nhân viên đăng ký ca sẽ hiện trên lịch — bấm vào ngày để chọn và
            lưu lịch.
          </p>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-[var(--shadow-card)]">
        <div className="grid grid-cols-7 border-b border-outline-variant bg-gradient-to-r from-brand-greenDark to-brand-greenLight text-center text-[11px] font-bold uppercase tracking-wide text-white">
          {WEEKDAY_LABELS.map((label, index) => (
            <div
              key={label}
              className={[
                'px-1 py-2.5 sm:px-2',
                index >= 5 ? 'bg-white/5' : '',
              ].join(' ')}
            >
              {label}
            </div>
          ))}
        </div>

        <div
          className={
            mode === 'week'
              ? 'grid grid-cols-1 md:grid-cols-7'
              : 'grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7'
          }
        >
          {days.map((date) => (
            <ScheduleDayCell
              key={date}
              date={date}
              compact={mode === 'month'}
              dimmed={mode === 'month' && !isSameMonth(parseDate(date), anchorDate)}
              registrations={registrationsByDate[date] ?? []}
              selectedIds={selectedIds}
              onOpen={() => onOpenDay(date)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

function ScheduleDayCell({
  date,
  compact,
  dimmed,
  registrations,
  selectedIds,
  onOpen,
}: {
  date: string
  compact: boolean
  dimmed: boolean
  registrations: AdminShiftRegistration[]
  selectedIds: Set<number>
  onOpen: () => void
}) {
  const pending = registrations.filter((item) => item.status === 'PENDING').length
  const approved = registrations.filter((item) => item.status === 'APPROVED').length
  const selected = registrations.filter((item) => selectedIds.has(item.id)).length
  const previewItems = registrations.slice(0, compact ? 2 : 3)
  const today = isToday(date)
  const weekend = isWeekend(date)

  return (
    <button
      type="button"
      onClick={onOpen}
      className={[
        'group relative min-h-36 border-b border-outline-variant p-2.5 text-left transition sm:min-h-40 sm:p-3 md:border-r',
        dimmed ? 'bg-surface-container-low/50 text-on-surface-variant' : 'bg-white text-on-surface',
        weekend && !dimmed ? 'bg-primary-container/10' : '',
        'hover:bg-primary-container/20 hover:shadow-[inset_0_0_0_1px_rgba(255,117,24,0.25)]',
        today ? 'ring-2 ring-inset ring-brand-orange/60' : '',
      ].join(' ')}
    >
      {today && (
        <span className="absolute right-2 top-2 rounded-full bg-brand-orange px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
          Hôm nay
        </span>
      )}

      <div className="flex items-start justify-between gap-1 pr-12">
        <div>
          <p className="font-display text-sm font-bold leading-none">{formatDayNumber(date)}</p>
          <p className="mt-1 text-[10px] text-on-surface-variant sm:text-xs">{formatWeekday(date)}</p>
        </div>
        {selected > 0 && (
          <span className="rounded-full bg-brand-orange px-1.5 py-0.5 text-[10px] font-bold text-white sm:px-2 sm:text-xs">
            {selected}
          </span>
        )}
      </div>

      {(pending > 0 || approved > 0) && (
        <div className="mt-2 flex flex-wrap gap-1">
          {pending > 0 && (
            <span className="rounded-md bg-tertiary-container px-1.5 py-0.5 text-[10px] font-bold text-on-tertiary-container">
              {pending} chờ
            </span>
          )}
          {approved > 0 && (
            <span className="rounded-md bg-secondary-container/15 px-1.5 py-0.5 text-[10px] font-bold text-secondary">
              {approved} lịch
            </span>
          )}
        </div>
      )}

      <div className="mt-2 space-y-1.5">
        {previewItems.length === 0 ? (
          <p className="rounded-lg border border-dashed border-outline-variant/80 px-2 py-3 text-center text-[10px] text-on-surface-variant group-hover:border-brand-orange/30 sm:text-xs">
            Trống
          </p>
        ) : (
          previewItems.map((registration) => (
            <div
              key={registration.id}
              className="flex items-center gap-2 rounded-lg border border-outline-variant/80 bg-surface-container-low/90 px-2 py-1.5 transition group-hover:border-brand-orange/20"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-greenDark to-brand-greenLight text-[9px] font-bold text-white">
                {staffInitials(registration.staffName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold text-on-surface">{registration.staffName}</p>
                <p className="text-[10px] text-on-surface-variant">
                  {registration.startTime}–{registration.endTime}
                </p>
              </div>
            </div>
          ))
        )}
        {registrations.length > previewItems.length && (
          <p className="text-center text-[10px] font-semibold text-brand-orange sm:text-xs">
            +{registrations.length - previewItems.length} nữa
          </p>
        )}
      </div>
    </button>
  )
}
