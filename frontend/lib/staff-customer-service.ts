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

export type BackendStaffCustomerBooking = {
  id: number
  code: string
  customerId: number
  roomName: string
  date: string
  startTime: string
  endTime: string
  totalPrice: number | string
  status: string
}

export type BackendStaffCustomerSummary = {
  id: number
  name: string
  phone?: string | null
  email?: string | null
  type: 'NEW' | 'RETURNING' | 'VIP'
  bookingCount: number
  lastBookingAt?: string | null
  favoriteRoom?: string | null
  hasTodayBooking: boolean
  recentBookings: BackendStaffCustomerBooking[]
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message || fallback
  }

  return fallback
}

export async function fetchStaffCustomers(): Promise<BackendStaffCustomerSummary[]> {
  try {
    const response = await api.get<ApiResponse<BackendStaffCustomerSummary[]>>('/api/staff/customers')
    return response.data.data ?? []
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Khong the tai danh sach khach hang.'))
  }
}
