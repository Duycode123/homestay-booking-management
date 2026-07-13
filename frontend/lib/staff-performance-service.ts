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

export type StaffPerformanceRange = 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH'

export type StaffPerformanceResponse = {
  fromDate: string
  toDate: string
  worklog: {
    totalShifts: number
    totalHours: number | string
    lateCount: number
    missingCheckout: number
  }
  reviews: {
    avgRating?: number | string | null
    items: Array<{
      rating: number
      content: string
      bookingId?: number | null
      createdAt: string
    }>
  }
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message || fallback
  }

  return fallback
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function getStaffPerformanceDateRange(range: StaffPerformanceRange) {
  const today = new Date()
  const fromDate = new Date(today)

  if (range === 'THIS_WEEK') {
    const day = today.getDay()
    const mondayOffset = day === 0 ? -6 : 1 - day
    fromDate.setDate(today.getDate() + mondayOffset)
  }

  if (range === 'THIS_MONTH') {
    fromDate.setDate(1)
  }

  return {
    fromDate: formatDate(fromDate),
    toDate: formatDate(today),
  }
}

export async function fetchMyStaffPerformance(range: StaffPerformanceRange): Promise<StaffPerformanceResponse> {
  const params = getStaffPerformanceDateRange(range)

  try {
    const response = await api.get<ApiResponse<StaffPerformanceResponse>>('/api/staff/performance', {
      params,
    })

    return response.data.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Khong the tai bao cao hieu suat nhan vien.'))
  }
}
