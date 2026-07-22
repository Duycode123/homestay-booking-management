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

const DAY_COLUMN_WIDTH = 138
const ROOM_COLUMN_WIDTH = 230
const DAYS_PER_WEEK = 7
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
  const [visibleWeekStart, setVisibleWeekStart] = useState(() => startOfWeek(parseFilterDate(filterDate) ?? new Date()))

  useEffect(() => {
    const selectedDate = parseFilterDate(filterDate)
    if (selectedDate) setVisibleWeekStart(startOfWeek(selectedDate))
  }, [filterDate])

  const weekStart = startOfWeek(visibleWeekStart)
  const weekEnd = addDays(weekStart, DAYS_PER_WEEK)
  const days = useMemo(
    () => Array.from({ length: DAYS_PER_WEEK }, (_, index) => addDays(weekStart, index)),
    [weekStart.getTime()],
  )

  const activeBookings = useMemo(
    () => bookings.filter((booking) => (
      booking.bookingStatus !== 'CANCELLED'
      && new Date(booking.startTime) < weekEnd
      && new Date(booking.endTime) > weekStart
    )),
    [bookings, weekEnd.getTime(), weekStart.getTime()],
  )

  const calendarRooms = useMemo(() => buildCalendarRooms(rooms, bookings)
    .filter((room) => !showOnlyMatchingRooms || activeBookings.some((booking) => booking.roomId === room.id)),
  [activeBookings, bookings, rooms, showOnlyMatchingRooms])

  const todayKey = toDateKey(new Date())
  const gridWidth = ROOM_COLUMN_WIDTH + DAYS_PER_WEEK * DAY_COLUMN_WIDTH

  if (isLoading) {
    return <CalendarSkeleton />
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-[var(--shadow-card)]">
      <header className="flex flex-col gap-4 border-b border-outline-variant px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-on-surface">
            Lịch phòng tuần {formatWeekRange(weekStart, weekEnd)}
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            {activeBookings.length} booking trên {calendarRooms.length} phòng trong 7 ngày đang xem
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVisibleWeekStart((current) => addDays(current, -DAYS_PER_WEEK))}
            aria-label="Xem tuần trước"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant bg-white text-on-surface transition hover:border-brand-orange/50 hover:text-brand-orange active:scale-[0.98]"
          >
            <IconChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setVisibleWeekStart(startOfWeek(new Date()))}
            className="h-10 rounded-xl border border-outline-variant bg-surface-container-low px-4 text-sm font-bold text-secondary transition hover:border-secondary/35 hover:bg-secondary-container/30 active:scale-[0.98]"
          >
            Tuần này
          </button>
          <button
            type="button"
            onClick={() => setVisibleWeekStart((current) => addDays(current, DAYS_PER_WEEK))}
            aria-label="Xem tuần sau"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant bg-white text-on-surface transition hover:border-brand-orange/50 hover:text-brand-orange active:scale-[0.98]"
          >
            <IconChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="border-b border-outline-variant bg-surface-container-low/50 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {legendStatuses.map((status) => (
            <span key={status} className="inline-flex items-center gap-2 text-xs font-medium text-on-surface-variant">
              <span className={`h-2.5 w-2.5 rounded-[3px] border ${statusStyles[status]}`} aria-hidden />
              {BOOKING_STATUS_LABELS[status]}
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs leading-5 text-on-surface-variant">
          Mỗi thẻ là một đơn đặt phòng; vị trí và độ dài thẻ thể hiện thời gian nhận - trả phòng. Bấm vào thẻ để xem chi tiết.
        </p>
      </div>

      {calendarRooms.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <h3 className="font-display text-lg font-bold text-on-surface">Không có booking phù hợp</h3>
          <p className="mt-2 text-sm text-on-surface-variant">Hãy đổi bộ lọc hoặc chuyển sang tuần khác.</p>
        </div>
      ) : (
        <div className="overflow-x-auto" aria-label="Lịch booking theo từng phòng trong tuần">
          <div style={{ minWidth: gridWidth }}>
            <div
              className="grid border-b border-outline-variant bg-[#faf8f4]"
              style={{ gridTemplateColumns: `${ROOM_COLUMN_WIDTH}px repeat(${DAYS_PER_WEEK}, ${DAY_COLUMN_WIDTH}px)` }}
            >
              <div className="flex h-[68px] items-center border-r border-outline-variant bg-[#faf8f4] px-5 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                Phòng
              </div>
              {days.map((day) => {
                const isToday = toDateKey(day) === todayKey
                const isWeekend = day.getDay() === 0 || day.getDay() === 6
                return (
                  <div
                    key={day.toISOString()}
                    className={[
                      'flex h-[68px] flex-col items-center justify-center border-r border-outline-variant/70 text-center',
                      isToday ? 'bg-[#e3eee9] text-secondary' : isWeekend ? 'bg-[#f3efe8] text-on-surface' : 'text-on-surface',
                    ].join(' ')}
                  >
                    <span className="text-[11px] font-bold text-on-surface-variant">{weekdayLabel(day)}</span>
                    <span className="mt-1 font-display text-base font-bold">{formatDayMonth(day)}</span>
                  </div>
                )
              })}
            </div>

            {calendarRooms.map((room) => {
              const roomBookings = activeBookings
                .filter((booking) => booking.roomId === room.id)
                .sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime())

              return (
                <div key={room.id} className="relative h-[96px] border-b border-outline-variant/80 last:border-b-0">
                  <div
                    className="grid h-full"
                    style={{ gridTemplateColumns: `${ROOM_COLUMN_WIDTH}px repeat(${DAYS_PER_WEEK}, ${DAY_COLUMN_WIDTH}px)` }}
                  >
                    <div className="flex min-w-0 flex-col justify-center border-r border-outline-variant bg-white px-5">
                      <span className="line-clamp-2 font-display text-sm font-bold leading-5 text-on-surface">{room.code} - {room.name}</span>
                      <span className="mt-1.5 truncate text-xs text-on-surface-variant">{room.roomType}</span>
                    </div>
                    {days.map((day) => (
                      <div
                        key={day.toISOString()}
                        className={[
                          'border-r border-outline-variant/55',
                          toDateKey(day) === todayKey ? 'bg-[#f1f8f5]' : day.getDay() === 0 || day.getDay() === 6 ? 'bg-[#fbfaf7]' : 'bg-white',
                        ].join(' ')}
                      />
                    ))}
                  </div>

                  <div
                    className="pointer-events-none absolute bottom-0 top-0 overflow-hidden"
                    style={{ left: ROOM_COLUMN_WIDTH, width: DAYS_PER_WEEK * DAY_COLUMN_WIDTH }}
                  >
                    {roomBookings.map((booking) => {
                      const position = getBookingPosition(booking, weekStart, weekEnd)
                      if (!position) return null
                      const isSelected = selectedId === booking.bookingId

                      return (
                        <button
                          key={booking.bookingId}
                          type="button"
                          onClick={() => onSelect(booking)}
                          title={`${booking.bookingCode} - ${booking.customerName} - ${BOOKING_STATUS_LABELS[booking.bookingStatus]}`}
                          className={[
                            'pointer-events-auto absolute top-3 h-[72px] overflow-hidden rounded-xl border px-3 py-2 text-left shadow-[0_1px_3px_rgba(24,58,49,.08)] transition-[filter,border-color,box-shadow]',
                            'hover:brightness-[0.97] hover:shadow-[0_2px_5px_rgba(24,58,49,.1)] active:brightness-[0.94]',
                            statusStyles[booking.bookingStatus],
                            isSelected ? 'ring-2 ring-[#b28455] ring-offset-2' : '',
                          ].join(' ')}
                          style={{ left: position.left, width: position.width }}
                        >
                          <span className="block truncate text-[11px] font-bold leading-4">{booking.bookingCode}</span>
                          <span className="block truncate text-[11px] font-semibold leading-4 opacity-95">{booking.customerName}</span>
                          <span className="mt-0.5 block truncate text-[10px] leading-4 opacity-80">{formatBookingHours(booking)}</span>
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
        <div key={index} className="grid h-[96px] grid-cols-[230px_1fr] border-b border-outline-variant last:border-b-0">
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

function getBookingPosition(booking: AdminBooking, weekStart: Date, weekEnd: Date) {
  const rawStart = new Date(booking.startTime).getTime()
  const rawEnd = new Date(booking.endTime).getTime()
  if (!Number.isFinite(rawStart) || !Number.isFinite(rawEnd) || rawEnd <= rawStart) return null

  const start = Math.max(rawStart, weekStart.getTime())
  const end = Math.min(rawEnd, weekEnd.getTime())
  if (end <= start) return null

  const left = ((start - weekStart.getTime()) / DAY_MS) * DAY_COLUMN_WIDTH
  const width = Math.min(
    DAYS_PER_WEEK * DAY_COLUMN_WIDTH - left,
    ((end - start) / DAY_MS) * DAY_COLUMN_WIDTH,
  )

  return { left, width }
}

function startOfWeek(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const daysFromMonday = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - daysFromMonday)
  start.setHours(0, 0, 0, 0)
  return start
}

function addDays(date: Date, amount: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
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
  return ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][date.getDay()]
}

function formatDayMonth(date: Date) {
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

function formatWeekRange(start: Date, endExclusive: Date) {
  const end = addDays(endExclusive, -1)
  return `${formatDayMonth(start)} - ${end.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
}

function formatBookingHours(booking: AdminBooking) {
  const format = (value: string) => new Date(value).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return `${format(booking.startTime)} - ${format(booking.endTime)}`
}
