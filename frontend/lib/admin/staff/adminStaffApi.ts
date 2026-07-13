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

export type StaffAccountFormData = {
  fullName: string
  email: string
  phone: string
  dateOfBirth: string
  initialPassword: string
}

export type StaffAccountFormErrors = Partial<Record<keyof StaffAccountFormData, string>>

export type StaffAccountResponse = {
  accountId: number
  staffId: number
  email: string
  fullName: string
  phone?: string | null
  dateOfBirth?: string | null
  avatarUrl?: string | null
  role: string
  emailVerified: boolean
  enabled: boolean
  createdAt?: string | null
  initialPassword?: string | null
}

export type StaffAccountFilters = {
  query: string
  status: 'ALL' | 'ACTIVE' | 'DISABLED'
  verification: 'ALL' | 'VERIFIED' | 'UNVERIFIED'
}

export const EMPTY_STAFF_ACCOUNT_FORM: StaffAccountFormData = {
  fullName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  initialPassword: '',
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message || fallback
  }

  return fallback
}

export function validateStaffAccountForm(data: StaffAccountFormData): StaffAccountFormErrors {
  const errors: StaffAccountFormErrors = {}
  const fullName = data.fullName.trim()
  const email = data.email.trim()
  const password = data.initialPassword.trim()

  if (fullName.length < 2) {
    errors.fullName = 'Tên nhân viên phải có ít nhất 2 ký tự.'
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Email nhân viên không hợp lệ.'
  }

  if (password && password.length < 6) {
    errors.initialPassword = 'Mật khẩu ban đầu phải có ít nhất 6 ký tự.'
  }

  return errors
}

export async function createStaffAccount(data: StaffAccountFormData): Promise<StaffAccountResponse> {
  const errors = validateStaffAccountForm(data)
  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors)[0] || 'Dữ liệu nhân viên không hợp lệ.')
  }

  try {
    const response = await api.post<ApiResponse<StaffAccountResponse>>('/api/admin/staff', {
      fullName: data.fullName.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim() || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
      initialPassword: data.initialPassword.trim() || undefined,
    })

    return response.data.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể tạo tài khoản nhân viên.'))
  }
}

export async function listStaffAccounts(): Promise<StaffAccountResponse[]> {
  try {
    const response = await api.get<ApiResponse<StaffAccountResponse[]>>('/api/admin/staff')
    return response.data.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể tải danh sách nhân viên.'))
  }
}

export async function getStaffAccountDetail(staffId: number): Promise<StaffAccountResponse> {
  try {
    const response = await api.get<ApiResponse<StaffAccountResponse>>(`/api/admin/staff/${staffId}`)
    return response.data.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể tải thông tin nhân viên.'))
  }
}

export async function disableStaffAccount(staffId: number): Promise<StaffAccountResponse> {
  try {
    const response = await api.patch<ApiResponse<StaffAccountResponse>>(`/api/admin/staff/${staffId}/disable`)
    return response.data.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể vô hiệu hóa nhân viên.'))
  }
}

export function formatStaffDate(value?: string | null) {
  if (!value) return 'Chưa có'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}
