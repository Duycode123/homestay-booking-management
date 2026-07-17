import axios from 'axios'
import api from '@/lib/api'

type ApiResponse<T> = { success: boolean; message: string; data: T }

export type AppNotification = {
  id: number
  type: string
  title: string
  message: string
  createdAt: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  actionUrl: string
  isRead: boolean
  isResolved: boolean
}

function errorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || fallback
  }
  return fallback
}

export async function getNotifications(limit = 30) {
  try {
    const response = await api.get<ApiResponse<AppNotification[]>>('/api/notifications', { params: { limit } })
    return response.data.data ?? []
  } catch (error) {
    throw new Error(errorMessage(error, 'Không thể tải thông báo.'))
  }
}

export async function markNotificationRead(id: number) {
  try {
    const response = await api.patch<ApiResponse<AppNotification>>(`/api/notifications/${id}/read`)
    return response.data.data
  } catch (error) {
    throw new Error(errorMessage(error, 'Không thể đánh dấu thông báo đã đọc.'))
  }
}

export async function markAllNotificationsRead(limit = 30) {
  try {
    const response = await api.patch<ApiResponse<AppNotification[]>>('/api/notifications/read-all', undefined, { params: { limit } })
    return response.data.data ?? []
  } catch (error) {
    throw new Error(errorMessage(error, 'Không thể đánh dấu tất cả thông báo đã đọc.'))
  }
}

export const NOTIFICATION_CHANGED_EVENT = 'serene-notifications-changed'

export function notifyNotificationChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(NOTIFICATION_CHANGED_EVENT))
}
