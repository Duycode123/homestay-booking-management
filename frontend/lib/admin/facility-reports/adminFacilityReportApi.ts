import api from '@/lib/api'
import type { AdminFacilityReport, FacilityReportStats, FacilityReportStatus } from './types'

type ApiResponse<T> = {
  success: boolean
  message?: string
  data: T
}

type AdminFacilityReportApiResponse = Omit<AdminFacilityReport, 'adminNote' | 'status'> & {
  adminNote?: string | null
  status?: FacilityReportStatus | null
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response
    return response?.data?.message || fallback
  }

  return fallback
}

export async function fetchAdminFacilityReports(maintenanceSuggested?: boolean): Promise<AdminFacilityReport[]> {
  try {
    const response = await api.get<ApiResponse<AdminFacilityReportApiResponse[]>>('/api/admin/facility/condition-reports', {
      params: {
        maintenanceSuggested,
        limit: 100,
      },
    })

    return (response.data.data ?? []).map(normalizeFacilityReport)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể tải lịch sử báo cáo cơ sở vật chất.'))
  }
}

export async function updateAdminFacilityReportStatus(
  reportId: string,
  status: FacilityReportStatus,
  adminNote: string,
): Promise<AdminFacilityReport> {
  try {
    const response = await api.patch<ApiResponse<AdminFacilityReportApiResponse>>(
      `/api/admin/facility/condition-reports/${reportId}/status`,
      {
        status,
        adminNote,
      },
    )

    return normalizeFacilityReport(response.data.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể cập nhật báo cáo cơ sở vật chất.'))
  }
}

export function getFacilityReportStats(reports: AdminFacilityReport[]): FacilityReportStats {
  return {
    total: reports.length,
    open: reports.filter((report) => report.status === 'OPEN').length,
    inProgress: reports.filter((report) => report.status === 'IN_PROGRESS').length,
    resolved: reports.filter((report) => ['RESOLVED', 'CLOSED'].includes(report.status)).length,
    maintenanceSuggested: reports.filter((report) => report.maintenanceSuggested).length,
  }
}

export function formatFacilityReportDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN')
}

function normalizeFacilityReport(report: AdminFacilityReportApiResponse): AdminFacilityReport {
  return {
    ...report,
    status: report.status ?? 'OPEN',
    adminNote: report.adminNote ?? '',
  }
}
