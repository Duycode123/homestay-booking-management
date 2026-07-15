import {
  MINIMUM_BOOKING_HOURS,
} from '@/components/booking/booking-data'
import { BOOKING_SLOT_TIMES, timeToMinutes } from '@/components/booking/booking-time-utils'
import type { TimeSlot } from '@/lib/booking/types'
import type { Room, RoomAvailabilityStatus } from '@/lib/public/room-filters'

export function applyTodayAvailability(room: Room, todaySlots: TimeSlot[] | undefined, now: Date): Room {
  if (isRoomTemporarilyUnavailable(room)) {
    return {
      ...room,
      availabilityStatus: 'FULL_TODAY',
      remainingSlots: 0,
      isAvailable: false,
      availabilityKnown: true,
      nextAvailableSlot: undefined,
      nextAvailableTime: undefined,
    }
  }

  if (todaySlots === undefined) {
    return {
      ...room,
      availabilityStatus: undefined,
      remainingSlots: undefined,
      isAvailable: false,
      availabilityKnown: false,
      nextAvailableSlot: undefined,
      nextAvailableTime: undefined,
    }
  }

  const bookableStartSlots = getBookableStartSlotsToday(room, now, todaySlots)
  const firstStartSlot = bookableStartSlots[0]
  const nextAvailableTime = typeof firstStartSlot === 'string' ? firstStartSlot : firstStartSlot?.start
  const remainingSlots = bookableStartSlots.length
  const availabilityStatus: RoomAvailabilityStatus = remainingSlots === 0
    ? 'FULL_TODAY'
    : remainingSlots <= 2
      ? 'ALMOST_FULL'
      : 'AVAILABLE'

  return {
    ...room,
    availabilityStatus,
    remainingSlots,
    isAvailable: remainingSlots > 0,
    availabilityKnown: true,
    nextAvailableSlot: nextAvailableTime ? `Hôm nay, ${nextAvailableTime}` : undefined,
    nextAvailableTime,
  }
}

export function getBookableStartSlotsToday(room: Room, now: Date, todaySlots?: TimeSlot[]) {
  if (todaySlots) {
    return todaySlots.filter((slot, startIndex) => {
      if (!isAvailableSlot(slot) || !isSlotInFuture(slot.start, now)) return false

      const bookingWindow = todaySlots.slice(startIndex, startIndex + MINIMUM_BOOKING_HOURS)
      if (bookingWindow.length < MINIMUM_BOOKING_HOURS) return false

      return bookingWindow.every((windowSlot, index) => {
        return isAvailableSlot(windowSlot)
          && timeToMinutes(windowSlot.start) === timeToMinutes(slot.start) + index * 60
      })
    })
  }

  if (!room.isAvailable || room.availabilityStatus === 'FULL_TODAY' || (room.remainingSlots ?? 0) <= 0) {
    return []
  }

  return BOOKING_SLOT_TIMES.filter((slot) => isSlotInFuture(slot, now)).slice(0, room.remainingSlots)
}

export function isRoomTemporarilyUnavailable(room: Room) {
  return ['MAINTENANCE', 'NEED_CLEANING', 'INACTIVE', 'UNAVAILABLE', 'DISABLED', 'CLOSED'].includes(room.operationalStatus ?? '')
}

export function isSlotInFuture(slot: string | undefined, now: Date) {
  if (!slot) return false

  const [hourValue, minuteValue] = slot.split(':').map(Number)
  if (!Number.isFinite(hourValue) || !Number.isFinite(minuteValue)) return false

  const slotDate = new Date(now)
  slotDate.setHours(hourValue, minuteValue, 0, 0)

  if (slot === '24:00') {
    slotDate.setDate(slotDate.getDate() + 1)
    slotDate.setHours(0, 0, 0, 0)
  }

  return slotDate.getTime() > now.getTime()
}

function isAvailableSlot(slot: TimeSlot) {
  return slot.status === 'available' && (slot as TimeSlot & { canSelect?: boolean }).canSelect !== false
}
