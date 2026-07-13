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

export type AdminShiftRegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type AdminShiftRegistrationStatusFilter = AdminShiftRegistrationStatus | 'ALL'

export type AdminShiftRegistration = {
  id: number
  staffId: number
  staffName: string
  staffEmail: string
  workDate: string
  startTime: string
  endTime: string
  status: AdminShiftRegistrationStatus
  reviewedByAccountId?: number | null
  reviewedAt?: string | null
  rejectionReason?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type ShiftRegistrationFilters = {
  status: AdminShiftRegistrationStatusFilter
  fromDate: string
  toDate: string
  staffId: string
  query: string
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message || fallback
  }

  return fallback
}

function normalizeTime(value: string) {
  if (!value) return '00:00'
  const [hours = '00', minutes = '00'] = value.split(':')
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
}

function normalizeText(value?: string | null) {
  return value?.trim() || ''
}

function mapRegistration(item: AdminShiftRegistration): AdminShiftRegistration {
  return {
    ...item,
    staffName: normalizeText(item.staffName) || `Nhân viên #${item.staffId}`,
    staffEmail: normalizeText(item.staffEmail),
    startTime: normalizeTime(item.startTime),
    endTime: normalizeTime(item.endTime),
    rejectionReason: normalizeText(item.rejectionReason) || null,
  }
}

function applyClientFilters(items: AdminShiftRegistration[], filters: ShiftRegistrationFilters) {
  const query = filters.query.trim().toLowerCase()

  return items.filter((item) => {
    if (!query) return true

    return (
      item.staffName.toLowerCase().includes(query) ||
      item.staffEmail.toLowerCase().includes(query) ||
      String(item.staffId).includes(query) ||
      String(item.id).includes(query)
    )
  })
}

export async function fetchAdminShiftRegistrations(
  filters: ShiftRegistrationFilters,
): Promise<AdminShiftRegistration[]> {
  try {
    const response = await api.get<ApiResponse<AdminShiftRegistration[]>>('/api/admin/shift-registrations', {
      params: {
        status: filters.status !== 'ALL' ? filters.status : undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
        staffId: filters.staffId.trim() || undefined,
      },
    })

    return applyClientFilters((response.data.data ?? []).map(mapRegistration), filters)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể tải danh sách đăng ký ca làm.'))
  }
}

export async function decideAdminShiftRegistration(
  registrationId: number,
  approved: boolean,
  rejectionReason?: string,
): Promise<AdminShiftRegistration> {
  const normalizedReason = normalizeText(rejectionReason)

  if (!approved && !normalizedReason) {
    throw new Error('Vui lòng nhập lý do từ chối.')
  }

  try {
    const response = await api.patch<ApiResponse<AdminShiftRegistration>>(
      `/api/admin/shift-registrations/${registrationId}/decision`,
      {
        approved,
        rejectionReason: approved ? undefined : normalizedReason,
      },
    )

    return mapRegistration(response.data.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, approved ? 'Không thể duyệt ca làm.' : 'Không thể từ chối ca làm.'))
  }
}

