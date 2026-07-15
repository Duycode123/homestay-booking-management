import type { HomestayRoom } from '@/lib/booking/types'

export type RoomCategory = 'standard' | 'deluxe' | 'family'
export type RoomAvailabilityStatus = 'AVAILABLE' | 'ALMOST_FULL' | 'FULL_TODAY'
export type TodayAvailabilityReason = 'BOOKED' | 'NEXT_DAY' | 'OPERATIONAL'
export type RoomOperationalStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'NEED_CLEANING' | 'INACTIVE' | 'UNAVAILABLE' | 'DISABLED' | 'CLOSED'

export type RoomCategoryOption = {
  id: RoomCategory
  label: string
  description: string
}

export type BookingRoom = {
  id: string
  code: string
  name: string
  category: RoomCategory
  roomTierId?: number
  roomTierName?: string
  roomTierDescription?: string
  categoryLabel: string
  type: string
  badge?: string
  rating?: number
  reviews?: number
  capacity: string
  location: string
  image?: string
  images?: string[]
  imageClassName: string
  pricePerHour: number
  equipments: string[]
  includedEquipments: string[]
  addons: string[]
  description?: string
  availabilityStatus?: RoomAvailabilityStatus
  todayAvailabilityReason?: TodayAvailabilityReason
  remainingSlots?: number
  nextAvailableSlot?: string
  isAvailable: boolean
  availabilityKnown?: boolean
  nextAvailableTime?: string
  operationalStatus?: RoomOperationalStatus
  note?: string
}

export type BookingRoomReviewSummary = {
  averageRating: number
  reviewCount: number
}

export type BookingRoomAvailabilitySummary = {
  isAvailable: boolean
  nextAvailableTime?: string
}

export function getTodayDateString() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const DEFAULT_BOOKING_DATE = getTodayDateString()
export const DEFAULT_START_TIME = ''
export const DEFAULT_DURATION = 0
export const FIRST_NIGHT_STAY_HOURS = 22
export const EMPTY_NOTE_TEXT = 'Không có ghi chú thêm.'

export const roomCategories: RoomCategoryOption[] = [
  {
    id: 'standard',
    label: 'Standard',
    description: 'Phòng tiện nghi cơ bản, phù hợp cho 1-2 khách.',
  },
  {
    id: 'deluxe',
    label: 'Deluxe',
    description: 'Phòng rộng rãi, có ban công và tiện nghi nâng cấp.',
  },
  {
    id: 'family',
    label: 'Family',
    description: 'Phòng gia đình có không gian sinh hoạt và sức chứa lớn.',
  },
]

const roomCategoryLabels: Record<RoomCategory, string> = {
  standard: 'Standard',
  deluxe: 'Deluxe',
  family: 'Family',
}

export function detectRoomCategory(typeName?: string | null): RoomCategory {
  const normalized = typeName?.trim().toLowerCase() || ''

  if (normalized.includes('family')) return 'family'
  if (normalized.includes('deluxe')) return 'deluxe'
  return 'standard'
}

export function isApiBackedBookingRoom(room: BookingRoom) {
  return room.code.startsWith('API-')
}

function getRoomImage(imageUrl?: string) {
  if (!imageUrl) return undefined

  const normalized = imageUrl.trim()
  if (!normalized) return undefined
  if (normalized.startsWith('/')) return normalized
  if (/^https?:\/\//i.test(normalized)) return normalized

  return undefined
}

export function mapPracticeRoomToBookingRoom(
  room: HomestayRoom,
  options: {
    reviewSummary?: BookingRoomReviewSummary
    availabilitySummary?: BookingRoomAvailabilitySummary
  } = {},
): BookingRoom {
  const category = detectRoomCategory(room.roomTypeName)
  const roomTierName = room.roomTypeName?.trim() || roomCategoryLabels[category]
  const roomTierDescription = room.roomTypeDescription?.trim() || undefined
  const safeImage = getRoomImage(room.imageUrl)
  const fallbackEquipments = room.equipment.length > 0 ? room.equipment : [room.roomTypeName || 'Tiện nghi cơ bản']
  const description = room.description?.trim() || roomTierDescription
  const availabilitySummary = options.availabilitySummary
  const reviewSummary = options.reviewSummary
  const availabilityStatus = !availabilitySummary
    ? undefined
    : availabilitySummary.isAvailable
      ? 'AVAILABLE'
      : 'FULL_TODAY'
  const nextAvailableSlot = availabilitySummary?.nextAvailableTime
    ? `Hôm nay, ${availabilitySummary.nextAvailableTime}`
    : undefined
  const remainingSlots = availabilitySummary?.isAvailable ? 3 : 0

  return {
    id: room.id,
    code: `API-${room.id}`,
    name: room.name,
    category,
    roomTierId: room.roomTypeId,
    roomTierName,
    roomTierDescription,
    categoryLabel: roomTierName,
    type: roomTierName,
    badge: availabilitySummary ? (availabilitySummary.isAvailable ? 'Có lịch trống' : 'Kín lịch') : undefined,
    rating: reviewSummary?.averageRating,
    reviews: reviewSummary?.reviewCount,
    capacity: `Tối đa ${room.capacity} người`,
    location: room.location || 'The Serene Villa',
    image: safeImage,
    imageClassName: 'object-[62%_center]',
    pricePerHour: room.pricePerHour,
    equipments: fallbackEquipments,
    includedEquipments: fallbackEquipments,
    addons: [],
    description,
    availabilityStatus,
    remainingSlots,
    nextAvailableSlot,
    isAvailable: availabilitySummary?.isAvailable ?? false,
    availabilityKnown: Boolean(availabilitySummary),
    nextAvailableTime: availabilitySummary?.nextAvailableTime,
    operationalStatus: room.status,
    note: undefined,
  }
}

export const EMPTY_BOOKING_ROOM: BookingRoom = {
  id: '',
  code: '',
  name: 'Đang tải thông tin phòng',
  category: 'standard',
  categoryLabel: '',
  type: '',
  capacity: '',
  location: '',
  imageClassName: 'object-center',
  pricePerHour: 0,
  equipments: [],
  includedEquipments: [],
  addons: [],
  isAvailable: false,
  availabilityKnown: false,
}
export function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ'
}

export function getNightlyDisplayPrice(pricePerHour: number) {
  return Math.max(0, pricePerHour) * FIRST_NIGHT_STAY_HOURS
}

export function maskCustomerName(customerName: string) {
  const parts = customerName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'Khách hàng'
  if (parts.length === 1) return parts[0]

  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`
}

export function formatRelativeTime(createdAt: string) {
  const createdDate = new Date(createdAt)

  if (Number.isNaN(createdDate.getTime())) {
    return 'Gần đây'
  }

  const now = new Date()
  const diffInMilliseconds = now.getTime() - createdDate.getTime()
  const diffInDays = Math.max(0, Math.floor(diffInMilliseconds / 86400000))

  if (diffInDays === 0) return 'Hôm nay'
  if (diffInDays === 1) return '1 ngày trước'
  if (diffInDays < 30) return `${diffInDays} ngày trước`

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths === 1) return '1 tháng trước'

  return `${diffInMonths} tháng trước`
}

export function normalizeDuration(value: string | number | null) {
  const duration = Number(value)
  return Number.isInteger(duration) && duration >= 0 && duration <= 24 * 30 ? duration : DEFAULT_DURATION
}

export function getRoomSubtotal(room: BookingRoom, duration: number) {
  return room.pricePerHour * duration
}

export function calculateEndTime(startTime: string, duration: number) {
  const [hourValue, minuteValue] = startTime.split(':').map(Number)
  const hour = Number.isFinite(hourValue) ? hourValue : 0
  const minute = Number.isFinite(minuteValue) ? minuteValue : 0
  const endHour = (hour + duration) % 24

  return `${String(endHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function formatDisplayDate(value: string) {
  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}
