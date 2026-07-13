import api from '@/lib/api'

export type BackendRoomStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE'

export type BackendRoomType = {
  id: number
  typeName: string
  description?: string | null
  pricePerHour?: number | string | null
  capacity?: number | null
}

export type BackendRoom = {
  id: number
  roomName: string
  roomType?: BackendRoomType | null
  floor?: number | null
  maxPeople?: number | null
  status?: BackendRoomStatus | null
  description?: string | null
  imageUrl?: string | null
}

type ApiResponse<T> = {
  success?: boolean
  message?: string
  data?: T
}

export type CreateBackendRoomPayload = {
  roomName: string
  roomTypeId: number
  maxPeople: number
  imageUrl?: string | null
  status?: BackendRoomStatus
}

export type UpdateBackendRoomPayload = {
  roomName: string
  roomTypeId: number
  maxPeople: number
  imageUrl?: string | null
  status: BackendRoomStatus
}

export type SaveBackendRoomTypePayload = {
  typeName: string
  description?: string | null
  pricePerHour: number
}

export type RoomImageUploadResult = {
  publicId: string
  secureUrl: string
}

function readApiData<T>(payload: T | ApiResponse<T>): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiResponse<T>).data as T
  }

  return payload as T
}

export async function fetchRooms(params?: {
  roomTypeId?: number
  status?: BackendRoomStatus
}) {
  const response = await api.get<ApiResponse<BackendRoom[]> | BackendRoom[]>('/api/rooms', {
    params,
  })

  return readApiData(response.data) ?? []
}

export async function fetchRoom(roomId: string | number) {
  const normalizedRoomId = String(roomId).trim()

  if (!/^\d+$/.test(normalizedRoomId)) {
    return null
  }

  const response = await api.get<ApiResponse<BackendRoom> | BackendRoom>(`/api/rooms/${normalizedRoomId}`)
  return readApiData(response.data)
}

export async function fetchRoomTypes() {
  const response = await api.get<ApiResponse<BackendRoomType[]> | BackendRoomType[]>('/api/room-types')
  return readApiData(response.data) ?? []
}

export async function createRoomType(payload: SaveBackendRoomTypePayload) {
  const response = await api.post<ApiResponse<BackendRoomType> | BackendRoomType>('/api/room-types', payload)
  return readApiData(response.data)
}

export async function updateRoomType(roomTypeId: string | number, payload: SaveBackendRoomTypePayload) {
  const response = await api.put<ApiResponse<BackendRoomType> | BackendRoomType>(`/api/room-types/${roomTypeId}`, payload)
  return readApiData(response.data)
}

export async function deleteRoomType(roomTypeId: string | number) {
  await api.delete(`/api/room-types/${roomTypeId}`)
}

export async function createRoom(payload: CreateBackendRoomPayload) {
  const response = await api.post<ApiResponse<BackendRoom> | BackendRoom>('/api/rooms', payload)
  return readApiData(response.data)
}

export async function updateRoom(roomId: string | number, payload: UpdateBackendRoomPayload) {
  const response = await api.put<ApiResponse<BackendRoom> | BackendRoom>(`/api/rooms/${roomId}`, payload)
  return readApiData(response.data)
}

export async function uploadRoomImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post<ApiResponse<RoomImageUploadResult> | RoomImageUploadResult>(
    '/api/admin/room-images',
    formData,
  )

  return readApiData(response.data)
}

export async function updateRoomOperationalStatus(roomId: string | number, status: BackendRoomStatus) {
  const response = await api.patch<ApiResponse<BackendRoom> | BackendRoom>(
    `/api/rooms/${roomId}/status`,
    null,
    { params: { status } },
  )
  return readApiData(response.data)
}

export async function deleteRoom(roomId: string | number) {
  await api.delete(`/api/rooms/${roomId}`)
}

export function getRoomApiErrorMessage(error: unknown, fallback = 'Không thể kết nối API phòng.') {
  const maybeError = error as {
    message?: string
    response?: {
      data?: {
        message?: string
        error?: string
      }
    }
  }

  return maybeError.response?.data?.message || maybeError.response?.data?.error || maybeError.message || fallback
}
