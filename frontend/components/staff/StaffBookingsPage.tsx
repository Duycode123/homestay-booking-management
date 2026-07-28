'use client'

import ProjectSelect from '@/components/ui/ProjectSelect'
import StaffCheckoutSettlementDialog from '@/components/staff/StaffCheckoutSettlementDialog'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { EmptyState, StaffPageShell, StatCard, Toast } from './StaffShared'
import { cancelAdminBooking, fetchAdminBookings, getAdminBookingById, updateAdminBookingStatus } from '@/lib/admin/adminBookingApi'
import { BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/admin/bookingLabels'
import { type AdminBooking, type BookingFilters, type BookingStatus, type PaymentStatus } from '@/lib/admin/types'
import {
  fetchManagementBookingAddons,
  updateBookingAddonStatus,
  type BookingAddonItem,
  type BookingAddonStatus,
} from '@/lib/addon-service'

type StaffDateFilter = 'ALL' | 'TODAY' | 'UPCOMING'

type ConfirmAction =
  | {
      title: string
      description: string
      confirmLabel: string
      variant?: 'primary' | 'danger'
      requiresReason?: boolean
      run: (reason?: string) => Promise<void>
    }
  | null

const DEFAULT_FILTERS = {
  query: '',
  bookingStatus: 'ALL' as BookingStatus | 'ALL',
  paymentStatus: 'ALL' as PaymentStatus | 'ALL',
  dateFilter: 'TODAY' as StaffDateFilter,
}

export default function StaffBookingsPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [settlementBooking, setSettlementBooking] = useState<AdminBooking | null>(null)

  const apiFilters = useMemo<BookingFilters>(() => {
    return {
      query: filters.query,
      bookingStatus: filters.bookingStatus,
      paymentStatus: filters.paymentStatus,
      date: filters.dateFilter === 'TODAY' ? toDateKey(new Date()) : '',
    }
  }, [filters])

  const loadBookings = useCallback(async () => {
    setIsLoading(true)

    try {
      const data = await fetchAdminBookings(apiFilters)
      const normalized = filters.dateFilter === 'UPCOMING' ? data.filter((booking) => new Date(booking.startTime) >= startOfToday()) : data

      setBookings(normalized)
      setErrorMessage('')
      setSelectedBooking((current) => {
        if (!current) return null
        return normalized.find((booking) => booking.bookingId === current.bookingId) ?? null
      })
    } catch (error) {
      setBookings([])
      setSelectedBooking(null)
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải danh sách booking.')
    } finally {
      setIsLoading(false)
    }
  }, [apiFilters, filters.dateFilter])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadBookings(), 200)
    return () => window.clearTimeout(timer)
  }, [loadBookings])

  useEffect(() => {
    if (!toastMessage) return
    const timer = window.setTimeout(() => setToastMessage(null), 2600)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  const stats = useMemo(() => {
    const todayKey = toDateKey(new Date())

    return {
      total: bookings.length,
      pending: bookings.filter((booking) => booking.bookingStatus === 'PENDING_PAYMENT').length,
      checkedIn: bookings.filter((booking) => booking.bookingStatus === 'CHECKED_IN').length,
      today: bookings.filter((booking) => toDateKey(new Date(booking.startTime)) === todayKey).length,
    }
  }, [bookings])

  const selectBooking = async (booking: AdminBooking) => {
    setSelectedBooking(booking)

    try {
      const detail = await getAdminBookingById(booking.bookingId)
      if (detail) {
        setSelectedBooking(detail)
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải chi tiết booking.')
    }
  }

  const performStatusUpdate = async (booking: AdminBooking, nextStatus: BookingStatus) => {
    const updated = await updateAdminBookingStatus(booking.bookingId, nextStatus)
    if (!updated) {
      throw new Error('Không tìm thấy booking cần cập nhật.')
    }

    setToastMessage(`Đã cập nhật ${updated.bookingCode} sang ${BOOKING_STATUS_LABELS[nextStatus].toLowerCase()}.`)
    await loadBookings()
    setSelectedBooking(updated)
  }

  const performCancel = async (booking: AdminBooking, reason: string) => {
    const updated = await cancelAdminBooking(booking.bookingId, reason)
    if (!updated) {
      throw new Error('Không tìm thấy booking cần hủy.')
    }

    setToastMessage(`Đã hủy booking ${updated.bookingCode}.`)
    await loadBookings()
    setSelectedBooking(updated)
  }

  const requestStatusChange = (booking: AdminBooking, action: StaffBookingAction) => {
    if (action.kind === 'detail') {
      void selectBooking(booking)
      return
    }

    if (action.kind === 'cancel') {
      setConfirmAction({
        title: 'Hủy booking này?',
        description: `${booking.bookingCode} sẽ chuyển sang trạng thái đã hủy trên backend.`,
        confirmLabel: 'Hủy booking',
        variant: 'danger',
        requiresReason: true,
        run: async (reason) => {
          await performCancel(booking, reason?.trim() || '')
        },
      })
      return
    }

    if (action.kind === 'settle') {
      setSettlementBooking(booking)
      return
    }

    setConfirmAction({
      title: action.title,
      description: action.description(booking),
      confirmLabel: action.label,
      variant: 'primary',
      run: async () => {
        await performStatusUpdate(booking, action.nextStatus)
      },
    })
  }

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS)
  }

  return (
    <AuthGuard allowedRoles={['STAFF']}>
      <StaffPageShell>
        <div className="space-y-6">
          <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="font-display text-sm font-bold uppercase tracking-wide text-brand-orange">Vận hành đặt phòng</p>
              <h1 className="mt-2 font-display text-[32px] font-bold leading-10 text-on-surface">Quản lý booking</h1>
            </div>
            <button type="button" onClick={() => void loadBookings()} className="btn-secondary self-start">
              <IconRefresh />
              Làm mới
            </button>
          </header>

          {errorMessage && (
            <div className="rounded-3xl border border-error/20 bg-error-container/30 px-4 py-3 text-sm text-error">
              {errorMessage}
            </div>
          )}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Kết quả lọc"
              value={isLoading ? '...' : stats.total}
              helper="Tổng booking theo bộ lọc hiện tại"
              icon={<IconCalendar />}
              className="bg-secondary text-on-secondary"
            />
            <StatCard
              label="Chờ thanh toán"
              value={isLoading ? '...' : stats.pending}
              helper="Cần staff theo dõi thanh toán"
              icon={<IconClock />}
              className="bg-primary-container text-brand-orange"
            />
            <StatCard
              label="Đang sử dụng"
              value={isLoading ? '...' : stats.checkedIn}
              helper="Khách đã check-in"
              icon={<IconCheck />}
              className="bg-on-secondary-container text-[#001A0D]"
            />
            <StatCard
              label="Lịch hôm nay"
              value={isLoading ? '...' : stats.today}
              helper="Booking có giờ bắt đầu trong ngày"
              icon={<IconList />}
              className="bg-tertiary-container text-on-tertiary-container"
            />
          </section>

          <section className="rounded-3xl border border-outline-variant bg-white p-4 shadow-[var(--homestay-shadow-card)]">
            <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_220px_220px_180px_auto]">
              <SearchInput
                value={filters.query}
                onChange={(value) => setFilters((current) => ({ ...current, query: value }))}
              />
              <SelectField
                value={filters.bookingStatus}
                onChange={(value) => setFilters((current) => ({ ...current, bookingStatus: value as BookingStatus | 'ALL' }))}
              >
                <option value="ALL">Tất cả trạng thái booking</option>
                {(['PENDING_PAYMENT', 'DEPOSIT_PAID', 'PAID', 'CHECKED_IN', 'COMPLETED', 'CANCELLED'] as BookingStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {BOOKING_STATUS_LABELS[status]}
                  </option>
                ))}
              </SelectField>
              <SelectField
                value={filters.paymentStatus}
                onChange={(value) => setFilters((current) => ({ ...current, paymentStatus: value as PaymentStatus | 'ALL' }))}
              >
                <option value="ALL">Tất cả thanh toán</option>
                {(['PAID', 'PARTIALLY_PAID', 'UNPAID', 'PENDING'] as PaymentStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {PAYMENT_STATUS_LABELS[status]}
                  </option>
                ))}
              </SelectField>
              <SelectField
                value={filters.dateFilter}
                onChange={(value) => setFilters((current) => ({ ...current, dateFilter: value as StaffDateFilter }))}
              >
                <option value="ALL">Tất cả ngày</option>
                <option value="TODAY">Hôm nay</option>
                <option value="UPCOMING">Sắp tới</option>
              </SelectField>
              <button type="button" onClick={resetFilters} className="btn-secondary">
                Đặt lại
              </button>
            </div>
          </section>

          {isLoading ? (
            <PageSkeleton />
          ) : bookings.length > 0 ? (
            <section className="grid gap-4">
              {bookings.map((booking) => (
                <BookingCard
                  key={booking.bookingId}
                  booking={booking}
                  onAction={(action) => requestStatusChange(booking, action)}
                />
              ))}
            </section>
          ) : (
            <EmptyState
              title="Không tìm thấy booking"
              description="Thử đổi từ khóa hoặc bộ lọc để xem kết quả khác."
              actionLabel="Đặt lại bộ lọc"
              onAction={resetFilters}
            />
          )}
        </div>

        {selectedBooking && (
          <BookingDetailPanel
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
            onAction={(action) => requestStatusChange(selectedBooking, action)}
            onAddonChanged={() => void selectBooking(selectedBooking)}
          />
        )}

        {confirmAction && (
          <ConfirmDialog
            action={confirmAction}
            onCancel={() => setConfirmAction(null)}
            onDone={() => setConfirmAction(null)}
          />
        )}

        {settlementBooking && (
          <StaffCheckoutSettlementDialog
            booking={settlementBooking}
            onClose={() => setSettlementBooking(null)}
            onCompleted={async (message) => {
              setToastMessage(message)
              setSettlementBooking(null)
              setSelectedBooking(null)
              await loadBookings()
            }}
          />
        )}

        {toastMessage && <Toast message={toastMessage} />}
      </StaffPageShell>
    </AuthGuard>
  )
}

type StaffBookingAction =
  | { kind: 'detail'; label: string }
  | { kind: 'cancel'; label: string }
  | { kind: 'settle'; label: string }
  | {
      kind: 'status'
      label: string
      title: string
      nextStatus: BookingStatus
      description: (booking: AdminBooking) => string
    }

function getAvailableActions(booking: AdminBooking): StaffBookingAction[] {
  const status = booking.bookingStatus

  if (booking.cancellationRequestStatus === 'PENDING') {
    return [{ kind: 'detail', label: 'Xem yêu cầu hủy' }]
  }

  if (status === 'PENDING_PAYMENT') {
    if (booking.paymentMethodCode !== 'CASH') {
      return [
        { kind: 'cancel', label: 'Hủy booking' },
        { kind: 'detail', label: 'Xem chi tiết' },
      ]
    }

    return [
      {
        kind: 'status',
        label: 'Xác nhận đã thanh toán',
        title: 'Đánh dấu đã thanh toán?',
        nextStatus: 'PAID',
        description: (booking) => `${booking.bookingCode} sẽ chuyển sang trạng thái đã thanh toán.`,
      },
      { kind: 'cancel', label: 'Hủy booking' },
      { kind: 'detail', label: 'Xem chi tiết' },
    ]
  }

  if (status === 'DEPOSIT_PAID') {
    return [
      {
        kind: 'status',
        label: 'Check-in',
        title: 'Check-in booking đã cọc?',
        nextStatus: 'CHECKED_IN',
        description: (selectedBooking) => `${selectedBooking.bookingCode} đã cọc 50%. Chỉ được check-in từ 5 phút trước giờ nhận phòng.`,
      },
      { kind: 'cancel', label: 'Hủy booking' },
      { kind: 'detail', label: 'Xem chi tiết' },
    ]
  }

  if (status === 'PAID') {
    return [
      {
        kind: 'status',
        label: 'Check-in',
        title: 'Check-in booking?',
        nextStatus: 'CHECKED_IN',
        description: (booking) => `${booking.customerName} sẽ được ghi nhận đang sử dụng phòng. Chỉ được check-in sớm tối đa 5 phút.`,
      },
      { kind: 'cancel', label: 'Hủy booking' },
      { kind: 'detail', label: 'Xem chi tiết' },
    ]
  }

  if (status === 'CHECKED_IN') {
    if (booking.remainingAmount > 0) {
      return [
        { kind: 'settle', label: `Thu còn lại ${formatCurrency(booking.remainingAmount)} & checkout` },
        { kind: 'detail', label: 'Xem chi tiết' },
      ]
    }

    return [
      {
        kind: 'status',
        label: 'Hoàn tất',
        title: 'Kết thúc booking?',
        nextStatus: 'COMPLETED',
        description: (booking) => `${booking.bookingCode} sẽ chuyển sang trạng thái hoàn tất.`,
      },
      { kind: 'detail', label: 'Xem chi tiết' },
    ]
  }

  return [{ kind: 'detail', label: 'Xem chi tiết' }]
}

function BookingCard({
  booking,
  onAction,
}: {
  booking: AdminBooking
  onAction: (action: StaffBookingAction) => void
}) {
  const actions = getAvailableActions(booking)
  const primaryAction = actions.find((action) => action.kind === 'status') ?? actions[0]
  const secondaryActions = actions.filter((action) => action !== primaryAction)

  return (
    <article className="rounded-3xl border border-outline-variant bg-white p-5 shadow-[var(--homestay-shadow-card)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-sm font-bold uppercase tracking-wide text-brand-orange">{booking.bookingCode}</p>
            <BookingStatusBadge status={booking.bookingStatus} />
            <PaymentStatusBadge status={booking.paymentStatus} />
          </div>
          <h2 className="mt-2 font-display text-2xl font-bold text-on-surface">{booking.customerName}</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            {booking.customerPhone || 'Chưa có số điện thoại'} · {booking.roomName} · {formatBookingWindow(booking.startTime, booking.endTime)}
          </p>
          {booking.note && (
            <p className="mt-3 rounded-2xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm leading-6 text-on-surface-variant">
              {booking.note}
            </p>
          )}
          {booking.cancellationRequestStatus === 'PENDING' && (
            <div className="mt-3 rounded-2xl border border-[#dfb980] bg-[#fff8eb] px-3 py-2.5 text-sm leading-6 text-[#79582f]">
              <strong>Đang chờ admin duyệt hủy.</strong> Không được check-in booking này cho đến khi yêu cầu được xử lý.
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          {secondaryActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => onAction(action)}
              className={action.kind === 'cancel' ? 'btn-secondary border-error text-error hover:bg-error-container/30' : 'btn-secondary'}
            >
              {action.label}
            </button>
          ))}
          <button type="button" onClick={() => onAction(primaryAction)} className="btn-warm">
            {primaryAction.label}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Metric label="Đã thanh toán" value={formatCurrency(booking.paidAmount)} />
        <Metric label="Còn phải thu" value={formatCurrency(booking.remainingAmount)} />
        <Metric label="Tổng tiền" value={formatCurrency(booking.totalPrice)} />
      </div>
    </article>
  )
}

function BookingDetailPanel({
  booking,
  onClose,
  onAction,
  onAddonChanged,
}: {
  booking: AdminBooking
  onClose: () => void
  onAction: (action: StaffBookingAction) => void
  onAddonChanged: () => void
}) {
  const actions = getAvailableActions(booking)

  return (
    <>
      <button
        type="button"
        aria-label="Đóng chi tiết booking"
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-[#173A31]/50 backdrop-blur-sm"
      />

      <aside className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-xl flex-col border-l border-outline-variant bg-white shadow-[var(--homestay-shadow-elevated)]">
        <header className="border-b border-outline-variant bg-white px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">{booking.bookingCode}</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-on-surface">{booking.customerName}</h2>
              <p className="mt-2 text-sm text-on-surface-variant">{booking.roomName} · {booking.roomType}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-xl border border-outline px-3 py-2 text-on-surface-variant hover:text-on-surface">
              <IconClose />
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <BookingStatusBadge status={booking.bookingStatus} />
            <PaymentStatusBadge status={booking.paymentStatus} />
          </div>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <PanelSection title="Thông tin lịch đặt">
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric label="Khung giờ" value={formatBookingWindow(booking.startTime, booking.endTime)} />
              <Metric label="Tổng tiền" value={formatCurrency(booking.totalPrice)} />
              <Metric label="Đã thanh toán" value={formatCurrency(booking.paidAmount)} />
              <Metric label="Còn phải thu" value={formatCurrency(booking.remainingAmount)} />
              <Metric label="Email" value={booking.customerEmail || 'Chưa cập nhật'} />
              <Metric label="Số điện thoại" value={booking.customerPhone || 'Chưa cập nhật'} />
            </div>
          </PanelSection>

          {(booking.bookingStatus === 'PAID' || booking.bookingStatus === 'DEPOSIT_PAID') && (
            <PanelSection title="Điều kiện check-in">
              <div className={[
                'rounded-2xl border px-4 py-3 text-sm leading-6',
                booking.cancellationRequestStatus === 'PENDING'
                  ? 'border-[#dfb980] bg-[#fff8eb] text-[#79582f]'
                  : 'border-[#b9d7ca] bg-[#f2faf6] text-[#285f4d]',
              ].join(' ')}>
                {booking.cancellationRequestStatus === 'PENDING'
                  ? 'Yêu cầu hủy đang chờ admin duyệt. Check-in tạm thời bị khóa.'
                  : `Có thể check-in từ ${formatCheckInOpenTime(booking.startTime)} — sớm tối đa 5 phút so với giờ nhận phòng.`}
              </div>
            </PanelSection>
          )}

          <PanelSection title="Ghi chú và tiện nghi">
            <div className="space-y-3">
              <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-3">
                <p className="font-display text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">Ghi chú</p>
                <p className="mt-2 text-sm leading-6 text-on-surface">{booking.note || 'Không có ghi chú.'}</p>
              </div>
              <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-3">
                <p className="font-display text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">Tiện nghi</p>
                {booking.equipment.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {booking.equipment.map((equipment) => (
                      <span key={equipment} className="rounded-full border border-outline px-3 py-1 text-xs font-medium text-on-surface-variant">
                        {equipment}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-on-surface-variant">Không có ghi chú tiện nghi.</p>
                )}
              </div>
            </div>
          </PanelSection>

          <StaffAddonPanel booking={booking} onChanged={onAddonChanged} />
        </div>

        <footer className="border-t border-outline-variant bg-surface-container-low/40 px-5 py-4">
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => onAction(action)}
                className={action.kind === 'status' ? 'btn-warm' : action.kind === 'cancel' ? 'btn-secondary border-error text-error hover:bg-error-container/30' : 'btn-secondary'}
              >
                {action.label}
              </button>
            ))}
          </div>
        </footer>
      </aside>
    </>
  )
}

function StaffAddonPanel({ booking, onChanged }: { booking: AdminBooking; onChanged: () => void }) {
  const [items, setItems] = useState<BookingAddonItem[]>(booking.addons ?? [])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    queueMicrotask(() => {
      if (!active) return
      setItems(booking.addons ?? [])
      void fetchManagementBookingAddons(booking.bookingId)
        .then((data) => { if (active) setItems(data) })
        .catch(() => undefined)
    })
    return () => { active = false }
  }, [booking.addons, booking.bookingId])

  const update = async (item: BookingAddonItem, status: BookingAddonStatus) => {
    setIsLoading(true)
    setError('')
    try {
      const updated = await updateBookingAddonStatus(booking.bookingId, item.id, status)
      setItems((current) => current.map((candidate) => candidate.id === updated.id ? updated : candidate))
      onChanged()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Không thể cập nhật dịch vụ.')
    } finally {
      setIsLoading(false)
    }
  }

  const visibleItems = items.filter((item) => item.status !== 'CANCELLED')
  if (!visibleItems.length) return null

  return (
    <PanelSection title="Dịch vụ thuê thêm">
      <div className="space-y-3">
        {visibleItems.map((item) => {
          const actions = nextAddonActions(item)
          return (
            <div key={item.id} className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display font-bold text-on-surface">{item.name} × {item.quantity}</p>
                  <p className="mt-1 text-xs text-on-surface-variant">{item.source === 'BOOKING' ? 'Đặt trước' : 'Gọi trong kỳ nghỉ'} · {formatCurrency(item.totalAmount)}</p>
                </div>
                <span className="rounded-full bg-primary-container px-3 py-1 text-xs font-bold text-on-primary-container">{staffAddonStatusLabel(item.status)}</span>
              </div>
              {item.note && <p className="mt-2 text-sm text-on-surface-variant">Ghi chú: {item.note}</p>}
              {actions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-outline-variant pt-3">
                  {actions.map((action) => (
                    <button key={action.status} type="button" disabled={isLoading} onClick={() => void update(item, action.status)} className={action.status === 'CANCELLED' ? 'btn-secondary border-error text-error' : 'btn-warm'}>
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {error && <p className="rounded-xl bg-error-container px-3 py-2 text-sm text-on-error-container">{error}</p>}
      </div>
    </PanelSection>
  )
}

function nextAddonActions(item: BookingAddonItem): Array<{ status: BookingAddonStatus; label: string }> {
  if (item.status === 'REQUESTED') return [{ status: 'CONFIRMED', label: 'Xác nhận yêu cầu' }, { status: 'CANCELLED', label: 'Từ chối' }]
  if (item.status === 'CONFIRMED') return [
    { status: 'PREPARED', label: 'Đã chuẩn bị' },
    { status: 'DELIVERED', label: 'Đã giao' },
    ...(item.source === 'DURING_STAY' ? [{ status: 'CANCELLED' as const, label: 'Hủy dịch vụ' }] : []),
  ]
  if (item.status === 'PREPARED') return [
    { status: 'DELIVERED', label: 'Xác nhận đã giao' },
    ...(item.source === 'DURING_STAY' ? [{ status: 'CANCELLED' as const, label: 'Hủy dịch vụ' }] : []),
  ]
  return []
}

function staffAddonStatusLabel(status: BookingAddonStatus) {
  return ({ PENDING_PAYMENT: 'Chờ thanh toán', REQUESTED: 'Khách vừa yêu cầu', CONFIRMED: 'Đã xác nhận', PREPARED: 'Đã chuẩn bị', DELIVERED: 'Đã giao', CANCELLED: 'Đã hủy' } as const)[status]
}

function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="font-display text-base font-bold text-on-surface">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-3">
      <p className="font-display text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">{label}</p>
      <p className="mt-2 text-sm font-semibold text-on-surface">{value}</p>
    </div>
  )
}

function formatCheckInOpenTime(startTime: string) {
  const date = new Date(startTime)
  if (Number.isNaN(date.getTime())) return '5 phút trước giờ nhận phòng'
  date.setMinutes(date.getMinutes() - 5)
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function SearchInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="relative block">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"><IconSearch /></span>
      <input
        data-search-input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Tìm mã booking, khách hàng, số điện thoại..."
        className="h-12 w-full rounded-2xl border border-outline-variant bg-surface-container-low pl-11 pr-4 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/70 focus:border-brand-orange focus:bg-white"
      />
    </label>
  )
}

function SelectField({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <ProjectSelect value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-2xl border border-outline-variant bg-surface-container-low px-4 font-display text-sm font-bold text-on-surface outline-none transition focus:border-brand-orange focus:bg-white">
      {children}
    </ProjectSelect>
  )
}

function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const className = {
    PENDING_PAYMENT: 'border-primary-container bg-primary-container text-on-primary-container',
    DEPOSIT_PAID: 'border-secondary-container bg-secondary-container text-on-secondary-container',
    PAID: 'border-on-secondary-container/40 bg-on-secondary-container text-[#001A0D]',
    CHECKED_IN: 'border-tertiary-container bg-tertiary-container text-on-tertiary-container',
    COMPLETED: 'border-outline-variant bg-surface-container-high text-on-surface-variant',
    CANCELLED: 'border-error-container bg-error-container text-on-error-container',
  }[status]

  return (
    <span className={['inline-flex rounded-full border px-3 py-1 font-display text-xs font-bold', className].join(' ')}>
      {BOOKING_STATUS_LABELS[status]}
    </span>
  )
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const className = {
    PAID: 'border-on-secondary-container/40 bg-on-secondary-container text-[#001A0D]',
    PARTIALLY_PAID: 'border-primary-container bg-primary-container text-on-primary-container',
    PENDING: 'border-primary-container bg-primary-container text-on-primary-container',
    UNPAID: 'border-outline-variant bg-surface-container-high text-on-surface-variant',
  }[status]

  return (
    <span className={['inline-flex rounded-full border px-3 py-1 font-display text-xs font-bold', className].join(' ')}>
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  )
}

function ConfirmDialog({
  action,
  onCancel,
  onDone,
}: {
  action: NonNullable<ConfirmAction>
  onCancel: () => void
  onDone: () => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [reason, setReason] = useState('')

  const handleConfirm = async () => {
    setIsSubmitting(true)
    setError('')

    try {
      await action.run(reason)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật booking.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#173A31]/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-outline-variant bg-white p-6 shadow-[var(--homestay-shadow-elevated)]">
        <div className={['flex h-12 w-12 items-center justify-center rounded-2xl', action.variant === 'danger' ? 'bg-error-container text-error' : 'bg-primary-container text-brand-orange'].join(' ')}>
          <IconAlert />
        </div>
        <h2 className="mt-5 font-display text-xl font-bold text-on-surface">{action.title}</h2>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">{action.description}</p>
        {action.requiresReason && (
          <label className="mt-4 block text-sm font-semibold text-on-surface">
            Lý do hủy
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Nhập lý do cụ thể để lưu vào lịch sử booking"
              className="mt-2 w-full resize-none rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm font-normal outline-none focus:border-brand-orange"
            />
          </label>
        )}

        {error && <p className="mt-4 rounded-2xl border border-error/30 bg-error-container/30 px-4 py-3 text-xs text-error">{error}</p>}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={isSubmitting} className="btn-secondary disabled:cursor-not-allowed disabled:opacity-70">Hủy</button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isSubmitting || (action.requiresReason === true && !reason.trim())}
            className={['inline-flex min-h-11 items-center justify-center rounded-[14px] px-5 font-display text-sm font-bold text-white shadow-[var(--homestay-shadow-card)] transition disabled:cursor-not-allowed disabled:opacity-70', action.variant === 'danger' ? 'bg-error hover:bg-[#A61F1F]' : 'bg-brand-orange hover:bg-brand-orangeHover'].join(' ')}
          >
            {isSubmitting ? 'Đang xử lý...' : action.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-3xl border border-outline-variant bg-white shadow-[var(--homestay-shadow-card)]" />)}
      </div>
      <div className="h-20 animate-pulse rounded-3xl border border-outline-variant bg-white shadow-[var(--homestay-shadow-card)]" />
      {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-48 animate-pulse rounded-3xl border border-outline-variant bg-white shadow-[var(--homestay-shadow-card)]" />)}
    </div>
  )
}

function toDateKey(date: Date) {
  const pad = (value: number) => value.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function startOfToday() {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

function formatBookingWindow(startTime: string, endTime: string) {
  const start = new Date(startTime)
  const end = new Date(endTime)
  return `${start.toLocaleDateString('vi-VN')} · ${start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function IconCalendar() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M7 3v4M17 3v4M4 9h16M6.5 5h11A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10A2.5 2.5 0 0 1 6.5 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

function IconClock() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function IconCheck() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function IconList() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

function IconAlert() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M12 8v5M12 17h.01M10.2 4.7 2.8 18a2 2 0 0 0 1.8 3h14.8a2 2 0 0 0 1.8-3L13.8 4.7a2 2 0 0 0-3.6 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function IconSearch() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15ZM16 16l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

function IconRefresh() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M18 3v4h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function IconClose() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
}
