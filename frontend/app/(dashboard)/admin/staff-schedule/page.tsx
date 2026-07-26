'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminToast from '@/components/admin/AdminToast'
import { IconRefresh } from '@/components/admin/AdminIcons'
import StaffScheduleApprovalQueue from '@/components/admin/staff-schedule/StaffScheduleApprovalQueue'
import StaffScheduleHourGrid from '@/components/admin/staff-schedule/StaffScheduleHourGrid'
import StaffScheduleRejectDialog from '@/components/admin/staff-schedule/StaffScheduleRejectDialog'
import StaffShiftRoomAssignmentDialog from '@/components/admin/staff-schedule/StaffShiftRoomAssignmentDialog'
import StaffScheduleToolbar from '@/components/admin/staff-schedule/StaffScheduleToolbar'
import {
  decideAdminShiftRegistration,
  fetchAdminShiftRegistrations,
  type AdminShiftRegistration,
  type ShiftRegistrationFilters,
} from '@/lib/admin/staff-schedule/adminShiftRegistrationApi'
import { fetchRooms, type BackendRoom } from '@/lib/rooms-api'
import {
  getNextWeekRange,
  getThisWeekRange,
  getVisibleDays,
  getVisibleRange,
  matchShiftFrame,
  parseDate,
  SHIFT_FRAMES,
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
  const [statusFilter, setStatusFilter] = useState<QueueStatusFilter>('ALL')
  const [highlightDate, setHighlightDate] = useState<string | null>(null)
  const [rejectingRegistration, setRejectingRegistration] = useState<AdminShiftRegistration | null>(null)
  const [approvingRegistrations, setApprovingRegistrations] = useState<AdminShiftRegistration[] | null>(null)
  const [rooms, setRooms] = useState<BackendRoom[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [approvalError, setApprovalError] = useState('')
  const [isLoadingRooms, setIsLoadingRooms] = useState(true)
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
    let isActive = true

    const loadRooms = async () => {
      setIsLoadingRooms(true)
      try {
        const data = await fetchRooms()
        if (!isActive) return
        setRooms(
          data.filter(
            (room) =>
              room.status !== 'INACTIVE' &&
              room.latitude !== null &&
              room.latitude !== undefined &&
              room.longitude !== null &&
              room.longitude !== undefined,
          ),
        )
      } catch (error) {
        if (!isActive) return
        setRooms([])
        setErrorMessage(error instanceof Error ? error.message : 'Không thể tải danh sách căn lưu trú.')
      } finally {
        if (isActive) setIsLoadingRooms(false)
      }
    }

    void loadRooms()
    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  const stats = useMemo(
    () => {
      const approved = registrations.filter((item) => item.status === 'APPROVED')
      const coveredSlots = new Set(
        approved.flatMap((item) => {
          const frame = matchShiftFrame(item.startTime, item.endTime)
          return frame.id === 'other' ? [] : [`${item.workDate}|${frame.id}`]
        }),
      )
      const totalStandardSlots = visibleDays.length * SHIFT_FRAMES.length

      return {
        total: registrations.length,
        pending: registrations.filter((item) => item.status === 'PENDING').length,
        approved: approved.length,
        scheduledStaff: new Set(approved.map((item) => item.staffId)).size,
        uncoveredSlots: Math.max(0, totalStandardSlots - coveredSlots.size),
        coverage: totalStandardSlots > 0 ? Math.round((coveredSlots.size / totalStandardSlots) * 100) : 0,
      }
    },
    [registrations, visibleDays.length],
  )

  const approveRegistrations = (items: AdminShiftRegistration[]) => {
    if (items.length === 0) {
      setErrorMessage('Không có ca nào để duyệt.')
      return
    }

    setSelectedRoomId('')
    setApprovalError('')
    setApprovingRegistrations(items)
    setErrorMessage('')
  }

  const confirmApproveRegistrations = async () => {
    if (!approvingRegistrations?.length) return
    const roomId = Number(selectedRoomId)
    if (!Number.isInteger(roomId) || roomId <= 0) {
      setApprovalError('Vui lòng chọn căn lưu trú cho ca làm.')
      return
    }

    setIsSaving(true)
    setErrorMessage('')
    let approvedCount = 0

    try {
      for (const registration of approvingRegistrations) {
        await decideAdminShiftRegistration(registration.id, true, undefined, roomId)
        approvedCount += 1
      }

      setSelectedIds(new Set())
      setToast(
        approvingRegistrations.length === 1
          ? `Đã duyệt ca ${approvingRegistrations[0].startTime}–${approvingRegistrations[0].endTime} của ${approvingRegistrations[0].staffName}.`
          : `Đã duyệt ${approvingRegistrations.length} ca — nhân viên sẽ thấy căn được phân công trên lịch.`,
      )
      setApprovingRegistrations(null)
      setSelectedRoomId('')
      setApprovalError('')
      await loadRegistrations()
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Không thể duyệt ca.'
      if (approvedCount > 0) {
        const remaining = approvingRegistrations.slice(approvedCount)
        setApprovingRegistrations(remaining.length > 0 ? remaining : null)
        setToast(`Đã duyệt ${approvedCount}/${approvingRegistrations.length} ca. Các ca còn lại cần kiểm tra lại.`)
        await loadRegistrations()
      }
      setApprovalError(reason)
    } finally {
      setIsSaving(false)
    }
  }

  const handleApproveSelected = () => {
    const items = registrations.filter(
      (registration) => selectedIds.has(registration.id) && registration.status === 'PENDING',
    )
    approveRegistrations(items)
  }

  const handleApproveOne = (registration: AdminShiftRegistration) => {
    approveRegistrations([registration])
  }

  const handleReject = async (reason: string) => {
    if (!rejectingRegistration) return

    setIsSaving(true)
    setErrorMessage('')

    try {
      await decideAdminShiftRegistration(rejectingRegistration.id, false, reason)
      setSelectedIds((current) => {
        const next = new Set(current)
        next.delete(rejectingRegistration.id)
        return next
      })
      setToast(`Đã từ chối ca của ${rejectingRegistration.staffName} và lưu lý do để nhân viên theo dõi.`)
      setRejectingRegistration(null)
      await loadRegistrations()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể từ chối ca.')
    } finally {
      setIsSaving(false)
    }
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

        <div className="mx-auto max-w-[1440px] space-y-5 px-5 py-6 sm:px-8">
          <AdminToast message={toast} onDismiss={() => setToast('')} />

          {errorMessage && (
            <div className="rounded-xl border border-error/30 bg-error-container/30 px-4 py-3 text-sm text-error">
              {errorMessage}
            </div>
          )}

          <ScheduleOverview stats={stats} isLoading={isLoading} />

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
            isLoading={isLoading}
          />

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
            <StaffScheduleHourGrid
              days={visibleDays}
              registrations={registrations}
              selectedIds={selectedIds}
              isLoading={isLoading}
              isSaving={isSaving}
              statusFilter={statusFilter}
              highlightDate={highlightDate}
              onStatusFilterChange={setStatusFilter}
              onHighlightDate={handleDayFilter}
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
              onRejectOne={setRejectingRegistration}
              onApproveMany={approveRegistrations}
              onApproveSelected={handleApproveSelected}
            />

            <StaffScheduleApprovalQueue
              registrations={registrations}
              highlightDate={highlightDate}
              isLoading={isLoading}
              isSaving={isSaving}
              onApprove={handleApproveOne}
              onApproveMany={approveRegistrations}
              onReject={setRejectingRegistration}
            />
          </div>
        </div>

        <StaffScheduleRejectDialog
          registration={rejectingRegistration}
          isSaving={isSaving}
          onClose={() => setRejectingRegistration(null)}
          onConfirm={(reason) => void handleReject(reason)}
        />

        <StaffShiftRoomAssignmentDialog
          registrations={approvingRegistrations}
          rooms={rooms}
          selectedRoomId={selectedRoomId}
          errorMessage={approvalError}
          isLoadingRooms={isLoadingRooms}
          isSaving={isSaving}
          onRoomChange={(roomId) => {
            setSelectedRoomId(roomId)
            setApprovalError('')
          }}
          onClose={() => {
            if (isSaving) return
            setApprovingRegistrations(null)
            setSelectedRoomId('')
            setApprovalError('')
          }}
          onConfirm={() => void confirmApproveRegistrations()}
        />
    </>
  )
}

function ScheduleOverview({
  stats,
  isLoading,
}: {
  stats: {
    total: number
    pending: number
    approved: number
    scheduledStaff: number
    uncoveredSlots: number
    coverage: number
  }
  isLoading: boolean
}) {
  const items = [
    { label: 'Chờ quyết định', value: stats.pending, helper: 'cần admin xử lý', tone: 'text-[#9a6435]', dot: 'bg-[#bd8a58]' },
    { label: 'Ca đã duyệt', value: stats.approved, helper: 'trong tuần đang xem', tone: 'text-secondary', dot: 'bg-secondary' },
    { label: 'Nhân viên đã xếp', value: stats.scheduledStaff, helper: 'nhân sự khác nhau', tone: 'text-on-surface', dot: 'bg-[#749486]' },
    { label: 'Độ phủ ca chuẩn', value: `${stats.coverage}%`, helper: `${stats.uncoveredSlots} khung chưa bố trí`, tone: stats.uncoveredSlots > 0 ? 'text-error' : 'text-secondary', dot: stats.uncoveredSlots > 0 ? 'bg-error' : 'bg-secondary' },
  ]

  return (
    <section className="overflow-hidden rounded-[22px] border border-[#ded2c3] bg-white shadow-[0_14px_40px_rgba(31,54,44,0.07)]">
      <div className="grid divide-y divide-[#e8dfd4] sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3 px-4 py-4 sm:px-5">
            <span className={['h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_0_5px_rgba(23,58,49,0.05)]', item.dot].join(' ')} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">{item.label}</p>
              <div className="mt-1 flex items-baseline gap-2">
                <strong className={['font-editorial text-2xl font-normal', item.tone].join(' ')}>{isLoading ? '…' : item.value}</strong>
                <span className="truncate text-[11px] text-on-surface-variant">{item.helper}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
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
