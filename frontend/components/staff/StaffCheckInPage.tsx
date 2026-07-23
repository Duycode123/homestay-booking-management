'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { StaffPageShell } from './StaffShared'
import { calculateDistanceMeters, STAFF_LOCATION } from './staff-location'
import { useAuth } from '@/contexts/AuthContext'
import { getDisplayName } from '@/lib/staff-profile'
import {
  checkInCurrentShift,
  checkOutCurrentShift,
  fetchCurrentAttendance,
  type StaffAttendanceRecord,
} from '@/lib/staff-schedule-service'

type AttendanceStatus = 'NOT_STARTED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'NO_SHIFT'
type VerificationStatus = 'IDLE' | 'CHECKING' | 'VALID' | 'INVALID'
type VerificationMethod = 'GPS' | 'NONE'

type StaffCurrentShift = {
  id: string
  shiftName: string
  date: string
  startTime: string
  endTime: string
  staffName: string
  assignedArea?: string
  status: AttendanceStatus
  checkInTime?: string
  checkOutTime?: string
  verificationMethod?: VerificationMethod
}

type StatusMeta = {
  label: string
  className: string
  dotClassName: string
}

type ToastState = {
  type: 'success' | 'error'
  message: string
}

type AuditLog = {
  id: string
  label: string
  time: string
  method: VerificationMethod
  status: string
}

type ActionLoading = 'CHECK_IN' | 'CHECK_OUT' | null

const todayFormatter = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

function createInitialShift(): StaffCurrentShift {
  const now = new Date()
  const end = new Date(now)
  end.setHours(end.getHours() + 4)

  return {
    id: 'shift-current',
    shiftName: 'Ca hiện tại',
    date: formatDateKey(now),
    startTime: formatTime(now),
    endTime: formatTime(end),
    staffName: 'Nhân viên',
    assignedArea: 'Deluxe Balcony 201, Deluxe City View 202 và Family Garden 302',
    status: 'NOT_STARTED',
    verificationMethod: 'NONE',
  }
}

export default function StaffCheckInPage() {
  const { user } = useAuth()
  const [shift, setShift] = useState<StaffCurrentShift>(() => createInitialShift())
  const [now, setNow] = useState(() => new Date())
  const [loadingAction, setLoadingAction] = useState<ActionLoading>(null)
  const [locationStatus, setLocationStatus] = useState<VerificationStatus>('IDLE')
  const [locationDistance, setLocationDistance] = useState<number | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [toast, setToast] = useState<ToastState | null>(null)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    setShift((current) => ({ ...current, staffName: getDisplayName(user) }))
  }, [user])

  useEffect(() => {
    let cancelled = false

    async function loadCurrentAttendance() {
      try {
        const attendance = await fetchCurrentAttendance()
        if (cancelled) return

        if (!attendance) {
          setShift((current) => ({ ...current, status: 'NO_SHIFT' }))
          return
        }

        setShift((current) => mergeAttendanceIntoShift(current, attendance, getDisplayName(user)))
        setLocationStatus(attendance.status === 'WORKING' || attendance.status === 'MISSING_CHECKOUT' ? 'VALID' : 'IDLE')
      } catch (error) {
        if (!cancelled) {
          showToast({
            type: 'error',
            message: error instanceof Error ? error.message : 'Khong the tai du lieu cham cong hien tai.',
          })
        }
      }
    }

    void loadCurrentAttendance()

    return () => {
      cancelled = true
    }
  }, [user])

  const timeWindow = isWithinCheckInWindow(shift, now)
  const canVerify = shift.status === 'NOT_STARTED'
  const hasValidVerification = locationStatus === 'VALID'
  const selectedVerificationMethod: VerificationMethod = locationStatus === 'VALID' ? 'GPS' : 'NONE'
  const canCheckIn = shift.status === 'NOT_STARTED' && timeWindow.allowed && hasValidVerification
  const isLoading = loadingAction !== null
  const statusMeta = getAttendanceStatusMeta(shift.status)
  const attendanceLabel = getAttendanceResultLabel(shift, now)
  const durationDisplay = shift.checkInTime
    ? calculateWorkingDuration(shift.checkInTime, shift.checkOutTime, now)
    : 'Chưa ghi nhận'

  const actionConfig = useMemo(() => {
    if (shift.status === 'NOT_STARTED') {
      return {
        label: 'Check-in',
        loadingLabel: 'Đang check-in...',
        disabled: !canCheckIn,
        onClick: handleCheckIn,
      }
    }

    if (shift.status === 'CHECKED_IN') {
      return {
        label: 'Check-out',
        loadingLabel: 'Đang check-out...',
        disabled: false,
        onClick: handleCheckOut,
      }
    }

    if (shift.status === 'CHECKED_OUT') {
      return {
        label: 'Đã hoàn tất ca',
        loadingLabel: 'Đã hoàn tất ca',
        disabled: true,
        onClick: handleCheckOut,
      }
    }

    return {
      label: 'Không có ca hiện tại',
      loadingLabel: 'Không có ca hiện tại',
      disabled: true,
      onClick: handleCheckIn,
    }
  }, [canCheckIn, shift.status])

  const buttonText = isLoading ? actionConfig.loadingLabel : actionConfig.label
  const actionHelper = getActionHelper(shift, timeWindow, hasValidVerification)

  const showToast = (nextToast: ToastState) => setToast(nextToast)

  function handleVerifyLocation() {
    if (!canVerify) {
      showToast({ type: 'error', message: shift.status === 'NO_SHIFT' ? 'Không tìm thấy ca làm hiện tại.' : 'Ca làm này không còn cần xác minh check-in.' })
      return
    }

    if (!('geolocation' in navigator)) {
      setLocationStatus('INVALID')
      showToast({ type: 'error', message: 'Không thể xác minh vị trí. Vui lòng bật quyền vị trí để check-in tại homestay.' })
      return
    }

    setLocationStatus('CHECKING')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const distance = calculateDistanceMeters(
          position.coords.latitude,
          position.coords.longitude,
          STAFF_LOCATION.lat,
          STAFF_LOCATION.lng,
        )
        setLocationDistance(distance)

        if (distance <= STAFF_LOCATION.radiusMeters) {
          setLocationStatus('VALID')
          showToast({ type: 'success', message: 'Vị trí hợp lệ. Bạn đang ở trong khu vực chấm công.' })
          return
        }

        setLocationStatus('INVALID')
        showToast({
          type: 'error',
            message: 'Bạn chưa ở trong bán kính chấm công. Vui lòng đến đúng địa điểm để check-in.',
        })
      },
      () => {
        setLocationStatus('INVALID')
        showToast({
          type: 'error',
          message: 'Không thể xác minh vị trí. Vui lòng bật quyền vị trí để check-in tại homestay.',
        })
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    )
  }

  async function handleCheckIn() {
    if (shift.status === 'NO_SHIFT') {
      showToast({ type: 'error', message: 'Không tìm thấy ca làm hiện tại.' })
      return
    }

    if (shift.status === 'CHECKED_IN') {
      showToast({ type: 'error', message: 'Bạn đã check-in ca này rồi.' })
      return
    }

    if (shift.status === 'CHECKED_OUT') {
      showToast({ type: 'error', message: 'Ca làm này đã hoàn tất.' })
      return
    }

    if (!timeWindow.allowed) {
      showToast({ type: 'error', message: timeWindow.message })
      return
    }

    if (!hasValidVerification) {
      showToast({ type: 'error', message: 'Vui lòng xác minh vị trí gần homestay để check-in.' })
      return
    }

    try {
      setLoadingAction('CHECK_IN')
      const attendance = await checkInCurrentShift()
      const checkInTime = formatBackendTime(attendance.checkInTime) ?? formatTime(new Date())
      setShift((current) =>
        mergeAttendanceIntoShift(
          {
            ...current,
            verificationMethod: selectedVerificationMethod,
          },
          attendance,
          getDisplayName(user),
        ),
      )
      setAuditLogs((current) => [
        {
          id: `audit-${Date.now()}`,
          label: 'Check-in',
          time: checkInTime,
          method: selectedVerificationMethod,
          status: getAttendanceResultLabel({ ...shift, checkInTime }, new Date()),
        },
        ...current,
      ])
      setNow(new Date())

      showToast({ type: 'success', message: 'Check-in thành công.' })
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Khong the check-in ca lam.',
      })
    } finally {
      setLoadingAction(null)
    }
  }

  async function handleCheckOut() {
    if (shift.status === 'NO_SHIFT') {
      showToast({ type: 'error', message: 'Không tìm thấy ca làm hiện tại.' })
      return
    }

    if (shift.status === 'NOT_STARTED') {
      showToast({ type: 'error', message: 'Bạn cần check-in trước khi check-out.' })
      return
    }

    if (shift.status === 'CHECKED_OUT') {
      showToast({ type: 'error', message: 'Ca làm này đã hoàn tất.' })
      return
    }

    try {
      setLoadingAction('CHECK_OUT')
      const attendance = await checkOutCurrentShift()
      const checkOutTime = formatBackendTime(attendance.checkOutTime) ?? formatTime(new Date())
      setShift((current) => mergeAttendanceIntoShift(current, attendance, getDisplayName(user)))
      setAuditLogs((current) => [
        {
          id: `audit-${Date.now()}`,
          label: 'Check-out',
          time: checkOutTime,
          method: shift.verificationMethod ?? 'NONE',
          status: 'Hoàn tất',
        },
        ...current,
      ])
      setNow(new Date())
      setLoadingAction(null)
      showToast({ type: 'success', message: 'Check-out thành công.' })
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Khong the check-out ca lam.',
      })
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <AuthGuard allowedRoles={['STAFF']}>
      <StaffPageShell>
            <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="font-display text-sm font-bold uppercase tracking-wide text-brand-orange">
                  Điểm danh nhân viên
                </p>
                <h1 className="mt-2 font-display text-[32px] font-bold leading-10 text-on-surface">
                  Check-in ca làm
                </h1>
              </div>

              <div className="rounded-2xl border border-outline-variant bg-white px-4 py-3 text-right shadow-[var(--homestay-shadow-card)]">
                <p className="font-display text-xs font-bold uppercase tracking-wide text-on-surface-variant">Hôm nay</p>
                <p className="mt-1 font-display text-base font-bold text-on-surface">{todayFormatter.format(now)}</p>
              </div>
            </header>

            {shift.status === 'NO_SHIFT' ? (
              <NoShiftState />
            ) : (
              <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
                <div className="space-y-5">
                  <article className="overflow-hidden rounded-3xl border border-outline-variant bg-white shadow-[var(--homestay-shadow-card)]">
                    <div className="border-b border-outline-variant bg-surface-container-low px-5 py-4 sm:px-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-display text-sm font-bold uppercase tracking-wide text-brand-orange">Ca hiện tại</p>
                          <h2 className="mt-2 font-display text-3xl font-bold text-on-surface">{shift.shiftName}</h2>
                          <p className="mt-2 text-sm text-on-surface-variant">
                            {formatShiftDate(shift.date)} · {shift.startTime} - {shift.endTime}
                          </p>
                        </div>
                        <StatusBadge meta={statusMeta} />
                      </div>
                    </div>

                    <div className="space-y-6 p-5 sm:p-6">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Metric label="Nhân viên" value={shift.staffName} icon={<IconUser />} />
                        <Metric label="Khu vực/phòng phụ trách" value={shift.assignedArea ?? 'Chưa phân công'} icon={<IconRoom />} />
                        <Metric label="Thời gian ca" value={`${shift.startTime} - ${shift.endTime}`} icon={<IconClock />} />
                        <Metric label="Trạng thái" value={statusMeta.label} icon={<IconBadge />} />
                      </div>

                      <div className="rounded-3xl border border-outline-variant bg-surface-container-low p-4">
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <AttendanceValue label="Giờ check-in" value={shift.checkInTime ?? '--:--'} helper={shift.checkInTime ? 'Đã ghi nhận' : 'Chưa ghi nhận'} />
                          <AttendanceValue label="Giờ check-out" value={shift.checkOutTime ?? '--:--'} helper={shift.checkOutTime ? 'Đã ghi nhận' : 'Chưa ghi nhận'} />
                          <AttendanceValue label="Tổng thời lượng" value={durationDisplay} helper={shift.checkInTime ? 'Tự động cập nhật' : 'Chưa ghi nhận'} />
                          <AttendanceValue label="Xác minh" value={formatVerificationMethod(shift.verificationMethod ?? 'NONE')} helper={attendanceLabel} />
                        </div>
                      </div>

                      <div className="rounded-3xl border border-outline-variant bg-white p-4 shadow-[var(--homestay-shadow-card)]">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-display text-base font-bold text-on-surface">Cập nhật điểm danh ca làm</p>
                            <p className="mt-1 text-sm text-on-surface-variant">{actionHelper}</p>
                          </div>
                          <button
                            type="button"
                            onClick={actionConfig.onClick}
                            disabled={actionConfig.disabled || isLoading}
                            className={[
                              'inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-6 font-display text-sm font-bold shadow-[0_14px_30px_rgba(178,132,85,0.22)] transition',
                              actionConfig.disabled || isLoading
                                ? 'cursor-not-allowed bg-surface-container-high text-on-surface-variant shadow-none'
                                : 'bg-brand-orange text-white hover:bg-brand-orangeHover',
                            ].join(' ')}
                          >
                            {isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                            {isLoading ? actionConfig.loadingLabel : actionConfig.label}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>

                  <VerificationPanel
                    shift={shift}
                    timeWindow={timeWindow}
                    locationStatus={locationStatus}
                    locationDistance={locationDistance}
                    onVerifyLocation={handleVerifyLocation}
                  />

                  <AuditLogPanel logs={auditLogs} />
                </div>

                <aside className="space-y-5">
                  <article className="rounded-3xl border border-outline-variant bg-white p-5 shadow-[var(--homestay-shadow-card)]">
                    <h2 className="font-display text-xl font-bold text-on-surface">Timeline ca làm</h2>
                    <ShiftTimeline shift={shift} />
                  </article>

                  <article className="rounded-3xl border border-outline-variant bg-white p-5 shadow-[var(--homestay-shadow-card)]">
                    <h2 className="font-display text-xl font-bold text-on-surface">Quy định check-in</h2>
                    <div className="mt-4 space-y-3 text-sm leading-6 text-on-surface-variant">
                      <p>Check-in chỉ mở từ 30 phút trước đến 30 phút sau giờ bắt đầu ca.</p>
              <p>Nhân viên cần xác minh GPS trong bán kính {STAFF_LOCATION.radiusMeters}m quanh địa điểm homestay trước khi check-in.</p>
                      <p className="rounded-2xl border border-primary-container bg-primary-container p-3 font-semibold text-on-primary-container">
                        Địa điểm: {STAFF_LOCATION.address}
                      </p>
                    </div>
                  </article>
                </aside>
              </section>
            )}`r`n`r`n        {toast && <Toast toast={toast} />}
      </StaffPageShell>
    </AuthGuard>
  )
}

function VerificationPanel({
  shift,
  timeWindow,
  locationStatus,
  locationDistance,
  onVerifyLocation,
}: {
  shift: StaffCurrentShift
  timeWindow: ReturnType<typeof isWithinCheckInWindow>
  locationStatus: VerificationStatus
  locationDistance: number | null
  onVerifyLocation: () => void
}) {
  const shiftValid = shift.status !== 'NO_SHIFT'
  const canVerify = shift.status === 'NOT_STARTED'

  return (
    <article className="rounded-3xl border border-outline-variant bg-white p-5 shadow-[var(--homestay-shadow-card)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-wide text-brand-orange">Điều kiện chấm công</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-on-surface">Xác minh trước khi check-in</h2>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            Bạn cần thỏa điều kiện ca làm, khung giờ và xác minh GPS gần địa điểm homestay.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onVerifyLocation}
            disabled={!canVerify || locationStatus === 'CHECKING'}
            className="btn-secondary"
          >
            {locationStatus === 'CHECKING' ? 'Đang kiểm tra vị trí...' : 'Kiểm tra vị trí'}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <ChecklistItem
          label="Ca làm hợp lệ"
          description={shiftValid ? `${shift.shiftName} · ${shift.startTime} - ${shift.endTime}` : 'Không có ca hiện tại'}
          status={shiftValid ? 'VALID' : 'INVALID'}
        />
        <ChecklistItem
          label="Đúng khung giờ check-in"
          description={timeWindow.message}
          status={timeWindow.allowed ? 'VALID' : 'INVALID'}
        />
        <ChecklistItem
          label="Vị trí gần homestay"
          description={getLocationDescription(locationStatus, locationDistance)}
          status={locationStatus}
        />
      </div>
    </article>
  )
}

function ChecklistItem({
  label,
  description,
  status,
}: {
  label: string
  description: string
  status: VerificationStatus
}) {
  const meta = getVerificationMeta(status)

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
      <div className="flex items-start gap-3">
        <span className={['flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', meta.iconClassName].join(' ')}>
          {status === 'CHECKING' ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" /> : meta.icon}
        </span>
        <div>
          <p className="font-display text-sm font-bold text-on-surface">{label}</p>
          <p className="mt-1 text-sm leading-5 text-on-surface-variant">{description}</p>
          <p className={['mt-2 font-display text-xs font-bold uppercase tracking-wide', meta.textClassName].join(' ')}>
            {meta.label}
          </p>
        </div>
      </div>
    </div>
  )
}

function AuditLogPanel({ logs }: { logs: AuditLog[] }) {
  return (
    <article className="rounded-3xl border border-outline-variant bg-white p-5 shadow-[var(--homestay-shadow-card)]">
      <h2 className="font-display text-xl font-bold text-on-surface">Lịch sử chấm công</h2>
      {logs.length > 0 ? (
        <div className="mt-4 space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-sm font-bold text-on-surface">{log.label} lúc {log.time}</p>
                <span className="rounded-full bg-primary-container px-3 py-1 font-display text-xs font-bold text-on-primary-container">
                  {log.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-on-surface-variant">Phương thức xác minh: {formatVerificationMethod(log.method)}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-2xl border border-dashed border-outline bg-surface-container-low p-4 text-sm text-on-surface-variant">
          Chưa có lịch sử chấm công cho ca này.
        </p>
      )}
    </article>
  )
}

function Metric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border border-outline-variant bg-white p-4 shadow-[var(--homestay-shadow-card)]">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-container text-brand-orange">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="font-display text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">{label}</p>
          <p className="mt-1 truncate text-sm font-semibold text-on-surface">{value}</p>
        </div>
      </div>
    </div>
  )
}

function AttendanceValue({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-outline-variant bg-white p-4">
      <p className="font-display text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">{label}</p>
      <p className="mt-3 font-display text-2xl font-bold text-on-surface">{value}</p>
      <p className="mt-1 text-xs text-on-surface-variant">{helper}</p>
    </div>
  )
}

function ShiftTimeline({ shift }: { shift: StaffCurrentShift }) {
  const items = [
    {
      label: 'Ca bắt đầu',
      time: shift.startTime,
      done: true,
      description: `Ca ${shift.shiftName.toLowerCase()} được phân công.`,
    },
    {
      label: 'Check-in',
      time: shift.checkInTime ?? '--:--',
      done: shift.status === 'CHECKED_IN' || shift.status === 'CHECKED_OUT',
      description: shift.checkInTime ? `Đã ghi nhận bằng ${formatVerificationMethod(shift.verificationMethod ?? 'NONE')}.` : 'Chờ nhân viên check-in.',
    },
    {
      label: 'Check-out',
      time: shift.checkOutTime ?? '--:--',
      done: shift.status === 'CHECKED_OUT',
      description: shift.checkOutTime ? 'Đã ghi nhận giờ ra.' : 'Chưa ghi nhận check-out.',
    },
    {
      label: 'Ca kết thúc',
      time: shift.endTime,
      done: shift.status === 'CHECKED_OUT',
      description: 'Hoàn tất ca và đối soát giờ công.',
    },
  ]

  return (
    <div className="mt-5 space-y-4">
      {items.map((item, index) => (
        <div key={item.label} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={[
                'mt-1 flex h-8 w-8 items-center justify-center rounded-full border font-display text-xs font-bold',
                item.done
                  ? 'border-brand-orange bg-primary-container text-brand-orange'
                  : 'border-outline-variant bg-surface-container-low text-on-surface-variant',
              ].join(' ')}
            >
              {index + 1}
            </span>
            {index < items.length - 1 && <span className="mt-2 h-10 w-px bg-outline-variant" />}
          </div>
          <div className="min-w-0 pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-sm font-bold text-on-surface">{item.label}</p>
              <span className="rounded-full bg-surface-container-low px-2 py-1 text-xs font-semibold text-on-surface-variant">
                {item.time}
              </span>
            </div>
            <p className="mt-1 text-sm leading-5 text-on-surface-variant">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function StatusBadge({ meta }: { meta: StatusMeta }) {
  return (
    <span className={['inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-display text-xs font-bold', meta.className].join(' ')}>
      <span className={['h-1.5 w-1.5 rounded-full', meta.dotClassName].join(' ')} />
      {meta.label}
    </span>
  )
}

function NoShiftState() {
  return (
    <section className="rounded-3xl border border-dashed border-outline bg-white px-5 py-16 text-center shadow-[var(--homestay-shadow-card)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-container text-brand-orange">
        <IconCalendar />
      </div>
      <h2 className="mt-5 font-display text-2xl font-bold text-on-surface">Bạn chưa có ca làm hiện tại.</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">
        Khi quản lý phân ca, thông tin check-in/check-out sẽ hiển thị tại đây.
      </p>
    </section>
  )
}

function Toast({ toast }: { toast: ToastState }) {
  return (
    <div
      className={[
        'fixed bottom-5 left-1/2 z-[80] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-[var(--homestay-shadow-elevated)]',
        toast.type === 'success'
          ? 'border-secondary-container bg-secondary text-on-secondary'
          : 'border-error-container bg-error-container text-on-error-container',
      ].join(' ')}
    >
      {toast.message}
    </div>
  )
}

function mergeAttendanceIntoShift(
  shift: StaffCurrentShift,
  attendance: StaffAttendanceRecord,
  staffName: string,
): StaffCurrentShift {
  const status: AttendanceStatus =
    attendance.status === 'DONE'
      ? 'CHECKED_OUT'
      : attendance.status === 'WORKING' || attendance.status === 'MISSING_CHECKOUT'
        ? 'CHECKED_IN'
        : shift.status

  return {
    ...shift,
    id: String(attendance.shiftId),
    staffName,
    status,
    checkInTime: formatBackendTime(attendance.checkInTime) ?? shift.checkInTime,
    checkOutTime: formatBackendTime(attendance.checkOutTime) ?? shift.checkOutTime,
    verificationMethod: shift.verificationMethod ?? 'NONE',
  }
}

function formatBackendTime(value?: string | null) {
  if (!value) return null

  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) {
    return formatTime(date)
  }

  const timeMatch = value.match(/(\d{2}):(\d{2})/)
  return timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : null
}

function isWithinCheckInWindow(shift: StaffCurrentShift, now = new Date()) {
  if (shift.status === 'NO_SHIFT') {
    return { allowed: false, message: 'Không tìm thấy ca làm hiện tại.' }
  }

  const shiftStart = createDateFromTime(shift.startTime, now)
  const windowStart = new Date(shiftStart.getTime() - 30 * 60000)
  const windowEnd = new Date(shiftStart.getTime() + 30 * 60000)

  if (now < windowStart) {
    return { allowed: false, message: 'Chưa đến thời gian check-in cho ca này.' }
  }

  if (now > windowEnd) {
    return { allowed: false, message: 'Đã quá thời gian check-in cho phép.' }
  }

  return { allowed: true, message: `Được phép check-in từ ${formatTime(windowStart)} đến ${formatTime(windowEnd)}.` }
}

function calculateWorkingDuration(checkInTime: string, checkOutTime?: string, now = new Date()) {
  const checkInDate = createDateFromTime(checkInTime, now)
  const checkOutDate = checkOutTime ? createDateFromTime(checkOutTime, now) : now
  const diffMs = Math.max(0, checkOutDate.getTime() - checkInDate.getTime())
  const totalMinutes = Math.floor(diffMs / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours <= 0) return `${minutes} phút`
  if (minutes <= 0) return `${hours} giờ`
  return `${hours} giờ ${minutes} phút`
}

function getAttendanceStatusMeta(status: AttendanceStatus): StatusMeta {
  const meta: Record<AttendanceStatus, StatusMeta> = {
    NOT_STARTED: {
      label: 'Chưa check-in',
      className: 'border-primary-container bg-primary-container text-on-primary-container',
      dotClassName: 'bg-brand-orange',
    },
    CHECKED_IN: {
      label: 'Đang làm việc',
      className: 'border-secondary-container bg-secondary text-on-secondary',
      dotClassName: 'bg-on-secondary-container',
    },
    CHECKED_OUT: {
      label: 'Đã check-out',
      className: 'border-on-secondary-container/40 bg-on-secondary-container text-[#001A0D]',
      dotClassName: 'bg-secondary-container',
    },
    NO_SHIFT: {
      label: 'Không có ca hiện tại',
      className: 'border-outline-variant bg-surface-container-high text-on-surface-variant',
      dotClassName: 'bg-on-surface-variant',
    },
  }

  return meta[status]
}

function getVerificationMeta(status: VerificationStatus) {
  const meta: Record<VerificationStatus, { label: string; iconClassName: string; textClassName: string; icon: ReactNode }> = {
    IDLE: {
      label: 'Chưa đạt',
      iconClassName: 'bg-surface-container-high text-on-surface-variant',
      textClassName: 'text-on-surface-variant',
      icon: <IconMinus />,
    },
    CHECKING: {
      label: 'Đang kiểm tra',
      iconClassName: 'bg-primary-container text-brand-orange',
      textClassName: 'text-brand-orange',
      icon: <IconClock />,
    },
    VALID: {
      label: 'Đạt',
      iconClassName: 'bg-on-secondary-container text-[#001A0D]',
      textClassName: 'text-secondary-container',
      icon: <IconCheck />,
    },
    INVALID: {
      label: 'Chưa đạt',
      iconClassName: 'bg-error-container text-error',
      textClassName: 'text-error',
      icon: <IconAlert />,
    },
  }

  return meta[status]
}

function getActionHelper(shift: StaffCurrentShift, timeWindow: ReturnType<typeof isWithinCheckInWindow>, hasVerification: boolean) {
  if (shift.status === 'NO_SHIFT') return 'Không tìm thấy ca làm hiện tại.'
  if (shift.status === 'CHECKED_IN') return 'Bạn đang trong ca. Bấm Check-out khi kết thúc công việc.'
  if (shift.status === 'CHECKED_OUT') return 'Ca làm này đã hoàn tất, không thể check-out thêm lần nữa.'
  if (!timeWindow.allowed) return timeWindow.message
  if (!hasVerification) return 'Vui lòng xác minh vị trí gần homestay để check-in.'
  return 'Đủ điều kiện check-in cho ca hiện tại.'
}

function getLocationDescription(status: VerificationStatus, distance: number | null) {
  if (status === 'CHECKING') return 'Đang kiểm tra vị trí hiện tại...'
  if (status === 'VALID') return distance === null ? 'Vị trí hợp lệ.' : `Vị trí hợp lệ, cách homestay khoảng ${distance}m.`
  if (status === 'INVALID') return distance === null ? 'Không thể xác minh vị trí.' : `Ngoài bán kính cho phép, cách homestay khoảng ${distance}m.`
  return `Chưa kiểm tra. Yêu cầu trong bán kính ${STAFF_LOCATION.radiusMeters}m.`
}

function getAttendanceResultLabel(shift: StaffCurrentShift, now = new Date()) {
  if (shift.status === 'CHECKED_OUT') return 'Hoàn tất'
  if (!shift.checkInTime) return 'Chưa ghi nhận'
  const checkIn = createDateFromTime(shift.checkInTime, now)
  const start = createDateFromTime(shift.startTime, now)
  return checkIn.getTime() > start.getTime() + 5 * 60000 ? 'Muộn' : 'Đúng giờ'
}

function formatVerificationMethod(method: VerificationMethod) {
  if (method === 'GPS') return 'GPS'
  return 'Chưa xác minh'
}

function createDateFromTime(time: string, baseDate: Date) {
  const [hours, minutes] = time.split(':').map(Number)
  const date = new Date(baseDate)
  date.setHours(hours || 0, minutes || 0, 0, 0)
  return date
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatShiftDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return todayFormatter.format(new Date(year, month - 1, day))
}

function IconLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M4 9v6M8 5v14M12 3v18M16 6v12M20 10v4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

function IconMenuDot({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" opacity={active ? 1 : 0.68} />
      <path d="M7 10h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity={active ? 1 : 0.68} />
    </svg>
  )
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M20 20a8 8 0 0 0-16 0M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconRoom() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M4 20V6.8L12 3l8 3.8V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 20v-7h6v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconBadge() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M7 4h10a2 2 0 0 1 2 2v13l-7-3-7 3V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 9h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="M7 3v4M17 3v4M4 9h16M6.5 5h11A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10A2.5 2.5 0 0 1 6.5 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M5 12.5l4.2 4.2L19 7" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconAlert() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M12 8v5M12 17h.01M10.2 4.7 2.8 18a2 2 0 0 0 1.8 3h14.8a2 2 0 0 0 1.8-3L13.8 4.7a2 2 0 0 0-3.6 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconMinus() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
    </svg>
  )
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}
