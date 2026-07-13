import type { AdminShiftRegistration } from '@/lib/admin/staff-schedule/adminShiftRegistrationApi'

export type CalendarMode = 'week' | 'month'

export function getThisWeekRange() {
  const monday = startOfWeek(new Date())
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { fromDate: toDateKey(monday), toDate: toDateKey(sunday) }
}

export function getNextWeekRange() {
  const today = new Date()
  const monday = startOfWeek(today)
  monday.setDate(monday.getDate() + 7)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { fromDate: toDateKey(monday), toDate: toDateKey(sunday) }
}

export function groupRegistrationsByDate(registrations: AdminShiftRegistration[]) {
  return registrations.reduce<Record<string, AdminShiftRegistration[]>>((acc, registration) => {
    acc[registration.workDate] = [...(acc[registration.workDate] ?? []), registration]
    return acc
  }, {})
}

export function getVisibleRange(anchorDate: Date, mode: CalendarMode) {
  if (mode === 'week') {
    const start = startOfWeek(anchorDate)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return { fromDate: toDateKey(start), toDate: toDateKey(end) }
  }

  const monthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1)
  const monthEnd = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0)
  return { fromDate: toDateKey(monthStart), toDate: toDateKey(monthEnd) }
}

export function getVisibleDays(anchorDate: Date, mode: CalendarMode) {
  if (mode === 'week') {
    const start = startOfWeek(anchorDate)
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      return toDateKey(date)
    })
  }

  const firstOfMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1)
  const gridStart = startOfWeek(firstOfMonth)
  const lastOfMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0)
  const gridEnd = startOfWeek(lastOfMonth)
  gridEnd.setDate(gridEnd.getDate() + 6)

  const days: string[] = []
  const cursor = new Date(gridStart)
  while (cursor <= gridEnd) {
    days.push(toDateKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

export function startOfWeek(date: Date) {
  const result = new Date(date)
  const day = result.getDay()
  const diff = day === 0 ? -6 : 1 - day
  result.setDate(result.getDate() + diff)
  result.setHours(0, 0, 0, 0)
  return result
}

export function isSameMonth(firstDate: Date, secondDate: Date) {
  return firstDate.getFullYear() === secondDate.getFullYear() && firstDate.getMonth() === secondDate.getMonth()
}

export function isToday(dateKey: string) {
  return dateKey === toDateKey(new Date())
}

export function isWeekend(dateKey: string) {
  const day = parseDate(dateKey).getDay()
  return day === 0 || day === 6
}

export function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

export function formatRangeLabel(fromDate: string, toDate: string, mode: CalendarMode) {
  if (mode === 'month') {
    return new Intl.DateTimeFormat('vi-VN', {
      month: 'long',
      year: 'numeric',
    }).format(parseDate(fromDate))
  }

  return `${formatShortDate(fromDate)} – ${formatShortDate(toDate)}`
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parseDate(value))
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parseDate(value))
}

export function formatDayNumber(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  }).format(parseDate(value))
}

export function formatWeekday(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
  }).format(parseDate(value))
}

export function staffInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export type ShiftFrame = {
  id: 'morning' | 'afternoon' | 'evening' | 'other'
  name: string
  startTime: string
  endTime: string
}

/** Khung giờ chuẩn — khớp lịch đăng ký phía staff */
export const SHIFT_FRAMES: ShiftFrame[] = [
  { id: 'morning', name: 'Ca sáng', startTime: '08:00', endTime: '12:00' },
  { id: 'afternoon', name: 'Ca chiều', startTime: '13:30', endTime: '17:30' },
  { id: 'evening', name: 'Ca tối', startTime: '18:00', endTime: '22:00' },
]

export function matchShiftFrame(startTime: string, endTime: string): ShiftFrame {
  const start = normalizeTime(startTime)
  const end = normalizeTime(endTime)
  const exact = SHIFT_FRAMES.find((frame) => frame.startTime === start && frame.endTime === end)
  if (exact) return exact
  return { id: 'other', name: 'Khung khác', startTime: start, endTime: end }
}

export function normalizeTime(value: string) {
  if (!value) return '00:00'
  const [hours = '00', minutes = '00'] = value.split(':')
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
}

export function getSlotKey(workDate: string, startTime: string, endTime: string) {
  return `${workDate}|${normalizeTime(startTime)}|${normalizeTime(endTime)}`
}
