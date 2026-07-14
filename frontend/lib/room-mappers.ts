import {
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

const fallbackImage = '/images/homestay-luxury-hero.webp'

const categoryBadges: Record<RoomCategory, string> = {
  standard: 'Standard',
  deluxe: 'Deluxe',
  family: 'Family',
}

const categoryDescriptions: Record<RoomCategory, string> = {
  standard: 'Phòng tiện nghi cơ bản, phù hợp cho 1-2 khách.',
  deluxe: 'Phòng Deluxe rộng rãi, có ban công và tiện nghi nâng cấp.',
  family: 'Phòng Family có không gian sinh hoạt và sức chứa lớn.',
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
  if (allowRemote && /^https?:\/\//i.test(value)) return value

  return fallbackImage
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
  const isDefaultSeededTier = ['standard', 'deluxe', 'family'].includes(normalized)

  if (rawTypeName && !isDefaultSeededTier) {
    return rawTypeName
  }

  if (category === 'family') return 'Phòng Family'
  if (category === 'deluxe') return 'Phòng Deluxe'
  return 'Phòng Standard'
}

function getPublicRoomBadge(category: RoomCategory, capacity: number) {
  if (category === 'family') return 'Family'
  if (category === 'deluxe') return 'Deluxe'
  return 'Standard'
}

function getRoomDescription(room: BackendRoom, category: RoomCategory) {
  return room.description?.trim() || room.roomType?.description?.trim() || categoryDescriptions[category]
}

function getRoomCapacity(room: BackendRoom, category: RoomCategory) {
  return room.maxPeople ?? room.roomType?.capacity ?? 0
}

function getRoomImages(room: BackendRoom) {
  // The explicit primary image must be the first gallery image everywhere.
  // Backend responses may also include it in imageUrls, so deduplicate afterward.
  const source = [room.imageUrl, ...(room.imageUrls ?? [])]
    .map((image) => image?.trim())
    .filter((image): image is string => Boolean(image))
  const images = Array.from(new Set(source.map((image) => getImageUrl(image, true)))).slice(0, 4)

  return images.length > 0 ? images : [fallbackImage]
}

function getRoomPrice(room: BackendRoom, category: RoomCategory) {
  return asNumber(room.roomType?.pricePerHour, 0)
}

function getRoomEquipmentNames(equipment: PublicRoomEquipment[] | undefined) {
  const names = (equipment ?? [])
    .filter((item) => item.status === 'GOOD')
    .map((item) => item.name?.trim())
    .filter((name): name is string => Boolean(name))

  return Array.from(new Set(names))
}

function getAvailability(status: BackendRoomStatus | null | undefined) {
  if (status === 'MAINTENANCE') {
    return {
      availabilityStatus: 'FULL_TODAY' as RoomAvailabilityStatus,
      remainingSlots: 0,
      nextAvailableSlot: undefined,
      isAvailable: false,
      nextAvailableTime: undefined,
      todaySchedule: 'Đang bảo trì, tạm khóa lịch hôm nay',
      occupancyRateToday: 0,
    }
  }

  if (status === 'IN_USE') {
    return {
      availabilityStatus: undefined,
      remainingSlots: undefined,
      nextAvailableSlot: undefined,
      isAvailable: false,
      nextAvailableTime: undefined,
      todaySchedule: 'Phòng đang có khách',
      occupancyRateToday: 0,
    }
  }

  return {
    availabilityStatus: undefined,
    remainingSlots: undefined,
    nextAvailableSlot: undefined,
    isAvailable: false,
    nextAvailableTime: undefined,
    todaySchedule: 'Xem lịch trống từ hệ thống',
    occupancyRateToday: 0,
  }
}

function getStatusNote(status: BackendRoomStatus | null | undefined) {
  if (status === 'MAINTENANCE') {
    return 'Phòng đang được bảo trì. Bạn vẫn có thể chọn ngày khác hoặc liên hệ nhân viên để được hỗ trợ.'
  }

  if (status === 'IN_USE') {
    return 'Phòng gần kín lịch hôm nay. Nên đặt sớm để giữ khung giờ phù hợp.'
  }

  return undefined
}

export function inferRoomCategoryFromTypeName(typeName?: string | null): RoomCategory {
  const normalized = normalizeSearchText(typeName)

  if (/family|gia dinh|suite|group/.test(normalized)) return 'family'
  if (/deluxe|premium|vip|cao cap/.test(normalized)) return 'deluxe'
  return 'standard'
}

export function mapBackendStatusToAdminStatus(status?: BackendRoomStatus | null): RoomStatus {
  if (status === 'IN_USE') return 'occupied'
  if (status === 'MAINTENANCE') return 'maintenance'
  if (status === 'INACTIVE') return 'inactive'
  return 'active'
}

export function mapAdminStatusToBackendStatus(status?: RoomStatus | null): BackendRoomStatus {
  if (status === 'occupied') return 'IN_USE'
  if (status === 'maintenance') return 'MAINTENANCE'
  if (status === 'inactive') return 'INACTIVE'
  return 'AVAILABLE'
}

export function mapRoomTypeToAdminOption(roomType: BackendRoomType): AdminRoomTypeOption {
  const category = inferRoomCategoryFromTypeName(`${roomType.typeName} ${roomType.description ?? ''}`)

  return {
    id: roomType.id,
    label: roomType.typeName,
    description: roomType.description?.trim() ?? '',
    category,
    pricePerHour: asNumber(roomType.pricePerHour, 0),
    capacity: roomType.capacity ?? 0,
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
  const equipments = getRoomEquipmentNames(equipment)
  const availability = getAvailability(room.status)
  const status = mapBackendStatusToAdminStatus(room.status)
  const images = getRoomImages(room)

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
    image: images[0],
    imageUrl: room.imageUrl?.trim() || '',
    imageUrls: images,
    equipmentCount: equipments.length,
    equipments,
    todaySchedule: availability.todaySchedule,
    lastUpdated: 'Đồng bộ từ backend',
    description: getRoomDescription(room, category),
    occupancyRateToday: availability.occupancyRateToday,
    monthlyRevenue,
    averageRating: reviewSummary?.averageRating ?? 0,
    latestMaintenance: status === 'maintenance' ? 'Đang bảo trì' : 'Không có dữ liệu lịch bảo trì',
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
  const equipments = getRoomEquipmentNames(equipment)
  const availability = getAvailability(room.status)
  const capacity = getRoomCapacity(room, category)
  const roomTypeName = getRoomTypeName(room, category)
  const images = getRoomImages(room)

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
    location: room.floor ? `Tầng ${room.floor}, The Serene Villa` : 'The Serene Villa',
    image: images[0],
    images,
    imageClassName: '',
    pricePerHour: getRoomPrice(room, category),
    equipments: equipments.slice(0, 3),
    includedEquipments: equipments,
    addons: [],
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
  return catalog.find((room) => room.id === roomId || room.code === roomId) ?? null
}
