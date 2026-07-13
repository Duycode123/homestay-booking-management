import type { IncidentPriority, IncidentReportStatus } from './types'

export const INCIDENT_STATUS_LABELS: Record<IncidentReportStatus, string> = {
  NEW: 'Mới gửi',
  IN_PROGRESS: 'Đang xử lý',
  RESOLVED: 'Đã xử lý',
  CLOSED: 'Đã đóng',
}

export const INCIDENT_PRIORITY_LABELS: Record<IncidentPriority, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
}

export const INCIDENT_STATUS_OPTIONS: IncidentReportStatus[] = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

export const INCIDENT_PRIORITY_OPTIONS: IncidentPriority[] = ['LOW', 'MEDIUM', 'HIGH']

export const INCIDENT_STATUS_STYLES: Record<IncidentReportStatus, string> = {
  NEW: 'border-brand-orange/30 bg-primary-container/35 text-brand-orange',
  IN_PROGRESS: 'border-tertiary/25 bg-tertiary-container/50 text-tertiary',
  RESOLVED: 'border-secondary/25 bg-secondary-container/40 text-secondary',
  CLOSED: 'border-outline-variant bg-surface-container text-on-surface-variant',
}

export const INCIDENT_PRIORITY_STYLES: Record<IncidentPriority, string> = {
  LOW: 'border-secondary/20 bg-secondary-container/30 text-secondary',
  MEDIUM: 'border-tertiary/25 bg-tertiary-container/45 text-tertiary',
  HIGH: 'border-error/30 bg-error-container/45 text-error',
}
