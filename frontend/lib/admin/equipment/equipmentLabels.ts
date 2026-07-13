import type { EquipmentStatus, EquipmentType } from './types'

export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  WIFI: 'Wi-Fi',
  AIR_CONDITIONER: 'Điều hòa',
  TV: 'TV',
  WATER_HEATER: 'Máy nước nóng',
  OTHER: 'Khác',
}

export const EQUIPMENT_TYPE_OPTIONS: EquipmentType[] = [
  'WIFI',
  'AIR_CONDITIONER',
  'TV',
  'WATER_HEATER',
  'OTHER',
]

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  GOOD: 'Tốt',
  BROKEN: 'Hư hỏng',
  MAINTENANCE: 'Bảo trì',
}

export const EQUIPMENT_STATUS_OPTIONS: EquipmentStatus[] = ['GOOD', 'BROKEN', 'MAINTENANCE']

export const EQUIPMENT_STATUS_STYLES: Record<EquipmentStatus, string> = {
  GOOD: 'bg-secondary-container/30 text-secondary border-secondary-container/50',
  BROKEN: 'bg-error-container text-error border-error/30',
  MAINTENANCE: 'bg-tertiary-container text-on-tertiary-container border-tertiary-container/50',
}
