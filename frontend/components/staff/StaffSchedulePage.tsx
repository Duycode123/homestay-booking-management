'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { EmptyState, StaffPageShell, Toast } from '@/components/staff/StaffShared'
import {
  STAFF_LOCATION,
  calculateDistanceMeters,
  formatDistance,
  getCurrentPosition,
  isWithinStaffLocation,
} from '@/components/staff/staff-location'
import {
  checkInCurrentShift,
  checkOutCurrentShift,
  fetchCurrentAttendance,
  fetchMyShiftRegistrations,
  fetchShiftBookings,
  fetchStaffSchedule,
  submitShiftRegistrations,
  type ShiftRegistrationSlot,
  type StaffAttendanceRecord,
  type StaffScheduleShift,
  type StaffShiftRegistration,
  type StaffShiftBooking,
} from '@/lib/staff-schedule-service'

type ShiftStatus = 'EMPTY' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED'
type AttendanceStatus = 'NOT_STARTED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'NO_SHIFT'
type DayKey = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'
type ShiftName = 'Ca sáng' | 'Ca chiều' | 'Ca tối'
type ScheduleView = 'CURRENT_WEEK' | 'NEXT_WEEK'
type VerificationStatus = 'IDLE' | 'CHECKING' | 'VALID' | 'INVALID' | 'BLOCKED'
type ConditionStatus = 'PASSED' | 'FAILED' | 'CHECKING'

type WeekDay = {
  key: DayKey
  label: string
  longLabel: string
  isoDate: string
  shortDate: string
}

type ShiftRow = {
  name: ShiftName
  startTime: string
  endTime: string
}

type StaffShiftCell = {
  cellId: string
  shiftId: number | null
  dayKey: DayKey
  date: string
  shiftName: ShiftName
  startTime: string
  endTime: string
  status: ShiftStatus
  note: string
  checkInTime?: string
  checkOutTime?: string
}

type ShiftBookingView = {
  bookingId: number
  roomName: string
  customerName: string
  startTime: string
  endTime: string
  status: string
  equipment: string[]
}

type ShiftDetailState = {
  cell: StaffShiftCell
  bookings: ShiftBookingView[]
  isLoading: boolean
  error: string
}

type StatusMeta = {
  label: string
  className: string
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

const CHECK_IN_EARLY_MINUTES = 30

const SHIFT_ROWS: ShiftRow[] = [
  { name: 'Ca sáng', startTime: '08:00', endTime: '12:00' },
  { name: 'Ca chiều', startTime: '13:30', endTime: '17:30' },
  { name: 'Ca tối', startTime: '18:00', endTime: '22:00' },
]

const DAY_META: Record<DayKey, { label: string; longLabel: string }> = {
  MON: { label: 'Th 2', longLabel: 'Thứ 2' },
  TUE: { label: 'Th 3', longLabel: 'Thứ 3' },
  WED: { label: 'Th 4', longLabel: 'Thứ 4' },
  THU: { label: 'Th 5', longLabel: 'Thứ 5' },
  FRI: { label: 'Th 6', longLabel: 'Thứ 6' },
  SAT: { label: 'Th 7', longLabel: 'Thứ 7' },
  SUN: { label: 'CN', longLabel: 'Chủ nhật' },
}

export default function StaffSchedulePage() {
  const [now, setNow] = useState(() => new Date())
  const [schedule, setSchedule] = useState<StaffScheduleShift[]>([])
  const [nextWeekSchedule, setNextWeekSchedule] = useState<StaffScheduleShift[]>([])
  const [currentAttendance, setCurrentAttendance] = useState<StaffAttendanceRecord | null>(null)
  const [scheduleView, setScheduleView] = useState<ScheduleView>('CURRENT_WEEK')
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true)
  const [isLoadingNextWeekSchedule, setIsLoadingNextWeekSchedule] = useState(true)
  const [pageError, setPageError] = useState('')
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false)
  const [locationStatus, setLocationStatus] = useState<VerificationStatus>('IDLE')
  const [locationDistance, setLocationDistance] = useState<number | null>(null)
  const [attendanceError, setAttendanceError] = useState('')
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false)
  const [shiftDetail, setShiftDetail] = useState<ShiftDetailState | null>(null)
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false)
  const [registrations, setRegistrations] = useState<StaffShiftRegistration[]>([])
  const [selectedRegistrationSlots, setSelectedRegistrationSlots] = useState<ShiftRegistrationSlot[]>([])
  const [isLoadingRegistrations, setIsLoadingRegistrations] = useState(false)
  const [isSubmittingRegistrations, setIsSubmittingRegistrations] = useState(false)
  const [registrationError, setRegistrationError] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  const weekDays = useMemo(() => getWeekDays(now), [now.getFullYear(), now.getMonth(), now.getDate()])
  const nextWeekDays = useMemo(() => {
    const nextWeekDate = new Date(now)
    nextWeekDate.setDate(now.getDate() + 7)
    return getWeekDays(nextWeekDate)
  }, [now.getFullYear(), now.getMonth(), now.getDate()])
  const weekRange = useMemo(
    () => ({
      fromDate: weekDays[0]?.isoDate ?? '',
      toDate: weekDays[weekDays.length - 1]?.isoDate ?? '',
    }),
    [weekDays],
  )
  const nextWeekRange = useMemo(
    () => ({
      fromDate: nextWeekDays[0]?.isoDate ?? '',
      toDate: nextWeekDays[nextWeekDays.length - 1]?.isoDate ?? '',
    }),
    [nextWeekDays],
  )
  const loadSchedule = useCallback(async (showLoading = true) => {
    if (!weekRange.fromDate || !weekRange.toDate) return

    if (showLoading) {
      setIsLoadingSchedule(true)
      setIsLoadingNextWeekSchedule(true)
    }
    try {
      const [currentScheduleResult, nextScheduleResult, attendanceResult] = await Promise.allSettled([
        fetchStaffSchedule(weekRange.fromDate, weekRange.toDate),
        nextWeekRange.fromDate && nextWeekRange.toDate
          ? fetchStaffSchedule(nextWeekRange.fromDate, nextWeekRange.toDate)
          : Promise.resolve([]),
        fetchCurrentAttendance(),
      ])

      const nextErrors: string[] = []
      if (currentScheduleResult.status === 'fulfilled') {
        setSchedule(currentScheduleResult.value)
      } else {
        nextErrors.push(`Lịch tuần này: ${getErrorMessage(currentScheduleResult.reason, 'Không thể tải lịch tuần này.')}`)
      }
      if (nextScheduleResult.status === 'fulfilled') {
        setNextWeekSchedule(nextScheduleResult.value)
      } else {
        nextErrors.push(`Lịch tuần tới: ${getErrorMessage(nextScheduleResult.reason, 'Không thể tải lịch tuần tới.')}`)
      }
      if (attendanceResult.status === 'fulfilled') {
        setCurrentAttendance(attendanceResult.value)
      } else {
        setCurrentAttendance(null)
        nextErrors.push(`Chấm công: ${getErrorMessage(attendanceResult.reason, 'Không thể tải dữ liệu chấm công.')}`)
      }
      setPageError(nextErrors.join(' '))
    } finally {
      if (showLoading) {
        setIsLoadingSchedule(false)
        setIsLoadingNextWeekSchedule(false)
      }
    }
  }, [nextWeekRange.fromDate, nextWeekRange.toDate, weekRange.fromDate, weekRange.toDate])

  useEffect(() => {
    void loadSchedule(true)
  }, [loadSchedule])

  useEffect(() => {
    const refreshTimer = window.setInterval(() => {
      void loadSchedule(false)
    }, 20000)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void loadSchedule(false)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.clearInterval(refreshTimer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [loadSchedule])

  const loadRegistrations = useCallback(async () => {
    if (!nextWeekRange.fromDate || !nextWeekRange.toDate) return

    setIsLoadingRegistrations(true)
    try {
      const nextRegistrations = await fetchMyShiftRegistrations(nextWeekRange.fromDate, nextWeekRange.toDate)
      setRegistrations(nextRegistrations)
      setRegistrationError('')
    } catch (error) {
      setRegistrations([])
      setRegistrationError(error instanceof Error ? error.message : 'Khong the tai danh sach dang ky ca lam.')
    } finally {
      setIsLoadingRegistrations(false)
    }
  }, [nextWeekRange.fromDate, nextWeekRange.toDate])

  const shiftCells = useMemo(
    () => schedule.map((shift) => mapShiftToCell(shift, currentAttendance)).sort(compareShiftCells),
    [currentAttendance, schedule],
  )
  const nextWeekShiftCells = useMemo(
    () => nextWeekSchedule.map((shift) => mapShiftToCell(shift, null)).sort(compareShiftCells),
    [nextWeekSchedule],
  )

  const shiftMap = useMemo(() => {
    return shiftCells.reduce<Record<string, StaffShiftCell>>((acc, cell) => {
      acc[getCellKey(cell.dayKey, cell.shiftName)] = cell
      return acc
    }, {})
  }, [shiftCells])
  const nextWeekShiftMap = useMemo(() => {
    return nextWeekShiftCells.reduce<Record<string, StaffShiftCell>>((acc, cell) => {
      acc[getCellKey(cell.dayKey, cell.shiftName)] = cell
      return acc
    }, {})
  }, [nextWeekShiftCells])
  const registrationMap = useMemo(() => {
    return registrations.reduce<Record<string, StaffShiftRegistration>>((acc, registration) => {
      acc[getSlotKey(registration.workDate, registration.startTime, registration.endTime)] = registration
      return acc
    }, {})
  }, [registrations])
  const selectedRegistrationSlotKeys = useMemo(() => {
    return new Set(selectedRegistrationSlots.map((slot) => getSlotKey(slot.workDate, slot.startTime, slot.endTime)))
  }, [selectedRegistrationSlots])
  const activeWeekDays = scheduleView === 'CURRENT_WEEK' ? weekDays : nextWeekDays
  const activeWeekRange = scheduleView === 'CURRENT_WEEK' ? weekRange : nextWeekRange
  const activeShiftCells = scheduleView === 'CURRENT_WEEK' ? shiftCells : nextWeekShiftCells
  const activeShiftMap = scheduleView === 'CURRENT_WEEK' ? shiftMap : nextWeekShiftMap
  const isLoadingActiveSchedule = scheduleView === 'CURRENT_WEEK' ? isLoadingSchedule : isLoadingNextWeekSchedule
  const activeScheduleCopy =
    scheduleView === 'CURRENT_WEEK'
      ? {
          title: 'Lịch tuần này',
          description: 'Ca làm chính thức trong tuần hiện tại.',
          emptyTitle: 'Chưa có ca làm việc trong tuần này',
          emptyDescription: 'Lịch sẽ tự cập nhật khi admin xếp ca cho tài khoản staff hiện tại.',
        }
      : {
          title: 'Lịch tuần tới',
          description: 'Ca đã được admin duyệt cho tuần kế tiếp.',
          emptyTitle: 'Chưa có ca làm việc tuần tới',
          emptyDescription: 'Khi admin duyệt đăng ký ca tuần tới, lịch sẽ tự hiện ở đây.',
        }

  useEffect(() => {
    if (!shiftDetail) return

    const nextCell = shiftCells.find((cell) => cell.cellId === shiftDetail.cell.cellId)
    if (!nextCell) return

    setShiftDetail((current) => {
      if (!current || current.cell.cellId !== nextCell.cellId) return current
      if (
        current.cell.status === nextCell.status &&
        current.cell.checkInTime === nextCell.checkInTime &&
        current.cell.checkOutTime === nextCell.checkOutTime &&
        current.cell.note === nextCell.note
      ) {
        return current
      }
      return { ...current, cell: nextCell }
    })
  }, [shiftCells, shiftDetail])

  const currentShift = useMemo(() => findCurrentShiftCell(shiftCells, currentAttendance, now), [currentAttendance, now, shiftCells])
  const attendanceStatus = useMemo(
    () => getAttendanceStatus(currentShift, currentAttendance),
    [currentAttendance, currentShift],
  )

  const handleRegisterShift = () => {
    setSelectedRegistrationSlots([])
    setRegistrationError('')
    setIsRegistrationOpen(true)
    void loadRegistrations()
  }

  const handleToggleRegistrationSlot = (slot: ShiftRegistrationSlot) => {
    const slotKey = getSlotKey(slot.workDate, slot.startTime, slot.endTime)

    setSelectedRegistrationSlots((currentSlots) => {
      if (currentSlots.some((currentSlot) => getSlotKey(currentSlot.workDate, currentSlot.startTime, currentSlot.endTime) === slotKey)) {
        return currentSlots.filter((currentSlot) => getSlotKey(currentSlot.workDate, currentSlot.startTime, currentSlot.endTime) !== slotKey)
      }

      return [...currentSlots, slot]
    })
  }

  const handleSubmitRegistrations = async () => {
    if (selectedRegistrationSlots.length === 0) {
      setRegistrationError('Vui lòng chọn ít nhất một ca làm.')
      return
    }

    setIsSubmittingRegistrations(true)
    setRegistrationError('')
    try {
      await submitShiftRegistrations(selectedRegistrationSlots)
      setSelectedRegistrationSlots([])
      await loadRegistrations()
      setToast('Đã gửi đăng ký ca làm. Vui lòng chờ admin duyệt.')
    } catch (error) {
      setRegistrationError(error instanceof Error ? error.message : 'Không thể đăng ký ca làm.')
    } finally {
      setIsSubmittingRegistrations(false)
    }
  }

  const handleVerifyLocation = async () => {
    setAttendanceError('')
    setLocationStatus('CHECKING')
    setLocationDistance(null)

    if (!navigator.geolocation) {
      setLocationStatus('BLOCKED')
      setAttendanceError('Không thể truy cập vị trí trên trình duyệt này.')
      return
    }

    try {
      const position = await getCurrentPosition()
      const distance = calculateDistanceMeters(
        position.coords.latitude,
        position.coords.longitude,
        STAFF_LOCATION.lat,
        STAFF_LOCATION.lng,
      )

      setLocationDistance(distance)
      if (isWithinStaffLocation(distance)) {
        setLocationStatus('VALID')
        return
      }

      setLocationStatus('INVALID')
      setAttendanceError('Bạn chưa ở gần homestay để điểm danh.')
    } catch {
      setLocationStatus('BLOCKED')
      setAttendanceError('Không thể truy cập vị trí. Vui lòng bật quyền vị trí và thử lại.')
    }
  }

  const handleCheckIn = async () => {
    setAttendanceError('')

    if (!currentShift) {
      setAttendanceError('Không có ca hiện tại để check-in.')
      return
    }

    if (!isWithinCheckInWindow(currentShift, now)) {
      setAttendanceError(`Chỉ được check-in từ ${getCheckInStartTime(currentShift)} đến ${currentShift.endTime}.`)
      return
    }

    if (locationStatus !== 'VALID') {
      setAttendanceError('Vui lòng xác minh vị trí gần homestay trước khi check-in.')
      return
    }

    setIsAttendanceLoading(true)
    try {
      const attendance = await checkInCurrentShift()
      setCurrentAttendance(attendance)
      setToast('Check-in thành công.')
      setAttendanceError('')
    } catch (error) {
      setAttendanceError(error instanceof Error ? error.message : 'Không thể check-in ca làm.')
    } finally {
      setIsAttendanceLoading(false)
    }
  }

  const handleCheckOut = async () => {
    setAttendanceError('')

    if (!currentShift) {
      setAttendanceError('Không có ca hiện tại để check-out.')
      return
    }

    if (locationStatus !== 'VALID') {
      setAttendanceError('Vui lòng xác minh vị trí gần homestay trước khi check-out.')
      return
    }

    if (!isAfterShiftEnd(currentShift, now)) {
      setAttendanceError(`Chưa đến giờ kết thúc ca. Bạn có thể check-out sau ${currentShift.endTime}.`)
      return
    }

    setIsAttendanceLoading(true)
    try {
      const attendance = await checkOutCurrentShift()
      setCurrentAttendance(attendance)
      setToast('Check-out thành công.')
      setAttendanceError('')
    } catch (error) {
      setAttendanceError(error instanceof Error ? error.message : 'Không thể check-out ca làm.')
    } finally {
      setIsAttendanceLoading(false)
    }
  }

  const openShiftDetails = useCallback(async (cell: StaffShiftCell) => {
    const nextState: ShiftDetailState = {
      cell,
      bookings: [],
      isLoading: Boolean(cell.shiftId),
      error: '',
    }
    setShiftDetail(nextState)

    if (!cell.shiftId) {
      return
    }

    try {
      const bookings = await fetchShiftBookings(cell.shiftId)
      setShiftDetail((current) => {
        if (!current || current.cell.cellId !== cell.cellId) return current
        return {
          ...current,
          bookings: bookings.map(mapShiftBookingToView),
          isLoading: false,
        }
      })
    } catch (error) {
      setShiftDetail((current) => {
        if (!current || current.cell.cellId !== cell.cellId) return current
        return {
          ...current,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Không thể tải booking trong ca làm.',
        }
      })
    }
  }, [])

  return (
    <AuthGuard allowedRoles={['STAFF']}>
      <StaffPageShell>
        <section className="space-y-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="font-display text-sm font-bold uppercase tracking-wide text-brand-orange">
                Staff workspace
              </p>
              <h1 className="font-display text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
                Lịch làm việc
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-full border border-outline-variant bg-white p-1 shadow-[var(--homestay-shadow-card)]">
                  <button
                    type="button"
                    onClick={() => setScheduleView('CURRENT_WEEK')}
                    className={[
                      'h-10 rounded-full px-4 font-display text-sm font-bold transition',
                      scheduleView === 'CURRENT_WEEK'
                        ? 'bg-surface-container text-on-surface'
                        : 'text-on-surface-variant hover:text-brand-orange',
                    ].join(' ')}
                  >
                    Tuần hiện tại
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleView('NEXT_WEEK')}
                    className={[
                      'h-10 rounded-full px-4 font-display text-sm font-bold transition',
                      scheduleView === 'NEXT_WEEK'
                        ? 'bg-surface-container text-on-surface'
                        : 'text-on-surface-variant hover:text-brand-orange',
                    ].join(' ')}
                  >
                    Tuần tới
                  </button>
                </div>
                <span className="text-sm font-semibold text-on-surface-variant">
                  {formatShortDate(activeWeekRange.fromDate)} - {formatShortDate(activeWeekRange.toDate)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleRegisterShift}
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#C91F2E] px-6 font-display text-sm font-bold text-white shadow-[0_12px_26px_rgba(201,31,46,0.22)] transition hover:bg-[#A91724]"
              >
                Đăng ký ca làm việc
                <IconCalendarPlus />
              </button>
              <button
                type="button"
                onClick={() => {
                  setAttendanceError('')
                  setLocationStatus('IDLE')
                  setLocationDistance(null)
                  setIsAttendanceOpen(true)
                }}
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#FFF5F5] px-6 font-display text-sm font-bold text-[#B91C1C] transition hover:bg-[#FFE8E8]"
              >
                Điểm danh
                <IconCalendarCheck />
              </button>
            </div>
          </div>

          {pageError && (
            <div className="rounded-xl border border-error-container bg-error-container px-4 py-3 text-sm font-semibold text-on-error-container">
              {pageError}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <SummaryCard
              label="Ca trong tuần"
              value={shiftCells.length}
              helper="Lấy từ /api/staff/schedule/shifts"
            />
            <SummaryCard
              label="Ca hiện tại"
              value={currentShift ? currentShift.shiftName : 'Không có'}
              helper={
                currentShift
                  ? `${formatDateForHeader(currentShift.date)} · ${currentShift.startTime} - ${currentShift.endTime}`
                  : 'Không có ca đang diễn ra'
              }
            />
            <SummaryCard
              label="Chấm công"
              value={getAttendanceStatusMeta(attendanceStatus).label}
              helper="Đồng bộ từ attendance API hiện tại"
            />
          </div>

          <ScheduleGrid
            title={activeScheduleCopy.title}
            description={activeScheduleCopy.description}
            weekDays={activeWeekDays}
            shiftCells={activeShiftCells}
            shiftMap={activeShiftMap}
            isLoading={isLoadingActiveSchedule}
            emptyTitle={activeScheduleCopy.emptyTitle}
            emptyDescription={activeScheduleCopy.emptyDescription}
            onOpenShiftDetails={openShiftDetails}
          />
        </section>

        {isAttendanceOpen && (
          <AttendanceModal
            shift={currentShift}
            status={attendanceStatus}
            attendance={currentAttendance}
            locationStatus={locationStatus}
            locationDistance={locationDistance}
            isLoading={isAttendanceLoading}
            error={attendanceError}
            now={now}
            onVerify={handleVerifyLocation}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            onClose={() => {
              setIsAttendanceOpen(false)
              setAttendanceError('')
            }}
          />
        )}

        {isRegistrationOpen && (
          <ShiftRegistrationModal
            weekDays={nextWeekDays}
            shiftRows={SHIFT_ROWS}
            registrationMap={registrationMap}
            selectedSlotKeys={selectedRegistrationSlotKeys}
            isLoading={isLoadingRegistrations}
            isSubmitting={isSubmittingRegistrations}
            error={registrationError}
            onToggleSlot={handleToggleRegistrationSlot}
            onSubmit={handleSubmitRegistrations}
            onClose={() => {
              setIsRegistrationOpen(false)
              setSelectedRegistrationSlots([])
              setRegistrationError('')
            }}
          />
        )}

        {shiftDetail && (
          <ShiftDetailModal
            detail={shiftDetail}
            now={now}
            onClose={() => setShiftDetail(null)}
          />
        )}

        {toast && <Toast message={toast} />}
      </StaffPageShell>
    </AuthGuard>
  )
}

function ScheduleGrid({
  title,
  description,
  weekDays,
  shiftCells,
  shiftMap,
  isLoading,
  emptyTitle,
  emptyDescription,
  onOpenShiftDetails,
}: {
  title: string
  description: string
  weekDays: WeekDay[]
  shiftCells: StaffShiftCell[]
  shiftMap: Record<string, StaffShiftCell>
  isLoading: boolean
  emptyTitle: string
  emptyDescription: string
  onOpenShiftDetails: (cell: StaffShiftCell) => void
}) {
  return (
    <section className="border border-outline-variant bg-white p-4 shadow-[var(--homestay-shadow-card)] sm:p-7">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-on-surface">{title}</h2>
          <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
        </div>
        <span className="text-xs font-semibold text-on-surface-variant">
          {weekDays[0] ? formatShortDate(weekDays[0].isoDate) : ''} - {weekDays[weekDays.length - 1] ? formatShortDate(weekDays[weekDays.length - 1].isoDate) : ''}
        </span>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-10 text-center text-sm text-on-surface-variant">
          Đang tải lịch làm việc...
        </div>
      ) : shiftCells.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse text-left">
            <thead>
              <tr>
                <th className="h-14 w-[170px] border border-[#C9D3E1] bg-white" />
                {weekDays.map((day) => (
                  <th
                    key={day.key}
                    className="h-14 border border-[#C9D3E1] bg-white text-center font-display text-lg font-medium text-[#1F2937]"
                  >
                    <div>{day.label}</div>
                    <div className="mt-1 text-xs font-semibold text-on-surface-variant">{day.shortDate}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SHIFT_ROWS.map((row) => (
                <tr key={row.name}>
                  <th className="h-[220px] w-[170px] border border-[#C9D3E1] bg-white px-3 align-middle sm:px-4">
                    <div>
                      <p className="font-display text-xl font-medium text-on-surface">{row.name}</p>
                      <span className="mt-2 inline-flex rounded-full bg-[#E3E9F1] px-3 py-1 font-display text-sm font-bold text-[#253044]">
                        {row.startTime} - {row.endTime}
                      </span>
                    </div>
                  </th>
                  {weekDays.map((day) => {
                    const cell = shiftMap[getCellKey(day.key, row.name)] ?? createEmptyCell(day, row)
                    const meta = getShiftStatusMeta(cell.status)

                    return (
                      <td
                        key={`${day.key}-${row.name}`}
                        className={[
                          'h-[220px] border border-[#C9D3E1] align-middle',
                          cell.status === 'EMPTY' ? 'bg-[#F7F8FA]' : 'bg-white',
                        ].join(' ')}
                      >
                        <button
                          type="button"
                          onClick={() => void onOpenShiftDetails(cell)}
                          className="flex h-full w-full items-center justify-center p-4 text-center transition hover:bg-primary-container/30 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-orange"
                        >
                          <span
                            className={[
                              'inline-flex rounded-full px-4 py-2 font-display text-sm font-bold',
                              meta.className,
                            ].join(' ')}
                          >
                            {meta.label}
                          </span>
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function ShiftRegistrationModal({
  weekDays,
  shiftRows,
  registrationMap,
  selectedSlotKeys,
  isLoading,
  isSubmitting,
  error,
  onToggleSlot,
  onSubmit,
  onClose,
}: {
  weekDays: WeekDay[]
  shiftRows: ShiftRow[]
  registrationMap: Record<string, StaffShiftRegistration>
  selectedSlotKeys: Set<string>
  isLoading: boolean
  isSubmitting: boolean
  error: string
  onToggleSlot: (slot: ShiftRegistrationSlot) => void
  onSubmit: () => void
  onClose: () => void
}) {
  const selectedCount = selectedSlotKeys.size

  return (
    <ModalFrame
      title="Đăng ký ca làm việc"
      description="Chọn ca làm cho tuần tới. Các ca được gửi ở trạng thái chờ admin duyệt."
      onClose={onClose}
      size="lg"
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-outline-variant bg-white p-4">
          <div>
            <p className="font-display text-base font-bold text-on-surface">Tuần đăng ký</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              {weekDays[0] ? formatDateForHeader(weekDays[0].isoDate) : ''} - {weekDays[weekDays.length - 1] ? formatDateForHeader(weekDays[weekDays.length - 1].isoDate) : ''}
            </p>
            <p className="mt-2 text-xs font-semibold text-on-surface-variant">
              {isLoading ? 'Đang tự tải danh sách đăng ký...' : 'Danh sách đăng ký được tải tự động khi mở cửa sổ này.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-error-container bg-error-container px-4 py-3 text-sm font-semibold text-on-error-container">
            {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-outline-variant bg-white">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead>
              <tr>
                <th className="h-12 w-[150px] border border-[#C9D3E1] bg-white px-3 text-sm font-bold text-on-surface-variant">
                  Ca
                </th>
                {weekDays.map((day) => (
                  <th key={day.key} className="h-12 border border-[#C9D3E1] bg-white px-3 text-center font-display text-sm font-bold text-on-surface">
                    <div>{day.label}</div>
                    <div className="mt-1 text-xs font-semibold text-on-surface-variant">{day.shortDate}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shiftRows.map((row) => (
                <tr key={row.name}>
                  <th className="h-[130px] border border-[#C9D3E1] bg-white px-3 align-middle">
                    <p className="font-display text-base font-bold text-on-surface">{row.name}</p>
                    <p className="mt-1 text-xs font-semibold text-on-surface-variant">{row.startTime} - {row.endTime}</p>
                  </th>
                  {weekDays.map((day) => {
                    const slot: ShiftRegistrationSlot = {
                      workDate: day.isoDate,
                      startTime: row.startTime,
                      endTime: row.endTime,
                    }
                    const slotKey = getSlotKey(slot.workDate, slot.startTime, slot.endTime)
                    const registration = registrationMap[slotKey]
                    const isSelected = selectedSlotKeys.has(slotKey)
                    const isBlocked = Boolean(registration && registration.status !== 'REJECTED')
                    const meta = registration ? getRegistrationStatusMeta(registration.status) : null

                    return (
                      <td key={`${day.key}-${row.name}`} className="h-[130px] border border-[#C9D3E1] bg-[#FDFBF8] p-2 align-middle">
                        <button
                          type="button"
                          onClick={() => onToggleSlot(slot)}
                          disabled={isBlocked || isLoading || isSubmitting}
                          className={[
                            'flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl border px-3 text-center transition',
                            isSelected
                              ? 'border-brand-orange bg-primary-container text-on-primary-container'
                              : 'border-outline-variant bg-white text-on-surface hover:border-brand-orange/50',
                            isBlocked ? 'cursor-not-allowed opacity-75 hover:border-outline-variant' : '',
                          ].join(' ')}
                        >
                          <span className="font-display text-sm font-bold">
                            {isSelected ? 'Đã chọn' : meta?.label ?? 'Có thể đăng ký'}
                          </span>
                          {registration?.rejectionReason && (
                            <span className="line-clamp-2 text-xs text-on-surface-variant">{registration.rejectionReason}</span>
                          )}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-on-surface-variant">Đã chọn {selectedCount} ca.</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
              Hủy
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={selectedCount === 0 || isSubmitting || isLoading}
              className="btn-warm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi đăng ký'}
            </button>
          </div>
        </div>
      </div>
    </ModalFrame>
  )
}

function AttendanceModal({
  shift,
  status,
  attendance,
  locationStatus,
  locationDistance,
  isLoading,
  error,
  now,
  onVerify,
  onCheckIn,
  onCheckOut,
  onClose,
}: {
  shift: StaffShiftCell | null
  status: AttendanceStatus
  attendance: StaffAttendanceRecord | null
  locationStatus: VerificationStatus
  locationDistance: number | null
  isLoading: boolean
  error: string
  now: Date
  onVerify: () => void
  onCheckIn: () => void
  onCheckOut: () => void
  onClose: () => void
}) {
  const statusMeta = getAttendanceStatusMeta(status)
  const hasShift = Boolean(shift)
  const withinCheckInWindow = shift ? isWithinCheckInWindow(shift, now) : false
  const afterShiftEnd = shift ? isAfterShiftEnd(shift, now) : false
  const canCheckIn = status === 'NOT_STARTED' && hasShift && withinCheckInWindow && locationStatus === 'VALID' && !isLoading
  const canCheckOut = status === 'CHECKED_IN' && hasShift && afterShiftEnd && locationStatus === 'VALID' && !isLoading
  const locationConditionStatus: ConditionStatus =
    locationStatus === 'CHECKING'
      ? 'CHECKING'
      : locationStatus === 'VALID'
        ? 'PASSED'
        : 'FAILED'

  return (
    <ModalFrame
      title="Điểm danh ca hiện tại"
      description="Xác minh vị trí và ghi nhận check-in/check-out cho ca đang diễn ra."
      onClose={onClose}
      size="lg"
    >
      {!shift ? (
        <div className="rounded-xl border border-error-container bg-error-container px-4 py-3 text-sm font-semibold text-on-error-container">
          Không có ca hiện tại.
        </div>
      ) : (
        <div className="space-y-5">
          <section className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-display text-xl font-bold text-on-surface">{shift.shiftName}</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {formatDateForHeader(shift.date)} · {shift.startTime} - {shift.endTime}
                </p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">{shift.note}</p>
              </div>
              <span className={['w-fit rounded-full px-3 py-1 font-display text-xs font-bold', statusMeta.className].join(' ')}>
                {statusMeta.label}
              </span>
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-4 shadow-[0_8px_24px_rgba(26,28,30,0.04)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-on-surface">Xác minh vị trí</h3>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {STAFF_LOCATION.name} · {STAFF_LOCATION.address} · bán kính {STAFF_LOCATION.radiusMeters}m
                </p>
                {locationDistance !== null && (
                  <p className="mt-1 text-sm font-semibold text-on-surface">
                    Khoảng cách hiện tại: {formatDistance(locationDistance)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onVerify}
                disabled={locationStatus === 'CHECKING' || isLoading}
                className="btn-secondary shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {locationStatus === 'CHECKING' ? 'Đang kiểm tra vị trí...' : 'Kiểm tra vị trí'}
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-4 shadow-[0_8px_24px_rgba(26,28,30,0.04)]">
            <h3 className="font-display text-base font-bold text-on-surface">Điều kiện điểm danh</h3>
            <div className="mt-4 grid gap-2">
              <ConditionLine status="PASSED" label="Ca làm hợp lệ từ backend" />
              <ConditionLine
                status={withinCheckInWindow ? 'PASSED' : 'FAILED'}
                label={`Đúng khung giờ check-in từ ${getCheckInStartTime(shift)} đến ${shift.endTime}`}
              />
              <ConditionLine status={locationConditionStatus} label="Đang ở gần homestay" />
              <ConditionLine
                status={afterShiftEnd ? 'PASSED' : 'FAILED'}
                label={`Đã đến giờ kết thúc ca ${shift.endTime}`}
              />
            </div>
          </section>

          <section className="grid gap-3 text-sm sm:grid-cols-2">
            <InfoItem label="Giờ vào" value={shift.checkInTime ?? 'Chưa check-in'} />
            <InfoItem label="Giờ ra" value={shift.checkOutTime ?? 'Chưa check-out'} />
            <InfoItem
              label="Tổng thời lượng làm việc"
              value={formatAttendanceDuration(attendance, shift.checkInTime, shift.checkOutTime, now)}
            />
            <InfoItem label="Trạng thái ca" value={statusMeta.label} />
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-4 shadow-[0_8px_24px_rgba(26,28,30,0.04)]">
            <h3 className="font-display text-base font-bold text-on-surface">Timeline ca làm</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <TimelineStep label="Bắt đầu ca" value={shift.startTime} active />
              <TimelineStep label="Check-in" value={shift.checkInTime ?? 'Chưa có'} active={Boolean(shift.checkInTime)} />
              <TimelineStep label="Kết thúc ca" value={shift.checkOutTime ?? shift.endTime} active={Boolean(shift.checkOutTime)} />
            </div>
          </section>

          {status === 'CHECKED_IN' && !afterShiftEnd && (
            <div className="rounded-xl border border-[#FEF3C7] bg-[#FFFBEB] px-4 py-3 text-sm font-semibold text-[#92400E]">
              Chưa đến giờ kết thúc ca. Bạn có thể check-out sau {shift.endTime}.
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-error-container bg-error-container px-4 py-3 text-sm font-semibold text-on-error-container">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={isLoading}>
              Hủy
            </button>
            {status === 'NOT_STARTED' && (
              <button
                type="button"
                onClick={onCheckIn}
                disabled={!canCheckIn}
                className="btn-warm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? 'Đang check-in...' : 'Check-in'}
              </button>
            )}
            {status === 'CHECKED_IN' && (
              <button
                type="button"
                onClick={onCheckOut}
                disabled={!canCheckOut}
                className="btn-warm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? 'Đang check-out...' : 'Check-out'}
              </button>
            )}
            {status === 'CHECKED_OUT' && (
              <button type="button" disabled className="btn-secondary opacity-70">
                Đã hoàn tất ca
              </button>
            )}
          </div>
        </div>
      )}
    </ModalFrame>
  )
}

function ShiftDetailModal({
  detail,
  now,
  onClose,
}: {
  detail: ShiftDetailState
  now: Date
  onClose: () => void
}) {
  const meta = getShiftStatusMeta(detail.cell.status)

  return (
    <ModalFrame title="Chi tiết ca làm" onClose={onClose} size="lg">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4 rounded-xl border border-outline-variant bg-surface-container-low p-4">
          <div>
            <p className="font-display text-xl font-bold text-on-surface">{detail.cell.shiftName}</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              {formatDateForHeader(detail.cell.date)} · {detail.cell.startTime} - {detail.cell.endTime}
            </p>
          </div>
          <span className={['rounded-full px-3 py-1 font-display text-xs font-bold', meta.className].join(' ')}>
            {meta.label}
          </span>
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <InfoItem label="Ngày" value={formatDateForHeader(detail.cell.date)} />
          <InfoItem label="Ca" value={detail.cell.shiftName} />
          <InfoItem label="Thời gian" value={`${detail.cell.startTime} - ${detail.cell.endTime}`} />
          <InfoItem label="Trạng thái" value={meta.label} />
          <InfoItem label="Check-in" value={detail.cell.checkInTime ?? 'Chưa có'} />
          <InfoItem label="Check-out" value={detail.cell.checkOutTime ?? 'Chưa có'} />
          <InfoItem
            label="Tổng thời lượng"
            value={formatAttendanceDuration(null, detail.cell.checkInTime, detail.cell.checkOutTime, now)}
          />
          <InfoItem label="Ghi chú" value={detail.cell.note} />
        </dl>

        <section className="rounded-xl border border-outline-variant bg-white p-4 shadow-[0_8px_24px_rgba(26,28,30,0.04)]">
          <h3 className="font-display text-base font-bold text-on-surface">Booking trong ca</h3>
          {detail.isLoading ? (
            <p className="mt-3 text-sm text-on-surface-variant">Đang tải booking trong ca...</p>
          ) : detail.error ? (
            <p className="mt-3 rounded-xl border border-error-container bg-error-container px-4 py-3 text-sm font-semibold text-on-error-container">
              {detail.error}
            </p>
          ) : detail.bookings.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-4 text-sm text-on-surface-variant">
              Không có booking nào trong khung giờ này.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {detail.bookings.map((booking) => (
                <article key={booking.bookingId} className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-display text-base font-bold text-on-surface">{booking.customerName}</p>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        {booking.roomName} · {formatBookingWindow(booking.startTime, booking.endTime)}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-on-surface-variant">
                      {booking.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-on-surface-variant">
                    Tiện nghi: {booking.equipment.length > 0 ? booking.equipment.join(', ') : 'Không có ghi chú tiện nghi'}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </ModalFrame>
  )
}

function SummaryCard({
  label,
  value,
  helper,
}: {
  label: string
  value: string | number
  helper: string
}) {
  return (
    <article className="rounded-3xl border border-outline-variant bg-white p-5 shadow-[var(--homestay-shadow-card)]">
      <p className="font-display text-sm font-bold text-on-surface-variant">{label}</p>
      <p className="mt-3 font-display text-3xl font-bold leading-none text-on-surface">{value}</p>
      <p className="mt-4 text-sm text-on-surface-variant">{helper}</p>
    </article>
  )
}

function ModalFrame({
  title,
  description,
  children,
  onClose,
  size = 'md',
}: {
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
  size?: 'md' | 'lg'
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1C1E]/35 p-3 sm:p-4">
      <section
        className={[
          'flex max-h-[calc(100vh-1.5rem)] w-full flex-col overflow-hidden rounded-xl border border-outline-variant bg-white shadow-[var(--homestay-shadow-elevated)]',
          size === 'lg' ? 'max-w-[760px]' : 'max-w-xl',
        ].join(' ')}
      >
        <header className="flex items-start justify-between gap-4 border-b border-outline-variant px-5 py-5 sm:px-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-on-surface">{title}</h2>
            {description && <p className="mt-1 max-w-xl text-sm leading-6 text-on-surface-variant">{description}</p>}
          </div>
          <button type="button" onClick={onClose} className="icon-button shrink-0" aria-label="Đóng">
            <IconClose />
          </button>
        </header>
        <div className="overflow-y-auto bg-[#FDFBF8] px-5 py-5 sm:px-6">{children}</div>
      </section>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-white px-4 py-3">
      <dt className="font-display text-xs font-bold uppercase text-on-surface-variant">{label}</dt>
      <dd className="mt-1 font-medium text-on-surface">{value}</dd>
    </div>
  )
}

function ConditionLine({ status, label }: { status: ConditionStatus; label: string }) {
  const meta = {
    PASSED: { mark: 'OK', label: 'Đạt', className: 'bg-secondary text-white', textClass: 'text-secondary' },
    FAILED: { mark: '!', label: 'Chưa đạt', className: 'bg-surface-container-high text-on-surface-variant', textClass: 'text-on-surface-variant' },
    CHECKING: { mark: '...', label: 'Đang kiểm tra', className: 'bg-primary-container text-on-primary-container', textClass: 'text-on-primary-container' },
  }[status]

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant bg-white px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className={['flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold', meta.className].join(' ')}>
          {meta.mark}
        </span>
        <span className="font-medium text-on-surface">{label}</span>
      </div>
      <span className={['shrink-0 text-xs font-bold', meta.textClass].join(' ')}>{meta.label}</span>
    </div>
  )
}

function TimelineStep({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div
      className={[
        'rounded-xl border px-4 py-3',
        active ? 'border-brand-orange bg-primary-container/35' : 'border-outline-variant bg-surface-container-low',
      ].join(' ')}
    >
      <p className="font-display text-xs font-bold uppercase text-on-surface-variant">{label}</p>
      <p className="mt-1 font-display text-lg font-bold text-on-surface">{value}</p>
    </div>
  )
}

function getShiftStatusMeta(status: ShiftStatus): StatusMeta {
  const meta: Record<ShiftStatus, StatusMeta> = {
    EMPTY: { label: 'Trống', className: 'bg-surface-container text-on-surface-variant' },
    ASSIGNED: { label: 'Đã phân công', className: 'bg-[#E8F5EC] text-secondary' },
    IN_PROGRESS: { label: 'Đang làm', className: 'bg-[#FEF3C7] text-[#92400E]' },
    COMPLETED: { label: 'Hoàn tất', className: 'bg-[#E8E4DC] text-on-surface-variant' },
  }

  return meta[status]
}

function getRegistrationStatusMeta(status: StaffShiftRegistration['status']): StatusMeta {
  const meta: Record<StaffShiftRegistration['status'], StatusMeta> = {
    PENDING: { label: 'Chờ duyệt', className: 'bg-[#FEF3C7] text-[#92400E]' },
    APPROVED: { label: 'Đã duyệt', className: 'bg-[#E8F5EC] text-secondary' },
    REJECTED: { label: 'Đã từ chối', className: 'bg-error-container text-on-error-container' },
  }

  return meta[status]
}

function getAttendanceStatusMeta(status: AttendanceStatus): StatusMeta {
  const meta: Record<AttendanceStatus, StatusMeta> = {
    NOT_STARTED: { label: 'Chưa check-in', className: 'bg-primary-container text-on-primary-container' },
    CHECKED_IN: { label: 'Đã check-in', className: 'bg-[#FEF3C7] text-[#92400E]' },
    CHECKED_OUT: { label: 'Đã check-out', className: 'bg-[#E8E4DC] text-on-surface-variant' },
    NO_SHIFT: { label: 'Không có ca', className: 'bg-error-container text-on-error-container' },
  }

  return meta[status]
}

function getAttendanceStatus(
  currentShift: StaffShiftCell | null,
  attendance: StaffAttendanceRecord | null,
): AttendanceStatus {
  if (!currentShift) return 'NO_SHIFT'
  if (!attendance || attendance.shiftId !== currentShift.shiftId) return 'NOT_STARTED'
  if (attendance.status === 'WORKING') return 'CHECKED_IN'
  return 'CHECKED_OUT'
}

function getWeekDays(baseDate: Date): WeekDay[] {
  const start = startOfWeek(baseDate)

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const key = toDayKey(date)

    return {
      key,
      label: DAY_META[key].label,
      longLabel: DAY_META[key].longLabel,
      isoDate: toDateKey(date),
      shortDate: new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(date),
    }
  })
}

function mapShiftToCell(
  shift: StaffScheduleShift,
  attendance: StaffAttendanceRecord | null,
): StaffShiftCell {
  const day = parseDate(shift.date)
  const dayKey = toDayKey(day)
  const shiftName = inferShiftName(shift.startTime, shift.endTime)
  const normalizedStart = normalizeTime(shift.startTime)
  const normalizedEnd = normalizeTime(shift.endTime)
  const currentAttendance = attendance?.shiftId === shift.shiftId ? attendance : null

  return {
    cellId: `${dayKey}-${shiftName}`,
    shiftId: shift.shiftId,
    dayKey,
    date: shift.date,
    shiftName,
    startTime: normalizedStart,
    endTime: normalizedEnd,
    status: currentAttendance
      ? currentAttendance.status === 'WORKING'
        ? 'IN_PROGRESS'
        : 'COMPLETED'
      : 'ASSIGNED',
    note: 'Đồng bộ từ lịch backend. Mở chi tiết để xem booking trong ca.',
    checkInTime: currentAttendance?.checkInTime ? formatTimeFromIso(currentAttendance.checkInTime) : undefined,
    checkOutTime: currentAttendance?.checkOutTime ? formatTimeFromIso(currentAttendance.checkOutTime) : undefined,
  }
}

function mapShiftBookingToView(booking: StaffShiftBooking): ShiftBookingView {
  return {
    bookingId: booking.bookingId,
    roomName: booking.roomName,
    customerName: booking.customerName,
    startTime: booking.startTime,
    endTime: booking.endTime,
    status: booking.status,
    equipment: normalizeEquipmentNotes(booking.equipmentNotes),
  }
}

function compareShiftCells(firstCell: StaffShiftCell, secondCell: StaffShiftCell) {
  return (
    firstCell.date.localeCompare(secondCell.date) ||
    SHIFT_ROWS.findIndex((row) => row.name === firstCell.shiftName) -
      SHIFT_ROWS.findIndex((row) => row.name === secondCell.shiftName)
  )
}

function findCurrentShiftCell(
  cells: StaffShiftCell[],
  attendance: StaffAttendanceRecord | null,
  now: Date,
): StaffShiftCell | null {
  if (attendance) {
    const matchedCell = cells.find((cell) => cell.shiftId === attendance.shiftId)
    if (matchedCell) return matchedCell
  }

  return cells.find((cell) => isShiftHappeningNow(cell, now)) ?? null
}

function createEmptyCell(day: WeekDay, row: ShiftRow): StaffShiftCell {
  return {
    cellId: `${day.key}-${row.name}`,
    shiftId: null,
    dayKey: day.key,
    date: day.isoDate,
    shiftName: row.name,
    startTime: row.startTime,
    endTime: row.endTime,
    status: 'EMPTY',
    note: 'Chưa có ca được phân công ở khung giờ này.',
  }
}

function getCellKey(dayKey: DayKey, shiftName: ShiftName) {
  return `${dayKey}-${shiftName}`
}

function getSlotKey(workDate: string, startTime: string, endTime: string) {
  return `${workDate}-${normalizeTime(startTime)}-${normalizeTime(endTime)}`
}

function inferShiftName(startTime: string, endTime: string): ShiftName {
  const normalizedStart = normalizeTime(startTime)
  const normalizedEnd = normalizeTime(endTime)

  const matchedRow = SHIFT_ROWS.find(
    (row) => row.startTime === normalizedStart && row.endTime === normalizedEnd,
  )
  if (matchedRow) return matchedRow.name

  const startMinutes = parseTimeToMinutes(normalizedStart)
  if (startMinutes < 12 * 60) return 'Ca sáng'
  if (startMinutes < 18 * 60) return 'Ca chiều'
  return 'Ca tối'
}

function normalizeTime(value: string) {
  if (!value) return '00:00'
  const [hours = '00', minutes = '00'] = value.split(':')
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
}

function formatTimeFromIso(value: string) {
  return new Date(value).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatDateForHeader(dateKey: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  }).format(parseDate(dateKey))
}

function formatShortDate(dateKey: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  }).format(parseDate(dateKey))
}

function formatBookingWindow(startIso: string, endIso: string) {
  return `${formatTimeFromIso(startIso)} - ${formatTimeFromIso(endIso)}`
}

function formatAttendanceDuration(
  attendance: StaffAttendanceRecord | null,
  checkInTime?: string,
  checkOutTime?: string,
  now = new Date(),
) {
  const numericDuration =
    typeof attendance?.workDuration === 'number'
      ? attendance.workDuration
      : typeof attendance?.workDuration === 'string'
        ? Number(attendance.workDuration)
        : null

  if (numericDuration !== null && Number.isFinite(numericDuration) && numericDuration >= 0) {
    const hours = numericDuration
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)
    if (wholeHours <= 0) return `${minutes} phút`
    if (minutes <= 0) return `${wholeHours} giờ`
    return `${wholeHours} giờ ${minutes} phút`
  }

  if (!checkInTime) return 'Chưa bắt đầu'
  const checkIn = createDateFromTime(checkInTime, now)
  const checkOut = checkOutTime ? createDateFromTime(checkOutTime, now) : now
  const diffMinutes = Math.max(0, Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000))
  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60

  if (hours <= 0) return `${minutes} phút`
  if (minutes <= 0) return `${hours} giờ`
  return `${hours} giờ ${minutes} phút`
}

function normalizeEquipmentNotes(notes?: string | null) {
  return (notes ?? '')
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function isShiftHappeningNow(shift: StaffShiftCell, now: Date) {
  const shiftStart = createDateFromTime(shift.startTime, parseDate(shift.date))
  const shiftEnd = createDateFromTime(shift.endTime, parseDate(shift.date))
  return now >= shiftStart && now <= shiftEnd
}

function isWithinCheckInWindow(shift: StaffShiftCell, now: Date) {
  const shiftStart = createDateFromTime(shift.startTime, parseDate(shift.date))
  const shiftEnd = createDateFromTime(shift.endTime, parseDate(shift.date))
  const earliestCheckIn = new Date(shiftStart.getTime() - CHECK_IN_EARLY_MINUTES * 60 * 1000)
  return now >= earliestCheckIn && now <= shiftEnd
}

function isAfterShiftEnd(shift: StaffShiftCell, now: Date) {
  return now >= createDateFromTime(shift.endTime, parseDate(shift.date))
}

function getCheckInStartTime(shift: StaffShiftCell) {
  const startMinutes = parseTimeToMinutes(shift.startTime) - CHECK_IN_EARLY_MINUTES
  const normalizedMinutes = Math.max(0, startMinutes)
  const hours = Math.floor(normalizedMinutes / 60)
  const minutes = normalizedMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function startOfWeek(date: Date) {
  const result = new Date(date)
  const day = result.getDay()
  const diff = day === 0 ? -6 : 1 - day
  result.setDate(result.getDate() + diff)
  result.setHours(0, 0, 0, 0)
  return result
}

function toDayKey(date: Date): DayKey {
  const keys: DayKey[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  return keys[date.getDay()]
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

function createDateFromTime(time: string, baseDate: Date) {
  const [hours, minutes] = normalizeTime(time).split(':').map(Number)
  const date = new Date(baseDate)
  date.setHours(hours, minutes, 0, 0)
  return date
}

function parseTimeToMinutes(time: string) {
  const [hours, minutes] = normalizeTime(time).split(':').map(Number)
  return hours * 60 + minutes
}

function IconCalendarCheck() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M7 3v3M17 3v3M4.5 9h15M6.5 5h11A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10A2.5 2.5 0 0 1 6.5 5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="m8.5 14 2 2 5-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconCalendarPlus() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M7 3v3M17 3v3M4.5 9h15M6.5 5h11A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10A2.5 2.5 0 0 1 6.5 5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M12 12v5M9.5 14.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
