import api from '@/lib/api'

type ApiResponse<T> = {
  success?: boolean
  message?: string
  data?: T
}

export type PublicRoomEquipment = {
  id: number
  roomId: number
  roomName: string
  type: string
  name: string
  status: string
  notes?: string | null
}

function readApiData<T>(payload: T | ApiResponse<T>): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiResponse<T>).data as T
  }

  return payload as T
}

export async function fetchPublicRoomEquipment(params?: { roomId?: number | string }) {
  const response = await api.get<ApiResponse<PublicRoomEquipment[]> | PublicRoomEquipment[]>(
    '/api/rooms/equipment',
    { params },
  )

  return readApiData(response.data) ?? []
}
