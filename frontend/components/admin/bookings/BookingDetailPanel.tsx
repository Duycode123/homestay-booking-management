'use client'

import { useState, type ReactNode } from 'react'
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
import { BookingStatusBadge, PaymentStatusBadge } from './BookingBadges'

type BookingDetailPanelProps = {
  booking: AdminBooking | null
  onClose: () => void
  onStatusChange: (bookingId: number, status: BookingStatus) => Promise<void>
}

export default function BookingDetailPanel({ booking, onClose, onStatusChange }: BookingDetailPanelProps) {
  const [pendingStatus, setPendingStatus] = useState<BookingStatus | ''>('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  if (!booking) return null

  const handleSaveStatus = async () => {
    if (!pendingStatus || pendingStatus === booking.bookingStatus) return
    setIsSaving(true)
    setMessage('')
    try {
      await onStatusChange(booking.bookingId, pendingStatus)
      setMessage('Cập nhật trạng thái thành công.')
      setPendingStatus('')
    } catch {
      setMessage('Không thể cập nhật trạng thái. Thử lại sau.')
    } finally {
      setIsSaving(false)
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
            <select
              value={pendingStatus || booking.bookingStatus}
              onChange={(e) => setPendingStatus(e.target.value as BookingStatus)}
              className="mt-3 h-11 w-full rounded-xl border border-outline bg-white px-3 text-sm text-on-surface outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
            >
              {BOOKING_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {BOOKING_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
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
