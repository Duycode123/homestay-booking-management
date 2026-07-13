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

export type BackendAttendanceStatus = 'WORKING' | 'DONE' | 'MISSING_CHECKOUT'

export type StaffScheduleShift = {
  shiftId: number
  date: string
  startTime: string
  endTime: string
}

export type StaffShiftBooking = {
  bookingId: number
  roomName: string
  customerName: string
  startTime: string
  endTime: string
  status: string
  equipmentNotes?: string | null
}

export type StaffAttendanceRecord = {
  attendanceId: string
  staffId: number
  shiftId: number
  checkInTime: string
  checkOutTime?: string | null
  workDuration?: number | string | null
  status: BackendAttendanceStatus
}

export type ShiftRegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type ShiftRegistrationSlot = {
  workDate: string
  startTime: string
  endTime: string
}

export type StaffShiftRegistration = ShiftRegistrationSlot & {
  id: number
  staffId: number
  staffName?: string | null
  staffEmail?: string | null
  status: ShiftRegistrationStatus
  reviewedByAccountId?: number | null
  reviewedAt?: string | null
  rejectionReason?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message || fallback
  }

  return fallback
}

export async function fetchStaffSchedule(fromDate: string, toDate: string): Promise<StaffScheduleShift[]> {
  try {
    const response = await api.get<ApiResponse<StaffScheduleShift[]>>('/api/staff/schedule/shifts', {
      params: {
        fromDate,
        toDate,
      },
    })

    return response.data.data ?? []
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể tải lịch làm việc.'))
  }
}

export async function fetchMyShiftRegistrations(fromDate: string, toDate: string): Promise<StaffShiftRegistration[]> {
  try {
    const response = await api.get<ApiResponse<StaffShiftRegistration[]>>('/api/staff/shift-registrations/my', {
      params: {
        fromDate,
        toDate,
      },
    })

    return response.data.data ?? []
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Khong the tai danh sach dang ky ca lam.'))
  }
}

export async function submitShiftRegistrations(slots: ShiftRegistrationSlot[]): Promise<StaffShiftRegistration[]> {
  try {
    const response = await api.post<ApiResponse<StaffShiftRegistration[]>>('/api/staff/shift-registrations', {
      slots,
    })

    return response.data.data ?? []
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Khong the dang ky ca lam.'))
  }
}

export async function fetchShiftBookings(shiftId: number): Promise<StaffShiftBooking[]> {
  try {
    const response = await api.get<ApiResponse<StaffShiftBooking[]>>(`/api/staff/schedule/shifts/${shiftId}/bookings`)
    return response.data.data ?? []
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể tải booking trong ca làm.'))
  }
}

export async function fetchCurrentAttendance(): Promise<StaffAttendanceRecord | null> {
  try {
    const response = await api.get<ApiResponse<StaffAttendanceRecord | null>>('/api/staff/attendance/current')
    return response.data.data ?? null
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể tải dữ liệu chấm công hiện tại.'))
  }
}

export async function checkInCurrentShift(): Promise<StaffAttendanceRecord> {
  try {
    const response = await api.post<ApiResponse<StaffAttendanceRecord>>('/api/staff/attendance/check-in')
    return response.data.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể check-in ca làm.'))
  }
}

export async function checkOutCurrentShift(): Promise<StaffAttendanceRecord> {
  try {
    const response = await api.post<ApiResponse<StaffAttendanceRecord>>('/api/staff/attendance/check-out')
    return response.data.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể check-out ca làm.'))
  }
}
