'use client'

import { useCallback, useEffect, useState } from 'react'
import AdminStatCard from '@/components/admin/AdminStatCard'
import { IconBookings, IconReports, IconRooms } from '@/components/admin/AdminIcons'
import { formatAdminPrice } from '@/lib/admin/adminBookingApi'
import { defaultReportDateRange, fetchAdminReport } from '@/lib/admin/adminReportsApi'
import type { AdminReportData, ReportDateRange } from '@/lib/admin/reportsTypes'
import ReportsChartPanel from './ReportsChartPanel'
import ReportsDateRangePicker from './ReportsDateRangePicker'
import RevenueLineChart from './RevenueLineChart'
import TopRoomsBarChart from './TopRoomsBarChart'

type AdminReportsOverviewProps = {
  className?: string
}

export default function AdminReportsOverview({ className }: AdminReportsOverviewProps) {
  const [dateRange, setDateRange] = useState<ReportDateRange>(defaultReportDateRange)
  const [report, setReport] = useState<AdminReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const loadReport = useCallback(async () => {
    if (!dateRange.startDate || !dateRange.endDate || dateRange.startDate > dateRange.endDate) {
      setReport(null)
      setErrorMessage('Khoảng thời gian không hợp lệ.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      const data = await fetchAdminReport(dateRange)
      setReport(data)
      setErrorMessage('')
    } catch (error) {
      setReport(null)
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải báo cáo.')
    } finally {
      setIsLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadReport(), 200)
    return () => window.clearTimeout(timer)
  }, [loadReport])

  const hasOrders = (report?.totalOrders ?? 0) > 0
  const hasRevenue = (report?.totalRevenue ?? 0) > 0
  const topRoom = report?.topRooms[0] ?? null

  return (
    <div className={['space-y-6', className].filter(Boolean).join(' ')}>
      {errorMessage && (
        <div className="rounded-xl border border-error/30 bg-error-container/30 px-4 py-3 text-sm text-error">
          {errorMessage}
        </div>
      )}

      <ReportsDateRangePicker value={dateRange} onChange={setDateRange} disabled={isLoading} />

      <div className="grid gap-4 xl:grid-cols-3">
        <AdminStatCard
          label="Tổng doanh thu"
          value={isLoading ? '...' : formatAdminPrice(report?.totalRevenue ?? 0)}
          hint="Chỉ tính các đơn đã thanh toán thành công trong kỳ"
          accent="primary"
          icon={<IconReports className="h-5 w-5" />}
        />
        <AdminStatCard
          label="Tổng đơn đặt"
          value={isLoading ? '...' : report?.totalOrders ?? 0}
          hint="Không tính đơn chưa thanh toán hoặc đã hủy"
          accent="secondary"
          icon={<IconBookings className="h-5 w-5" />}
        />
        <AdminStatCard
          label="Phòng dẫn đầu"
          value={isLoading ? '...' : topRoom?.roomName ?? '-'}
          hint={
            isLoading
              ? 'Đang tổng hợp'
              : topRoom
                ? `${topRoom.orderCount} lượt đặt thành công`
                : 'Chưa có phòng nổi bật trong kỳ'
          }
          accent="tertiary"
          icon={<IconRooms className="h-5 w-5" />}
        />
      </div>

      <ReportsChartPanel
        title="Doanh thu theo ngày"
        description="Di chuột vào từng điểm để xem doanh thu và số đơn của ngày đó."
        isLoading={isLoading}
        isEmpty={!isLoading && !hasRevenue}
        emptyTitle="Chưa có doanh thu trong kỳ"
        emptyDescription="Chưa ghi nhận đơn thanh toán thành công trong khoảng thời gian này."
      >
        {report && <RevenueLineChart data={report.dailyRevenue} />}
      </ReportsChartPanel>

      <ReportsChartPanel
        title="Tần suất sử dụng phòng"
        description="Top phòng được đặt nhiều nhất trong khoảng thời gian đã chọn."
        isLoading={isLoading}
        isEmpty={!isLoading && report?.topRooms.length === 0}
        emptyTitle="Chưa có dữ liệu phòng"
        emptyDescription="Chưa có lượt đặt thành công nào để xếp hạng phòng trong kỳ này."
      >
        {report && report.topRooms.length > 0 && <TopRoomsBarChart data={report.topRooms} />}
      </ReportsChartPanel>

      {!isLoading && !errorMessage && !hasOrders && (
        <div className="rounded-xl border border-outline-variant bg-surface-container-low/60 px-4 py-3 text-sm text-on-surface-variant">
          Không có đơn đặt phòng nào trong khoảng thời gian đã chọn.
        </div>
      )}
    </div>
  )
}
