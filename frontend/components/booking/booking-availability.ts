import { fetchAvailableSlots } from '@/lib/booking/bookingApi'
import { getSlotEndTime, timeToMinutes } from '@/components/booking/booking-time-utils'

export type ExistingBooking = {
  id: string
  roomId: string
  date: string
  startTime: string
  endTime: string
  status: 'PENDING' | 'CONFIRMED' | 'PAID' | 'CANCELLED'
}

const blockingStatuses = new Set<ExistingBooking['status']>(['PENDING', 'CONFIRMED', 'PAID'])

export async function getRoomAvailability(roomId: string, date: string): Promise<ExistingBooking[]> {
  const slots = await fetchAvailableSlots(roomId, date)

  return slots
    .filter((slot) => slot.status === 'booked')
    .map((slot) => ({
      id: `${roomId}-${date}-${slot.start}`,
      roomId,
      date,
      startTime: slot.start,
      endTime: slot.end,
      status: 'CONFIRMED' as const,
    }))
}

export function isBlockingBooking(booking: ExistingBooking) {
  return blockingStatuses.has(booking.status)
}

export function isSlotBooked(slotStart: string, bookings: ExistingBooking[]) {
  const slotEnd = getSlotEndTime(slotStart)
  const slotStartMinutes = timeToMinutes(slotStart)
  const slotEndMinutes = timeToMinutes(slotEnd)

  return bookings.some((booking) => {
    if (!isBlockingBooking(booking)) return false

    const bookingStart = timeToMinutes(booking.startTime)
    const bookingEnd = timeToMinutes(booking.endTime)
    return slotStartMinutes < bookingEnd && slotEndMinutes > bookingStart
  })
}
