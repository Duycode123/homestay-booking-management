import api from '@/lib/api'
import { uploadRoomImage } from '@/lib/rooms-api'
import type { CommonAmenity } from '@/lib/common-amenity-service'

type ApiResponse<T> = { data?: T; message?: string }

export type CommonAmenityForm = {
  name: string
  description: string
  iconName: string
  imageUrl: string
  displayOrder: number
  active: boolean
}

function data<T>(payload: ApiResponse<T>) {
  return payload.data as T
}

export async function fetchAdminCommonAmenities() {
  const response = await api.get<ApiResponse<CommonAmenity[]>>('/api/admin/common-amenities')
  return data(response.data) ?? []
}

export async function createCommonAmenity(form: CommonAmenityForm) {
  const response = await api.post<ApiResponse<CommonAmenity>>('/api/admin/common-amenities', form)
  return data(response.data)
}

export async function updateCommonAmenity(id: number, form: CommonAmenityForm) {
  const response = await api.put<ApiResponse<CommonAmenity>>(`/api/admin/common-amenities/${id}`, form)
  return data(response.data)
}

export async function deleteCommonAmenity(id: number) {
  await api.delete(`/api/admin/common-amenities/${id}`)
}

export async function uploadCommonAmenityImage(file: File) {
  return uploadRoomImage(file)
}

export function commonAmenityError(error: unknown) {
  const candidate = error as { message?: string; response?: { data?: { message?: string } } }
  return candidate.response?.data?.message || candidate.message || 'Không thể cập nhật tiện nghi chung.'
}
