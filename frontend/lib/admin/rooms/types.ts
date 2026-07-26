export type RoomCategory = 'standard' | 'deluxe' | 'family'
export type AccommodationType = 'VILLA' | 'GARDEN_HOUSE' | 'BUNGALOW' | 'APARTMENT' | 'HOMESTAY'

export type RoomStatus = 'active' | 'occupied' | 'maintenance' | 'inactive'

export type AdminRoom = {
  id: string
  code: string
  name: string
  roomTypeId?: number | null
  roomTypeName?: string
  category: RoomCategory
  categoryLabel: string
  capacity: number
  bedroomCount: number
  bedCount: number
  bathroomCount: number
  pricePerHour: number
  baseNightlyRate: number
  accommodationType: AccommodationType
  addressLine: string
  ward: string
  district: string
  city: string
  latitude: number | null
  longitude: number | null
  checkInRadiusMeters: number
  status: RoomStatus
  image: string
  imageUrl?: string
  imageUrls?: string[]
  equipmentCount: number
  equipments: string[]
  todaySchedule: string
  lastUpdated: string
  description: string
  occupancyRateToday: number
  monthlyRevenue: number
  averageRating: number
  latestMaintenance: string
}

export type RoomFilters = {
  query: string
  roomTypeId: number | 'ALL'
  category: RoomCategory | 'ALL'
  status: RoomStatus | 'ALL'
  sortBy: 'updated' | 'price-asc' | 'price-desc' | 'capacity'
}

export type RoomFormData = {
  name: string
  code: string
  roomTypeId: number | null
  category: RoomCategory | ''
  capacity: number
  bedroomCount: number
  bedCount: number
  bathroomCount: number
  pricePerHour: number
  baseNightlyRate: number
  accommodationType: AccommodationType
  addressLine: string
  ward: string
  district: string
  city: string
  latitude: number | null
  longitude: number | null
  checkInRadiusMeters: number
  status: RoomStatus | ''
  description: string
  equipments: string
  image: string
  additionalImages: string[]
  selectedEquipmentKeys: string[]
}

export type RoomEquipmentOption = {
  key: string
  name: string
  equipmentType: 'WIFI' | 'AIR_CONDITIONER' | 'TV' | 'WATER_HEATER' | 'OTHER'
}

export type RoomFormErrors = Partial<Record<keyof RoomFormData, string>>

export type AdminRoomTypeOption = {
  id: number
  label: string
  description: string
  category: RoomCategory
  pricePerHour: number
  capacity: number
}

export type RoomTypeFormData = {
  typeName: string
  description: string
  pricePerHour: number
}

export type RoomTypeFormErrors = Partial<Record<keyof RoomTypeFormData, string>>

export const roomCategoryOptions: RoomCategory[] = ['standard', 'deluxe', 'family']

export const roomStatusOptions: RoomStatus[] = ['active', 'occupied', 'maintenance', 'inactive']
export const accommodationTypeOptions: AccommodationType[] = ['VILLA', 'GARDEN_HOUSE', 'BUNGALOW', 'APARTMENT', 'HOMESTAY']

export const accommodationTypeLabels: Record<AccommodationType, string> = {
  VILLA: 'Biệt thự',
  GARDEN_HOUSE: 'Nhà vườn',
  BUNGALOW: 'Bungalow',
  APARTMENT: 'Căn hộ',
  HOMESTAY: 'Homestay nguyên căn',
}

export const roomCategoryLabels: Record<RoomCategory, string> = {
  standard: 'Phòng homestay tiêu chuẩn',
  deluxe: 'Phòng Deluxe',
  family: 'Phòng Family',
}

export const roomStatusLabels: Record<RoomStatus, string> = {
  active: 'Đang hoạt động',
  occupied: 'Đang sử dụng',
  maintenance: 'Bảo trì',
  inactive: 'Tạm ngưng',
}
