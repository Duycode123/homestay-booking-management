'use client'

import ProjectSelect from '@/components/ui/ProjectSelect'

import { useEffect, useState, type ReactNode } from 'react'
import {
  IconBookings,
  IconClock,
  IconEquipment,
  IconRooms,
  IconUsers,
} from '@/components/admin/AdminIcons'
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_OPTIONS,
} from '@/lib/admin/bookingLabels'
import {
  formatAdminPrice,
  formatBookingClockRange,
  formatBookingDateTime,
} from '@/lib/admin/adminBookingApi'
import type { AdminBooking, BookingStatus } from '@/lib/admin/types'
import {
  updateBookingAddonStatus,
  type BookingAddonItem,
  type BookingAddonStatus,
} from '@/lib/addon-service'
import { BookingStatusBadge, PaymentStatusBadge } from './BookingBadges'

type BookingDetailPanelProps = {
  booking: AdminBooking | null
  onClose: () => void
  onStatusChange: (bookingId: number, status: BookingStatus) => Promise<void>
  onSettleCheckout: (bookingId: number) => Promise<void>
  onAddonChanged: (bookingId: number) => Promise<void>
}

export default function BookingDetailPanel({ booking, onClose, onStatusChange, onSettleCheckout, onAddonChanged }: BookingDetailPanelProps) {
  const [pendingStatus, setPendingStatus] = useState<BookingStatus | ''>('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [addonItems, setAddonItems] = useState<BookingAddonItem[]>([])
  const [addonSavingId, setAddonSavingId] = useState<number | null>(null)

  useEffect(() => {
    setAddonItems(booking?.addons ?? [])
  }, [booking])

  if (!booking) return null

  const checkInWindow = getCheckInWindow(booking)

  const handleSaveStatus = async () => {
    if (!pendingStatus || pendingStatus === booking.bookingStatus) return
    setIsSaving(true)
    setMessage('')
    try {
      await onStatusChange(booking.bookingId, pendingStatus)
      setMessage('Cập nhật trạng thái thành công.')
      setPendingStatus('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái. Thử lại sau.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSettleCheckout = async () => {
    setIsSaving(true)
    setMessage('')
    try {
      await onSettleCheckout(booking.bookingId)
      setMessage('Đã kết toán và checkout thành công.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể kết toán booking.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddonStatus = async (item: BookingAddonItem, status: BookingAddonStatus) => {
    if (!booking) return
    setAddonSavingId(item.id)
    setMessage('')
    try {
      const updated = await updateBookingAddonStatus(booking.bookingId, item.id, status)
      setAddonItems((current) => current.map((entry) => entry.id === updated.id ? updated : entry))
      await onAddonChanged(booking.bookingId)
      setMessage('Cập nhật dịch vụ thành công.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể cập nhật dịch vụ.')
    } finally {
      setAddonSavingId(null)
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Đóng chi tiết"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-inverse-surface/50 backdrop-blur-sm"
      />

      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-outline-variant bg-brand-bgGray shadow-[var(--shadow-elevated)]">
        <header className="relative shrink-0 overflow-hidden bg-gradient-to-br from-brand-greenDark via-brand-greenDark to-brand-greenLight text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-orange/25 blur-3xl"
          />
          <div className="relative px-5 pb-5 pt-4">
            <div className="mb-4">
              <div>
                <p className="font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-orange">
                  Chi tiết đơn đặt
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold leading-tight">{booking.bookingCode}</h2>
                <p className="mt-1 text-sm text-inverse-on-surface/85">{booking.customerName}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <BookingStatusBadge status={booking.bookingStatus} tone="overlay" />
              <PaymentStatusBadge status={booking.paymentStatus} tone="overlay" />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <SummaryChip
                label="Khung giờ"
                value={formatBookingClockRange(booking.startTime, booking.endTime)}
              />
              <SummaryChip label="Thời lượng" value={`${booking.durationHours} giờ`} />
              <SummaryChip
                label="Tổng tiền"
                value={formatAdminPrice(booking.totalPrice)}
                accent
              />
            </div>
          </div>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <DetailCard
            title="Khách hàng"
            icon={<IconUsers className="h-4 w-4" />}
            accent="secondary"
          >
            <InfoRow label="Họ tên" value={booking.customerName} />
            <InfoRow label="Email" value={booking.customerEmail || '—'} />
            <InfoRow label="SĐT" value={booking.customerPhone || '—'} />
          </DetailCard>

          <DetailCard title="Phòng homestay" icon={<IconRooms className="h-4 w-4" />} accent="primary">
            <InfoRow label="Tên phòng" value={booking.roomName} />
            <InfoRow label="Loại phòng" value={booking.roomType} />
          </DetailCard>

          <DetailCard title="Thời gian sử dụng" icon={<IconClock className="h-4 w-4" />} accent="tertiary">
            <InfoRow label="Bắt đầu" value={formatBookingDateTime(booking.startTime)} />
            <InfoRow label="Kết thúc" value={formatBookingDateTime(booking.endTime)} />
            <InfoRow label="Thời lượng" value={`${booking.durationHours} giờ`} />
          </DetailCard>

          <DetailCard title="Thanh toán" icon={<IconBookings className="h-4 w-4" />} accent="secondary">
            <InfoRow label="Tổng tiền" value={formatAdminPrice(booking.totalPrice)} />
            <InfoRow label="Đã thanh toán" value={formatAdminPrice(booking.paidAmount)} />
            <InfoRow label="Còn phải thu" value={formatAdminPrice(booking.remainingAmount)} />
            {booking.bookingStatus === 'CHECKED_IN' && booking.remainingAmount > 0 && (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => void handleSettleCheckout()}
                className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-secondary font-display text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {isSaving ? 'Đang kết toán...' : `Thu ${formatAdminPrice(booking.remainingAmount)} & checkout`}
              </button>
            )}
          </DetailCard>

          <DetailCard title="Dịch vụ thuê thêm" icon={<IconEquipment className="h-4 w-4" />} accent="primary">
            {addonItems.length === 0 ? (
              <p className="text-sm text-on-surface-variant">Booking chưa có dịch vụ thuê thêm.</p>
            ) : (
              <div className="space-y-3">
                {addonItems.map((item) => (
                  <div key={item.id} className="rounded-xl border border-outline-variant bg-surface-container-low/55 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{item.name} × {item.quantity}</p>
                        <p className="mt-0.5 text-xs text-on-surface-variant">{item.source === 'BOOKING' ? 'Đặt cùng phòng' : 'Gọi trong kỳ lưu trú'} · {formatAdminPrice(item.totalAmount)}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${addonStatusStyle[item.status]}`}>{addonStatusLabel[item.status]}</span>
                    </div>
                    <AddonActions item={item} busy={addonSavingId === item.id} onUpdate={(status) => void handleAddonStatus(item, status)} />
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-outline-variant pt-3 text-sm"><span className="text-on-surface-variant">Đã tính vào booking</span><strong className="text-brand-orange">{formatAdminPrice(booking.addonAmount ?? 0)}</strong></div>
              </div>
            )}
          </DetailCard>

          <DetailCard
            title="Tiện nghi đi kèm"
            icon={<IconEquipment className="h-4 w-4" />}
            accent="default"
          >
            {booking.equipment.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {booking.equipment.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-xs font-medium text-on-surface"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-on-surface-variant">Không có tiện nghi thuê thêm.</p>
            )}
          </DetailCard>

          {booking.note && (
            <DetailCard title="Ghi chú" icon={<IconBookings className="h-4 w-4" />} accent="default">
              <p className="text-sm leading-relaxed text-on-surface">{booking.note}</p>
            </DetailCard>
          )}

          <div className="rounded-2xl border border-brand-orange/25 bg-gradient-to-br from-primary-container/50 to-white p-4 shadow-[var(--shadow-card)]">
            <h3 className="font-display text-sm font-bold text-on-surface">Cập nhật trạng thái</h3>
            <p className="mt-1 text-xs text-on-surface-variant">
              Thay đổi trạng thái vận hành của đơn đặt phòng.
            </p>
            {(booking.bookingStatus === 'PAID' || booking.bookingStatus === 'DEPOSIT_PAID') && (
              <div className={[
                'mt-3 rounded-xl border px-3 py-2.5 text-xs leading-5',
                checkInWindow.allowed
                  ? 'border-secondary/25 bg-secondary-container/20 text-secondary'
                  : 'border-[#dfb980] bg-[#fff8eb] text-[#79582f]',
              ].join(' ')}>
                {checkInWindow.message}
              </div>
            )}
            <ProjectSelect
              value={pendingStatus || booking.bookingStatus}
              onChange={(e) => setPendingStatus(e.target.value as BookingStatus)}
              className="mt-3 h-11 w-full rounded-xl border border-outline bg-white px-3 text-sm text-on-surface outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
            >
              {BOOKING_STATUS_OPTIONS.map((s) => (
                <option
                  key={s}
                  value={s}
                  disabled={
                    s === 'CHECKED_IN'
                    && (booking.bookingStatus === 'PAID' || booking.bookingStatus === 'DEPOSIT_PAID')
                    && !checkInWindow.allowed
                  }
                >
                  {BOOKING_STATUS_LABELS[s]}
                </option>
              ))}
            </ProjectSelect>
            <button
              type="button"
              disabled={isSaving || !pendingStatus || pendingStatus === booking.bookingStatus}
              onClick={() => void handleSaveStatus()}
              className="mt-3 flex h-11 w-full items-center justify-center rounded-xl bg-brand-orange font-display text-sm font-semibold text-white shadow-md shadow-brand-orange/20 transition hover:bg-brand-orangeHover disabled:cursor-not-allowed disabled:bg-surface-container-high disabled:text-on-surface-variant disabled:shadow-none"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu trạng thái'}
            </button>
            {message && (
              <p
                className={[
                  'mt-2 text-xs font-medium',
                  message.includes('thành công') ? 'text-secondary' : 'text-error',
                ].join(' ')}
              >
                {message}
              </p>
            )}
          </div>
        </div>

        <footer className="shrink-0 border-t border-outline-variant bg-white/80 px-5 py-4 backdrop-blur-sm">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-outline bg-white px-5 py-2.5 font-display text-sm font-medium text-on-surface-variant transition hover:border-brand-orange/40 hover:text-brand-orange"
          >
            Đóng
          </button>
        </footer>
      </aside>
    </>
  )
}

function getCheckInWindow(booking: AdminBooking) {
  if (booking.cancellationRequestStatus === 'PENDING') {
    return { allowed: false, message: 'Check-in đang bị khóa vì yêu cầu hủy phòng chờ admin xử lý.' }
  }

  const start = new Date(booking.startTime)
  const end = new Date(booking.endTime)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { allowed: false, message: 'Booking không có khung giờ hợp lệ để check-in.' }
  }

  const opensAt = new Date(start.getTime() - 5 * 60 * 1000)
  const now = new Date()
  const openTimeLabel = opensAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })

  if (now < opensAt) {
    return { allowed: false, message: `Check-in mở lúc ${openTimeLabel}, sớm tối đa 5 phút.` }
  }
  if (now >= end) {
    return { allowed: false, message: 'Đã quá giờ kết thúc booking nên không thể check-in.' }
  }

  return { allowed: true, message: 'Đã đến khung giờ cho phép check-in.' }
}

type Accent = 'default' | 'primary' | 'secondary' | 'tertiary'

const accentStyles: Record<Accent, { border: string; icon: string }> = {
  default: {
    border: 'border-l-outline-variant',
    icon: 'bg-surface-container text-on-surface-variant',
  },
  primary: {
    border: 'border-l-brand-orange',
    icon: 'bg-primary-container text-brand-orange',
  },
  secondary: {
    border: 'border-l-secondary',
    icon: 'bg-secondary-container/40 text-secondary',
  },
  tertiary: {
    border: 'border-l-tertiary',
    icon: 'bg-tertiary-container text-tertiary',
  },
}

function DetailCard({
  title,
  icon,
  accent,
  children,
}: {
  title: string
  icon: ReactNode
  accent: Accent
  children: ReactNode
}) {
  const styles = accentStyles[accent]

  return (
    <section
      className={[
        'overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-[var(--shadow-card)]',
        'border-l-4',
        styles.border,
      ].join(' ')}
    >
      <div className="flex items-center gap-2 border-b border-outline-variant/70 bg-surface-container-low/50 px-4 py-3">
        <span className={['flex h-8 w-8 items-center justify-center rounded-lg', styles.icon].join(' ')}>
          {icon}
        </span>
        <h3 className="font-display text-sm font-bold text-on-surface">{title}</h3>
      </div>
      <div className="space-y-2.5 px-4 py-3">{children}</div>
    </section>
  )
}

function SummaryChip({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="rounded-xl border border-white/15 bg-black/20 px-2.5 py-2 backdrop-blur-sm">
      <p className="text-[10px] font-medium uppercase tracking-wide text-inverse-on-surface/70">{label}</p>
      <p
        className={[
          'mt-0.5 font-display text-xs font-bold leading-snug',
          accent ? 'text-brand-orange' : 'text-white',
        ].join(' ')}
      >
        {value}
      </p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-on-surface-variant">{label}</span>
      <span className="text-right font-medium text-on-surface">{value}</span>
    </div>
  )
}

const addonStatusLabel: Record<BookingAddonStatus, string> = {
  PENDING_PAYMENT: 'Chờ thanh toán', REQUESTED: 'Khách yêu cầu', CONFIRMED: 'Đã xác nhận',
  PREPARED: 'Đã chuẩn bị', DELIVERED: 'Đã giao', CANCELLED: 'Đã hủy',
}

const addonStatusStyle: Record<BookingAddonStatus, string> = {
  PENDING_PAYMENT: 'bg-[#fff3df] text-[#855d28]', REQUESTED: 'bg-[#fff3df] text-[#855d28]',
  CONFIRMED: 'bg-[#e8f2ef] text-brand-greenDark', PREPARED: 'bg-[#e9efff] text-[#36558d]',
  DELIVERED: 'bg-secondary-container/35 text-secondary', CANCELLED: 'bg-error-container/40 text-error',
}

function AddonActions({ item, busy, onUpdate }: { item: BookingAddonItem; busy: boolean; onUpdate: (status: BookingAddonStatus) => void }) {
  const actions: Array<{ label: string; status: BookingAddonStatus; primary?: boolean }> = item.status === 'REQUESTED'
    ? [{ label: 'Xác nhận', status: 'CONFIRMED', primary: true }, { label: 'Từ chối', status: 'CANCELLED' }]
    : item.status === 'CONFIRMED'
      ? [{ label: 'Đã chuẩn bị', status: 'PREPARED' }, { label: 'Giao ngay', status: 'DELIVERED', primary: true }, ...(item.source === 'DURING_STAY' ? [{ label: 'Hủy', status: 'CANCELLED' as const }] : [])]
      : item.status === 'PREPARED'
        ? [{ label: 'Xác nhận đã giao', status: 'DELIVERED', primary: true }, ...(item.source === 'DURING_STAY' ? [{ label: 'Hủy', status: 'CANCELLED' as const }] : [])]
        : []

  if (actions.length === 0) return null
  return <div className="mt-3 flex flex-wrap gap-2">{actions.map((action) => <button key={action.status} type="button" disabled={busy} onClick={() => onUpdate(action.status)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${action.primary ? 'bg-brand-greenDark text-white hover:bg-brand-greenLight' : 'border border-outline-variant bg-white text-on-surface-variant hover:border-brand-orange/40 hover:text-brand-orange'}`}>{busy ? 'Đang lưu...' : action.label}</button>)}</div>
}
