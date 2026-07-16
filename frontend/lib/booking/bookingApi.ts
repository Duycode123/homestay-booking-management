import api from '@/lib/api'
import type { HomestayRoom, SlotStatus, TimeSlot } from './types'

const OPEN_HOUR = 8
const CLOSE_HOUR = 24

type RoomStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE'
type BookingPaymentMethod = 'CASH' | 'ONLINE'

type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

type RoomTypeResponse = {
  id: number
  typeName: string
  description?: string | null
  pricePerHour?: number | string | null
  capacity?: number | null
}

type RoomResponse = {
  id: number
  roomName: string
  roomType?: RoomTypeResponse | null
  floor?: number | null
  maxPeople?: number | null
  bedroomCount?: number | null
  bedCount?: number | null
  status?: RoomStatus | null
  description?: string | null
  imageUrl?: string | null
}

type AvailabilityRangeResponse = {
  startTime: string
  endTime: string
}

type RoomAvailabilityResponse = {
  roomId: number
  roomName: string
  from: string
  to: string
  operational: boolean
  availableSlots: AvailabilityRangeResponse[]
  blockType?: 'PAYMENT_HOLD' | 'BOOKED' | null
  holdExpiresAt?: string | null
  holdRemainingSeconds?: number | null
}

export type BookingResponse = {
  bookingId: number
  bookingCode: string
  roomId: number
  roomName: string
  typeName?: string | null
  startTime: string
  endTime: string
  totalHours: number | string
  pricePerHour: number | string
  totalAmount: number | string
  status: string
  paymentMethod?: BookingPaymentMethod | null
  note?: string | null
  equipmentNotes?: string | null
  canReview?: boolean | null
  alreadyReviewed?: boolean | null
}

type CreateBookingRequest = {
  roomId: number
  startTime: string
  endTime: string
  paymentMethod: BookingPaymentMethod
  couponCode?: string
  note?: string
}

export type CreateBookingPayload = {
  roomId: string | number
  date: string
  endDate?: string
  startTime: string
  endTime: string
  paymentMethod: BookingPaymentMethod
  couponCode?: string
  note?: string
}

function pad(value: number) {
  return value.toString().padStart(2, '0')
}

function parseAmount(value?: number | string | null) {
  const normalizedValue = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(normalizedValue) ? Number(normalizedValue) : 0
}

function parseCapacity(room: RoomResponse) {
  const directCapacity = room.maxPeople
  if (typeof directCapacity === 'number' && Number.isFinite(directCapacity) && directCapacity > 0) {
    return directCapacity
  }

  const roomTypeCapacity = room.roomType?.capacity
  if (typeof roomTypeCapacity === 'number' && Number.isFinite(roomTypeCapacity) && roomTypeCapacity > 0) {
    return roomTypeCapacity
  }

  return 4
}

function getRoomLocation(room: RoomResponse) {
  if (typeof room.floor === 'number' && Number.isFinite(room.floor)) {
    return `Tầng ${room.floor}`
  }

  return undefined
}

function buildRoomTags(room: RoomResponse): string[] {
  const tags = [
    room.roomType?.typeName?.trim(),
    getRoomLocation(room),
    room.status === 'AVAILABLE'
      ? 'Sẵn sàng'
      : room.status === 'IN_USE'
        ? 'Đang có lịch'
        : room.status === 'MAINTENANCE'
          ? 'Bảo trì'
          : undefined,
  ].filter((value): value is string => Boolean(value))

  return tags.length > 0 ? tags : ['Phòng Standard']
}

function mapRoomToHomestayRoom(room: RoomResponse): HomestayRoom {
  const pricePerHour = parseAmount(room.roomType?.pricePerHour)
  const roomTypeName = room.roomType?.typeName?.trim() || 'Standard'

  return {
    id: String(room.id),
    name: room.roomName,
    capacity: parseCapacity(room),
    bedroomCount: room.bedroomCount ?? 1,
    bedCount: room.bedCount ?? 1,
    pricePerHour,
    equipment: buildRoomTags(room),
    isVip: /vip|premium/i.test(roomTypeName),
    roomTypeId: room.roomType?.id,
    roomTypeName,
    roomTypeDescription: room.roomType?.description?.trim() || undefined,
    location: getRoomLocation(room),
    description: room.description?.trim() || room.roomType?.description?.trim() || undefined,
    imageUrl: room.imageUrl?.trim() || undefined,
    status: room.status ?? undefined,
  }
}

function parseLocalDateTime(value: string) {
  return new Date(value)
}

function formatTimeFromIso(value: string) {
  const date = parseLocalDateTime(value)
  if (Number.isNaN(date.getTime())) return ''

  const hour = date.getHours()
  const minute = date.getMinutes()
  return `${pad(hour)}:${pad(minute)}`
}

function toDateWithTime(date: string, time: string) {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number)
  const [hour = 0, minute = 0] = time.split(':').map(Number)
  const dateTime = new Date(year, month - 1, day, hour, minute, 0, 0)

  if (time === '24:00') {
    dateTime.setDate(dateTime.getDate() + 1)
    dateTime.setHours(0, 0, 0, 0)
  }

  return dateTime
}

function toBackendIso(date: string, time: string) {
  const dateTime = toDateWithTime(date, time)
  return `${dateTime.getFullYear()}-${pad(dateTime.getMonth() + 1)}-${pad(dateTime.getDate())}T${pad(dateTime.getHours())}:${pad(dateTime.getMinutes())}:00`
}

function buildHourSlots(date: string): Omit<TimeSlot, 'status'>[] {
  const slots: Omit<TimeSlot, 'status'>[] = []

  for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour++) {
    const start = `${pad(hour)}:00`
    const end = hour + 1 === CLOSE_HOUR ? '24:00' : `${pad(hour + 1)}:00`

    slots.push({
      id: `${date}-${start}`,
      start,
      end,
      label: `${start} - ${end}`,
    })
  }

  return slots
}

function isSlotCoveredByRange(date: string, slot: Omit<TimeSlot, 'status'>, range: AvailabilityRangeResponse) {
  const slotStart = toDateWithTime(date, slot.start).getTime()
  const slotEnd = toDateWithTime(date, slot.end).getTime()
  const rangeStart = parseLocalDateTime(range.startTime).getTime()
  const rangeEnd = parseLocalDateTime(range.endTime).getTime()

  if (!Number.isFinite(rangeStart) || !Number.isFinite(rangeEnd)) {
    return false
  }

  return slotStart >= rangeStart && slotEnd <= rangeEnd
}

function resolveSlotStatus(
  date: string,
  slot: Omit<TimeSlot, 'status'>,
  availableRanges: AvailabilityRangeResponse[],
  operational: boolean,
  now: Date,
): SlotStatus {
  const slotStart = toDateWithTime(date, slot.start)

  if (slotStart.getTime() <= now.getTime()) {
    return 'past'
  }

  if (!operational) {
    return 'booked'
  }

  return availableRanges.some((range) => isSlotCoveredByRange(date, slot, range)) ? 'available' : 'booked'
}

export async function fetchRooms(): Promise<HomestayRoom[]> {
  const response = await api.get<ApiResponse<RoomResponse[]>>('/api/rooms')
  const rooms = response.data.data ?? []

  return rooms
    .filter((room) => room.status !== 'MAINTENANCE')
    .map(mapRoomToHomestayRoom)
}

export async function fetchAvailableSlots(roomId: string, date: string): Promise<TimeSlot[]> {
  const response = await api.get<ApiResponse<RoomAvailabilityResponse>>(`/api/rooms/${roomId}/available-slots`, {
    params: {
      from: toBackendIso(date, '08:00'),
      to: toBackendIso(date, '24:00'),
    },
  })

  const availability = response.data.data
  const baseSlots = buildHourSlots(date)
  const now = new Date()
  const availableRanges = availability?.availableSlots ?? []
  const operational = availability?.operational ?? true

  return baseSlots.map((slot) => ({
    ...slot,
    status: resolveSlotStatus(date, slot, availableRanges, operational, now),
    backendAvailable: operational && availableRanges.some((range) => isSlotCoveredByRange(date, slot, range)),
    blockType: availability?.blockType ?? undefined,
    holdExpiresAt: availability?.holdExpiresAt ?? undefined,
    holdRemainingSeconds: availability?.holdRemainingSeconds ?? undefined,
  }))
}

export async function checkRoomAvailabilityRange(
  roomId: string,
  startDate: string,
  endDate: string,
  startTime = '14:00',
  endTime = '12:00',
) {
  const requestedStart = toBackendIso(startDate, startTime)
  const requestedEnd = toBackendIso(endDate, endTime)
  const response = await api.get<ApiResponse<RoomAvailabilityResponse>>(`/api/rooms/${roomId}/available-slots`, {
    params: { from: requestedStart, to: requestedEnd },
  })
  const availability = response.data.data
  const requestedStartMs = parseLocalDateTime(requestedStart).getTime()
  const requestedEndMs = parseLocalDateTime(requestedEnd).getTime()
  const fullyAvailable = Boolean(availability?.operational) && (availability?.availableSlots ?? []).some((range) => {
    const rangeStart = parseLocalDateTime(range.startTime).getTime()
    const rangeEnd = parseLocalDateTime(range.endTime).getTime()
    return rangeStart <= requestedStartMs && rangeEnd >= requestedEndMs
  })

  return { available: fullyAvailable, operational: availability?.operational ?? false }
}

export async function createBooking(payload: CreateBookingPayload): Promise<BookingResponse> {
  const roomId = Number(payload.roomId)
  if (!Number.isInteger(roomId) || roomId <= 0) {
    throw new Error('Khong tim thay ma phong hop le de tao booking. Vui long chon lai phong.')
  }

  const request: CreateBookingRequest = {
    roomId,
    startTime: toBackendIso(payload.date, payload.startTime),
    endTime: toBackendIso(payload.endDate ?? payload.date, payload.endTime),
    paymentMethod: payload.paymentMethod,
    couponCode: payload.couponCode?.trim() || undefined,
    note: payload.note?.trim() || undefined,
  }

  const response = await api.post<ApiResponse<BookingResponse>>('/api/bookings', request)
  return response.data.data
}

export function formatPrice(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

export function mapPaymentMethodToBackend(_method: 'bank_transfer'): BookingPaymentMethod {
  return 'ONLINE'
}

export function getTimeLabelFromIso(value: string) {
  return formatTimeFromIso(value)
}
