import type { PaymentMethod } from '@/lib/payment-service'

export const PENDING_BOOKING_KEY = 'pendingBooking'

export type PendingBooking = {
  bookingId: string
  roomId: string
  date: string
  startTime: string
  endTime: string
  duration: number
  addons: string[]
  note?: string
  method?: PaymentMethod
  discountCode?: string
  discountAmount?: number
}

export function savePendingBooking(booking: PendingBooking) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(PENDING_BOOKING_KEY, JSON.stringify(booking))
}

export function getPendingBooking(): PendingBooking | null {
  if (typeof window === 'undefined') return null

  try {
    const rawBooking = window.localStorage.getItem(PENDING_BOOKING_KEY)
    if (!rawBooking) return null

    return normalizePendingBooking(JSON.parse(rawBooking))
  } catch {
    clearPendingBooking()
    return null
  }
}

export function clearPendingBooking() {
  if (typeof window === 'undefined') return

  window.localStorage.removeItem(PENDING_BOOKING_KEY)
}

export function pendingBookingToSearchParams(booking: PendingBooking) {
  const searchParams = new URLSearchParams({
    bookingId: booking.bookingId,
    roomId: booking.roomId,
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    duration: String(booking.duration),
    addons: booking.addons.join(','),
    note: booking.note ?? '',
  })

  if (booking.method) {
    searchParams.set('method', booking.method)
  }

  if (booking.discountCode) {
    searchParams.set('discountCode', booking.discountCode)
  }

  if (booking.discountAmount !== undefined) {
    searchParams.set('discountAmount', String(booking.discountAmount))
  }

  return searchParams
}

function normalizePendingBooking(value: unknown): PendingBooking | null {
  if (!value || typeof value !== 'object') return null

  const booking = value as Partial<PendingBooking>

  if (
    typeof booking.bookingId !== 'string' ||
    typeof booking.roomId !== 'string' ||
    typeof booking.date !== 'string' ||
    typeof booking.startTime !== 'string' ||
    typeof booking.endTime !== 'string' ||
    typeof booking.duration !== 'number' ||
    !Array.isArray(booking.addons)
  ) {
    return null
  }

  return {
    bookingId: booking.bookingId,
    roomId: booking.roomId,
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    duration: booking.duration,
    addons: booking.addons.filter((addonId): addonId is string => typeof addonId === 'string'),
    note: typeof booking.note === 'string' ? booking.note : undefined,
    method: isPaymentMethod(booking.method) ? booking.method : undefined,
    discountCode: typeof booking.discountCode === 'string' ? booking.discountCode : undefined,
    discountAmount: typeof booking.discountAmount === 'number' ? booking.discountAmount : undefined,
  }
}

function isPaymentMethod(value: unknown): value is PaymentMethod {
  return value === 'bank_transfer' || value === 'e_wallet' || value === 'cash'
}
