/** Maximum days ahead a customer can book. */
export const MAX_BOOKING_DAYS_AHEAD = 30

/** How many months ahead the calendar can be browsed (view only, not book). */
export const MAX_CALENDAR_VIEW_MONTHS_AHEAD = 12

const pad = (n: number) => n.toString().padStart(2, '0')

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return startOfDay(d)
}

/** ISO week: Monday as first day of week. */
export function startOfWeek(date: Date): Date {
  const d = startOfDay(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  return addDays(d, diff)
}

export function getTodayKey(): string {
  return toDateKey(startOfDay(new Date()))
}

export function getMaxBookableDate(): Date {
  return addDays(startOfDay(new Date()), MAX_BOOKING_DAYS_AHEAD)
}

export function isDateSelectable(key: string): boolean {
  const date = parseDateKey(key)
  const today = startOfDay(new Date())
  const max = getMaxBookableDate()
  return date >= today && date <= max
}

export function getWeekDayKeys(weekStart: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => toDateKey(addDays(weekStart, i)))
}

export function isDatePast(key: string): boolean {
  return parseDateKey(key) < startOfDay(new Date())
}

export function isDateBeyondBookingWindow(key: string): boolean {
  return parseDateKey(key) > getMaxBookableDate()
}

/** Consecutive bookable day keys from windowStart (clamped to today), up to count. */
export function getBookableWindowKeys(windowStart: Date, count = 7): string[] {
  const today = startOfDay(new Date())
  const max = getMaxBookableDate()
  let cursor = startOfDay(windowStart)
  if (cursor < today) cursor = today

  const keys: string[] = []
  while (keys.length < count && cursor <= max) {
    keys.push(toDateKey(cursor))
    cursor = addDays(cursor, 1)
  }
  return keys
}

export function getInitialWindowStart(): Date {
  return startOfDay(new Date())
}

export function canShiftWindowBack(windowStart: Date): boolean {
  return startOfDay(windowStart) > startOfDay(new Date())
}

export function canShiftWindowForward(windowStart: Date): boolean {
  const nextStart = addDays(startOfDay(windowStart), 7)
  return isDateSelectable(toDateKey(nextStart))
}

export function canViewPreviousMonth(viewMonth: Date): boolean {
  const today = startOfDay(new Date())
  const monthStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1)
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  return monthStart > currentMonthStart
}

export function canViewNextMonth(viewMonth: Date): boolean {
  const today = startOfDay(new Date())
  const maxViewMonth = new Date(
    today.getFullYear(),
    today.getMonth() + MAX_CALENDAR_VIEW_MONTHS_AHEAD,
    1,
  )
  const nextMonthStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1)
  return nextMonthStart <= maxViewMonth
}

export function clampToBookableRange(key: string): string {
  if (isDateSelectable(key)) return key
  return getTodayKey()
}

export function formatDateLong(key: string): string {
  return parseDateKey(key).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
}

/** Calendar header label, e.g. "Tháng 6-2026". */
export function formatCalendarTitle(date: Date): string {
  return `Tháng ${date.getMonth() + 1}-${date.getFullYear()}`
}

export function formatWeekdayShort(key: string): string {
  return parseDateKey(key).toLocaleDateString('vi-VN', { weekday: 'short' })
}

export function formatDayNumber(key: string): string {
  return parseDateKey(key).toLocaleDateString('vi-VN', { day: '2-digit' })
}

export function isToday(key: string): boolean {
  return key === getTodayKey()
}

export type CalendarCell = {
  key: string
  day: number
  inMonth: boolean
  selectable: boolean
  isPast: boolean
  isBeyondBookingWindow: boolean
}

const CALENDAR_ROWS = 5
const CALENDAR_COLS = 7

export function getCalendarMonthCells(viewMonth: Date): CalendarCell[] {
  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const start = startOfWeek(firstOfMonth)
  const cells: CalendarCell[] = []
  const totalCells = CALENDAR_ROWS * CALENDAR_COLS

  for (let i = 0; i < totalCells; i++) {
    const date = addDays(start, i)
    const key = toDateKey(date)
    const past = isDatePast(key)
    const beyond = isDateBeyondBookingWindow(key)
    cells.push({
      key,
      day: date.getDate(),
      inMonth: date.getMonth() === month,
      selectable: isDateSelectable(key),
      isPast: past,
      isBeyondBookingWindow: beyond,
    })
  }

  return cells
}
