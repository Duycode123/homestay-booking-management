import type { PracticeRoom } from '@/lib/booking/types'

export type RoomCategory = 'standard' | 'band' | 'recording' | 'premium'
export type RoomAvailabilityStatus = 'AVAILABLE' | 'ALMOST_FULL' | 'FULL_TODAY'
export type RoomOperationalStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'INACTIVE' | 'UNAVAILABLE' | 'DISABLED' | 'CLOSED'

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
  imageClassName: string
  pricePerHour: number
  equipments: string[]
  includedEquipments: string[]
  addons: string[]
  description?: string
  availabilityStatus?: RoomAvailabilityStatus
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

export type PaymentMethodId = 'bank_transfer' | 'e_wallet' | 'cash'

export type PaymentMethod = {
  id: PaymentMethodId
  label: string
  description: string
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
export const BOOKING_DURATION_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const
export const EMPTY_NOTE_TEXT = 'Không có ghi chú thêm.'

export const roomCategories: RoomCategoryOption[] = [
  {
    id: 'standard',
    label: 'Standard',
    description: 'Phòng tiện nghi cơ bản, phù hợp cho 1-2 khách.',
  },
  {
    id: 'band',
    label: 'Deluxe',
    description: 'Phòng rộng rãi, có ban công và tiện nghi nâng cấp.',
  },
  {
    id: 'recording',
    label: 'Family',
    description: 'Phòng gia đình có không gian sinh hoạt và sức chứa lớn.',
  },
  {
    id: 'premium',
    label: 'Family',
    description: 'Lựa chọn rộng rãi cho gia đình hoặc nhóm đông người.',
  },
]

const roomCategoryLabels: Record<RoomCategory, string> = {
  standard: 'Standard',
  band: 'Deluxe',
  recording: 'Family',
  premium: 'Family',
}

export function detectRoomCategory(typeName?: string | null): RoomCategory {
  const normalized = typeName?.trim().toLowerCase() || ''

  if (normalized.includes('family')) return 'recording'
  if (normalized.includes('deluxe')) return 'band'
  return 'standard'
}

export function isApiBackedBookingRoom(room: BookingRoom) {
  return room.code.startsWith('API-')
}

function getOptimizedCloudinaryImageUrl(imageUrl: string) {
  if (!/^https:\/\/res\.cloudinary\.com\//i.test(imageUrl)) {
    return imageUrl
  }

  if (imageUrl.includes('/image/upload/f_auto,q_auto/')) {
    return imageUrl
  }

  return imageUrl.replace('/image/upload/', '/image/upload/f_auto,q_auto/')
}

function getRoomImage(imageUrl?: string) {
  if (!imageUrl) return undefined

  const normalized = imageUrl.trim()
  if (!normalized) return undefined
  if (normalized.startsWith('/')) return normalized
  if (/^https?:\/\//i.test(normalized)) return getOptimizedCloudinaryImageUrl(normalized)

  return undefined
}

export function mapPracticeRoomToBookingRoom(
  room: PracticeRoom,
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
    location: room.location || 'Homestay Booking',
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

export const paymentMethods: PaymentMethod[] = [
  {
    id: 'bank_transfer',
    label: 'Chuyển khoản ngân hàng',
    description: 'Thanh toán online qua portal SePay.',
  },
]

const image = '/images/homestay-room-hero.png'

export const bookingRooms: BookingRoom[] = [
  {
    id: 'standard-garden-101', code: 'HS-STD-101', name: 'Standard Garden 101', category: 'standard',
    categoryLabel: 'Standard', type: 'Standard', badge: 'Tiết kiệm', rating: 4.7, reviews: 128,
    capacity: 'Tối đa 2 người', location: 'Tầng 1, Homestay Booking', image, imageClassName: 'object-center',
    pricePerHour: 350000, equipments: ['Wi-Fi', 'Điều hòa', 'Smart TV', 'Máy nước nóng'],
    includedEquipments: ['Wi-Fi tốc độ cao', 'Điều hòa Daikin', 'Smart TV 43 inch', 'Máy nước nóng Ariston'],
    addons: ['Bữa sáng', 'Giặt ủi'], description: 'Phòng hướng vườn yên tĩnh, phù hợp cho cá nhân hoặc cặp đôi.',
    availabilityStatus: 'AVAILABLE', remainingSlots: 4, nextAvailableSlot: 'Hôm nay, 14:00', isAvailable: true, nextAvailableTime: '14:00',
  },
  {
    id: 'standard-garden-102', code: 'HS-STD-102', name: 'Standard Garden 102', category: 'standard',
    categoryLabel: 'Standard', type: 'Standard', badge: 'Phổ biến', rating: 4.6, reviews: 96,
    capacity: 'Tối đa 2 người', location: 'Tầng 1, Homestay Booking', image, imageClassName: 'object-center',
    pricePerHour: 350000, equipments: ['Wi-Fi', 'Điều hòa', 'Smart TV', 'Máy nước nóng'],
    includedEquipments: ['Wi-Fi tốc độ cao', 'Điều hòa Panasonic', 'Smart TV 43 inch', 'Máy nước nóng Ferroli'],
    addons: ['Bữa sáng', 'Đón sân bay'], description: 'Phòng Standard gọn gàng với đầy đủ tiện nghi thiết yếu.',
    availabilityStatus: 'AVAILABLE', remainingSlots: 3, nextAvailableSlot: 'Hôm nay, 16:00', isAvailable: true, nextAvailableTime: '16:00',
  },
  {
    id: 'deluxe-balcony-201', code: 'HS-DLX-201', name: 'Deluxe Balcony 201', category: 'band',
    categoryLabel: 'Deluxe', type: 'Deluxe', badge: 'Có ban công', rating: 4.9, reviews: 214,
    capacity: 'Tối đa 3 người', location: 'Tầng 2, Homestay Booking', image, imageClassName: 'object-center',
    pricePerHour: 550000, equipments: ['Wi-Fi 5G', 'Điều hòa âm trần', 'Smart TV 50 inch', 'Máy nước nóng'],
    includedEquipments: ['Wi-Fi 5G', 'Điều hòa âm trần', 'Smart TV 50 inch', 'Máy nước nóng trực tiếp'],
    addons: ['Bữa sáng', 'Trang trí phòng'], description: 'Phòng Deluxe rộng rãi với ban công riêng và góc thư giãn.',
    availabilityStatus: 'ALMOST_FULL', remainingSlots: 1, nextAvailableSlot: 'Ngày mai, 09:00', isAvailable: true, nextAvailableTime: '09:00',
  },
  {
    id: 'deluxe-city-view-202', code: 'HS-DLX-202', name: 'Deluxe City View 202', category: 'band',
    categoryLabel: 'Deluxe', type: 'Deluxe', badge: 'View thành phố', rating: 4.8, reviews: 175,
    capacity: 'Tối đa 3 người', location: 'Tầng 2, Homestay Booking', image, imageClassName: 'object-center',
    pricePerHour: 550000, equipments: ['Wi-Fi 5G', 'Điều hòa âm trần', 'Smart TV 50 inch', 'Máy nước nóng'],
    includedEquipments: ['Wi-Fi 5G', 'Điều hòa âm trần', 'Smart TV 50 inch', 'Máy nước nóng trực tiếp'],
    addons: ['Bữa sáng', 'Đón sân bay'], description: 'Phòng Deluxe có cửa sổ lớn nhìn ra thành phố.',
    availabilityStatus: 'FULL_TODAY', remainingSlots: 0, nextAvailableSlot: 'Ngày mai, 12:00', isAvailable: false, nextAvailableTime: '12:00',
  },
  {
    id: 'family-suite-301', code: 'HS-FAM-301', name: 'Family Suite 301', category: 'recording',
    categoryLabel: 'Family', type: 'Family', badge: 'Gia đình', rating: 4.9, reviews: 246,
    capacity: 'Tối đa 6 người', location: 'Tầng 3, Homestay Booking', image, imageClassName: 'object-center',
    pricePerHour: 750000, equipments: ['Wi-Fi gia đình', 'Hai điều hòa', 'Smart TV 55 inch', 'Bình nước nóng'],
    includedEquipments: ['Wi-Fi phủ sóng toàn phòng', 'Hai điều hòa inverter', 'Smart TV 55 inch', 'Bình nước nóng 30 lít'],
    addons: ['Bữa sáng gia đình', 'Nôi em bé'], description: 'Suite gia đình có phòng khách riêng và không gian sinh hoạt rộng.',
    availabilityStatus: 'AVAILABLE', remainingSlots: 2, nextAvailableSlot: 'Hôm nay, 15:00', isAvailable: true, nextAvailableTime: '15:00',
  },
  {
    id: 'family-garden-302', code: 'HS-FAM-302', name: 'Family Garden 302', category: 'premium',
    categoryLabel: 'Family', type: 'Family', badge: 'Sân vườn', rating: 4.8, reviews: 192,
    capacity: 'Tối đa 5 người', location: 'Tầng 3, Homestay Booking', image, imageClassName: 'object-center',
    pricePerHour: 750000, equipments: ['Wi-Fi gia đình', 'Hai điều hòa', 'Smart TV 55 inch', 'Bình nước nóng'],
    includedEquipments: ['Wi-Fi phủ sóng sân vườn', 'Hai điều hòa inverter', 'Smart TV 55 inch', 'Bình nước nóng 30 lít'],
    addons: ['BBQ sân vườn', 'Bữa sáng gia đình'], description: 'Phòng Family có lối ra vườn, phù hợp nhóm bạn hoặc gia đình.',
    availabilityStatus: 'FULL_TODAY', remainingSlots: 0, nextAvailableSlot: 'Ngày kia, 10:00', isAvailable: false, operationalStatus: 'MAINTENANCE', note: 'Đang bảo trì một điều hòa.',
  },
]
export function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ'
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

export function findBookingRoom(roomId: string | null) {
  return bookingRooms.find((room) => room.id === roomId) ?? null
}

export function getBookingRoomOrFallback(roomId: string | null) {
  return findBookingRoom(roomId) ?? bookingRooms[0]
}

export function normalizeDuration(value: string | number | null) {
  const duration = Number(value)
  return Number.isInteger(duration) && duration >= 0 && duration <= 8 ? duration : DEFAULT_DURATION
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
