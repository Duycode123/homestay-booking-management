export type FacilityCondition = 'GOOD' | 'NEED_CLEANING' | 'NEED_CHECK' | 'BROKEN'
export type FacilityReportStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
export type FacilityReportPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export type AdminFacilityReport = {
  id: string
  staffId: number
  roomId?: number | null
  equipmentId?: number | null
  condition?: FacilityCondition | null
  note?: string | null
  imageUrl?: string | null
  maintenanceSuggested: boolean
  roomStatusAfterUpdate?: string | null
  status: FacilityReportStatus
  adminNote: string
  resolvedAt?: string | null
  createdAt: string
}

export type FacilityReportStats = {
  total: number
  open: number
  inProgress: number
  resolved: number
  maintenanceSuggested: number
}
