'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type AdminDatePickerProps = {
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  disabled?: boolean
  placeholder?: string
  allowClear?: boolean
  className?: string
  ariaLabel?: string
}

type PopoverPosition = {
  left: number
  top: number
  width: number
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const CALENDAR_HEIGHT = 390

export default function AdminDatePicker({
  value,
  onChange,
  min,
  max,
  disabled = false,
  placeholder = 'Chọn ngày',
  allowClear = true,
  className = '',
  ariaLabel = 'Chọn ngày',
}: AdminDatePickerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<PopoverPosition | null>(null)
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(value || todayKey()))
  const cells = useMemo(() => getMonthCells(viewMonth), [viewMonth])

  useEffect(() => {
    if (value) setViewMonth(startOfMonth(value))
  }, [value])

  useEffect(() => {
    if (!open) return

    const updatePosition = () => {
      const trigger = triggerRef.current
      if (!trigger) return

      const rect = trigger.getBoundingClientRect()
      const width = Math.min(340, Math.max(300, rect.width))
      const left = Math.min(
        window.innerWidth - width - 12,
        Math.max(12, rect.left),
      )
      const roomBelow = window.innerHeight - rect.bottom
      const top = roomBelow >= CALENDAR_HEIGHT + 12
        ? rect.bottom + 8
        : Math.max(12, rect.top - CALENDAR_HEIGHT - 8)

      setPosition({ left, top, width })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', closeWithEscape)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      document.removeEventListener('keydown', closeWithEscape)
    }
  }, [open])

  const toggle = () => {
    if (disabled) return
    setViewMonth(startOfMonth(value || clampDate(todayKey(), min, max)))
    setOpen((current) => !current)
  }

  const selectDate = (date: string) => {
    if (!isSelectable(date, min, max)) return
    onChange(date)
    setOpen(false)
  }

  const selectedDate = value ? parseDate(value) : null

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={toggle}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={[
          'group flex h-11 w-full items-center gap-3 rounded-xl border bg-white px-3 text-left',
          'shadow-[0_6px_18px_rgba(31,48,41,0.04)] outline-none transition-all',
          open
            ? 'border-brand-orange ring-4 ring-brand-orange/10'
            : 'border-outline hover:border-brand-orange/55 hover:shadow-[0_8px_22px_rgba(31,48,41,0.08)]',
          'disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:opacity-60',
          className,
        ].join(' ')}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-container/45 text-brand-orange transition group-hover:bg-primary-container/70">
          <CalendarIcon />
        </span>
        <span className="min-w-0 flex-1">
          {selectedDate ? (
            <span className="flex items-baseline justify-between gap-2">
              <span className="truncate font-display text-sm font-semibold text-on-surface">
                {formatDate(value)}
              </span>
              <span className="hidden truncate text-[10px] font-medium capitalize text-on-surface-variant sm:block">
                {formatWeekday(value)}
              </span>
            </span>
          ) : (
            <span className="text-sm text-on-surface-variant">{placeholder}</span>
          )}
        </span>
        <ChevronDown open={open} />
      </button>

      {open && position && createPortal(
        <div className="fixed inset-0 z-[240]" role="presentation" onMouseDown={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            className="fixed overflow-hidden rounded-[22px] border border-[#ddcfbd] bg-white shadow-[0_28px_80px_rgba(22,48,39,0.24)]"
            style={{ left: position.left, top: position.top, width: position.width }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between bg-[linear-gradient(135deg,#173a31,#285347)] px-4 py-3.5 text-white">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#e7c69f]">Lịch The Serene Villa</p>
                <p className="mt-0.5 font-display text-sm font-bold capitalize">{formatMonthYear(viewMonth)}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <MonthButton
                  label="Tháng trước"
                  direction="previous"
                  disabled={!canShowMonth(addMonths(viewMonth, -1), min, max)}
                  onClick={() => setViewMonth(addMonths(viewMonth, -1))}
                />
                <MonthButton
                  label="Tháng sau"
                  direction="next"
                  disabled={!canShowMonth(addMonths(viewMonth, 1), min, max)}
                  onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                />
              </div>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-7">
                {WEEKDAYS.map((weekday) => (
                  <span key={weekday} className="py-2 text-center text-[10px] font-bold uppercase text-on-surface-variant">
                    {weekday}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-1">
                {cells.map((cell) => {
                  const selected = value === cell.date
                  const today = cell.date === todayKey()
                  const selectable = isSelectable(cell.date, min, max)

                  return (
                    <button
                      key={cell.date}
                      type="button"
                      disabled={!selectable}
                      onClick={() => selectDate(cell.date)}
                      aria-label={formatDateLong(cell.date)}
                      aria-pressed={selected}
                      className={[
                        'mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition',
                        selected
                          ? 'bg-secondary text-white shadow-[0_7px_18px_rgba(23,58,49,0.28)]'
                          : selectable
                            ? 'text-on-surface hover:bg-primary-container/60 hover:text-brand-orange'
                            : 'cursor-not-allowed text-on-surface-variant/25',
                        !cell.inMonth && !selected ? 'opacity-40' : '',
                        today && !selected && selectable ? 'ring-1 ring-brand-orange text-brand-orange' : '',
                      ].join(' ')}
                    >
                      {cell.day}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#eee5da] bg-[#fbf8f3] px-4 py-3">
              <button
                type="button"
                disabled={!isSelectable(todayKey(), min, max)}
                onClick={() => selectDate(todayKey())}
                className="text-xs font-bold text-secondary transition hover:text-brand-orange disabled:cursor-not-allowed disabled:opacity-35"
              >
                Hôm nay
              </button>
              <div className="flex items-center gap-3">
                {allowClear && value && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange('')
                      setOpen(false)
                    }}
                    className="text-xs font-semibold text-on-surface-variant transition hover:text-error"
                  >
                    Xóa ngày
                  </button>
                )}
                <button type="button" onClick={() => setOpen(false)} className="text-xs font-bold text-brand-orange">
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

function MonthButton({
  label,
  direction,
  disabled,
  onClick,
}: {
  label: string
  direction: 'previous' | 'next'
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30"
    >
      <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d={direction === 'previous' ? 'm15 18-6-6 6-6' : 'm9 6 6 6-6 6'} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

function CalendarIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M8 3v4M16 3v4M3.5 10h17" strokeLinecap="round" />
    </svg>
  )
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={['h-4 w-4 shrink-0 text-on-surface-variant transition', open ? 'rotate-180' : ''].join(' ')} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m7 10 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function getMonthCells(monthKey: string) {
  const first = parseDate(startOfMonth(monthKey))
  const mondayOffset = (first.getDay() + 6) % 7
  const start = new Date(first)
  start.setDate(first.getDate() - mondayOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return {
      date: toDateKey(date),
      day: date.getDate(),
      inMonth: date.getMonth() === first.getMonth(),
    }
  })
}

function canShowMonth(month: string, min?: string, max?: string) {
  const first = startOfMonth(month)
  const last = endOfMonth(month)
  return (!min || last >= min) && (!max || first <= max)
}

function isSelectable(date: string, min?: string, max?: string) {
  return (!min || date >= min) && (!max || date <= max)
}

function clampDate(date: string, min?: string, max?: string) {
  if (min && date < min) return min
  if (max && date > max) return max
  return date
}

function startOfMonth(date: string) {
  const parsed = parseDate(date)
  return toDateKey(new Date(parsed.getFullYear(), parsed.getMonth(), 1))
}

function endOfMonth(date: string) {
  const parsed = parseDate(date)
  return toDateKey(new Date(parsed.getFullYear(), parsed.getMonth() + 1, 0))
}

function addMonths(date: string, amount: number) {
  const parsed = parseDate(startOfMonth(date))
  return toDateKey(new Date(parsed.getFullYear(), parsed.getMonth() + amount, 1))
}

function parseDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function todayKey() {
  return toDateKey(new Date())
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(parseDate(date))
}

function formatDateLong(date: string) {
  return new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).format(parseDate(date))
}

function formatWeekday(date: string) {
  return new Intl.DateTimeFormat('vi-VN', { weekday: 'long' }).format(parseDate(date))
}

function formatMonthYear(date: string) {
  return new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(parseDate(date))
}
