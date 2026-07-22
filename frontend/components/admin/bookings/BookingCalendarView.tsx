'use client'

import { useEffect, useMemo, useState } from 'react'
import { IconChevronLeft, IconChevronRight } from '@/components/admin/AdminIcons'
import { BOOKING_STATUS_LABELS } from '@/lib/admin/bookingLabels'
import type { AdminRoom } from '@/lib/admin/rooms/types'
import type { AdminBooking, BookingStatus } from '@/lib/admin/types'

type BookingCalendarViewProps = {
  bookings: AdminBooking[]
  rooms: AdminRoom[]
  isLoading: boolean
  selectedId: number | null
  filterDate?: string
  showOnlyMatchingRooms?: boolean
  onSelect: (booking: AdminBooking) => void
}

type CalendarRoom = {
  id: number
  code: string
  name: string
  roomType: string
}

const DAY_COLUMN_WIDTH = 64
const ROOM_COLUMN_WIDTH = 224
const DAY_MS = 24 * 60 * 60 * 1000

const statusStyles: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'border-[#d5aa69] bg-[#f5dfbd] text-[#63451f]',
  DEPOSIT_PAID: 'border-[#8eaeaa] bg-[#c9ddd7] text-[#173f35]',
  PAID: 'border-[#4d8b78] bg-[#4d8b78] text-white',
  CHECKED_IN: 'border-[#0f392f] bg-[#17493c] text-white',
  COMPLETED: 'border-[#bdc2bd] bg-[#e3e6e2] text-[#3e4944]',
  CANCELLED: 'border-[#ddaaa5] bg-[#f8dfdc] text-[#8f3f38]',
}

const legendStatuses: BookingStatus[] = [
  'PENDING_PAYMENT',
  'DEPOSIT_PAID',
  'PAID',
  'CHECKED_IN',
  'COMPLETED',
]

export default function BookingCalendarView({
  bookings,
  rooms,
  isLoading,
  selectedId,
  filterDate,
  showOnlyMatchingRooms = false,
  onSelect,
}: BookingCalendarViewProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(parseFilterDate(filterDate) ?? new Date()))

  useEffect(() => {
    const selectedDate = parseFilterDate(filterDate)
    if (selectedDate) setVisibleMonth(startOfMonth(selectedDate))
  }, [filterDate])

  const monthStart = startOfMonth(visibleMonth)
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1)
  const dayCount = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate()
  const days = useMemo(
    () => Array.from({ length: dayCount }, (_, index) => new Date(monthStart.getFullYear(), monthStart.getMonth(), index + 1)),
    [dayCount, monthStart.getFullYear(), monthStart.getMonth()],
  )

  const activeBookings = useMemo(
    () => bookings.filter((booking) => (
      booking.bookingStatus !== 'CANCELLED'
      && new Date(booking.startTime) < monthEnd
      && new Date(booking.endTime) > monthStart
    )),
    [bookings, monthEnd.getTime(), monthStart.getTime()],
  )

  const calendarRooms = useMemo(() => buildCalendarRooms(rooms, bookings)
    .filter((room) => !showOnlyMatchingRooms || activeBookings.some((booking) => booking.roomId === room.id)),
  [activeBookings, bookings, rooms, showOnlyMatchingRooms])

  const todayKey = toDateKey(new Date())
  const gridWidth = ROOM_COLUMN_WIDTH + dayCount * DAY_COLUMN_WIDTH

  if (isLoading) {
    return <CalendarSkeleton />
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-[var(--shadow-card)]">
      <header className="flex flex-col gap-4 border-b border-outline-variant px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-on-surface">
            Lịch phòng tháng {visibleMonth.toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            {activeBookings.length} booking trên {calendarRooms.length} phòng trong tháng đang xem
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
            aria-label="Xem tháng trước"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant bg-white text-on-surface transition hover:border-brand-orange/50 hover:text-brand-orange active:scale-[0.98]"
          >
            <IconChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setVisibleMonth(startOfMonth(new Date()))}
            className="h-10 rounded-xl border border-outline-variant bg-surface-container-low px-4 text-sm font-bold text-secondary transition hover:border-secondary/35 hover:bg-secondary-container/30 active:scale-[0.98]"
          >
            Tháng này
          </button>
          <button
            type="button"
            onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
            aria-label="Xem tháng sau"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant bg-white text-on-surface transition hover:border-brand-orange/50 hover:text-brand-orange active:scale-[0.98]"
          >
            <IconChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-x-5 gap-y-2 border-b border-outline-variant bg-surface-container-low/50 px-4 py-3 sm:px-5">
        {legendStatuses.map((status) => (
          <span key={status} className="inline-flex items-center gap-2 text-xs font-medium text-on-surface-variant">
            <span className={`h-2.5 w-2.5 rounded-[3px] border ${statusStyles[status]}`} aria-hidden />
            {BOOKING_STATUS_LABELS[status]}
          </span>
        ))}
      </div>

      {calendarRooms.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <h3 className="font-display text-lg font-bold text-on-surface">Không có booking phù hợp</h3>
          <p className="mt-2 text-sm text-on-surface-variant">Hãy đổi bộ lọc hoặc chuyển sang tháng khác.</p>
        </div>
      ) : (
        <div className="panel-scroll overflow-x-auto" aria-label="Lịch booking theo từng phòng">
          <div style={{ minWidth: gridWidth }}>
            <div
              className="grid border-b border-outline-variant bg-[#faf8f4]"
              style={{ gridTemplateColumns: `${ROOM_COLUMN_WIDTH}px repeat(${dayCount}, ${DAY_COLUMN_WIDTH}px)` }}
            >
              <div className="sticky left-0 z-20 flex h-14 items-center border-r border-outline-variant bg-[#faf8f4] px-4 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                Phòng
              </div>
              {days.map((day) => {
                const isToday = toDateKey(day) === todayKey
                const isWeekend = day.getDay() === 0 || day.getDay() === 6
                return (
                  <div
                    key={day.toISOString()}
                    className={[
                      'flex h-14 flex-col items-center justify-center border-r border-outline-variant/70 text-center',
                      isToday ? 'bg-[#ead8bf] text-[#704b24]' : isWeekend ? 'bg-[#f3efe8] text-on-surface' : 'text-on-surface',
                    ].join(' ')}
                  >
                    <span className="text-[10px] font-bold uppercase text-on-surface-variant">{weekdayLabel(day)}</span>
                    <span className="mt-0.5 font-display text-sm font-bold">{day.getDate()}</span>
                  </div>
                )
              })}
            </div>

            {calendarRooms.map((room) => {
              const roomBookings = activeBookings
                .filter((booking) => booking.roomId === room.id)
                .sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime())

              return (
                <div key={room.id} className="relative h-[76px] border-b border-outline-variant/80 last:border-b-0">
                  <div
                    className="grid h-full"
                    style={{ gridTemplateColumns: `${ROOM_COLUMN_WIDTH}px repeat(${dayCount}, ${DAY_COLUMN_WIDTH}px)` }}
                  >
                    <div className="sticky left-0 z-20 flex min-w-0 flex-col justify-center border-r border-outline-variant bg-white px-4 shadow-[5px_0_12px_rgba(24,58,49,.04)]">
                      <span className="truncate font-display text-sm font-bold text-on-surface">{room.code} - {room.name}</span>
                      <span className="mt-1 truncate text-xs text-on-surface-variant">{room.roomType}</span>
                    </div>
                    {days.map((day) => (
                      <div
                        key={day.toISOString()}
                        className={[
                          'border-r border-outline-variant/55',
                          toDateKey(day) === todayKey ? 'bg-[#f8eee0]' : day.getDay() === 0 || day.getDay() === 6 ? 'bg-[#fbfaf7]' : 'bg-white',
                        ].join(' ')}
                      />
                    ))}
                  </div>

                  <div
                    className="pointer-events-none absolute bottom-0 top-0"
                    style={{ left: ROOM_COLUMN_WIDTH, width: dayCount * DAY_COLUMN_WIDTH }}
                  >
                    {roomBookings.map((booking) => {
                      const position = getBookingPosition(booking, monthStart, monthEnd, dayCount)
                      if (!position) return null
                      const isSelected = selectedId === booking.bookingId

                      return (
                        <button
                          key={booking.bookingId}
                          type="button"
                          onClick={() => onSelect(booking)}
                          title={`${booking.bookingCode} - ${booking.customerName} - ${BOOKING_STATUS_LABELS[booking.bookingStatus]}`}
                          className={[
                            'pointer-events-auto absolute top-[14px] h-12 overflow-hidden rounded-xl border px-2.5 text-left shadow-[0_5px_14px_rgba(24,58,49,.14)] transition',
                            'hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(24,58,49,.2)] active:translate-y-0',
                            statusStyles[booking.bookingStatus],
                            isSelected ? 'ring-2 ring-[#b28455] ring-offset-2' : '',
                          ].join(' ')}
                          style={{ left: position.left, width: position.width, minWidth: 42 }}
                        >
                          <span className="block truncate text-[10px] font-bold leading-4">{booking.bookingCode}</span>
                          <span className="block truncate text-[10px] leading-4 opacity-90">{booking.customerName}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

function CalendarSkeleton() {
  return (
    <section className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-[var(--shadow-card)]">
      <div className="h-24 animate-pulse border-b border-outline-variant bg-surface-container-low" />
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="grid h-[76px] grid-cols-[224px_1fr] border-b border-outline-variant last:border-b-0">
          <div className="border-r border-outline-variant p-4"><div className="h-4 w-32 rounded bg-[#e9e4dc]" /></div>
          <div className="m-4 animate-pulse rounded-xl bg-[#efeae2]" />
        </div>
      ))}
    </section>
  )
}

function buildCalendarRooms(rooms: AdminRoom[], bookings: AdminBooking[]): CalendarRoom[] {
  const roomMap = new Map<number, CalendarRoom>()

  rooms.forEach((room) => {
    const id = Number(room.id)
    if (!Number.isFinite(id)) return
    roomMap.set(id, {
      id,
      code: room.code || `P${id}`,
      name: room.name,
      roomType: room.roomTypeName || room.categoryLabel,
    })
  })

  bookings.forEach((booking) => {
    if (roomMap.has(booking.roomId)) return
    roomMap.set(booking.roomId, {
      id: booking.roomId,
      code: `P${booking.roomId}`,
      name: booking.roomName,
      roomType: booking.roomType,
    })
  })

  return Array.from(roomMap.values()).sort((left, right) => (
    left.code.localeCompare(right.code, 'vi', { numeric: true })
    || left.name.localeCompare(right.name, 'vi')
  ))
}

function getBookingPosition(booking: AdminBooking, monthStart: Date, monthEnd: Date, dayCount: number) {
  const rawStart = new Date(booking.startTime).getTime()
  const rawEnd = new Date(booking.endTime).getTime()
  if (!Number.isFinite(rawStart) || !Number.isFinite(rawEnd) || rawEnd <= rawStart) return null

  const start = Math.max(rawStart, monthStart.getTime())
  const end = Math.min(rawEnd, monthEnd.getTime())
  if (end <= start) return null

  const left = ((start - monthStart.getTime()) / DAY_MS) * DAY_COLUMN_WIDTH
  const width = Math.min(
    dayCount * DAY_COLUMN_WIDTH - left,
    ((end - start) / DAY_MS) * DAY_COLUMN_WIDTH,
  )

  return { left, width }
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function parseFilterDate(value?: string) {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? null : date
}

function toDateKey(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function weekdayLabel(date: Date) {
  return ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()]
}
