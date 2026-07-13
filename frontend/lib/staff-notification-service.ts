import axios from 'axios'
import api from '@/lib/api'

type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

type ApiErrorResponse = {
  message?: string
}

export type BackendStaffNotification = {
  id: number
  type: string
  title: string
  message: string
  createdAt: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  isRead: boolean
  isResolved: boolean
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message || fallback
  }

  return fallback
}

export async function fetchStaffNotifications(): Promise<BackendStaffNotification[]> {
  try {
    const response = await api.get<ApiResponse<BackendStaffNotification[]>>('/api/staff/notifications')
    return response.data.data ?? []
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Khong the tai thong bao nhan vien.'))
  }
}

export async function markStaffNotificationRead(id: string): Promise<BackendStaffNotification> {
  try {
    const response = await api.patch<ApiResponse<BackendStaffNotification>>(`/api/staff/notifications/${id}/read`)
    return response.data.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Khong the danh dau thong bao da doc.'))
  }
}

export async function resolveStaffNotification(id: string): Promise<BackendStaffNotification> {
  try {
    const response = await api.patch<ApiResponse<BackendStaffNotification>>(`/api/staff/notifications/${id}/resolve`)
    return response.data.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Khong the cap nhat thong bao da xu ly.'))
  }
}

export async function markAllStaffNotificationsRead(): Promise<BackendStaffNotification[]> {
  try {
    const response = await api.patch<ApiResponse<BackendStaffNotification[]>>('/api/staff/notifications/read-all')
    return response.data.data ?? []
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Khong the danh dau tat ca thong bao da doc.'))
  }
}
