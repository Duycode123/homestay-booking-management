import type { BookingHistoryItem, CustomerBookingStatus } from '@/lib/customer-booking-service'

export type BookingHistoryFilterState = {
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  status: CustomerBookingStatus | 'ALL'
}

export const defaultBookingHistoryFilters: BookingHistoryFilterState = {
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  status: 'ALL',
}

function toDateKey(date: Date) {
  const pad = (value: number) => value.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function parseBookingDateKey(date: string) {
  const [day, month, year] = date.split('/').map(Number)
  if (!day || !month || !year) return ''

  const pad = (value: number) => value.toString().padStart(2, '0')
  return `${year}-${pad(month)}-${pad(day)}`
}

function timeToMinutes(time: string) {
  const [hour, minute] = time.split(':').map(Number)
  if (Number.isNaN(hour) || Number.isNaN(minute)) return 0

  return hour * 60 + minute
}

export function applyBookingDatePreset(days: number): Pick<BookingHistoryFilterState, 'startDate' | 'endDate'> {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - (days - 1))

  return {
    startDate: toDateKey(start),
    endDate: toDateKey(end),
  }
}

export function hasActiveBookingHistoryFilters(filters: BookingHistoryFilterState) {
  return Boolean(
    filters.startDate ||
      filters.endDate ||
      filters.startTime ||
      filters.endTime ||
      filters.status !== 'ALL',
  )
}

export function filterBookingHistory(
  bookings: BookingHistoryItem[],
  filters: BookingHistoryFilterState,
): BookingHistoryItem[] {
  return bookings.filter((booking) => {
    const bookingDateKey = parseBookingDateKey(booking.date)

    if (filters.startDate && bookingDateKey && bookingDateKey < filters.startDate) {
      return false
    }

    if (filters.endDate && bookingDateKey && bookingDateKey > filters.endDate) {
      return false
    }

    if (filters.startTime && timeToMinutes(booking.startTime) < timeToMinutes(filters.startTime)) {
      return false
    }

    if (filters.endTime && timeToMinutes(booking.startTime) > timeToMinutes(filters.endTime)) {
      return false
    }

    if (filters.status !== 'ALL' && booking.status !== filters.status) {
      return false
    }

    return true
  })
}
