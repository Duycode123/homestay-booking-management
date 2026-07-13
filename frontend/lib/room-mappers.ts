import {
  bookingRooms,
  roomCategories,
  type BookingRoom,
  type BookingRoomReviewSummary,
  type RoomAvailabilityStatus,
  type RoomCategory,
} from '@/components/booking/booking-data'
import {
  roomCategoryLabels,
  type AdminRoom,
  type AdminRoomTypeOption,
  type RoomStatus,
} from '@/lib/admin/rooms/types'
import type { BackendRoom, BackendRoomStatus, BackendRoomType } from '@/lib/rooms-api'
import type { PublicRoomEquipment } from '@/lib/public-room-equipment-service'

const fallbackImage = '/images/homestay-room-hero.png'

const defaultCapacity: Record<RoomCategory, number> = {
  standard: 2,
  band: 3,
  recording: 6,
  premium: 5,
}

const defaultPrice: Record<RoomCategory, number> = {
  standard: 350000,
  band: 550000,
  recording: 750000,
  premium: 750000,
}

const categoryEquipment: Record<RoomCategory, string[]> = {
  standard: ['Wi-Fi', 'Điều hòa', 'Smart TV', 'Máy nước nóng'],
  band: ['Wi-Fi 5G', 'Điều hòa âm trần', 'Smart TV 50 inch', 'Máy nước nóng'],
  recording: ['Wi-Fi gia đình', 'Hai điều hòa', 'Smart TV 55 inch', 'Bình nước nóng'],
  premium: ['Wi-Fi gia đình', 'Hai điều hòa', 'Smart TV 55 inch', 'Bình nước nóng'],
}

const categoryBadges: Record<RoomCategory, string> = {
  standard: 'Standard',
  band: 'Deluxe',
  recording: 'Family',
  premium: 'Family',
}

const categoryDescriptions: Record<RoomCategory, string> = {
  standard: 'Phòng tiện nghi cơ bản, phù hợp cho 1-2 khách.',
  band: 'Phòng Deluxe rộng rãi, có ban công và tiện nghi nâng cấp.',
  recording: 'Phòng Family có không gian sinh hoạt và sức chứa lớn.',
  premium: 'Phòng Family rộng rãi dành cho gia đình hoặc nhóm đông người.',
}

function normalizeSearchText(value?: string | null) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function asNumber(value: number | string | null | undefined, fallback: number) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : fallback
}

function getCategoryLabel(category: RoomCategory) {
  return roomCategories.find((item) => item.id === category)?.label ?? roomCategoryLabels[category]
}

function getRoomCode(room: BackendRoom) {
  return `ROOM-${String(room.id).padStart(3, '0')}`
}

function getImageUrl(imageUrl: string | null | undefined, allowRemote = false) {
  const value = imageUrl?.trim()

  if (!value) return fallbackImage
  if (value.startsWith('/')) return value
  if (allowRemote && /^https?:\/\//i.test(value)) return getOptimizedCloudinaryUrl(value)

  return fallbackImage
}

function getOptimizedCloudinaryUrl(imageUrl: string) {
  if (!/^https:\/\/res\.cloudinary\.com\//i.test(imageUrl)) {
    return imageUrl
  }
  if (imageUrl.includes('/image/upload/f_auto,q_auto/')) {
    return imageUrl
  }

  return imageUrl.replace('/image/upload/', '/image/upload/f_auto,q_auto/')
}

function getRoomTypeName(room: BackendRoom, category: RoomCategory) {
  return room.roomType?.typeName?.trim() || getCategoryLabel(category)
}

export function getPublicRoomTierLabel(
  typeName?: string | null,
  options: { category?: RoomCategory; capacity?: number | null } = {},
) {
  const rawTypeName = typeName?.trim()
  const category = options.category ?? inferRoomCategoryFromTypeName(rawTypeName)
  const capacity = options.capacity ?? null
  const normalized = normalizeSearchText(rawTypeName)
  const isDefaultSeededTier = [
    'standard practice',
    'band lưu trú',
    'recording & mixing',
    'premium homestay',
  ].includes(normalized)

  if (rawTypeName && !isDefaultSeededTier) {
    return rawTypeName
  }

  if (category === 'recording') return 'Phòng thu'
  if (capacity !== null && capacity >= 12) return 'Phòng nhóm lớn'
  if (capacity !== null && capacity >= 5) return 'Phòng band'
  if (category === 'premium') return 'Phòng nhóm lớn'
  if (category === 'band') return 'Phòng band'

  return 'Phòng nhóm nhỏ'
}

function getPublicRoomBadge(category: RoomCategory, capacity: number) {
  if (category === 'recording') return 'Family'
  if (capacity >= 12) return 'Nhóm lớn'
  if (capacity >= 5) return 'Band'

  return 'Nhóm nhỏ'
}

function getRoomDescription(room: BackendRoom, category: RoomCategory) {
  return room.description?.trim() || room.roomType?.description?.trim() || categoryDescriptions[category]
}

function getRoomCapacity(room: BackendRoom, category: RoomCategory) {
  return room.maxPeople ?? room.roomType?.capacity ?? defaultCapacity[category]
}

function getRoomPrice(room: BackendRoom, category: RoomCategory) {
  return asNumber(room.roomType?.pricePerHour, defaultPrice[category])
}

function getRoomEquipmentNames(equipment: PublicRoomEquipment[] | undefined, category: RoomCategory) {
  const names = (equipment ?? [])
    .filter((item) => item.status === 'GOOD')
    .map((item) => item.name?.trim())
    .filter((name): name is string => Boolean(name))

  return names.length > 0 ? Array.from(new Set(names)) : categoryEquipment[category]
}

function getAvailability(status: BackendRoomStatus | null | undefined, index: number) {
  if (status === 'MAINTENANCE') {
    return {
      availabilityStatus: 'FULL_TODAY' as RoomAvailabilityStatus,
      remainingSlots: 0,
      nextAvailableSlot: 'Ngày mai, 18:00',
      isAvailable: false,
      nextAvailableTime: 'Ngày mai 18:00',
      todaySchedule: 'Đang bảo trì, tạm khóa lịch hôm nay',
      occupancyRateToday: 0,
    }
  }

  if (status === 'IN_USE') {
    return {
      availabilityStatus: 'ALMOST_FULL' as RoomAvailabilityStatus,
      remainingSlots: 1,
      nextAvailableSlot: 'Hôm nay, 21:00',
      isAvailable: true,
      nextAvailableTime: '21:00',
      todaySchedule: 'Sắp kín lịch hôm nay',
      occupancyRateToday: 85,
    }
  }

  const availableTimes = ['18:00', '19:00', '20:00', '21:00']
  const nextTime = availableTimes[index % availableTimes.length]

  return {
    availabilityStatus: 'AVAILABLE' as RoomAvailabilityStatus,
    remainingSlots: 3 + (index % 2),
    nextAvailableSlot: `Hôm nay, ${nextTime}`,
    isAvailable: true,
    nextAvailableTime: nextTime,
    todaySchedule: 'Còn lịch trống hôm nay',
    occupancyRateToday: 35 + (index % 3) * 10,
  }
}

function getStatusNote(status: BackendRoomStatus | null | undefined) {
  if (status === 'MAINTENANCE') {
    return 'Phòng đang được bảo trì. Bạn vẫn có thể chọn ngày khác hoặc liên hệ nhân viên để được hỗ trợ.'
  }

  if (status === 'IN_USE') {
    return 'Phòng gần kín lịch hôm nay. Nên đặt sớm để giữ khung giờ phù hợp.'
  }

  return 'Phòng còn nhiều khung giờ hôm nay, phù hợp để đặt nhanh trong ngày.'
}

export function inferRoomCategoryFromTypeName(typeName?: string | null): RoomCategory {
  const normalized = normalizeSearchText(typeName)

  if (/record|mix|thu|vocal|podcast/.test(normalized)) return 'recording'
  if (/premium|vip|private|suite|cao cap/.test(normalized)) return 'premium'
  if (/band|lưu trú|studio|nhom/.test(normalized)) return 'band'
  return 'standard'
}

export function mapBackendStatusToAdminStatus(status?: BackendRoomStatus | null): RoomStatus {
  if (status === 'IN_USE') return 'occupied'
  if (status === 'MAINTENANCE') return 'maintenance'
  return 'active'
}

export function mapAdminStatusToBackendStatus(status?: RoomStatus | null): BackendRoomStatus {
  if (status === 'occupied') return 'IN_USE'
  if (status === 'maintenance' || status === 'inactive') return 'MAINTENANCE'
  return 'AVAILABLE'
}

export function mapRoomTypeToAdminOption(roomType: BackendRoomType): AdminRoomTypeOption {
  const category = inferRoomCategoryFromTypeName(`${roomType.typeName} ${roomType.description ?? ''}`)

  return {
    id: roomType.id,
    label: roomType.typeName,
    description: roomType.description?.trim() ?? '',
    category,
    pricePerHour: asNumber(roomType.pricePerHour, defaultPrice[category]),
    capacity: roomType.capacity ?? defaultCapacity[category],
  }
}

export function mapBackendRoomToAdminRoom(
  room: BackendRoom,
  index = 0,
  monthlyRevenue = 0,
  reviewSummary?: BookingRoomReviewSummary,
  equipment?: PublicRoomEquipment[],
): AdminRoom {
  const category = inferRoomCategoryFromTypeName(
    `${room.roomType?.typeName ?? ''} ${room.roomType?.description ?? ''}`,
  )
  const equipments = getRoomEquipmentNames(equipment, category)
  const availability = getAvailability(room.status, index)
  const status = mapBackendStatusToAdminStatus(room.status)

  return {
    id: String(room.id),
    code: getRoomCode(room),
    name: room.roomName,
    roomTypeId: room.roomType?.id ?? null,
    roomTypeName: room.roomType?.typeName,
    category,
    categoryLabel: getRoomTypeName(room, category),
    capacity: getRoomCapacity(room, category),
    pricePerHour: getRoomPrice(room, category),
    status,
    image: getImageUrl(room.imageUrl, true),
    imageUrl: room.imageUrl?.trim() || '',
    equipmentCount: equipments.length,
    equipments,
    todaySchedule: availability.todaySchedule,
    lastUpdated: 'Đồng bộ từ backend',
    description: getRoomDescription(room, category),
    occupancyRateToday: availability.occupancyRateToday,
    monthlyRevenue,
    averageRating: reviewSummary?.averageRating ?? 0,
    latestMaintenance: status === 'maintenance' ? 'Đang bảo trì' : 'Chưa có lịch bảo trì gần đây',
  }
}

export function mapBackendRoomToBookingRoom(
  room: BackendRoom,
  index = 0,
  reviewSummary?: BookingRoomReviewSummary,
  equipment?: PublicRoomEquipment[],
): BookingRoom {
  const category = inferRoomCategoryFromTypeName(
    `${room.roomType?.typeName ?? ''} ${room.roomType?.description ?? ''}`,
  )
  const equipments = getRoomEquipmentNames(equipment, category)
  const availability = getAvailability(room.status, index)
  const capacity = getRoomCapacity(room, category)
  const roomTypeName = getRoomTypeName(room, category)

  return {
    id: String(room.id),
    code: getRoomCode(room),
    name: room.roomName,
    category,
    roomTierId: room.roomType?.id,
    roomTierName: roomTypeName,
    roomTierDescription: room.roomType?.description?.trim() || undefined,
    categoryLabel: getPublicRoomTierLabel(roomTypeName, { category, capacity }),
    type: roomTypeName,
    badge: getPublicRoomBadge(category, capacity),
    rating: reviewSummary?.reviewCount ? reviewSummary.averageRating : undefined,
    reviews: reviewSummary?.reviewCount ?? 0,
    capacity: `Tối đa ${capacity} người`,
    location: room.floor ? `Tầng ${room.floor}, Homestay Booking Studio` : 'Homestay Booking Studio',
    image: getImageUrl(room.imageUrl, true),
    imageClassName: '',
    pricePerHour: getRoomPrice(room, category),
    equipments: equipments.slice(0, 3),
    includedEquipments: equipments,
    addons: ['Dây jack dự phòng', 'Stand micro', 'Kỹ thuật viên hỗ trợ'],
    description: getRoomDescription(room, category),
    availabilityStatus: availability.availabilityStatus,
    remainingSlots: availability.remainingSlots,
    nextAvailableSlot: availability.nextAvailableSlot,
    isAvailable: availability.isAvailable,
    nextAvailableTime: availability.nextAvailableTime,
    operationalStatus: room.status ?? 'AVAILABLE',
    note: getStatusNote(room.status),
  }
}

export function findBookingRoomInCatalog(roomId: string | null, catalog: BookingRoom[]) {
  if (!roomId) return null
  return catalog.find((room) => room.id === roomId) ?? bookingRooms.find((room) => room.id === roomId) ?? null
}
