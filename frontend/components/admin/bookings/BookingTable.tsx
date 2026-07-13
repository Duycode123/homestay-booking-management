'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import {
  formatAdminPrice,
  formatBookingClockRange,
  formatBookingDayHeading,
  getBookingDateKey,
} from '@/lib/admin/adminBookingApi'
import type { AdminBooking } from '@/lib/admin/types'
import { BookingStatusBadge, PaymentStatusBadge } from './BookingBadges'

type BookingTableProps = {
  bookings: AdminBooking[]
  isLoading: boolean
  selectedId: number | null
  onSelect: (booking: AdminBooking) => void
}

export default function BookingTable({ bookings, isLoading, selectedId, onSelect }: BookingTableProps) {
  const theadRef = useRef<HTMLTableSectionElement>(null)
  const [headHeight, setHeadHeight] = useState(45)

  useLayoutEffect(() => {
    const measure = () => {
      const height = theadRef.current?.getBoundingClientRect().height
      if (height && height > 0) setHeadHeight(Math.ceil(height))
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [bookings.length, isLoading])

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-outline-variant bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-surface-container" />
          ))}
        </div>
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-outline-variant bg-gradient-to-br from-white to-surface-container-low px-6 py-14 text-center shadow-[var(--shadow-card)]">
        <p className="font-display text-base font-semibold text-on-surface">Không tìm thấy đơn đặt phòng</p>
        <p className="mt-1 text-sm text-on-surface-variant">Thử đổi bộ lọc hoặc bấm Hôm nay / Ngày mai.</p>
      </div>
    )
  }

  const groups = groupBookingsByDate(bookings)

  return (
    <div className="flex max-h-[min(70vh,680px)] flex-col overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-[var(--shadow-card)]">
      <div className="shrink-0 border-b border-outline-variant bg-gradient-to-r from-brand-greenDark/5 via-primary-container/20 to-transparent px-4 py-3">
        <p className="font-display text-sm font-bold text-on-surface">Danh sách đơn đặt</p>
        <p className="text-xs text-on-surface-variant">Nhấn dòng để xem chi tiết bên phải</p>
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-brand-bgGray/40">
        <table className="min-w-[920px] w-full border-separate border-spacing-0 text-left text-sm">
          <thead ref={theadRef} className="sticky top-0 z-20">
            <tr>
              {['Mã đơn', 'Khách hàng', 'Phòng', 'Giờ', 'Trạng thái đơn', 'Thanh toán', 'Tổng tiền'].map((h) => (
                <th
                  key={h}
                  className="border-b border-outline-variant bg-surface-container-low px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant shadow-[0_2px_8px_-2px_rgba(26,28,30,0.14)]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <DayGroup
                key={group.dateKey}
                group={group}
                selectedId={selectedId}
                onSelect={onSelect}
                stickyTop={headHeight}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="shrink-0 border-t border-outline-variant bg-gradient-to-r from-surface-container-low to-white px-4 py-2.5 text-xs text-on-surface-variant">
        <span className="font-semibold text-on-surface">{groups.length}</span> ngày ·{' '}
        <span className="font-semibold text-on-surface">{bookings.length}</span> đơn
      </div>
    </div>
  )
}

function DayGroup({
  group,
  selectedId,
  onSelect,
  stickyTop,
}: {
  group: BookingDayGroup
  selectedId: number | null
  onSelect: (booking: AdminBooking) => void
  stickyTop: number
}) {
  return (
    <>
      <tr>
        <td
          colSpan={7}
          className="sticky z-[15] border-b border-outline-variant p-0"
          style={{ top: stickyTop }}
        >
          <div className="flex items-center justify-between gap-3 border-l-4 border-l-brand-orange bg-surface-container-high px-4 py-2.5 shadow-[0_4px_12px_-4px_rgba(26,28,30,0.18)]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-brand-orange shadow-[0_0_8px_rgba(255,117,24,0.6)]" />
              <p className="font-display text-sm font-bold capitalize text-on-surface">{group.label}</p>
            </div>
            <span className="rounded-full border border-outline-variant bg-white px-2.5 py-0.5 text-[11px] font-semibold text-on-surface-variant shadow-sm">
              {group.items.length} đơn
            </span>
          </div>
        </td>
      </tr>

      {group.items.map((booking) => {
        const active = selectedId === booking.bookingId
        const rowBg = active ? 'bg-primary-container/30' : 'bg-white'

        return (
          <tr
            key={booking.bookingId}
            onClick={() => onSelect(booking)}
            className={[
              'cursor-pointer transition-colors',
              active
                ? 'shadow-[inset_3px_0_0_0_#FF7518,inset_0_0_0_1px_rgba(255,117,24,0.12)]'
                : 'hover:bg-surface-container-low/80',
            ].join(' ')}
          >
            <td className={`border-b border-outline-variant/50 px-4 py-3.5 ${rowBg}`}>
              <span className="inline-flex rounded-lg bg-primary-container/40 px-2 py-1 font-display text-xs font-bold text-brand-orange">
                {booking.bookingCode}
              </span>
            </td>
            <td className={`border-b border-outline-variant/50 px-4 py-3.5 ${rowBg}`}>
              <p className="font-medium text-on-surface">{booking.customerName}</p>
              <p className="text-xs text-on-surface-variant">{booking.customerPhone}</p>
            </td>
            <td className={`border-b border-outline-variant/50 px-4 py-3.5 ${rowBg}`}>
              <p className="font-display font-semibold text-on-surface">{booking.roomName}</p>
              <p className="text-xs font-medium text-secondary">{booking.roomType}</p>
            </td>
            <td className={`border-b border-outline-variant/50 px-4 py-3.5 ${rowBg}`}>
              <p className="font-display text-sm font-semibold tabular-nums text-on-surface">
                {formatBookingClockRange(booking.startTime, booking.endTime)}
              </p>
              <p className="text-xs text-on-surface-variant">{booking.durationHours} giờ</p>
            </td>
            <td className={`border-b border-outline-variant/50 px-4 py-3.5 ${rowBg}`}>
              <BookingStatusBadge status={booking.bookingStatus} />
            </td>
            <td className={`border-b border-outline-variant/50 px-4 py-3.5 ${rowBg}`}>
              <PaymentStatusBadge status={booking.paymentStatus} />
            </td>
            <td className={`border-b border-outline-variant/50 px-4 py-3.5 font-display text-sm font-bold text-brand-orange ${rowBg}`}>
              {formatAdminPrice(booking.totalPrice)}
            </td>
          </tr>
        )
      })}
    </>
  )
}

type BookingDayGroup = {
  dateKey: string
  label: string
  items: AdminBooking[]
}

function groupBookingsByDate(bookings: AdminBooking[]): BookingDayGroup[] {
  const map = new Map<string, AdminBooking[]>()

  bookings.forEach((booking) => {
    const key = getBookingDateKey(booking.startTime) || 'unknown'
    const list = map.get(key) ?? []
    list.push(booking)
    map.set(key, list)
  })

  return [...map.entries()].map(([dateKey, items]) => ({
    dateKey,
    label: formatBookingDayHeading(items[0]?.startTime ?? dateKey),
    items,
  }))
}
