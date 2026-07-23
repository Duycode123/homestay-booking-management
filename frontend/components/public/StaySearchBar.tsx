'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useI18n } from '@/components/i18n/LocaleProvider'
import type { Locale } from '@/i18n/config'

export type StaySearchCriteria = {
  keyword: string
  checkIn: string
  checkOut: string
  adults: number
  children: number
}

type StaySearchBarProps = {
  variant?: 'hero' | 'catalog' | 'sidebar'
  initialValues?: Partial<StaySearchCriteria>
  onSearch?: (criteria: StaySearchCriteria) => void
}

type ActiveDateField = 'checkIn' | 'checkOut' | null

const searchCopy: Record<Locale, {
  ariaLabel: string
  keywordLabel: string
  keywordPlaceholder: string
  checkIn: string
  checkOut: string
  guests: string
  adultSuffix: string
  childSuffix: string
  adults: string
  adultsNote: string
  children: string
  childrenNote: string
  done: string
  search: string
  checkInPast: string
  invalidStay: string
  previousMonth: string
  nextMonth: string
  selectCheckIn: string
  selectCheckOut: string
  stayHours: string
  decrease: string
  increase: string
  weekdays: readonly string[]
}> = {
  vi: {
    ariaLabel: 'Tìm phòng theo kỳ lưu trú',
    keywordLabel: 'Tên hoặc nhu cầu',
    keywordPlaceholder: 'Tên phòng, tiện nghi...',
    checkIn: 'Nhận phòng',
    checkOut: 'Trả phòng',
    guests: 'Khách lưu trú',
    adultSuffix: 'người lớn',
    childSuffix: 'trẻ em',
    adults: 'Người lớn',
    adultsNote: 'Từ 13 tuổi',
    children: 'Trẻ em',
    childrenNote: 'Từ 0–12 tuổi',
    done: 'Xong',
    search: 'Tìm phòng',
    checkInPast: 'Ngày nhận phòng không thể ở trong quá khứ.',
    invalidStay: 'Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm.',
    previousMonth: 'Tháng trước',
    nextMonth: 'Tháng sau',
    selectCheckIn: 'Chọn ngày nhận phòng',
    selectCheckOut: 'Chọn ngày trả phòng',
    stayHours: 'Nhận phòng 14:00 · Trả phòng 12:00',
    decrease: 'Giảm',
    increase: 'Tăng',
    weekdays: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
  },
  en: {
    ariaLabel: 'Search rooms by stay dates',
    keywordLabel: 'Room or preference',
    keywordPlaceholder: 'Room name, amenity...',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    guests: 'Guests',
    adultSuffix: 'adults',
    childSuffix: 'children',
    adults: 'Adults',
    adultsNote: 'Ages 13+',
    children: 'Children',
    childrenNote: 'Ages 0–12',
    done: 'Done',
    search: 'Find rooms',
    checkInPast: 'Check-in cannot be in the past.',
    invalidStay: 'Check-out must be at least one night after check-in.',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    selectCheckIn: 'Select check-in date',
    selectCheckOut: 'Select check-out date',
    stayHours: 'Check-in 14:00 · Check-out 12:00',
    decrease: 'Decrease',
    increase: 'Increase',
    weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
}

export default function StaySearchBar({
  variant = 'hero',
  initialValues,
  onSearch,
}: StaySearchBarProps) {
  const router = useRouter()
  const { locale, localizedHref } = useI18n()
  const copy = searchCopy[locale]
  const earliestCheckIn = useMemo(getEarliestCheckIn, [])
  const defaultCheckIn = normalizeDate(initialValues?.checkIn, earliestCheckIn)
  const defaultCheckOutCandidate = normalizeDate(initialValues?.checkOut, addDays(defaultCheckIn, 1))
  const defaultCheckOut = defaultCheckOutCandidate > defaultCheckIn
    ? defaultCheckOutCandidate
    : addDays(defaultCheckIn, 1)
  const [keyword, setKeyword] = useState(initialValues?.keyword ?? '')
  const [checkIn, setCheckIn] = useState(defaultCheckIn)
  const [checkOut, setCheckOut] = useState(defaultCheckOut)
  const [adults, setAdults] = useState(clamp(initialValues?.adults ?? 2, 1, 20))
  const [children, setChildren] = useState(clamp(initialValues?.children ?? 0, 0, 12))
  const [activeDateField, setActiveDateField] = useState<ActiveDateField>(null)
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(defaultCheckIn))
  const [guestPanelOpen, setGuestPanelOpen] = useState(false)
  const [error, setError] = useState('')
  const datePanelRef = useRef<HTMLDivElement>(null)
  const guestPanelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!initialValues) return
    const nextCheckIn = normalizeDate(initialValues.checkIn, earliestCheckIn)
    const nextCheckOutCandidate = normalizeDate(initialValues.checkOut, addDays(nextCheckIn, 1))
    setKeyword(initialValues.keyword ?? '')
    setCheckIn(nextCheckIn)
    setCheckOut(nextCheckOutCandidate > nextCheckIn ? nextCheckOutCandidate : addDays(nextCheckIn, 1))
    setAdults(clamp(initialValues.adults ?? 2, 1, 20))
    setChildren(clamp(initialValues.children ?? 0, 0, 12))
  }, [earliestCheckIn, initialValues])

  useEffect(() => {
    const closePanels = (event: MouseEvent) => {
      const target = event.target as Node
      if (activeDateField && !datePanelRef.current?.contains(target)) setActiveDateField(null)
      if (guestPanelOpen && !guestPanelRef.current?.contains(target)) setGuestPanelOpen(false)
    }
    document.addEventListener('mousedown', closePanels)
    return () => document.removeEventListener('mousedown', closePanels)
  }, [activeDateField, guestPanelOpen])

  const openDateField = (field: Exclude<ActiveDateField, null>) => {
    setGuestPanelOpen(false)
    setActiveDateField(field)
    setVisibleMonth(startOfMonth(field === 'checkIn' ? checkIn : checkOut))
  }

  const selectDate = (date: string) => {
    if (activeDateField === 'checkIn') {
      setCheckIn(date)
      if (checkOut <= date) setCheckOut(addDays(date, 1))
      setActiveDateField('checkOut')
      setVisibleMonth(startOfMonth(checkOut <= date ? addDays(date, 1) : checkOut))
      setError('')
      return
    }
    setCheckOut(date)
    setActiveDateField(null)
    setError('')
  }

  const submit = () => {
    if (checkIn < earliestCheckIn) {
      setError(copy.checkInPast)
      return
    }
    if (checkOut <= checkIn) {
      setError(copy.invalidStay)
      return
    }

    const criteria: StaySearchCriteria = {
      keyword: keyword.trim(),
      checkIn,
      checkOut,
      adults,
      children,
    }
    if (onSearch) {
      onSearch(criteria)
      return
    }
    router.push(localizedHref(`/rooms?${buildStaySearchParams(criteria).toString()}`))
  }

  const isCatalog = variant === 'catalog'
  const isSidebar = variant === 'sidebar'
  const fieldClassName = [
    'group flex min-w-0 items-center gap-3 rounded-[18px] border bg-white px-4 text-left transition focus-within:border-[#b28455] focus-within:ring-4 focus-within:ring-[#b28455]/10',
    isCatalog ? 'h-[68px] border-[#e2d7c9] hover:border-[#b28455]' : isSidebar ? 'h-[60px] border-[#e2d7c9] px-3.5 hover:border-[#b28455]' : 'h-[72px] border-[#e5dacd] hover:border-[#b28455] hover:shadow-[0_10px_28px_rgba(31,48,41,.08)]',
  ].join(' ')

  return (
    <section
      aria-label={copy.ariaLabel}
      className={[
        'relative rounded-[26px] border border-[#dfd4c6] bg-[#fffdf9] shadow-[0_24px_70px_rgba(26,47,39,.14)]',
        isSidebar ? 'border-0 bg-transparent p-0 shadow-none' : 'p-3 sm:p-4',
      ].join(' ')}
    >
      <div className={isSidebar ? 'grid gap-2.5' : 'grid gap-2 md:grid-cols-2 xl:grid-cols-[1.35fr_1fr_1fr_1.05fr_auto]'}>
        <label className={fieldClassName}>
          <SearchIcon />
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-[0.13em] text-[#89877f]">{copy.keywordLabel}</span>
            <input
              data-search-input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') submit()
              }}
              placeholder={copy.keywordPlaceholder}
              className="mt-1 w-full border-0 bg-transparent p-0 font-display text-sm font-semibold text-[#26352f] outline-none placeholder:font-normal placeholder:text-[#a5a39c] focus:ring-0"
            />
          </span>
        </label>

        <div ref={datePanelRef} className="relative">
          <DateButton
            className={fieldClassName}
            label={copy.checkIn}
            value={checkIn}
            locale={locale}
            active={activeDateField === 'checkIn'}
            onClick={() => openDateField('checkIn')}
          />
          {activeDateField && (
            <CompactCalendar
              sidebar={isSidebar}
              activeField={activeDateField}
              visibleMonth={visibleMonth}
              checkIn={checkIn}
              checkOut={checkOut}
              minDate={activeDateField === 'checkIn' ? earliestCheckIn : addDays(checkIn, 1)}
              maxDate={activeDateField === 'checkIn' ? addDays(earliestCheckIn, 365) : addDays(checkIn, 30)}
              onPrevious={() => setVisibleMonth((month) => addMonths(month, -1))}
              onNext={() => setVisibleMonth((month) => addMonths(month, 1))}
              onSelect={selectDate}
              locale={locale}
              copy={copy}
            />
          )}
        </div>

        <DateButton
          className={fieldClassName}
          label={copy.checkOut}
          value={checkOut}
          locale={locale}
          active={activeDateField === 'checkOut'}
          onClick={() => openDateField('checkOut')}
        />

        <div ref={guestPanelRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setActiveDateField(null)
              setGuestPanelOpen((open) => !open)
            }}
            className={`${fieldClassName} w-full`}
            aria-expanded={guestPanelOpen}
          >
            <GuestsIcon />
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-[0.13em] text-[#89877f]">{copy.guests}</span>
              <span className="mt-1 block truncate font-display text-sm font-semibold text-[#26352f]">
                {adults} {copy.adultSuffix}{children > 0 ? ` · ${children} ${copy.childSuffix}` : ''}
              </span>
            </span>
            <ChevronIcon open={guestPanelOpen} />
          </button>
          {guestPanelOpen && (
            <div className={`serene-dropdown-enter absolute right-0 z-40 mt-2 w-full rounded-[22px] border border-[#ded2c3] bg-white p-4 shadow-[0_24px_60px_rgba(30,48,40,.18)] ${isSidebar ? 'min-w-0' : 'min-w-0 sm:min-w-[300px]'}`}>
              <GuestCounter label={copy.adults} note={copy.adultsNote} value={adults} min={1} max={20} onChange={setAdults} decreaseLabel={copy.decrease} increaseLabel={copy.increase} />
              <div className="my-3 h-px bg-[#eee7de]" />
              <GuestCounter label={copy.children} note={copy.childrenNote} value={children} min={0} max={12} onChange={setChildren} decreaseLabel={copy.decrease} increaseLabel={copy.increase} />
              <button type="button" onClick={() => setGuestPanelOpen(false)} className="mt-4 w-full rounded-full bg-secondary px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#52766B]">{copy.done}</button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={submit}
          className={`inline-flex items-center justify-center gap-2 rounded-[18px] bg-secondary px-6 font-display text-sm font-bold text-white shadow-[0_16px_34px_rgba(23,58,49,.2)] transition hover:-translate-y-0.5 hover:bg-[#52766B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#234D42]/20 ${isSidebar ? 'h-12' : 'h-[68px] xl:h-[72px]'}`}
        >
          <SearchIcon className="text-white" />
          {copy.search}
        </button>
      </div>
      {error && <p role="alert" className="px-2 pt-2 text-xs font-semibold text-[#b45148]">{error}</p>}
    </section>
  )
}

export function buildStaySearchParams(criteria: StaySearchCriteria) {
  const params = new URLSearchParams()
  if (criteria.keyword.trim()) params.set('search', criteria.keyword.trim())
  params.set('checkIn', criteria.checkIn)
  params.set('checkOut', criteria.checkOut)
  params.set('adults', String(criteria.adults))
  params.set('children', String(criteria.children))
  return params
}

export function readStaySearchCriteria(search: string): StaySearchCriteria | null {
  const params = new URLSearchParams(search)
  const checkIn = params.get('checkIn')
  const checkOut = params.get('checkOut')
  if (!isDateKey(checkIn) || !isDateKey(checkOut) || checkOut <= checkIn) return null
  return {
    keyword: params.get('search')?.trim() ?? '',
    checkIn,
    checkOut,
    adults: clamp(Number(params.get('adults')) || 1, 1, 20),
    children: clamp(Number(params.get('children')) || 0, 0, 12),
  }
}

function DateButton({ className, label, value, active, onClick, locale }: { className: string; label: string; value: string; active: boolean; onClick: () => void; locale: Locale }) {
  return (
    <button type="button" onClick={onClick} className={`${className} w-full ${active ? '!border-[#b28455] ring-4 ring-[#b28455]/12' : ''}`} aria-expanded={active}>
      <CalendarIcon />
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-bold uppercase tracking-[0.13em] text-[#89877f]">{label}</span>
        <span suppressHydrationWarning className="mt-1 block truncate font-display text-sm font-semibold text-[#26352f]">{formatDate(value, locale)}</span>
      </span>
      <ChevronIcon open={active} />
    </button>
  )
}

function CompactCalendar({ sidebar, activeField, visibleMonth, checkIn, checkOut, minDate, maxDate, onPrevious, onNext, onSelect, locale, copy }: { sidebar?: boolean; activeField: Exclude<ActiveDateField, null>; visibleMonth: string; checkIn: string; checkOut: string; minDate: string; maxDate: string; onPrevious: () => void; onNext: () => void; onSelect: (date: string) => void; locale: Locale; copy: (typeof searchCopy)[Locale] }) {
  const cells = getCalendarCells(visibleMonth)
  return (
    <div className={`serene-dropdown-enter serene-dropdown-enter-left absolute left-0 z-50 mt-2 rounded-[22px] border border-[#ded2c3] bg-white p-4 shadow-[0_26px_66px_rgba(30,48,40,.2)] ${sidebar ? 'w-full' : 'w-[320px] sm:w-[350px]'}`}>
      <div className="flex items-center justify-between">
        <button type="button" onClick={onPrevious} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e2d8ca] text-lg text-secondary hover:border-[#b28455]" aria-label={copy.previousMonth}>‹</button>
        <div className="text-center">
          <p suppressHydrationWarning className="font-display text-sm font-bold capitalize text-secondary">{formatMonthYear(visibleMonth, locale)}</p>
          <p className="mt-0.5 text-[10px] text-[#8a8b84]">{activeField === 'checkIn' ? copy.selectCheckIn : copy.selectCheckOut}</p>
        </div>
        <button type="button" onClick={onNext} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e2d8ca] text-lg text-secondary hover:border-[#b28455]" aria-label={copy.nextMonth}>›</button>
      </div>
      <div className="mt-4 grid grid-cols-7 text-center text-[10px] font-bold uppercase text-[#999991]">
        {copy.weekdays.map((day) => <span key={day} className="py-1">{day}</span>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-y-1">
        {cells.map((date, index) => {
          if (!date) return <span key={`blank-${index}`} className="h-10" />
          const disabled = date < minDate || date > maxDate
          const endpoint = date === checkIn || date === checkOut
          const inRange = date > checkIn && date < checkOut
          return (
            <button
              key={date}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(date)}
              aria-label={formatDate(date, locale)}
              className={[
                'flex h-10 items-center justify-center text-sm font-semibold transition',
                endpoint ? 'rounded-full bg-secondary text-white shadow-[0_7px_18px_rgba(23,58,49,.24)]' : inRange ? 'bg-[#f0e3d2] text-[#654b31]' : 'rounded-full text-[#53635E] hover:bg-[#f5eee5]',
                disabled ? 'cursor-not-allowed text-[#cdcac3] hover:bg-transparent' : '',
              ].join(' ')}
            >
              {Number(date.slice(-2))}
            </button>
          )
        })}
      </div>
      <p className="mt-3 border-t border-[#eee7de] pt-3 text-center text-[10px] font-medium text-[#85877f]">{copy.stayHours}</p>
    </div>
  )
}

function GuestCounter({ label, note, value, min, max, onChange, decreaseLabel, increaseLabel }: { label: string; note: string; value: number; min: number; max: number; onChange: (value: number) => void; decreaseLabel: string; increaseLabel: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div><p className="font-display text-sm font-bold text-secondary">{label}</p><p className="mt-0.5 text-xs text-[#888a84]">{note}</p></div>
      <div className="flex items-center gap-3">
        <button type="button" disabled={value <= min} onClick={() => onChange(value - 1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ddd2c3] text-lg text-secondary disabled:opacity-30" aria-label={`${decreaseLabel} ${label.toLowerCase()}`}>−</button>
        <span className="w-5 text-center font-display text-sm font-bold text-secondary">{value}</span>
        <button type="button" disabled={value >= max} onClick={() => onChange(value + 1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ddd2c3] text-lg text-secondary disabled:opacity-30" aria-label={`${increaseLabel} ${label.toLowerCase()}`}>+</button>
      </div>
    </div>
  )
}

function SearchIcon({ className = 'text-[#a06f40]' }: { className?: string }) { return <svg aria-hidden viewBox="0 0 24 24" className={`h-5 w-5 shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4" strokeLinecap="round"/></svg> }
function CalendarIcon() { return <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-[#a06f40]" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17" strokeLinecap="round"/></svg> }
function GuestsIcon() { return <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-[#a06f40]" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="8" r="3"/><path d="M3.5 20v-1.5A4.5 4.5 0 0 1 8 14h2a4.5 4.5 0 0 1 4.5 4.5V20M16 6.5a2.5 2.5 0 0 1 0 5M17 14a4 4 0 0 1 3.5 4v2" strokeLinecap="round"/></svg> }
function ChevronIcon({ open }: { open: boolean }) { return <svg aria-hidden viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 text-[#91765b] transition ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2"><path d="m7 10 5 5 5-5" strokeLinecap="round" strokeLinejoin="round"/></svg> }

function clamp(value: number, min: number, max: number) { return Math.min(Math.max(Math.round(value), min), max) }
function isDateKey(value: string | null): value is string { return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value)) }
function parseDate(date: string) { const [year, month, day] = date.split('-').map(Number); return new Date(year, month - 1, day) }
function toDateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
function addDays(date: string, days: number) { const value = parseDate(date); value.setDate(value.getDate() + days); return toDateKey(value) }
function startOfMonth(date: string) { const value = parseDate(date); value.setDate(1); return toDateKey(value) }
function addMonths(date: string, months: number) { const value = parseDate(startOfMonth(date)); value.setMonth(value.getMonth() + months); return toDateKey(value) }
function getEarliestCheckIn() { const value = new Date(); if (value.getHours() >= 14) value.setDate(value.getDate() + 1); return toDateKey(value) }
function normalizeDate(value: string | undefined, fallback: string) { return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback }
function getCalendarCells(month: string) { const first = parseDate(startOfMonth(month)); const offset = (first.getDay() + 6) % 7; const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate(); return [...Array.from({ length: offset }, () => null), ...Array.from({ length: days }, (_, index) => toDateKey(new Date(first.getFullYear(), first.getMonth(), index + 1)))] }
function formatDate(date: string, locale: Locale) {
  const value = parseDate(date)
  const weekdayIndex = (value.getDay() + 6) % 7
  const weekday = locale === 'en'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][weekdayIndex]
    : ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'][weekdayIndex]
  const day = String(value.getDate()).padStart(2, '0')
  const month = String(value.getMonth() + 1).padStart(2, '0')
  return locale === 'en' ? `${weekday}, ${month}/${day}/${value.getFullYear()}` : `${weekday}, ${day}/${month}/${value.getFullYear()}`
}

function formatMonthYear(date: string, locale: Locale) {
  const value = parseDate(date)
  if (locale === 'en') {
    return `${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][value.getMonth()]} ${value.getFullYear()}`
  }
  return `Tháng ${value.getMonth() + 1}, ${value.getFullYear()}`
}
