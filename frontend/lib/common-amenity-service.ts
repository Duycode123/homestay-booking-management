import api from '@/lib/api'

export type CommonAmenity = {
  id: number
  name: string
  description: string
  iconName: string
  imageUrl?: string | null
  displayOrder: number
  active: boolean
}

type ApiResponse<T> = { data?: T }

export async function fetchCommonAmenities() {
  const response = await api.get<ApiResponse<CommonAmenity[]>>('/api/rooms/common-amenities')
  return response.data.data ?? []
}
