export type EquipmentType =
  | 'WIFI'
  | 'AIR_CONDITIONER'
  | 'TV'
  | 'WATER_HEATER'
  | 'OTHER'

export type EquipmentStatus = 'GOOD' | 'BROKEN' | 'MAINTENANCE'

export type AdminEquipment = {
  equipmentId: number
  roomId: number
  roomName: string
  equipmentName: string
  equipmentType: EquipmentType
  status: EquipmentStatus
  notes?: string
}

export type EquipmentFilters = {
  query: string
  equipmentType: EquipmentType | 'ALL'
  status: EquipmentStatus | 'ALL'
  sortBy: 'name' | 'room'
  sortOrder: 'asc' | 'desc'
}

export type EquipmentFormData = {
  roomId: number | null
  equipmentName: string
  equipmentType: EquipmentType
  status: EquipmentStatus
  notes: string
}

export type EquipmentFormErrors = Partial<Record<keyof EquipmentFormData, string>>

export type EquipmentRoomOption = {
  roomId: number
  roomName: string
}
