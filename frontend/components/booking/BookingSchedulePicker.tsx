'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  getRoomAvailability,
  isSlotBooked,
  type ExistingBooking,
} from '@/components/booking/booking-availability'
import {
  BOOKING_SLOT_TIMES,
  addDays,
  calculateScheduleValue,
  formatDateInputValue,
  formatDayOfMonth,
  formatWeekday,
  getFutureDateKeys,
  getSlotsInRange,
  getTodayKey,
  isDateBefore,
  isPastSlot,
  timeToMinutes,
  type BookingScheduleValue,
} from '@/components/booking/booking-time-utils'

type BookingSchedulePickerProps = {
  roomId: string
  initialDate?: string
  initialStartTime?: string
  initialDuration?: number
  onChange: (value: BookingScheduleValue) => void
  className?: string
}

type SlotViewState = 'available' | 'selected' | 'booked' | 'past' | 'blocked-range'

const dateWindowSize = 14
const refreshIntervalMs = 15_000

const slotStateClasses: Record<SlotViewState, string> = {
  available:
    'border-[#C9C2B6] bg-white text-[#1A1C1E] hover:border-[#FF7518] hover:bg-[#FFF8F2] hover:shadow-[0_10px_26px_rgba(255,117,24,0.10)]',
  selected:
    'border-[#FF7518] bg-[#FF7518] text-white shadow-[0_12px_28px_rgba(255,117,24,0.25)]',
  booked:
    'border-[#E8E4DC] bg-[#F0EDE6] text-[#8A8176] opacity-70 line-through',
  past:
    'border-[#E8E4DC] bg-[#FAF8F4] text-[#8A8176] opacity-60',
  'blocked-range':
    'border-[#E8E4DC] bg-[#FAF8F4] text-[#8A8176] opacity-75 hover:border-[#C9C2B6]',
}

const slotStateLabels: Record<SlotViewState, string> = {
  available: 'Trống',
  selected: 'Đã chọn',
  booked: 'Đã đặt',
  past: 'Đã qua',
  'blocked-range': 'Không khả dụng',
}

function buildInitialSlots(startTime?: string, duration?: number) {
  if (!startTime || !duration || duration < 1) return []

  const startMinutes = timeToMinutes(startTime)
  return Array.from({ length: duration }, (_, index) => {
    const hour = Math.floor((startMinutes + index * 60) / 60)
    return `${String(hour).padStart(2, '0')}:00`
  }).filter((slot) => BOOKING_SLOT_TIMES.includes(slot))
}

export default function BookingSchedulePicker({
  roomId,
  initialDate,
  initialStartTime,
  initialDuration,
  onChange,
  className = '',
}: BookingSchedulePickerProps) {
  const dateInputRef = useRef<HTMLInputElement>(null)
  const previousRoomIdRef = useRef(roomId)
  const todayKey = getTodayKey()
  const initialSafeDate = (() => {
    const date = formatDateInputValue(initialDate)
    return isDateBefore(date, todayKey) ? todayKey : date
  })()

  const [selectedDate, setSelectedDate] = useState(initialSafeDate)
  const [dateAnchor, setDateAnchor] = useState(initialSafeDate)
  const [pendingStartSlot, setPendingStartSlot] = useState<string | null>(null)
  const [selectedSlots, setSelectedSlots] = useState<string[]>(() =>
    buildInitialSlots(initialStartTime, initialDuration),
  )
  const [bookings, setBookings] = useState<ExistingBooking[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [message, setMessage] = useState('')

  const dateOptions = useMemo(() => getFutureDateKeys(dateAnchor, todayKey, dateWindowSize), [dateAnchor, todayKey])
  const selectedValue = useMemo(
    () => calculateScheduleValue(selectedDate, selectedSlots),
    [selectedDate, selectedSlots],
  )

  const emittedValue = useMemo<BookingScheduleValue>(() => {
    if (selectedSlots.length === 0) {
      return calculateScheduleValue(selectedDate, [])
    }

    return selectedValue
  }, [selectedDate, selectedSlots, selectedValue])

  const loadAvailability = useCallback(async () => {
    if (!roomId || !selectedDate) return

    setIsLoading(true)
    try {
      const data = await getRoomAvailability(roomId, selectedDate)
      setBookings(data)
      setLastUpdated(new Date())
    } catch {
      setMessage('Không thể tải lịch trống. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }, [roomId, selectedDate])

  useEffect(() => {
    void loadAvailability()
  }, [loadAvailability])

  useEffect(() => {
    if (previousRoomIdRef.current === roomId) return

    previousRoomIdRef.current = roomId
    clearSelectedTime('')
  }, [roomId])

  useEffect(() => {
    if (!roomId || !selectedDate) return

    const timer = globalThis.setInterval(() => {
      void loadAvailability()
    }, refreshIntervalMs)

    return () => globalThis.clearInterval(timer)
  }, [loadAvailability, roomId, selectedDate])

  useEffect(() => {
    onChange(emittedValue)
  }, [emittedValue, onChange])

  useEffect(() => {
    if (pendingStartSlot && isSlotUnavailable(pendingStartSlot, selectedDate, bookings)) {
      setPendingStartSlot(null)
      setMessage('Khung giờ bắt đầu vừa không còn khả dụng. Vui lòng chọn lại.')
    }

    if (selectedSlots.length === 0) return

    const invalidSelection = selectedSlots.some((slot) => isSlotUnavailable(slot, selectedDate, bookings))
    if (!invalidSelection) return

    clearSelectedTime('Một số khung giờ vừa được đặt bởi người khác. Vui lòng chọn lại.')
  }, [bookings, pendingStartSlot, selectedDate, selectedSlots])

  const clearSelectedTime = (nextMessage = '') => {
    setPendingStartSlot(null)
    setSelectedSlots([])
    setMessage(nextMessage)
  }

  const chooseDate = (date: string) => {
    if (isDateBefore(date, todayKey)) {
      setMessage('Không thể đặt lịch trong quá khứ.')
      return
    }

    setSelectedDate(date)
    setDateAnchor(date)
    clearSelectedTime('')
  }

  const chooseNativeDate = (date: string) => {
    const normalizedDate = formatDateInputValue(date)
    if (isDateBefore(normalizedDate, todayKey)) {
      setMessage('Không thể đặt lịch trong quá khứ.')
      return
    }

    chooseDate(normalizedDate)
  }

  const openDatePicker = () => {
    const input = dateInputRef.current
    if (!input) return

    if (typeof input.showPicker === 'function') {
      input.showPicker()
      return
    }

    input.click()
  }

  const selectSlot = (slot: string, state: SlotViewState) => {
    if (state === 'booked' || state === 'past') return

    if (state === 'blocked-range') {
      setMessage('Khoảng giờ này có khung đã được đặt. Vui lòng chọn khoảng khác.')
      return
    }

    if (!pendingStartSlot) {
      setPendingStartSlot(slot)
      setSelectedSlots([slot])
      setMessage('')
      return
    }

    const nextSlots = getSlotsInRange(pendingStartSlot, slot)
    const invalidRange = nextSlots.some((rangeSlot) => isSlotUnavailable(rangeSlot, selectedDate, bookings))

    if (invalidRange) {
      setMessage('Khoảng giờ này có khung đã được đặt. Vui lòng chọn khoảng khác.')
      return
    }

    setSelectedSlots(nextSlots)
    setPendingStartSlot(null)
    setMessage('')
  }

  const hasSelectedTime = selectedValue.duration > 0
  const hasPendingStart = Boolean(pendingStartSlot)

  return (
    <section
      className={[
        'rounded-[24px] border border-[#E8E4DC] bg-white p-5 shadow-[0_10px_34px_rgba(26,28,30,0.08)] sm:p-6',
        className,
      ].join(' ')}
    >
      <div className="flex flex-col gap-4 border-b border-[#E8E4DC] pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-[#1A1C1E]">
            Chọn ngày & khung giờ
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#5C5348]">
            Chọn giờ bắt đầu và giờ kết thúc để hệ thống tự tính thời lượng.
          </p>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#5C5348]">
            Lịch trống cập nhật theo thời gian thực. Chỉ hiển thị các khung giờ có thể đặt.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF8F2] px-3 py-2 text-xs font-semibold text-[#6B3200]">
            <span className="h-2 w-2 rounded-full bg-[#FF7518]" aria-hidden="true" />
            Cập nhật lúc {lastUpdated ? lastUpdated.toLocaleTimeString('vi-VN') : '--:--:--'}
          </span>
          <button
            type="button"
            onClick={() => void loadAvailability()}
            disabled={isLoading}
            className="h-9 rounded-full border border-[#C9C2B6] bg-white px-4 font-display text-xs font-bold text-[#1A1C1E] transition hover:border-[#FF7518] hover:bg-[#FFF8F2] focus:outline-none focus:ring-2 focus:ring-[#FF7518]/25 disabled:cursor-wait disabled:opacity-60"
          >
            {isLoading ? 'Đang tải' : 'Làm mới'}
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!isDateBefore(todayKey, dateAnchor)}
              onClick={() => setDateAnchor((current) => (isDateBefore(todayKey, current) ? addDays(current, -dateWindowSize) : todayKey))}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#C9C2B6] bg-white font-display text-lg font-bold text-[#1A1C1E] transition hover:border-[#FF7518] hover:bg-[#FFF8F2] focus:outline-none focus:ring-2 focus:ring-[#FF7518]/25 disabled:cursor-not-allowed disabled:opacity-45"
              aria-label="Xem các ngày trước"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setDateAnchor((current) => addDays(current, dateWindowSize))}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#C9C2B6] bg-white font-display text-lg font-bold text-[#1A1C1E] transition hover:border-[#FF7518] hover:bg-[#FFF8F2] focus:outline-none focus:ring-2 focus:ring-[#FF7518]/25"
              aria-label="Xem các ngày tiếp theo"
            >
              ›
            </button>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={openDatePicker}
              className="inline-flex h-10 items-center rounded-full border border-[#C9C2B6] bg-white px-4 font-display text-xs font-bold text-[#1A1C1E] transition hover:border-[#FF7518] hover:bg-[#FFF8F2] focus:outline-none focus:ring-2 focus:ring-[#FF7518]/25"
            >
              Chọn ngày
            </button>
            <input
              ref={dateInputRef}
              type="date"
              min={todayKey}
              value={selectedDate}
              onChange={(event) => chooseNativeDate(event.target.value)}
              className="pointer-events-none absolute right-0 top-full h-px w-px opacity-0"
              aria-label="Chọn ngày đặt phòng"
              tabIndex={-1}
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {dateOptions.map((date) => {
            const selected = date === selectedDate
            const today = date === todayKey

            return (
              <button
                key={date}
                type="button"
                onClick={() => chooseDate(date)}
                className={[
                  'min-h-[98px] min-w-[96px] rounded-[20px] border px-3 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-[#FF7518]/30 sm:min-w-[104px]',
                  selected
                    ? 'border-[#FF7518] bg-[#FF7518] text-white shadow-[0_12px_28px_rgba(255,117,24,0.25)]'
                    : 'border-[#E8E4DC] bg-[#FAF8F4] text-[#1A1C1E] hover:border-[#FF7518] hover:bg-[#FFF8F2]',
                ].join(' ')}
                aria-label={`Chọn ngày ${date}`}
              >
                <span className="block font-display text-xs font-bold uppercase tracking-wide opacity-80">
                  {formatWeekday(date)}
                </span>
                <span className="mt-1 block font-display text-3xl font-bold leading-none">
                  {formatDayOfMonth(date)}
                </span>
                {today && (
                  <span
                    className={[
                      'mt-2 inline-flex rounded-full px-2 py-1 font-display text-[10px] font-bold',
                      selected ? 'bg-white/20 text-white' : 'bg-[#FFE8D6] text-[#6B3200]',
                    ].join(' ')}
                  >
                    Hôm nay
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-bold text-[#1A1C1E]">Khung giờ còn trống</h3>
            <p className="mt-1 text-sm text-[#5C5348]">Click một khung giờ để đặt 1 giờ, click thêm khung khác để mở rộng thời lượng.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hasSelectedTime && (
              <span className="rounded-full bg-[#FFE8D6] px-3 py-2 font-display text-xs font-bold text-[#6B3200]">
                {selectedValue.startTime} - {selectedValue.endTime} · {selectedValue.duration} giờ
              </span>
            )}
            {(hasSelectedTime || hasPendingStart) && (
              <button
                type="button"
                onClick={() => clearSelectedTime('')}
                className="h-9 rounded-full border border-[#C9C2B6] bg-white px-4 font-display text-xs font-bold text-[#1A1C1E] transition hover:border-[#FF7518] hover:bg-[#FFF8F2] focus:outline-none focus:ring-2 focus:ring-[#FF7518]/25"
              >
                Xóa giờ chọn
              </button>
            )}
          </div>
        </div>

        {isLoading && bookings.length === 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-2xl bg-[#F0EDE6]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {BOOKING_SLOT_TIMES.map((slot) => {
              const state = getSlotState(slot, selectedDate, bookings, selectedSlots, pendingStartSlot)
              const disabled = state === 'booked' || state === 'past'
              const ariaLabel = getSlotAriaLabel(slot, state)

              return (
                <button
                  key={slot}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectSlot(slot, state)}
                  className={[
                    'min-h-[62px] rounded-2xl border px-3 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-[#FF7518]/30 disabled:cursor-not-allowed',
                    slotStateClasses[state],
                  ].join(' ')}
                  aria-label={ariaLabel}
                  aria-pressed={state === 'selected'}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-display text-base font-bold">{slot}</span>
                    {state === 'selected' && <span className="text-sm font-bold">✓</span>}
                  </span>
                  <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wide opacity-80">
                    {slotStateLabels[state]}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold text-[#5C5348]">
        <LegendItem className="border-[#C9C2B6] bg-white" label="Trống" />
        <LegendItem className="border-[#FF7518] bg-[#FF7518]" label="Đã chọn" dark />
        <LegendItem className="border-[#E8E4DC] bg-[#F0EDE6]" label="Đã đặt" />
        <LegendItem className="border-[#E8E4DC] bg-[#FAF8F4]" label="Không khả dụng" />
      </div>

      {(message || !hasSelectedTime) && (
        <p
          className={[
            'mt-4 rounded-2xl border px-4 py-3 text-sm',
            message
              ? 'border-[#C62828]/20 bg-[#FFEBEE] text-[#C62828]'
              : 'border-[#E8E4DC] bg-[#FAF8F4] text-[#5C5348]',
          ].join(' ')}
          aria-live="polite"
        >
          {message || getSelectionHint(pendingStartSlot)}
        </p>
      )}
    </section>
  )
}

function getSlotState(
  slot: string,
  date: string,
  bookings: ExistingBooking[],
  selectedSlots: string[],
  pendingStartSlot: string | null,
): SlotViewState {
  if (isDateBefore(date, getTodayKey()) || isPastSlot(date, slot)) return 'past'
  if (isSlotBooked(slot, bookings)) return 'booked'
  if (selectedSlots.includes(slot) || pendingStartSlot === slot) return 'selected'

  if (pendingStartSlot) {
    const rangeSlots = getSlotsInRange(pendingStartSlot, slot)
    const invalidRange = rangeSlots.some((rangeSlot) => isSlotUnavailable(rangeSlot, date, bookings))
    if (invalidRange) return 'blocked-range'
  }

  return 'available'
}

function isSlotUnavailable(slot: string, date: string, bookings: ExistingBooking[]) {
  return isDateBefore(date, getTodayKey()) || isPastSlot(date, slot) || isSlotBooked(slot, bookings)
}

function getSlotAriaLabel(slot: string, state: SlotViewState) {
  if (state === 'booked') return `Khung ${slot} đã được đặt`
  if (state === 'past') return `Khung ${slot} đã qua`
  if (state === 'blocked-range') return `Khoảng giờ đến ${slot} có khung không khả dụng`
  if (state === 'selected') return `Khung ${slot} đang được chọn`
  return `Chọn khung ${slot}`
}

function getSelectionHint(pendingStartSlot: string | null) {
  if (pendingStartSlot) {
    return `Đã chọn ${pendingStartSlot} trong 1 giờ. Chọn thêm khung khác nếu muốn đặt lâu hơn.`
  }

  return 'Chọn một khung giờ trống để đặt tối thiểu 1 giờ.'
}

function LegendItem({ className, label, dark = false }: { className: string; label: string; dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={['h-3 w-3 rounded-full border', className].join(' ')} aria-hidden="true" />
      <span className={dark ? 'text-[#1A1C1E]' : undefined}>{label}</span>
    </span>
  )
}
