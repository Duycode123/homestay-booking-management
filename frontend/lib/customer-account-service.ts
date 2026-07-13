import axios from 'axios'
import api from '@/lib/api'

export type CustomerBookingStatus = 'PENDING_PAYMENT' | 'PAID' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED'

export type CustomerBookingSummary = {
  id: string
  code: string
  roomName: string
  date: string
  timeRange: string
  total: number
  status: CustomerBookingStatus
}

export type ReportIssueType = 'ROOM' | 'EQUIPMENT' | 'PAYMENT' | 'ACCOUNT' | 'OTHER'

export type ReportIssuePayload = {
  issueType: ReportIssueType
  bookingCode: string
  description: string
}

type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

type PagedResponse<T> = {
  content: T[]
}

type BackendBooking = {
  bookingId: number
  bookingCode: string
  roomName: string
  startTime: string
  endTime: string
  totalAmount: number | string
  status: CustomerBookingStatus
}

type ApiErrorResponse = {
  message?: string
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message || fallback
  }

  return fallback
}

function parseAmount(value: number | string | null | undefined) {
  const normalized = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(normalized) ? Number(normalized) : 0
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function mapBooking(booking: BackendBooking): CustomerBookingSummary {
  return {
    id: String(booking.bookingId),
    code: booking.bookingCode,
    roomName: booking.roomName,
    date: formatDate(booking.startTime),
    timeRange: `${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}`,
    total: parseAmount(booking.totalAmount),
    status: booking.status,
  }
}

export function formatBookingStatus(status: CustomerBookingStatus) {
  const labels: Record<CustomerBookingStatus, string> = {
    PENDING_PAYMENT: 'Chờ thanh toán',
    PAID: 'Đã thanh toán',
    CHECKED_IN: 'Đã check-in',
    COMPLETED: 'Hoàn tất',
    CANCELLED: 'Đã hủy',
  }

  return labels[status]
}

export async function fetchCustomerBookings(): Promise<CustomerBookingSummary[]> {
  try {
    const response = await api.get<ApiResponse<PagedResponse<BackendBooking>>>('/api/bookings/my/history', {
      params: { size: 50 },
    })

    return (response.data.data?.content ?? []).map(mapBooking)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể tải danh sách booking của bạn.'))
  }
}

export async function submitCustomerIssueReport(payload: ReportIssuePayload): Promise<void> {
  try {
    await api.post('/api/customer/report-issue', {
      issueType: payload.issueType,
      bookingCode: payload.bookingCode.trim() || undefined,
      description: payload.description.trim(),
    })
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể gửi báo cáo sự cố.'))
  }
}
