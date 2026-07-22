import axios from 'axios'
import api from '@/lib/api'

type ApiResponse<T> = { success: boolean; message: string; data: T }
type ApiErrorResponse = { message?: string }

export type PayrollStatus = 'DRAFT' | 'FINALIZED' | 'PAID'

export type PayrollLine = {
  staffId: number
  fullName: string
  email: string
  enabled: boolean
  workHours: number
  hourlyRate: number
  totalSalary: number
}

export type PayrollReport = {
  year: number
  month: number
  status: PayrollStatus
  totalHours: number
  totalSalary: number
  staff: PayrollLine[]
}

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) return error.response?.data?.message || fallback
  return fallback
}

export async function getPayroll(year: number, month: number): Promise<PayrollReport> {
  try {
    const response = await api.get<ApiResponse<PayrollReport>>('/api/admin/payroll', { params: { year, month } })
    return response.data.data
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Không thể tải bảng lương.'))
  }
}

export async function updateHourlyRate(staffId: number, hourlyRate: number, year: number, month: number) {
  try {
    const response = await api.patch<ApiResponse<PayrollReport>>(
      `/api/admin/payroll/staff/${staffId}/hourly-rate`,
      { hourlyRate },
      { params: { year, month } },
    )
    return response.data.data
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Không thể cập nhật lương theo giờ.'))
  }
}

export async function finalizePayroll(year: number, month: number) {
  try {
    const response = await api.post<ApiResponse<PayrollReport>>(`/api/admin/payroll/${year}/${month}/finalize`)
    return response.data.data
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Không thể chốt bảng lương.'))
  }
}

export async function markPayrollPaid(year: number, month: number) {
  try {
    const response = await api.post<ApiResponse<PayrollReport>>(`/api/admin/payroll/${year}/${month}/mark-paid`)
    return response.data.data
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Không thể đánh dấu đã thanh toán.'))
  }
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency: 'VND', maximumFractionDigits: 0,
  }).format(value)
}
