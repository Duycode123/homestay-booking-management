import axios from 'axios'
import api from '@/lib/api'

export type FavoriteRoom = {
  roomId: number
  roomName: string
  roomType?: string | null
  maxPeople?: number | null
  pricePerHour?: number | null
  imageUrl?: string | null
  addedAt: string
}

type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

function errorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || fallback
  }
  return fallback
}

export async function fetchFavoriteRooms() {
  try {
    const response = await api.get<ApiResponse<FavoriteRoom[]>>('/api/favorites')
    return response.data.data ?? []
  } catch (error) {
    throw new Error(errorMessage(error, 'Không thể tải danh sách yêu thích.'))
  }
}

export async function addFavoriteRoom(roomId: number) {
  try {
    const response = await api.post<ApiResponse<FavoriteRoom>>(`/api/favorites/${roomId}`)
    return response.data.data
  } catch (error) {
    throw new Error(errorMessage(error, 'Không thể thêm phòng vào danh sách yêu thích.'))
  }
}

export async function removeFavoriteRoom(roomId: number) {
  try {
    await api.delete(`/api/favorites/${roomId}`)
  } catch (error) {
    throw new Error(errorMessage(error, 'Không thể xóa phòng khỏi danh sách yêu thích.'))
  }
}
