import { BOOKING_SLOT_TIMES } from '@/components/booking/booking-time-utils'
import type { TimeSlot } from '@/lib/booking/types'
import type { Room, RoomAvailabilityStatus } from '@/lib/public/room-filters'

export type RoomCardAvailabilityState = {
  isChecking: boolean
  isUnavailable: boolean
  canBookToday: boolean
  canBookFutureDate: boolean
  canStartBooking: boolean
  hasBookingToday: boolean
}

export function applyTodayAvailability(
  room: Room,
  todaySlots: TimeSlot[] | undefined,
  now: Date,
  tomorrowSlots?: TimeSlot[],
): Room {
  if (isRoomTemporarilyUnavailable(room)) {
    return {
      ...room,
      availabilityStatus: 'FULL_TODAY',
      remainingSlots: 0,
      isAvailable: false,
      availabilityKnown: true,
      todayAvailabilityReason: 'OPERATIONAL',
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
      todayAvailabilityReason: undefined,
      nextAvailableSlot: undefined,
      nextAvailableTime: undefined,
    }
  }

  const bookableStartSlots = getBookableStartSlotsToday(room, now, todaySlots)
  const firstStartSlot = bookableStartSlots[0]
  const nextAvailableTime = typeof firstStartSlot === 'string' ? firstStartSlot : firstStartSlot?.start
  const tomorrowBookableSlots = (tomorrowSlots ?? []).filter(isStandardCheckInSlot)
  const tomorrowStartSlot = bookableStartSlots.length === 0 ? tomorrowBookableSlots[0] : undefined
  const tomorrowStartTime = typeof tomorrowStartSlot === 'string'
    ? tomorrowStartSlot
    : tomorrowStartSlot?.start
  const remainingSlots = bookableStartSlots.length > 0
    ? bookableStartSlots.length
    : tomorrowBookableSlots.length
  const todayCheckInAvailable = todaySlots.some((slot) => {
    return slot.start === '14:00' && slot.backendAvailable === true
  })
  const availabilityStatus: RoomAvailabilityStatus = remainingSlots === 0 ? 'FULL_TODAY' : 'AVAILABLE'

  return {
    ...room,
    availabilityStatus,
    remainingSlots,
    isAvailable: remainingSlots > 0,
    availabilityKnown: true,
    todayAvailabilityReason: remainingSlots > 0
      ? bookableStartSlots.length === 0
        ? todayCheckInAvailable ? 'NEXT_DAY' : 'TODAY_BOOKED'
        : undefined
      : 'BOOKED',
    nextAvailableSlot: nextAvailableTime
      ? `Hôm nay, ${nextAvailableTime}`
      : tomorrowStartTime
        ? `Ngày mai, ${tomorrowStartTime}`
        : undefined,
    nextAvailableTime,
  }
}

export function getBookableStartSlotsToday(room: Room, now: Date, todaySlots?: TimeSlot[]) {
  if (todaySlots) {
    if (now.getHours() >= 14) return []
    return todaySlots.filter(isStandardCheckInSlot)
  }

  if (!room.isAvailable || room.availabilityStatus === 'FULL_TODAY' || (room.remainingSlots ?? 0) <= 0) {
    return []
  }

  return BOOKING_SLOT_TIMES.filter((slot) => isSlotInFuture(slot, now)).slice(0, room.remainingSlots)
}

export function isRoomTemporarilyUnavailable(room: Room) {
  return ['MAINTENANCE', 'NEED_CLEANING', 'INACTIVE', 'UNAVAILABLE', 'DISABLED', 'CLOSED'].includes(room.operationalStatus ?? '')
}

/**
 * Single source of truth for availability badges and CTAs on public room cards.
 * Both the homepage and the room catalog must use this state so a room cannot
 * be presented differently merely because tomorrow still has availability.
 */
export function getRoomCardAvailabilityState(room: Room): RoomCardAvailabilityState {
  const isUnavailable = isRoomTemporarilyUnavailable(room)
  const isChecking = !isUnavailable && !room.availabilityKnown
  const canBookFutureDate = room.todayAvailabilityReason === 'NEXT_DAY'
  const hasBookingToday = room.todayAvailabilityReason === 'TODAY_BOOKED'
  const canBookToday = !isUnavailable
    && !isChecking
    && room.todayAvailabilityReason === undefined
    && room.isAvailable
    && room.availabilityStatus !== 'FULL_TODAY'
    && (room.remainingSlots ?? 0) > 0

  return {
    isChecking,
    isUnavailable,
    canBookToday,
    canBookFutureDate,
    canStartBooking: canBookToday || canBookFutureDate,
    hasBookingToday,
  }
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

function isStandardCheckInSlot(slot: TimeSlot) {
  return slot.start === '14:00' && isAvailableSlot(slot)
}
