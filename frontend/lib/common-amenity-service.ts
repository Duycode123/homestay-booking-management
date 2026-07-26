import api from '@/lib/api'

export type CommonAmenity = {
  id: number
  name: string
  description: string
  iconName: string
  imageUrl?: string | null
  displayOrder: number
  active: boolean
  roomIds: number[]
}

type ApiResponse<T> = { data?: T }

export async function fetchCommonAmenities(roomId?: string | number) {
  const response = await api.get<ApiResponse<CommonAmenity[]>>('/api/rooms/common-amenities', {
    params: roomId == null ? undefined : { roomId },
  })
  return response.data.data ?? []
}
