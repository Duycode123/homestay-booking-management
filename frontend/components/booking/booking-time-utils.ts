export const OPEN_HOUR = 8
export const CLOSE_HOUR = 24

export const BOOKING_SLOT_TIMES = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, index) => {
  return `${String(OPEN_HOUR + index).padStart(2, '0')}:00`
})

export type BookingScheduleValue = {
  date: string
  startTime: string
  endTime: string
  duration: number
  selectedSlots: string[]
}

export function padTimeUnit(value: number) {
  return String(value).padStart(2, '0')
}

export function toDateKey(date: Date) {
  return `${date.getFullYear()}-${padTimeUnit(date.getMonth() + 1)}-${padTimeUnit(date.getDate())}`
}

export function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

export function getTodayKey() {
  return toDateKey(new Date())
}

export function addDays(dateKey: string, days: number) {
  const date = parseDateKey(dateKey)
  date.setDate(date.getDate() + days)
  return toDateKey(date)
}

export function startOfWeek(dateKey: string) {
  const date = parseDateKey(dateKey)
  const day = date.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + mondayOffset)
  return toDateKey(date)
}

export function getWeekDateKeys(anchorDate: string) {
  const weekStart = startOfWeek(anchorDate)
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
}

export function getFutureDateKeys(anchorDate: string, todayKey = getTodayKey(), days = 14) {
  const startDate = isDateBefore(anchorDate, todayKey) ? todayKey : anchorDate
  return Array.from({ length: days }, (_, index) => addDays(startDate, index))
}

export function isDateBefore(dateKey: string, compareDateKey: string) {
  return parseDateKey(dateKey).getTime() < parseDateKey(compareDateKey).getTime()
}

export function isToday(dateKey: string) {
  return dateKey === getTodayKey()
}

export function timeToMinutes(time: string) {
  const [hourValue, minuteValue] = time.split(':').map(Number)
  const hour = Number.isFinite(hourValue) ? hourValue : 0
  const minute = Number.isFinite(minuteValue) ? minuteValue : 0
  return hour * 60 + minute
}

export function minutesToTime(minutes: number) {
  const normalized = Math.max(0, minutes)
  const hour = Math.floor(normalized / 60)
  const minute = normalized % 60
  return `${padTimeUnit(hour)}:${padTimeUnit(minute)}`
}

export function getSlotEndTime(slotStart: string) {
  return minutesToTime(timeToMinutes(slotStart) + 60)
}

export function isPastSlot(dateKey: string, slotStart: string, now = new Date()) {
  if (dateKey !== toDateKey(now)) return false

  return timeToMinutes(slotStart) <= now.getHours() * 60 + now.getMinutes()
}

export function calculateScheduleValue(date: string, selectedSlots: string[]): BookingScheduleValue {
  const sortedSlots = sortSlots(selectedSlots)

  if (sortedSlots.length === 0) {
    return {
      date,
      startTime: '',
      endTime: '',
      duration: 0,
      selectedSlots: [],
    }
  }

  const startTime = sortedSlots[0]
  const endTime = getSlotEndTime(sortedSlots[sortedSlots.length - 1])

  return {
    date,
    startTime,
    endTime,
    duration: sortedSlots.length,
    selectedSlots: sortedSlots,
  }
}

export function sortSlots(slots: string[]) {
  return [...slots].sort((a, b) => timeToMinutes(a) - timeToMinutes(b))
}

export function areSlotsContiguous(slots: string[]) {
  const sortedSlots = sortSlots(slots)
  return sortedSlots.every((slot, index) => {
    if (index === 0) return true
    return timeToMinutes(slot) - timeToMinutes(sortedSlots[index - 1]) === 60
  })
}

export function getSlotsInRange(firstSlot: string, secondSlot: string) {
  const startMinutes = Math.min(timeToMinutes(firstSlot), timeToMinutes(secondSlot))
  const endMinutes = Math.max(timeToMinutes(firstSlot), timeToMinutes(secondSlot))

  return BOOKING_SLOT_TIMES.filter((slot) => {
    const slotMinutes = timeToMinutes(slot)
    return slotMinutes >= startMinutes && slotMinutes <= endMinutes
  })
}

export function formatWeekday(dateKey: string) {
  const weekday = parseDateKey(dateKey).getDay()
  if (weekday === 0) return 'CN'
  return `T${weekday + 1}`
}

export function formatDayOfMonth(dateKey: string) {
  return String(parseDateKey(dateKey).getDate()).padStart(2, '0')
}

export function formatDateInputValue(value: string | null | undefined) {
  if (!value) return getTodayKey()
  return Number.isNaN(parseDateKey(value).getTime()) ? getTodayKey() : value
}
