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

export type BackendRoomStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'NEED_CLEANING'
export type FacilityCondition = 'GOOD' | 'NEED_CLEANING' | 'NEED_CHECK' | 'BROKEN'

export type FacilityConditionReport = {
  id: string
  staffId: number
  roomId?: number | null
  equipmentId?: number | null
  condition?: FacilityCondition | null
  note?: string | null
  imageUrl?: string | null
  maintenanceSuggested: boolean
  roomStatusAfterUpdate?: BackendRoomStatus | null
  createdAt: string
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message || fallback
  }

  return fallback
}

export function parseBackendId(id: string | number | null | undefined) {
  const normalized = String(id ?? '').trim()
  if (!/^\d+$/.test(normalized)) return null
  return Number(normalized)
}

export async function updateStaffRoomStatus(
  roomId: number,
  status: BackendRoomStatus,
  note?: string,
): Promise<FacilityConditionReport> {
  try {
    const response = await api.post<ApiResponse<FacilityConditionReport>>(`/api/staff/facility/rooms/${roomId}/status`, {
      status,
      note,
    })

    return response.data.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể đồng bộ trạng thái phòng.'))
  }
}

export async function recordStaffRoomCondition(
  roomId: number,
  condition: FacilityCondition,
  note?: string,
): Promise<FacilityConditionReport> {
  try {
    const response = await api.post<ApiResponse<FacilityConditionReport>>(`/api/staff/facility/rooms/${roomId}/condition`, {
      condition,
      note,
    })

    return response.data.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể ghi nhận tình trạng phòng.'))
  }
}

export async function recordStaffEquipmentCondition(
  equipmentId: number,
  condition: FacilityCondition,
  note?: string,
): Promise<FacilityConditionReport> {
  try {
    const response = await api.post<ApiResponse<FacilityConditionReport>>(
      `/api/staff/facility/equipment/${equipmentId}/condition`,
      {
        condition,
        note,
      },
    )

    return response.data.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể ghi nhận tình trạng tiện nghi.'))
  }
}
