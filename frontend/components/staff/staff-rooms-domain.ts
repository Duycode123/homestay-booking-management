import type { AdminEquipment, EquipmentStatus as BackendEquipmentStatus, EquipmentType as BackendEquipmentType } from '@/lib/admin/equipment/types'
import type { BackendRoom } from '@/lib/rooms-api'
import type { BackendRoomStatus, FacilityCondition } from '@/lib/staff-facility-service'

export type RoomStatus = 'AVAILABLE' | 'IN_USE' | 'CLEANING' | 'MAINTENANCE' | 'ISSUE'
export type RoomCategory = 'STANDARD' | 'DELUXE' | 'FAMILY'
export type EquipmentStatus = 'AVAILABLE' | 'IN_USE' | 'INSPECTION' | 'MAINTENANCE' | 'BROKEN'
export type EquipmentType = 'WIFI' | 'AIR_CONDITIONER' | 'TV' | 'WATER_HEATER' | 'OTHER'
export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type IssueType = 'AMENITY' | 'POWER' | 'DEVICE' | 'CLEANING' | 'OTHER'
export type StaffRoomsTab = 'ROOMS' | 'EQUIPMENT' | 'ISSUES'

export type StaffRoom = {
  id: string
  name: string
  category: RoomCategory
  capacity: number
  status: RoomStatus
  currentBooking?: { bookingId: string; customerName: string; timeRange: string }
  equipment: string[]
  updatedAt: string
  assignedStaff?: string
  note?: string
}

export type StaffEquipment = {
  id: string
  code: string
  name: string
  type: EquipmentType
  location: string
  status: EquipmentStatus
  quantity?: number
  lastCheckedAt: string
  currentBookingId?: string
  note?: string
}

export type StaffIssue = {
  id: string
  title: string
  targetType: 'ROOM' | 'EQUIPMENT'
  targetId: string
  targetName: string
  issueType: IssueType
  priority: Priority
  status: IssueStatus
  reporter: string
  createdAt: string
  description: string
}

export type Meta = { label: string; className: string; dotClassName?: string }
export type ReportIssueDraft = {
  targetType: 'ROOM' | 'EQUIPMENT'
  targetId: string
  issueType: IssueType
  priority: Priority
  title: string
  description: string
}
export type ReportIssueErrors = Partial<Record<keyof ReportIssueDraft, string>>

export function mapBackendRoomsToStaffRooms(rooms: BackendRoom[], equipment: AdminEquipment[]): StaffRoom[] {
  return rooms.map((room) => {
    const roomEquipment = equipment.filter((item) => item.roomId === room.id)
    return {
      id: String(room.id),
      name: room.roomName || `Room ${room.id}`,
      category: mapRoomTypeToCategory(room.roomType?.typeName),
      capacity: Number(room.maxPeople ?? room.roomType?.capacity ?? 0),
      status: mapBackendRoomStatusToStaff(room.status),
      equipment: roomEquipment.map((item) => item.equipmentName),
      updatedAt: 'Backend',
      assignedStaff: undefined,
      note: room.description ?? undefined,
    }
  })
}

export function mapBackendEquipmentToStaffEquipment(item: AdminEquipment): StaffEquipment {
  return {
    id: String(item.equipmentId), code: `EQ-${String(item.equipmentId).padStart(3, '0')}`,
    name: item.equipmentName, type: mapBackendEquipmentType(item.equipmentType), location: item.roomName,
    status: mapBackendEquipmentStatus(item.status), quantity: 1, lastCheckedAt: 'Backend', note: item.notes,
  }
}

export function mapRoomStatusToBackend(status: RoomStatus): BackendRoomStatus {
  if (status === 'CLEANING') return 'NEED_CLEANING'
  if (status === 'ISSUE') return 'MAINTENANCE'
  return status
}

export function mapEquipmentStatusToCondition(status: EquipmentStatus): FacilityCondition {
  if (status === 'BROKEN') return 'BROKEN'
  if (status === 'INSPECTION' || status === 'MAINTENANCE') return 'NEED_CHECK'
  return 'GOOD'
}

export function mapIssueTypeToCondition(issueType: IssueType): FacilityCondition {
  return issueType === 'CLEANING' ? 'NEED_CLEANING' : 'NEED_CHECK'
}

export function getRoomStatusMeta(status: RoomStatus): Meta {
  return {
    AVAILABLE: { label: 'Sẵn sàng', className: 'border-on-secondary-container/40 bg-on-secondary-container text-[#001A0D]', dotClassName: 'bg-secondary-container' },
    IN_USE: { label: 'Đang sử dụng', className: 'border-secondary-container bg-secondary text-on-secondary', dotClassName: 'bg-on-secondary-container' },
    CLEANING: { label: 'Cần vệ sinh', className: 'border-primary-container bg-primary-container text-on-primary-container', dotClassName: 'bg-brand-orange' },
    MAINTENANCE: { label: 'Bảo trì', className: 'border-tertiary-container bg-tertiary-container text-on-tertiary-container', dotClassName: 'bg-tertiary' },
    ISSUE: { label: 'Có sự cố', className: 'border-error-container bg-error-container text-on-error-container', dotClassName: 'bg-error' },
  }[status]
}

export function getEquipmentStatusMeta(status: EquipmentStatus): Meta {
  return {
    AVAILABLE: { label: 'Sẵn sàng', className: 'border-on-secondary-container/40 bg-on-secondary-container text-[#001A0D]', dotClassName: 'bg-secondary-container' },
    IN_USE: { label: 'Đang sử dụng', className: 'border-secondary-container bg-secondary text-on-secondary', dotClassName: 'bg-on-secondary-container' },
    INSPECTION: { label: 'Cần kiểm tra', className: 'border-primary-container bg-primary-container text-on-primary-container', dotClassName: 'bg-brand-orange' },
    MAINTENANCE: { label: 'Bảo trì', className: 'border-tertiary-container bg-tertiary-container text-on-tertiary-container', dotClassName: 'bg-tertiary' },
    BROKEN: { label: 'Hỏng', className: 'border-error-container bg-error-container text-on-error-container', dotClassName: 'bg-error' },
  }[status]
}

export function getIssueStatusMeta(status: IssueStatus): Meta {
  return {
    OPEN: { label: 'Mới tạo', className: 'border-primary-container bg-primary-container text-on-primary-container', dotClassName: 'bg-brand-orange' },
    IN_PROGRESS: { label: 'Đang xử lý', className: 'border-tertiary-container bg-tertiary-container text-on-tertiary-container', dotClassName: 'bg-tertiary' },
    RESOLVED: { label: 'Đã xử lý', className: 'border-on-secondary-container/40 bg-on-secondary-container text-[#001A0D]', dotClassName: 'bg-secondary-container' },
    CLOSED: { label: 'Đã đóng', className: 'border-outline-variant bg-surface-container-high text-on-surface-variant', dotClassName: 'bg-on-surface-variant' },
  }[status]
}

export function getPriorityMeta(priority: Priority): Meta {
  return {
    LOW: { label: 'Thấp', className: 'border-outline-variant bg-surface-container-low text-on-surface-variant', dotClassName: 'bg-on-surface-variant' },
    MEDIUM: { label: 'Trung bình', className: 'border-primary-container bg-primary-container text-on-primary-container', dotClassName: 'bg-brand-orange' },
    HIGH: { label: 'Cao', className: 'border-tertiary-container bg-tertiary-container text-on-tertiary-container', dotClassName: 'bg-tertiary' },
    URGENT: { label: 'Khẩn cấp', className: 'border-error-container bg-error-container text-on-error-container', dotClassName: 'bg-error' },
  }[priority]
}

export function getEquipmentTypeLabel(type: EquipmentType) {
  return { WIFI: 'Wi-Fi', AIR_CONDITIONER: 'Điều hòa', TV: 'TV', WATER_HEATER: 'Máy nước nóng', OTHER: 'Khác' }[type]
}

export function getRoomCategoryLabel(category: RoomCategory) {
  return { STANDARD: 'Standard', DELUXE: 'Deluxe', FAMILY: 'Family' }[category]
}

export function getTargetName(targetType: 'ROOM' | 'EQUIPMENT', targetId: string, rooms: StaffRoom[], equipment: StaffEquipment[]) {
  const targets = targetType === 'ROOM' ? rooms : equipment
  return targets.find((target) => target.id === targetId)?.name ?? 'Chưa xác định'
}

export function createIssueId(sequence: number) {
  return `ISS-0701-${String(sequence).padStart(2, '0')}`
}

export function normalizeText(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function mapBackendRoomStatusToStaff(status?: string | null): RoomStatus {
  if (status === 'NEED_CLEANING') return 'CLEANING'
  if (status === 'MAINTENANCE') return 'MAINTENANCE'
  if (status === 'IN_USE') return 'IN_USE'
  return 'AVAILABLE'
}

function mapBackendEquipmentStatus(status: BackendEquipmentStatus): EquipmentStatus {
  if (status === 'BROKEN') return 'BROKEN'
  if (status === 'MAINTENANCE') return 'MAINTENANCE'
  return 'AVAILABLE'
}

function mapBackendEquipmentType(type: BackendEquipmentType): EquipmentType { return type }
function mapRoomTypeToCategory(typeName?: string | null): RoomCategory {
  const normalized = normalizeText(typeName ?? '')
  if (normalized.includes('family')) return 'FAMILY'
  if (normalized.includes('deluxe')) return 'DELUXE'
  return 'STANDARD'
}
