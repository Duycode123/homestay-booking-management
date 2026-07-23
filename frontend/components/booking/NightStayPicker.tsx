'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { BookingScheduleValue } from '@/components/booking/booking-time-utils'
import { checkRoomAvailabilityRange } from '@/lib/booking/bookingApi'

const CHECK_IN_TIME = '14:00'
const CHECK_OUT_TIME = '12:00'
const MS_PER_DAY = 86_400_000
const MS_PER_HOUR = 3_600_000

type AvailabilityState = 'checking' | 'available' | 'unavailable' | 'error'
type ActiveDatePicker = 'checkin' | 'checkout' | null

type NightStayPickerProps = {
  roomId: string
  initialDate?: string
  initialEndDate?: string
  onChange: (value: BookingScheduleValue) => void
  className?: string
}

export default function NightStayPicker({ roomId, initialDate, initialEndDate, onChange, className = '' }: NightStayPickerProps) {
  const defaultCheckIn = useMemo(() => getDefaultCheckInDate(), [])
  const [checkInDate, setCheckInDate] = useState(normalizeFutureDate(initialDate, defaultCheckIn))
  const [checkOutDate, setCheckOutDate] = useState(() => {
    const candidate = normalizeFutureDate(initialEndDate, addDays(defaultCheckIn, 1))
    return candidate > normalizeFutureDate(initialDate, defaultCheckIn) ? candidate : addDays(normalizeFutureDate(initialDate, defaultCheckIn), 1)
  })
  const [availability, setAvailability] = useState<AvailabilityState>('checking')
  const [activeDatePicker, setActiveDatePicker] = useState<ActiveDatePicker>(null)
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(normalizeFutureDate(initialDate, defaultCheckIn)))
  const requestIdRef = useRef(0)
  const nights = Math.max(1, differenceInDays(checkInDate, checkOutDate))
  const duration = getStayHours(checkInDate, checkOutDate)
  const quickDates = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(defaultCheckIn, index)), [defaultCheckIn])

  useEffect(() => {
    const requestId = ++requestIdRef.current
    setAvailability('checking')
    onChange(emptyValue(checkInDate, checkOutDate))

    void checkRoomAvailabilityRange(roomId, checkInDate, checkOutDate, CHECK_IN_TIME, CHECK_OUT_TIME)
      .then((result) => {
        if (requestId !== requestIdRef.current) return
        if (!result.available) {
          setAvailability('unavailable')
          return
        }
        setAvailability('available')
        onChange({
          date: checkInDate,
          endDate: checkOutDate,
          startTime: CHECK_IN_TIME,
          endTime: CHECK_OUT_TIME,
          duration,
          selectedSlots: [],
        })
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return
        setAvailability('error')
      })
  }, [checkInDate, checkOutDate, duration, onChange, roomId])

  const selectCheckIn = (date: string) => {
    const normalized = normalizeFutureDate(date, defaultCheckIn)
    setCheckInDate(normalized)
    if (checkOutDate <= normalized || differenceInDays(normalized, checkOutDate) > 30) setCheckOutDate(addDays(normalized, 1))
  }

  const openDatePicker = (picker: Exclude<ActiveDatePicker, null>) => {
    setActiveDatePicker(picker)
    setVisibleMonth(startOfMonth(picker === 'checkin' ? checkInDate : checkOutDate))
  }

  const selectCalendarDate = (date: string) => {
    if (activeDatePicker === 'checkin') {
      selectCheckIn(date)
      setActiveDatePicker('checkout')
      setVisibleMonth(startOfMonth(addDays(date, 1)))
      return
    }

    setCheckOutDate(date)
    setActiveDatePicker(null)
  }

  return (
    <section className={['overflow-hidden rounded-[26px] border border-[#dfd3c3] bg-[#fffdf9] shadow-[0_22px_70px_rgba(30,48,40,.10)]', className].join(' ')}>
      <div className="border-b border-[#e8dfd2] bg-[linear-gradient(135deg,#514C44,#746D63)] px-5 py-5 text-white sm:px-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#e8cba8]">Lịch lưu trú</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="font-editorial text-3xl font-semibold">Chọn ngày nhận & trả phòng</h2><p className="mt-1 text-sm text-white/70">Nhận phòng sau {CHECK_IN_TIME} · Trả phòng trước {CHECK_OUT_TIME}</p></div>
          <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold">{nights} đêm</span>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <DateField label="Ngày nhận phòng" value={checkInDate} active={activeDatePicker === 'checkin'} onClick={() => openDatePicker('checkin')} />
          <div className="hidden h-12 items-center text-2xl text-[#b28455] sm:flex" aria-hidden>→</div>
          <DateField label="Ngày trả phòng" value={checkOutDate} active={activeDatePicker === 'checkout'} onClick={() => openDatePicker('checkout')} />
        </div>

        {activeDatePicker && (
          <CalendarPanel
            activePicker={activeDatePicker}
            visibleMonth={visibleMonth}
            checkInDate={checkInDate}
            checkOutDate={checkOutDate}
            minDate={activeDatePicker === 'checkin' ? defaultCheckIn : addDays(checkInDate, 1)}
            maxDate={activeDatePicker === 'checkin' ? addDays(defaultCheckIn, 365) : addDays(checkInDate, 30)}
            onPrevious={() => setVisibleMonth((month) => addMonths(month, -1))}
            onNext={() => setVisibleMonth((month) => addMonths(month, 1))}
            onSelect={selectCalendarDate}
            onClose={() => setActiveDatePicker(null)}
          />
        )}

        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#77766f]">Chọn nhanh ngày nhận</p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {quickDates.map((date) => {
              const selected = date === checkInDate
              return <button key={date} type="button" onClick={() => selectCheckIn(date)} className={['min-w-[76px] rounded-2xl border px-3 py-3 text-center transition', selected ? 'border-secondary bg-secondary text-white shadow-[0_10px_24px_rgba(23,58,49,.22)]' : 'border-[#e1d7c9] bg-white text-[#5F5A53] hover:border-secondary'].join(' ')}><span className="block text-[10px] font-bold uppercase opacity-70">{formatWeekday(date)}</span><span className="mt-1 block text-xl font-bold">{formatDay(date)}</span><span className="mt-1 block text-[10px] opacity-70">{formatMonth(date)}</span></button>
            })}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 7].map((count) => <button key={count} type="button" onClick={() => setCheckOutDate(addDays(checkInDate, count))} className={['rounded-full border px-4 py-2 text-xs font-bold transition', nights === count ? 'border-[#514C44] bg-[#514C44] text-white' : 'border-[#ddd2c3] bg-white text-[#5e625f] hover:border-[#b28455]'].join(' ')}>{count} đêm</button>)}
        </div>

        <AvailabilityNotice state={availability} nights={nights} duration={duration} />
      </div>
    </section>
  )
}

function DateField({ label, value, active, onClick }: { label: string; value: string; active: boolean; onClick: () => void }) {
  return <div><span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#6f716b]">{label}</span><button type="button" onClick={onClick} className={['flex h-[76px] w-full items-center rounded-2xl border bg-white px-4 text-left shadow-[0_8px_24px_rgba(31,48,41,.06)] transition', active ? 'border-[#b28455] ring-4 ring-[#b28455]/12' : 'border-[#d9cebf] hover:border-[#b28455] hover:shadow-[0_12px_30px_rgba(31,48,41,.10)]'].join(' ')}><span className="mr-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f1e6d7] text-[#9b6b3c]"><CalendarIcon /></span><span className="min-w-0 flex-1"><span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b8c85]">{formatWeekdayLong(value)}</span><span className="mt-1 block truncate font-display text-lg font-bold text-[#24322d]">{formatFullDate(value)}</span></span><svg aria-hidden viewBox="0 0 24 24" className={['h-4 w-4 text-[#927556] transition', active ? 'rotate-180' : ''].join(' ')} fill="none" stroke="currentColor" strokeWidth="2"><path d="m7 10 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" /></svg></button></div>
}

function CalendarPanel({ activePicker, visibleMonth, checkInDate, checkOutDate, minDate, maxDate, onPrevious, onNext, onSelect, onClose }: { activePicker: Exclude<ActiveDatePicker, null>; visibleMonth: string; checkInDate: string; checkOutDate: string; minDate: string; maxDate: string; onPrevious: () => void; onNext: () => void; onSelect: (date: string) => void; onClose: () => void }) {
  const secondMonth = addMonths(visibleMonth, 1)
  return <div className="mt-4 overflow-hidden rounded-[24px] border border-[#ddd0bf] bg-white shadow-[0_24px_64px_rgba(31,48,41,.13)]"><div className="flex items-center justify-between border-b border-[#eee6db] bg-[#fbf8f3] px-4 py-3 sm:px-5"><button type="button" onClick={onPrevious} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ded3c4] bg-white text-xl text-[#5F5A53] transition hover:border-[#b28455] hover:text-[#9b6b3c]" aria-label="Tháng trước">‹</button><div className="text-center"><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#9b6b3c]">{activePicker === 'checkin' ? 'Chọn ngày nhận phòng' : 'Chọn ngày trả phòng'}</p><p className="mt-0.5 text-xs text-[#7a7d77]">Tối đa 30 đêm cho mỗi lượt đặt</p></div><button type="button" onClick={onNext} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ded3c4] bg-white text-xl text-[#5F5A53] transition hover:border-[#b28455] hover:text-[#9b6b3c]" aria-label="Tháng sau">›</button></div><div className="grid gap-7 p-4 sm:p-5 md:grid-cols-2"><CalendarMonth month={visibleMonth} checkInDate={checkInDate} checkOutDate={checkOutDate} minDate={minDate} maxDate={maxDate} onSelect={onSelect} /><div className="hidden md:block"><CalendarMonth month={secondMonth} checkInDate={checkInDate} checkOutDate={checkOutDate} minDate={minDate} maxDate={maxDate} onSelect={onSelect} /></div></div><div className="flex items-center justify-between border-t border-[#eee6db] bg-[#fbf8f3] px-5 py-3"><div className="flex items-center gap-4 text-[11px] font-semibold text-[#747871]"><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#514C44]" />Ngày đã chọn</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#eadbc8]" />Kỳ lưu trú</span></div><button type="button" onClick={onClose} className="text-xs font-bold text-[#9b6b3c] hover:underline">Đóng lịch</button></div></div>
}

function CalendarMonth({ month, checkInDate, checkOutDate, minDate, maxDate, onSelect }: { month: string; checkInDate: string; checkOutDate: string; minDate: string; maxDate: string; onSelect: (date: string) => void }) {
  const cells = getCalendarCells(month)
  return <div><h3 className="text-center font-display text-base font-bold capitalize text-[#26352f]">{formatMonthYear(month)}</h3><div className="mt-4 grid grid-cols-7 text-center text-[10px] font-bold uppercase text-[#999991]">{['T2','T3','T4','T5','T6','T7','CN'].map((day) => <span key={day} className="py-1">{day}</span>)}</div><div className="mt-1 grid grid-cols-7 gap-y-1">{cells.map((date, index) => {
    if (!date) return <span key={`empty-${index}`} className="h-10" />
    const disabled = date < minDate || date > maxDate
    const endpoint = date === checkInDate || date === checkOutDate
    const inRange = date > checkInDate && date < checkOutDate
    return <button key={date} type="button" disabled={disabled} onClick={() => onSelect(date)} className={['relative flex h-10 items-center justify-center text-sm font-semibold transition', endpoint ? 'z-10 rounded-full bg-[#514C44] text-white shadow-[0_7px_18px_rgba(23,58,49,.25)]' : inRange ? 'bg-[#f0e3d2] text-[#654b31]' : 'rounded-full text-[#5F5A53] hover:bg-[#f5eee5]', disabled ? 'cursor-not-allowed text-[#cdcac3] hover:bg-transparent' : ''].join(' ')} aria-label={formatFullDate(date)}>{Number(date.slice(-2))}</button>
  })}</div></div>
}

function CalendarIcon() { return <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17" strokeLinecap="round"/></svg> }

function AvailabilityNotice({ state, nights, duration }: { state: AvailabilityState; nights: number; duration: number }) {
  const content = state === 'checking'
    ? ['Đang kiểm tra lịch trống…', 'Hệ thống đang đối chiếu với các đơn đặt phòng hiện tại.']
    : state === 'available'
      ? ['Khoảng ngày này còn trống', `${nights} đêm · ${duration} giờ lưu trú thực tế · Có thể tiếp tục đặt phòng.`]
      : state === 'unavailable'
        ? ['Khoảng ngày này đã có lịch', 'Hãy chọn ngày nhận hoặc ngày trả phòng khác.']
        : ['Chưa thể kiểm tra lịch', 'Vui lòng chọn lại ngày hoặc thử lại sau ít phút.']
  const good = state === 'available'
  return <div className={['mt-5 flex gap-3 rounded-2xl border px-4 py-4', good ? 'border-[#b9d5c9] bg-[#eff8f3]' : state === 'checking' ? 'border-[#e2d7c8] bg-[#faf7f1]' : 'border-[#ecc7c2] bg-[#fff4f2]'].join(' ')}><span className={['mt-1 h-2.5 w-2.5 shrink-0 rounded-full', good ? 'bg-[#3f8068]' : state === 'checking' ? 'animate-pulse bg-[#b28455]' : 'bg-[#bd665b]'].join(' ')} /><div><p className="font-bold text-[#283630]">{content[0]}</p><p className="mt-1 text-sm leading-6 text-[#6e726e]">{content[1]}</p></div></div>
}

function emptyValue(date: string, endDate: string): BookingScheduleValue { return { date, endDate, startTime: '', endTime: '', duration: 0, selectedSlots: [] } }
function toDateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
function parseDate(date: string) { const [year, month, day] = date.split('-').map(Number); return new Date(year, month - 1, day) }
function addDays(date: string, days: number) { const value = parseDate(date); value.setDate(value.getDate() + days); return toDateKey(value) }
function startOfMonth(date: string) { const value = parseDate(date); value.setDate(1); return toDateKey(value) }
function addMonths(date: string, months: number) { const value = parseDate(startOfMonth(date)); value.setMonth(value.getMonth() + months); return toDateKey(value) }
function getCalendarCells(month: string) { const first = parseDate(startOfMonth(month)); const mondayOffset = (first.getDay() + 6) % 7; const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate(); return [...Array.from({ length: mondayOffset }, () => null), ...Array.from({ length: last }, (_, index) => toDateKey(new Date(first.getFullYear(), first.getMonth(), index + 1)))] }
function differenceInDays(start: string, end: string) { return Math.round((parseDate(end).getTime() - parseDate(start).getTime()) / MS_PER_DAY) }
function getStayHours(start: string, end: string) { const from = parseDate(start); from.setHours(14); const to = parseDate(end); to.setHours(12); return Math.round((to.getTime() - from.getTime()) / MS_PER_HOUR) }
function getDefaultCheckInDate() { const now = new Date(); if (now.getHours() >= 14) now.setDate(now.getDate() + 1); return toDateKey(now) }
function normalizeFutureDate(value: string | undefined, fallback: string) { return value && /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= fallback ? value : fallback }
function formatWeekday(date: string) { return new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(parseDate(date)) }
function formatWeekdayLong(date: string) { return new Intl.DateTimeFormat('vi-VN', { weekday: 'long' }).format(parseDate(date)) }
function formatDay(date: string) { return new Intl.DateTimeFormat('vi-VN', { day: '2-digit' }).format(parseDate(date)) }
function formatMonth(date: string) { return new Intl.DateTimeFormat('vi-VN', { month: '2-digit' }).format(parseDate(date)) }
function formatMonthYear(date: string) { return new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(parseDate(date)) }
function formatFullDate(date: string) { return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(parseDate(date)) }
