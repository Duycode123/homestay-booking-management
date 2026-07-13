'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  addDays,
  canShiftWindowBack,
  canShiftWindowForward,
  canViewNextMonth,
  clampToBookableRange,
  formatCalendarTitle,
  formatDateLong,
  formatDayNumber,
  formatWeekdayShort,
  getBookableWindowKeys,
  getCalendarMonthCells,
  getInitialWindowStart,
  getTodayKey,
  isDateSelectable,
  isToday,
  MAX_BOOKING_DAYS_AHEAD,
  parseDateKey,
} from '@/lib/booking/dateUtils'

const WEEKDAY_HEADERS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'Cn']

type BookingDatePickerProps = {
  value: string
  onChange: (dateKey: string) => void
}

export default function BookingDatePicker({ value, onChange }: BookingDatePickerProps) {
  const todayKey = getTodayKey()
  const [windowStart, setWindowStart] = useState(getInitialWindowStart)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(() => {
    const base = value ? parseDateKey(value) : parseDateKey(todayKey)
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })
  const calendarRef = useRef<HTMLDivElement>(null)

  const weekKeys = useMemo(() => getBookableWindowKeys(windowStart, 7), [windowStart])
  const monthCells = useMemo(() => getCalendarMonthCells(viewMonth), [viewMonth])

  useEffect(() => {
    if (!value) return
    const clamped = clampToBookableRange(value)
    if (clamped !== value) {
      onChange(clamped)
      return
    }
    const selected = parseDateKey(clamped)
    setWindowStart(selected)
    setViewMonth(new Date(selected.getFullYear(), selected.getMonth(), 1))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync window when value changes only
  }, [value])

  useEffect(() => {
    if (!calendarOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setCalendarOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [calendarOpen])

  const shiftWindow = (delta: number) => {
    setWindowStart((current) => addDays(current, delta * 7))
  }

  const selectDate = (key: string) => {
    if (!isDateSelectable(key)) return
    onChange(key)
    setCalendarOpen(false)
  }

  const shiftMonth = (delta: number) => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
  }

  return (
    <div className="space-y-4">
      {/* Selected date + navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant bg-gradient-to-r from-surface-container-low to-white px-4 py-3.5 shadow-sm">
        <div className="min-w-0">
          <p className="font-display text-[10px] font-medium uppercase tracking-[0.12em] text-on-surface-variant">
            Ngày đã chọn
          </p>
          <p className="font-display text-base font-semibold text-on-surface">
            {value ? formatDateLong(value) : '—'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftWindow(-1)}
            disabled={!canShiftWindowBack(windowStart)}
            aria-label="Tuần trước"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline bg-white text-on-surface-variant transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            onClick={() => setCalendarOpen((o) => !o)}
            aria-expanded={calendarOpen}
            aria-label="Mở lịch chọn ngày"
            className="flex h-9 items-center gap-2 rounded-lg border border-outline bg-white px-3 font-display text-xs font-medium text-on-surface transition-colors hover:border-brand-orange/50 hover:bg-primary-container/20"
          >
            <CalendarIcon />
            Chọn ngày
          </button>
          <button
            type="button"
            onClick={() => shiftWindow(1)}
            disabled={!canShiftWindowForward(windowStart)}
            aria-label="Tuần sau"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline bg-white text-on-surface-variant transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight />
          </button>
        </div>
      </div>

      {/* Rolling window — only bookable days from today */}
      <div className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-sm">
        <div className="flex gap-1 p-1.5">
          {weekKeys.map((key) => {
            const selected = value === key
            const today = isToday(key)

            return (
              <button
                key={key}
                type="button"
                onClick={() => selectDate(key)}
                aria-label={formatDateLong(key)}
                aria-pressed={selected}
                className={[
                  'flex min-h-[4.75rem] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl py-3 transition-all duration-200',
                  selected
                    ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/30'
                    : 'text-on-surface hover:bg-primary-container/20',
                  today && !selected ? 'ring-1 ring-brand-orange/30' : '',
                ].join(' ')}
              >
                <span
                  className={[
                    'font-display text-lg font-bold leading-none',
                    today && !selected ? 'text-brand-orange' : '',
                  ].join(' ')}
                >
                  {formatDayNumber(key)}
                </span>
                <span
                  className={[
                    'font-display text-[10px] font-medium',
                    selected ? 'text-white/90' : 'text-on-surface-variant',
                  ].join(' ')}
                >
                  {today ? 'Hôm nay' : formatWeekdayShort(key)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Month calendar popover */}
      {calendarOpen && (
        <div
          ref={calendarRef}
          className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-[var(--shadow-elevated)]"
          role="dialog"
          aria-label="Lịch chọn ngày"
        >
          {/* Header — dark bar like mockup */}
          <div className="flex items-center justify-between bg-secondary px-4 py-3">
            <p className="font-display text-sm font-semibold text-white">{formatCalendarTitle(viewMonth)}</p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                aria-label="Tháng trước"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/90 transition-colors hover:bg-white/10"
              >
                <ChevronLeft className="text-white" />
              </button>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                disabled={!canViewNextMonth(viewMonth)}
                aria-label="Tháng sau"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/90 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="text-white" />
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 gap-y-1">
              {WEEKDAY_HEADERS.map((label) => (
                <div
                  key={`cal-${label}`}
                  className="py-2 text-center font-display text-xs font-medium text-on-surface-variant"
                >
                  {label}
                </div>
              ))}
              {monthCells.map((cell) => {
                const selected = value === cell.key

                return (
                  <button
                    key={cell.key}
                    type="button"
                    disabled={!cell.selectable}
                    onClick={() => selectDate(cell.key)}
                    aria-label={formatDateLong(cell.key)}
                    aria-pressed={selected}
                    className={[
                      'mx-auto flex h-10 w-10 items-center justify-center font-display text-sm transition-colors',
                      selected
                        ? 'rounded-full bg-brand-orange font-semibold text-white'
                        : cell.selectable
                          ? 'rounded-full text-on-surface hover:bg-primary-container/30'
                          : 'cursor-not-allowed rounded-full text-on-surface-variant/35',
                      !selected && !cell.inMonth ? 'text-on-surface-variant/30' : '',
                      !selected && (cell.isPast || cell.isBeyondBookingWindow) && cell.inMonth
                        ? 'text-on-surface-variant/35'
                        : '',
                      isToday(cell.key) && !selected && cell.selectable
                        ? 'font-semibold text-brand-orange'
                        : '',
                    ].join(' ')}
                  >
                    {cell.day}
                  </button>
                )
              })}
            </div>

            <p className="mt-4 text-center text-[11px] text-on-surface-variant">
              Có thể đặt trước tối đa {MAX_BOOKING_DAYS_AHEAD} ngày
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className="h-4 w-4 text-brand-orange" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  )
}
