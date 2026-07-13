export type ReportDateRange = {
  startDate: string
  endDate: string
}

export type DailyRevenuePoint = {
  date: string
  label: string
  revenue: number
  orderCount: number
}

export type TopRoomPoint = {
  roomId: number
  roomName: string
  roomTypeName?: string
  orderCount: number
}

export type AdminReportData = {
  totalRevenue: number
  totalOrders: number
  dailyRevenue: DailyRevenuePoint[]
  topRooms: TopRoomPoint[]
}
