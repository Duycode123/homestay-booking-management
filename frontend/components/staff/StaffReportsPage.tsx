'use client'

import ProjectSelect from '@/components/ui/ProjectSelect'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { EmptyState, StaffPageShell, StatCard, StatusBadge, Toast } from './StaffShared'
import { fetchMyStaffPerformance, type StaffPerformanceResponse } from '@/lib/staff-performance-service'

type ReportRange = 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH'

type StaffReportSummary = {
  totalShifts: number
  handledBookings: number
  checkInRate: number
  noShowCount: number
  reportedIssues: number
  resolvedIssues: number
}

type ShiftPerformance = {
  name: string
  checkIn: string
  checkOut: string
  duration: string
  status: 'ON_TIME' | 'LATE' | 'DONE' | 'MISSING_CHECKOUT'
}

type ReportDataset = {
  summary: StaffReportSummary
  shifts: ShiftPerformance[]
  bookingStatus: Record<string, number>
  roomStatus: {
    topRoom: string
    cleaning: number
    maintenance: number
    issue: number
  }
  issueStatus: Record<string, number>
  hourlyBookings: Array<{ label: string; value: number }>
}

const reportData: Record<ReportRange, ReportDataset> = {
  TODAY: {
    summary: { totalShifts: 1, handledBookings: 18, checkInRate: 92, noShowCount: 2, reportedIssues: 4, resolvedIssues: 2 },
    shifts: [
      { name: 'Ca sáng', checkIn: '07:54', checkOut: '12:04', duration: '4 giờ 10 phút', status: 'DONE' },
      { name: 'Ca chiều', checkIn: '13:06', checkOut: '--:--', duration: 'Đang làm', status: 'MISSING_CHECKOUT' },
    ],
    bookingStatus: { 'Chờ xác nhận': 3, 'Đã xác nhận': 5, 'Đã check-in': 4, 'Hoàn tất': 4, 'Đã hủy': 1, 'Không đến': 1 },
    roomStatus: { topRoom: 'Deluxe Balcony 201', cleaning: 2, maintenance: 1, issue: 1 },
    issueStatus: { 'Sự cố mới': 2, 'Đang xử lý': 1, 'Đã xử lý': 2, 'Khẩn cấp': 1 },
    hourlyBookings: [
      { label: '08:00', value: 4 },
      { label: '10:00', value: 6 },
      { label: '13:00', value: 3 },
      { label: '16:00', value: 5 },
      { label: '19:00', value: 7 },
    ],
  },
  THIS_WEEK: {
    summary: { totalShifts: 7, handledBookings: 96, checkInRate: 88, noShowCount: 9, reportedIssues: 18, resolvedIssues: 14 },
    shifts: [
      { name: 'Thứ 2 - Ca sáng', checkIn: '07:55', checkOut: '12:00', duration: '4 giờ 05 phút', status: 'DONE' },
      { name: 'Thứ 3 - Ca tối', checkIn: '18:10', checkOut: '22:02', duration: '3 giờ 52 phút', status: 'LATE' },
      { name: 'Thứ 4 - Ca sáng', checkIn: '07:58', checkOut: '12:08', duration: '4 giờ 10 phút', status: 'ON_TIME' },
    ],
    bookingStatus: { 'Chờ xác nhận': 12, 'Đã xác nhận': 24, 'Đã check-in': 18, 'Hoàn tất': 31, 'Đã hủy': 5, 'Không đến': 6 },
    roomStatus: { topRoom: 'Family Garden 302', cleaning: 8, maintenance: 3, issue: 4 },
    issueStatus: { 'Sự cố mới': 5, 'Đang xử lý': 4, 'Đã xử lý': 14, 'Khẩn cấp': 2 },
    hourlyBookings: [
      { label: '08:00', value: 18 },
      { label: '10:00', value: 22 },
      { label: '13:00', value: 15 },
      { label: '16:00', value: 19 },
      { label: '19:00', value: 24 },
    ],
  },
  THIS_MONTH: {
    summary: { totalShifts: 26, handledBookings: 412, checkInRate: 91, noShowCount: 31, reportedIssues: 67, resolvedIssues: 58 },
    shifts: [
      { name: 'Tuần 1', checkIn: 'Đủ', checkOut: 'Đủ', duration: '38 giờ', status: 'DONE' },
      { name: 'Tuần 2', checkIn: '1 ca muộn', checkOut: 'Đủ', duration: '41 giờ', status: 'LATE' },
      { name: 'Tuần 3', checkIn: 'Đủ', checkOut: '1 ca thiếu', duration: '36 giờ', status: 'MISSING_CHECKOUT' },
    ],
    bookingStatus: { 'Chờ xác nhận': 42, 'Đã xác nhận': 90, 'Đã check-in': 78, 'Hoàn tất': 169, 'Đã hủy': 18, 'Không đến': 15 },
    roomStatus: { topRoom: 'Family Suite 301', cleaning: 32, maintenance: 9, issue: 14 },
    issueStatus: { 'Sự cố mới': 13, 'Đang xử lý': 9, 'Đã xử lý': 58, 'Khẩn cấp': 6 },
    hourlyBookings: [
      { label: '08:00', value: 70 },
      { label: '10:00', value: 95 },
      { label: '13:00', value: 68 },
      { label: '16:00', value: 83 },
      { label: '19:00', value: 104 },
    ],
  },
}

const ranges: Array<{ value: ReportRange; label: string }> = [
  { value: 'TODAY', label: 'Hôm nay' },
  { value: 'THIS_WEEK', label: 'Tuần này' },
  { value: 'THIS_MONTH', label: 'Tháng này' },
]

export default function StaffReportsPage() {
  const [range, setRange] = useState<ReportRange>('TODAY')
  const [toast, setToast] = useState<string | null>(null)
  const [data, setData] = useState<ReportDataset>(() => reportData.TODAY)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    let cancelled = false

    async function loadPerformance() {
      setIsLoading(true)

      try {
        const report = await fetchMyStaffPerformance(range)
        if (cancelled) return

        setData(mapPerformanceReport(report))
        setErrorMessage('')
      } catch (error) {
        if (cancelled) return

        setData(reportData[range])
        setErrorMessage(error instanceof Error ? error.message : 'Khong the tai bao cao hieu suat nhan vien.')
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadPerformance()

    return () => {
      cancelled = true
    }
  }, [range])

  const cards = useMemo(
    () => [
      { label: 'Tổng ca đã làm', value: data.summary.totalShifts, helper: 'Ca trong kỳ', icon: <IconClock />, className: 'bg-secondary text-on-secondary' },
      { label: 'Booking xử lý', value: data.summary.handledBookings, helper: 'Tổng booking vận hành', icon: <IconCalendar />, className: 'bg-primary-container text-brand-orange' },
      { label: 'Tỷ lệ check-in', value: `${data.summary.checkInRate}%`, helper: 'Khách đến đúng quy trình', icon: <IconTrend />, className: 'bg-on-secondary-container text-[#001A0D]' },
      { label: 'No-show', value: data.summary.noShowCount, helper: 'Khách không đến', icon: <IconAlert />, className: 'bg-error-container text-error' },
      { label: 'Sự cố đã báo', value: data.summary.reportedIssues, helper: 'Phòng/tiện nghi', icon: <IconTool />, className: 'bg-tertiary-container text-tertiary' },
      { label: 'Sự cố đã xử lý', value: data.summary.resolvedIssues, helper: 'Đã đóng trong kỳ', icon: <IconCheck />, className: 'bg-on-secondary-container text-[#001A0D]' },
    ],
    [data],
  )

  return (
    <AuthGuard allowedRoles={['STAFF']}>
      <StaffPageShell>
        <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-wide text-brand-orange">Phân tích ca làm</p>
            <h1 className="mt-2 font-display text-[32px] font-bold leading-10 text-on-surface">Báo cáo vận hành</h1>
            <p className="mt-2 max-w-2xl text-base leading-6 text-on-surface-variant">
              Theo dõi hiệu quả ca làm, booking, phòng và sự cố.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ProjectSelect value={range} onChange={(event) => setRange(event.target.value as ReportRange)} className="h-11 rounded-xl border border-outline-variant bg-white px-4 font-display text-sm font-bold outline-none focus:border-brand-orange">
              {ranges.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </ProjectSelect>
            <button type="button" onClick={() => setToast('Đã chuẩn bị báo cáo demo.')} className="btn-warm">Xuất báo cáo</button>
          </div>
        </header>

        {errorMessage && (
          <div className="rounded-2xl border border-error/30 bg-error-container/30 px-4 py-3 text-sm font-semibold text-error">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-3xl border border-outline-variant bg-white shadow-[var(--homestay-shadow-card)]" />
            ))}
          </section>
        ) : data.summary.totalShifts > 0 || data.summary.handledBookings > 0 ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {cards.map((card) => <StatCard key={card.label} {...card} />)}
            </section>

            <section className="grid gap-5 xl:grid-cols-[minmax(0,0.55fr)_minmax(0,0.45fr)]">
              <ReportSection title="Hiệu suất ca làm">
                <div className="space-y-3">
                  {data.shifts.map((shift) => (
                    <div key={shift.name} className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-display text-base font-bold text-on-surface">{shift.name}</p>
                        <StatusBadge {...getShiftStatusMeta(shift.status)} />
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        <Metric label="Check-in" value={shift.checkIn} />
                        <Metric label="Check-out" value={shift.checkOut} />
                        <Metric label="Thời lượng" value={shift.duration} />
                      </div>
                    </div>
                  ))}
                </div>
              </ReportSection>

              <ReportSection title="Booking trong ca">
                <StatusGrid data={data.bookingStatus} />
              </ReportSection>

              <ReportSection title="Booking theo khung giờ">
                <BarChart data={data.hourlyBookings} />
              </ReportSection>

              <ReportSection title="Trạng thái booking">
                <BarChart data={Object.entries(data.bookingStatus).map(([label, value]) => ({ label, value }))} compact />
              </ReportSection>

              <ReportSection title="Tình trạng phòng">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Metric label="Phòng dùng nhiều nhất" value={data.roomStatus.topRoom} />
                  <Metric label="Cần vệ sinh" value={`${data.roomStatus.cleaning}`} />
                  <Metric label="Bảo trì" value={`${data.roomStatus.maintenance}`} />
                  <Metric label="Có sự cố" value={`${data.roomStatus.issue}`} />
                </div>
              </ReportSection>

              <ReportSection title="Sự cố tiện nghi/phòng">
                <StatusGrid data={data.issueStatus} />
              </ReportSection>
            </section>
          </>
        ) : (
          <EmptyState title="Chưa có dữ liệu báo cáo" description="Khoảng thời gian này chưa có dữ liệu vận hành để hiển thị." />
        )}

        {toast && <Toast message={toast} />}
      </StaffPageShell>
    </AuthGuard>
  )
}

function mapPerformanceReport(report: StaffPerformanceResponse): ReportDataset {
  const totalShifts = Number(report.worklog.totalShifts ?? 0)
  const lateCount = Number(report.worklog.lateCount ?? 0)
  const missingCheckout = Number(report.worklog.missingCheckout ?? 0)
  const completedShifts = Math.max(0, totalShifts - missingCheckout)
  const onTimeShifts = Math.max(0, completedShifts - lateCount)
  const checkInRate = totalShifts > 0 ? Math.round((completedShifts / totalShifts) * 100) : 0
  const totalHours = Number(report.worklog.totalHours ?? 0)
  const avgRating = Number(report.reviews.avgRating ?? 0)

  return {
    summary: {
      totalShifts,
      handledBookings: report.reviews.items.length,
      checkInRate,
      noShowCount: missingCheckout,
      reportedIssues: lateCount,
      resolvedIssues: onTimeShifts,
    },
    shifts: [
      {
        name: `${report.fromDate} - ${report.toDate}`,
        checkIn: `${totalShifts} ca`,
        checkOut: `${completedShifts} hoan tat`,
        duration: Number.isFinite(totalHours) ? `${totalHours.toFixed(1)} gio` : `${report.worklog.totalHours} gio`,
        status: missingCheckout > 0 ? 'MISSING_CHECKOUT' : lateCount > 0 ? 'LATE' : 'DONE',
      },
    ],
    bookingStatus: {
      'Tong review': report.reviews.items.length,
      'Diem TB': Number.isFinite(avgRating) ? Math.round(avgRating * 10) / 10 : 0,
      'Ca hoan tat': completedShifts,
      'Ca thieu checkout': missingCheckout,
    },
    roomStatus: {
      topRoom: 'Theo du lieu cham cong',
      cleaning: 0,
      maintenance: lateCount,
      issue: missingCheckout,
    },
    issueStatus: {
      'Dung gio': onTimeShifts,
      'Di muon': lateCount,
      'Thieu checkout': missingCheckout,
      'Tong ca': totalShifts,
    },
    hourlyBookings: [
      { label: 'Tong ca', value: totalShifts },
      { label: 'Hoan tat', value: completedShifts },
      { label: 'Di muon', value: lateCount },
      { label: 'Thieu checkout', value: missingCheckout },
    ],
  }
}

function ReportSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-outline-variant bg-white p-5 shadow-[var(--homestay-shadow-card)]">
      <h2 className="font-display text-xl font-bold text-on-surface">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-outline-variant bg-white p-3"><p className="font-display text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">{label}</p><p className="mt-2 text-sm font-semibold text-on-surface">{value}</p></div>
}

function StatusGrid({ data }: { data: Record<string, number> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Object.entries(data).map(([label, value]) => <Metric key={label} label={label} value={`${value}`} />)}
    </div>
  )
}

function BarChart({ data, compact }: { data: Array<{ label: string; value: number }>; compact?: boolean }) {
  const max = Math.max(...data.map((item) => item.value), 1)
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label} className={compact ? 'space-y-1' : 'grid gap-3 sm:grid-cols-[96px_1fr_48px] sm:items-center'}>
          <p className="truncate font-display text-sm font-bold text-on-surface">{item.label}</p>
          <div className="h-3 overflow-hidden rounded-full bg-surface-container-high">
            <div className="h-full rounded-full bg-brand-orange" style={{ width: `${Math.max(8, (item.value / max) * 100)}%` }} />
          </div>
          <p className="font-display text-sm font-bold text-on-surface">{item.value}</p>
        </div>
      ))}
    </div>
  )
}

function getShiftStatusMeta(status: ShiftPerformance['status']) {
  const meta = {
    ON_TIME: { label: 'Đúng giờ', className: 'border-on-secondary-container/40 bg-on-secondary-container text-[#001A0D]', dotClassName: 'bg-secondary-container' },
    LATE: { label: 'Muộn', className: 'border-tertiary-container bg-tertiary-container text-on-tertiary-container', dotClassName: 'bg-tertiary' },
    DONE: { label: 'Hoàn tất', className: 'border-secondary-container bg-secondary text-on-secondary', dotClassName: 'bg-on-secondary-container' },
    MISSING_CHECKOUT: { label: 'Chưa check-out', className: 'border-error-container bg-error-container text-on-error-container', dotClassName: 'bg-error' },
  }
  return meta[status]
}

function IconClock() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none"><path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> }
function IconCalendar() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none"><path d="M7 3v4M17 3v4M4 9h16M6.5 5h11A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10A2.5 2.5 0 0 1 6.5 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> }
function IconTrend() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none"><path d="m4 16 5-5 4 4 7-8M14 7h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function IconAlert() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none"><path d="M12 8v5M12 17h.01M10.2 4.7 2.8 18a2 2 0 0 0 1.8 3h14.8a2 2 0 0 0 1.8-3L13.8 4.7a2 2 0 0 0-3.6 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function IconTool() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none"><path d="M15 4a4 4 0 0 0 5 5L10.5 18.5a3 3 0 0 1-4.2 0l-.8-.8a3 3 0 0 1 0-4.2L15 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function IconCheck() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none"><path d="M5 12.5l4.2 4.2L19 7" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" /></svg> }

