import {
  inferRoomCategoryFromTypeName,
  mapAdminStatusToBackendStatus,
  mapBackendRoomToAdminRoom,
  mapRoomTypeToAdminOption,
} from '@/lib/room-mappers'
import api from '@/lib/api'
import { fetchRoomReviewSummaries } from '@/lib/public-room-review-service'
import {
  createRoomType,
  createRoom,
  deleteRoomType,
  deleteRoom,
  fetchRooms,
  fetchRoomTypes,
  getRoomApiErrorMessage,
  updateRoomType,
  updateRoom,
  updateRoomOperationalStatus,
  uploadRoomImage,
} from '@/lib/rooms-api'
import type {
  AdminRoom,
  AdminRoomTypeOption,
  RoomFormData,
  RoomFormErrors,
  RoomStatus,
  RoomTypeFormData,
  RoomTypeFormErrors,
} from './types'

type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

type BackendRoomRevenueSummary = {
  roomId: number
  revenue: number | string
}

type BackendRevenueUsageReport = {
  rooms?: BackendRoomRevenueSummary[]
}

function pickRoomType(data: RoomFormData, roomTypes: AdminRoomTypeOption[]) {
  if (data.roomTypeId) {
    return roomTypes.find((roomType) => roomType.id === data.roomTypeId) ?? null
  }

  if (data.category) {
    return roomTypes.find((roomType) => roomType.category === data.category) ?? null
  }

  return roomTypes[0] ?? null
}

export function formatRoomPrice(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function validateRoomForm(data: RoomFormData): RoomFormErrors {
  const errors: RoomFormErrors = {}
  const name = data.name.trim()

  if (name.length < 2 || name.length > 100) {
    errors.name = 'Tên phòng phải từ 2-100 ký tự.'
  }

  if (!data.roomTypeId && !data.category) {
    errors.category = 'Vui lòng chọn hạng phòng.'
  }

  if (!data.status) {
    errors.status = 'Vui lòng chọn trạng thái.'
  }

  if (!Number.isFinite(data.capacity) || data.capacity < 1 || data.capacity > 100) {
    errors.capacity = 'Sức chứa phải nằm trong khoảng 1-100 người.'
  }

  if (data.description.length > 500) {
    errors.description = 'Mô tả tối đa 500 ký tự.'
  }

  if (data.image.trim() && !/^https?:\/\/.+/i.test(data.image.trim())) {
    errors.image = 'Đường dẫn ảnh phải bắt đầu bằng http hoặc https.'
  }

  return errors
}

export function validateRoomTypeForm(data: RoomTypeFormData): RoomTypeFormErrors {
  const errors: RoomTypeFormErrors = {}
  const typeName = data.typeName.trim()

  if (typeName.length < 2 || typeName.length > 255) {
    errors.typeName = 'Tên hạng phòng phải từ 2-255 ký tự.'
  }

  if (!Number.isFinite(data.pricePerHour) || data.pricePerHour <= 0) {
    errors.pricePerHour = 'Giá theo giờ phải lớn hơn 0.'
  }

  if (data.description.length > 2000) {
    errors.description = 'Mô tả tối đa 2000 ký tự.'
  }

  return errors
}

export async function getAdminRoomTypes(): Promise<AdminRoomTypeOption[]> {
  try {
    const roomTypes = await fetchRoomTypes()
    return roomTypes.map(mapRoomTypeToAdminOption)
  } catch (error) {
    throw new Error(getRoomApiErrorMessage(error, 'Không thể tải hạng phòng từ hệ thống.'))
  }
}

export async function createAdminRoomType(data: RoomTypeFormData): Promise<AdminRoomTypeOption> {
  const errors = validateRoomTypeForm(data)
  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors)[0])
  }

  try {
    const roomType = await createRoomType({
      typeName: data.typeName.trim(),
      description: normalizeOptionalText(data.description),
      pricePerHour: data.pricePerHour,
    })
    return mapRoomTypeToAdminOption(roomType)
  } catch (error) {
    throw new Error(getRoomApiErrorMessage(error, 'Không thể thêm hạng phòng trên hệ thống.'))
  }
}

export async function updateAdminRoomType(id: number, data: RoomTypeFormData): Promise<AdminRoomTypeOption> {
  const errors = validateRoomTypeForm(data)
  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors)[0])
  }

  try {
    const roomType = await updateRoomType(id, {
      typeName: data.typeName.trim(),
      description: normalizeOptionalText(data.description),
      pricePerHour: data.pricePerHour,
    })
    return mapRoomTypeToAdminOption(roomType)
  } catch (error) {
    throw new Error(getRoomApiErrorMessage(error, 'Không thể cập nhật hạng phòng trên hệ thống.'))
  }
}

export async function deleteAdminRoomType(id: number): Promise<void> {
  try {
    await deleteRoomType(id)
  } catch (error) {
    throw new Error(getRoomApiErrorMessage(error, 'Không thể xóa hạng phòng trên hệ thống.'))
  }
}

export async function getAdminRooms(): Promise<AdminRoom[]> {
  try {
    const [rooms, currentMonthRevenueByRoomId, reviewSummaries] = await Promise.all([
      fetchRooms(),
      fetchCurrentMonthRoomRevenueById().catch(() => new Map<number, number>()),
      fetchRoomReviewSummaries().catch(() => new Map()),
    ])

    return rooms.map((room, index) =>
      mapBackendRoomToAdminRoom(
        room,
        index,
        currentMonthRevenueByRoomId.get(room.id) ?? 0,
        reviewSummaries.get(String(room.id)),
      ),
    )
  } catch (error) {
    throw new Error(getRoomApiErrorMessage(error, 'Không thể tải danh sách phòng từ hệ thống.'))
  }
}

async function fetchCurrentMonthRoomRevenueById() {
  const range = getCurrentMonthRange()
  const response = await api.get<ApiResponse<BackendRevenueUsageReport>>('/api/admin/reports/revenue-usage', {
    params: {
      startDate: range.startDate,
      endDate: range.endDate,
      bucket: 'DAY',
    },
  })

  return new Map(
    (response.data.data.rooms ?? []).map((room) => [
      room.roomId,
      parseAmount(room.revenue),
    ]),
  )
}

export async function createAdminRoom(data: RoomFormData): Promise<AdminRoom> {
  const errors = validateRoomForm(data)
  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors)[0])
  }

  const roomTypes = await getAdminRoomTypes()
  const roomType = pickRoomType(data, roomTypes)

  if (!roomType) {
    throw new Error('Hệ thống chưa có hạng phòng. Vui lòng tạo hạng phòng trước khi thêm phòng.')
  }

  try {
    const room = await createRoom({
      roomName: data.name.trim(),
      roomTypeId: roomType.id,
      maxPeople: data.capacity,
      imageUrl: normalizeOptionalImageUrl(data.image),
      status: mapAdminStatusToBackendStatus(data.status || 'active'),
    })

    return mapBackendRoomToAdminRoom(room)
  } catch (error) {
    throw new Error(getRoomApiErrorMessage(error, 'Không thể thêm phòng trên hệ thống.'))
  }
}

export async function updateAdminRoom(id: string, data: RoomFormData): Promise<AdminRoom | null> {
  const errors = validateRoomForm(data)
  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors)[0])
  }

  const roomTypes = await getAdminRoomTypes()
  const roomType = pickRoomType(data, roomTypes)

  if (!roomType) {
    throw new Error('Hệ thống chưa có hạng phòng để cập nhật.')
  }

  try {
    const room = await updateRoom(id, {
      roomName: data.name.trim(),
      roomTypeId: roomType.id,
      maxPeople: data.capacity,
      imageUrl: normalizeOptionalImageUrl(data.image),
      status: mapAdminStatusToBackendStatus(data.status || 'active'),
    })

    return mapBackendRoomToAdminRoom(room)
  } catch (error) {
    throw new Error(getRoomApiErrorMessage(error, 'Không thể cập nhật phòng trên hệ thống.'))
  }
}

export async function deleteAdminRoom(id: string): Promise<void> {
  try {
    await deleteRoom(id)
  } catch (error) {
    throw new Error(getRoomApiErrorMessage(error, 'Không thể xóa phòng trên hệ thống.'))
  }
}

export async function updateRoomStatus(id: string, status: RoomStatus): Promise<AdminRoom | null> {
  try {
    const room = await updateRoomOperationalStatus(id, mapAdminStatusToBackendStatus(status))
    return mapBackendRoomToAdminRoom(room)
  } catch (error) {
    throw new Error(getRoomApiErrorMessage(error, 'Không thể đổi trạng thái phòng.'))
  }
}

export function toRoomFormData(room: AdminRoom): RoomFormData {
  return {
    name: room.name,
    code: room.code,
    roomTypeId: room.roomTypeId ?? null,
    category: room.category,
    capacity: room.capacity,
    pricePerHour: room.pricePerHour,
    status: room.status,
    description: room.description,
    equipments: room.equipments.join('\n'),
    image: room.imageUrl ?? '',
  }
}

export async function uploadAdminRoomImage(file: File) {
  try {
    return await uploadRoomImage(file)
  } catch (error) {
    throw new Error(getRoomApiErrorMessage(error, 'Không thể tải ảnh phòng lên máy chủ lưu trữ.'))
  }
}

function normalizeOptionalImageUrl(imageUrl: string) {
  const normalized = imageUrl.trim()
  return normalized ? normalized : null
}

function normalizeOptionalText(value: string) {
  const normalized = value.trim()
  return normalized ? normalized : null
}

function getCurrentMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  return {
    startDate: toDateKey(start),
    endDate: toDateKey(end),
  }
}

function toDateKey(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function parseAmount(value: number | string | null | undefined) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function getDefaultRoomForm(roomTypes: AdminRoomTypeOption[] = []): RoomFormData {
  const roomType = roomTypes[0]
  const category = roomType?.category ?? inferRoomCategoryFromTypeName('')

  return {
    ...EMPTY_ROOM_FORM,
    roomTypeId: roomType?.id ?? null,
    category,
    capacity: roomType?.capacity ?? EMPTY_ROOM_FORM.capacity,
    pricePerHour: roomType?.pricePerHour ?? EMPTY_ROOM_FORM.pricePerHour,
  }
}

export const EMPTY_ROOM_FORM: RoomFormData = {
  name: '',
  code: '',
  roomTypeId: null,
  category: 'standard',
  capacity: 1,
  pricePerHour: 0,
  status: 'active',
  description: '',
  equipments: '',
  image: '',
}
