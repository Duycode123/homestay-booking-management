export type IncidentReportStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

export type IncidentPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export type IncidentReport = {
  id: string
  reportCode: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  roomId: string
  roomName: string
  bookingId?: string
  title: string
  description: string
  priority: IncidentPriority
  status: IncidentReportStatus
  submittedAt: string
  evidenceImages: string[]
  adminNote: string
}

export type IncidentReportFilters = {
  query: string
  status: IncidentReportStatus | 'ALL'
  priority: IncidentPriority | 'ALL'
  roomId: string
  submittedDate: string
}

export type IncidentReportStats = {
  total: number
  newCount: number
  inProgress: number
  resolved: number
  highPriority: number
}

export type IncidentRoomOption = {
  roomId: string
  roomName: string
}

