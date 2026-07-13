import api from '@/lib/api'
import type {
  IncidentReport,
  IncidentReportFilters,
  IncidentReportStats,
  IncidentReportStatus,
  IncidentRoomOption,
} from './types'

type ApiResponse<T> = {
  success: boolean
  message?: string
  data: T
}

type IncidentReportApiResponse = Omit<IncidentReport, 'evidenceImages' | 'adminNote'> & {
  evidenceImages?: string[] | null
  adminNote?: string | null
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response
    return response?.data?.message || fallback
  }

  return fallback
}

export async function fetchAdminIncidentReports(filters: IncidentReportFilters): Promise<IncidentReport[]> {
  try {
    const response = await api.get<ApiResponse<IncidentReportApiResponse[]>>('/api/admin/incident-reports', {
      params: {
        query: filters.query || undefined,
        status: filters.status === 'ALL' ? undefined : filters.status,
        priority: filters.priority === 'ALL' ? undefined : filters.priority,
        roomId: filters.roomId === 'ALL' ? undefined : filters.roomId,
        submittedDate: filters.submittedDate || undefined,
      },
    })

    return (response.data.data ?? []).map(normalizeIncidentReport)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể tải danh sách báo cáo sự cố.'))
  }
}

export async function fetchAdminIncidentReportDetail(id: string): Promise<IncidentReport | null> {
  try {
    const response = await api.get<ApiResponse<IncidentReportApiResponse>>(`/api/admin/incident-reports/${id}`)
    return response.data.data ? normalizeIncidentReport(response.data.data) : null
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể tải chi tiết báo cáo sự cố.'))
  }
}

export async function updateAdminIncidentReportStatus(
  report: IncidentReport,
  status: IncidentReportStatus,
  adminNote: string,
): Promise<IncidentReport> {
  try {
    const response = await api.patch<ApiResponse<IncidentReportApiResponse>>(`/api/admin/incident-reports/${report.id}/status`, {
      status,
      adminNote,
    })

    return normalizeIncidentReport(response.data.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể cập nhật báo cáo sự cố.'))
  }
}

export function getIncidentReportStats(reports: IncidentReport[]): IncidentReportStats {
  return {
    total: reports.length,
    newCount: reports.filter((report) => report.status === 'NEW').length,
    inProgress: reports.filter((report) => report.status === 'IN_PROGRESS').length,
    resolved: reports.filter((report) => report.status === 'RESOLVED').length,
    highPriority: reports.filter((report) => report.priority === 'HIGH').length,
  }
}

export function getIncidentRoomOptions(reports: IncidentReport[]): IncidentRoomOption[] {
  return Array.from(new Map(reports.map((report) => [report.roomId, report.roomName])).entries())
    .filter(([roomId]) => roomId !== 'none')
    .map(([roomId, roomName]) => ({ roomId, roomName }))
}

export function formatIncidentDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN')
}

function normalizeIncidentReport(report: IncidentReportApiResponse): IncidentReport {
  return {
    ...report,
    evidenceImages: Array.isArray(report.evidenceImages) ? report.evidenceImages : [],
    adminNote: report.adminNote ?? '',
  }
}
