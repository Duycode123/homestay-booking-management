'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'
import AdminToast from '@/components/admin/AdminToast'
import { IconBookings, IconCheckCircle, IconClock, IconRefresh } from '@/components/admin/AdminIcons'
import StaffScheduleHourGrid from '@/components/admin/staff-schedule/StaffScheduleHourGrid'
import StaffScheduleToolbar from '@/components/admin/staff-schedule/StaffScheduleToolbar'
import StaffScheduleWeekStrip, { scrollToScheduleDay } from '@/components/admin/staff-schedule/StaffScheduleWeekStrip'
import {
  decideAdminShiftRegistration,
  fetchAdminShiftRegistrations,
  type AdminShiftRegistration,
  type ShiftRegistrationFilters,
} from '@/lib/admin/staff-schedule/adminShiftRegistrationApi'
import {
  getNextWeekRange,
  getThisWeekRange,
  getVisibleDays,
  getVisibleRange,
  groupRegistrationsByDate,
  parseDate,
} from '@/lib/admin/staff-schedule/staffScheduleUtils'

const DEFAULT_RANGE = getNextWeekRange()

const DEFAULT_FILTERS: ShiftRegistrationFilters = {
  status: 'ALL',
  fromDate: DEFAULT_RANGE.fromDate,
  toDate: DEFAULT_RANGE.toDate,
  staffId: '',
  query: '',
}

type QueueStatusFilter = 'PENDING' | 'APPROVED' | 'ALL'

export default function AdminStaffSchedulePage() {
  const [anchorDate, setAnchorDate] = useState(() => parseDate(DEFAULT_RANGE.fromDate))
  const [filters, setFilters] = useState<ShiftRegistrationFilters>(DEFAULT_FILTERS)
  const [statusFilter, setStatusFilter] = useState<QueueStatusFilter>('PENDING')
  const [highlightDate, setHighlightDate] = useState<string | null>(null)
  const [registrations, setRegistrations] = useState<AdminShiftRegistration[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const visibleRange = useMemo(() => getVisibleRange(anchorDate, 'week'), [anchorDate])
  const visibleDays = useMemo(() => getVisibleDays(anchorDate, 'week'), [anchorDate])

  const requestFilters = useMemo<ShiftRegistrationFilters>(
    () => ({
      ...filters,
      status: 'ALL',
      fromDate: visibleRange.fromDate,
      toDate: visibleRange.toDate,
    }),
    [filters, visibleRange.fromDate, visibleRange.toDate],
  )

  const loadRegistrations = useCallback(async () => {
    setIsLoading(true)

    try {
      const data = await fetchAdminShiftRegistrations(requestFilters)
      setRegistrations(data)
      setSelectedIds((current) => {
        const pendingIds = new Set(data.filter((item) => item.status === 'PENDING').map((item) => item.id))
        return new Set([...current].filter((id) => pendingIds.has(id)))
      })
      setErrorMessage('')
    } catch (error) {
      setRegistrations([])
      setSelectedIds(new Set())
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải danh sách đăng ký ca làm.')
    } finally {
      setIsLoading(false)
    }
  }, [requestFilters])

  useEffect(() => {
    const timer = setTimeout(() => void loadRegistrations(), 200)
    return () => clearTimeout(timer)
  }, [loadRegistrations])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  const registrationsByDate = useMemo(() => groupRegistrationsByDate(registrations), [registrations])

  const stats = useMemo(
    () => ({
      total: registrations.length,
      pending: registrations.filter((item) => item.status === 'PENDING').length,
      approved: registrations.filter((item) => item.status === 'APPROVED').length,
    }),
    [registrations],
  )

  const approveRegistrations = async (items: AdminShiftRegistration[]) => {
    if (items.length === 0) {
      setErrorMessage('Không có ca nào để duyệt.')
      return
    }

    setIsSaving(true)
    setErrorMessage('')

    try {
      for (const registration of items) {
        await decideAdminShiftRegistration(registration.id, true)
      }

      setSelectedIds(new Set())
      setToast(
        items.length === 1
          ? `Đã duyệt ca ${items[0].startTime}–${items[0].endTime} của ${items[0].staffName}.`
          : `Đã duyệt ${items.length} ca — nhân viên sẽ thấy trên lịch làm việc.`,
      )
      await loadRegistrations()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể duyệt ca.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleApproveSelected = () => {
    const items = registrations.filter(
      (registration) => selectedIds.has(registration.id) && registration.status === 'PENDING',
    )
    void approveRegistrations(items)
  }

  const handleApproveOne = (registration: AdminShiftRegistration) => {
    void approveRegistrations([registration])
  }

  const selectAllPending = () => {
    const pendingIds = registrations
      .filter((item) => {
        if (item.status !== 'PENDING') return false
        if (statusFilter !== 'ALL' && item.status !== statusFilter) return false
        if (highlightDate && item.workDate !== highlightDate) return false
        return true
      })
      .map((item) => item.id)
    setSelectedIds(new Set(pendingIds))
  }

  const handleDayFilter = (date: string | null) => {
    setHighlightDate(date)
    if (date) {
      window.setTimeout(() => scrollToScheduleDay(date), 100)
    }
  }

  const jumpToWeek = (fromDate: string) => {
    setAnchorDate(parseDate(fromDate))
    setSelectedIds(new Set())
    setHighlightDate(null)
  }

  return (
    <>
        <AdminPageHeader
          eyebrow="Lịch nhân viên"
          title="Quản lý lịch làm việc"
          description="Xem lịch theo khung giờ (sáng / chiều / tối), lọc ngày và duyệt ca hàng loạt."
          breadcrumbs={[
            { label: 'Tổng quan', href: '/admin/dashboard' },
            { label: 'Lịch nhân viên' },
          ]}
          actions={
            <button
              type="button"
              onClick={() => void loadRegistrations()}
              disabled={isLoading}
              title="Làm mới"
              aria-label="Làm mới"
              className={[
                'group flex h-10 w-10 items-center justify-center rounded-full',
                'border border-outline-variant bg-white text-on-surface-variant shadow-sm',
                'transition-all hover:border-brand-orange/40 hover:text-brand-orange',
                'disabled:cursor-not-allowed disabled:opacity-50',
              ].join(' ')}
            >
              <IconRefresh
                className={[
                  'h-[15px] w-[15px] transition-transform duration-300',
                  isLoading ? 'animate-spin' : 'group-hover:rotate-180',
                ].join(' ')}
              />
            </button>
          }
        />

        <div className="mx-auto max-w-6xl space-y-4 px-5 py-6 sm:px-8">
          <AdminToast message={toast} onDismiss={() => setToast('')} />

          {errorMessage && (
            <div className="rounded-xl border border-error/30 bg-error-container/30 px-4 py-3 text-sm text-error">
              {errorMessage}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <AdminStatCard
              label="Chờ duyệt"
              value={isLoading ? '…' : stats.pending}
              hint="Cần duyệt để lên lịch"
              accent="tertiary"
              icon={<IconClock className="h-5 w-5" />}
            />
            <AdminStatCard
              label="Đã lên lịch"
              value={isLoading ? '…' : stats.approved}
              hint="Nhân viên đã thấy trên lịch"
              accent="secondary"
              icon={<IconCheckCircle className="h-5 w-5" />}
            />
            <AdminStatCard
              label="Tổng đăng ký"
              value={isLoading ? '…' : stats.total}
              hint="Trong tuần đang xem"
              icon={<IconBookings className="h-5 w-5" />}
            />
          </div>

          <StaffScheduleToolbar
            rangeLabel={formatWeekRangeLabel(visibleRange.fromDate, visibleRange.toDate)}
            query={filters.query}
            staffId={filters.staffId}
            resultCount={registrations.length}
            pendingCount={stats.pending}
            onMove={(direction) => {
              setAnchorDate((current) => {
                const next = new Date(current)
                next.setDate(current.getDate() + direction * 7)
                return next
              })
              setSelectedIds(new Set())
              setHighlightDate(null)
            }}
            onThisWeek={() => jumpToWeek(getThisWeekRange().fromDate)}
            onNextWeek={() => jumpToWeek(getNextWeekRange().fromDate)}
            onQueryChange={(value) => setFilters((current) => ({ ...current, query: value }))}
            onStaffIdChange={(value) => setFilters((current) => ({ ...current, staffId: value }))}
            onRefresh={() => void loadRegistrations()}
            isLoading={isLoading}
          />

          <StaffScheduleWeekStrip
            days={visibleDays}
            registrationsByDate={registrationsByDate}
            activeDate={highlightDate}
            onSelectDate={handleDayFilter}
          />

          <StaffScheduleHourGrid
            days={visibleDays}
            registrations={registrations}
            selectedIds={selectedIds}
            isLoading={isLoading}
            isSaving={isSaving}
            statusFilter={statusFilter}
            highlightDate={highlightDate}
            onStatusFilterChange={setStatusFilter}
            onToggle={(registration) => {
              if (registration.status !== 'PENDING') return
              setSelectedIds((current) => {
                const next = new Set(current)
                if (next.has(registration.id)) next.delete(registration.id)
                else next.add(registration.id)
                return next
              })
            }}
            onSelectAllPending={selectAllPending}
            onClearSelection={() => setSelectedIds(new Set())}
            onApproveOne={handleApproveOne}
            onApproveSelected={handleApproveSelected}
          />
        </div>
    </>
  )
}

function formatWeekRangeLabel(fromDate: string, toDate: string) {
  const formatter = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `${formatter.format(parseDate(fromDate))} – ${formatter.format(parseDate(toDate))}`
}
