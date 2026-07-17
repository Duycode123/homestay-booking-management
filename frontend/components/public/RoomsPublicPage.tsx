'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import BookingQuickModal from '@/components/booking/BookingQuickModal'
import {
  buildStaySearchParams,
  readStaySearchCriteria,
  type StaySearchCriteria,
} from '@/components/public/StaySearchBar'
import {
  formatCurrency,
  getNightlyDisplayPrice,
  FIRST_NIGHT_STAY_HOURS,
} from '@/components/booking/booking-data'
import { addDays, BOOKING_SLOT_TIMES, getTodayKey } from '@/components/booking/booking-time-utils'
import { HeartIcon } from '@/components/layout/FavoriteRoomsMenu'
import RoomCatalogSkeleton from '@/components/public/RoomCatalogSkeleton'
import { useAuth } from '@/contexts/AuthContext'
import { useFavorites } from '@/contexts/FavoritesContext'
import {
  clearQuickBookingDraft,
  readQuickBookingDraft,
  shouldReopenQuickBooking,
} from '@/components/booking/quick-booking-draft'
import { usePublicRoomCatalog } from '@/hooks/usePublicRoomCatalog'
import { checkRoomAvailabilityRange, fetchAvailableSlots } from '@/lib/booking/bookingApi'
import type { TimeSlot } from '@/lib/booking/types'
import { shouldBypassImageOptimization } from '@/lib/image-optimization'
import { fetchRoomTypes, type BackendRoomType } from '@/lib/rooms-api'
import { getPublicRoomTierLabel, inferRoomCategoryFromTypeName } from '@/lib/room-mappers'
import {
  OPEN_QUICK_BOOKING_EVENT,
  type OpenQuickBookingEventDetail,
} from '@/lib/quick-booking-navigation'
import {
  filterRooms,
  getAvailabilityLabel,
  type Room,
  type RoomAvailabilityStatus,
  type RoomCapacityFilter,
  type RoomFilters,
} from '@/lib/public/room-filters'
import {
  applyTodayAvailability,
  getRoomCardAvailabilityState,
  getBookableStartSlotsToday,
  isRoomTemporarilyUnavailable,
  isSlotInFuture,
} from '@/lib/public/today-room-availability'

const MIN_NIGHTLY_PRICE = 1_000_000
const MAX_NIGHTLY_PRICE = 5_000_000
const NIGHTLY_PRICE_STEP = 100_000

type RoomSortOption = 'recommended' | 'rating_desc' | 'price_asc' | 'price_desc' | 'capacity_desc'

const capacityOptions: Array<{ value: RoomCapacityFilter; label: string }> = [
  { value: 'all', label: 'Mọi sức chứa' },
  { value: 'small', label: '1-4 người' },
  { value: 'medium', label: '5-8 người' },
  { value: 'large', label: '9+ người' },
]

const defaultFilters: RoomFilters = {
  search: '',
  roomName: '',
  roomTierId: 'all',
  capacity: 'all',
  minGuests: 0,
  minBedrooms: 0,
  amenities: [],
  minRating: 0,
  availability: 'all',
  minNightlyPrice: MIN_NIGHTLY_PRICE,
  maxNightlyPrice: MAX_NIGHTLY_PRICE,
}

type RoomSlotsById = Record<string, TimeSlot[] | undefined>
type StayAvailabilityByRoomId = Record<string, boolean | undefined>

type TodayRoomSummary = {
  available: number
  almostFull: number
  full: number
  unavailable: number
  unknown: number
}

type QuickBookingState = {
  room: Room
  initialDate?: string
  initialEndDate?: string
  initialStartTime?: string
  initialDuration?: number
  initialNote?: string
}

export default function RoomsPublicPage() {
  const router = useRouter()
  const [filters, setFilters] = useState<RoomFilters>(defaultFilters)
  const [sortBy, setSortBy] = useState<RoomSortOption>('recommended')
  const [stayCriteria, setStayCriteria] = useState<StaySearchCriteria | null>(null)
  const [stayAvailabilityByRoomId, setStayAvailabilityByRoomId] = useState<StayAvailabilityByRoomId>({})
  const [isStayAvailabilityLoading, setIsStayAvailabilityLoading] = useState(false)
  const [stayAvailabilityErrorCount, setStayAvailabilityErrorCount] = useState(0)
  const { rooms, source: catalogSource, isLoading, isRefreshing, error: catalogError } = usePublicRoomCatalog()
  const [roomTiers, setRoomTiers] = useState<BackendRoomType[]>([])
  const [quickBooking, setQuickBooking] = useState<QuickBookingState | null>(null)
  const [todaySlotsByRoomId, setTodaySlotsByRoomId] = useState<RoomSlotsById>({})
  const [tomorrowSlotsByRoomId, setTomorrowSlotsByRoomId] = useState<RoomSlotsById>({})
  const [isTodayScheduleLoading, setIsTodayScheduleLoading] = useState(true)
  const [scheduleUpdatedAt, setScheduleUpdatedAt] = useState<Date | null>(null)
  const [scheduleErrorCount, setScheduleErrorCount] = useState(0)
  const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0)
  const liveRooms = useMemo(
    () => rooms.map((room) => applyTodayAvailability(
      room,
      todaySlotsByRoomId[room.id],
      new Date(),
      tomorrowSlotsByRoomId[room.id],
    )),
    [rooms, todaySlotsByRoomId, tomorrowSlotsByRoomId],
  )
  const availableAmenities = useMemo(() => Array.from(new Set(liveRooms.flatMap((room) => room.equipments).filter(Boolean)))
    .sort((left, right) => left.localeCompare(right, 'vi')), [liveRooms])
  const filteredRooms = useMemo(() => {
    const matchesDetailFilters = filterRooms(liveRooms, filters)
    const availableMatches = !stayCriteria || isStayAvailabilityLoading
      ? (stayCriteria ? [] : matchesDetailFilters)
      : matchesDetailFilters.filter((room) => stayAvailabilityByRoomId[room.id] === true)

    return sortPublicRooms(availableMatches, sortBy)
  }, [filters, isStayAvailabilityLoading, liveRooms, sortBy, stayAvailabilityByRoomId, stayCriteria])
  const todayRoomSummary = useMemo(() => summarizeTodayRooms(liveRooms), [liveRooms])
  const isInitialScheduleLoading = isLoading || (isTodayScheduleLoading && scheduleUpdatedAt === null)
  const bookableRoomCount = todayRoomSummary.available
  const nearestHoldExpiry = useMemo(() => liveRooms
    .filter((room) => room.todayAvailabilityReason === 'PAYMENT_HOLD' && room.holdExpiresAt)
    .map((room) => new Date(room.holdExpiresAt as string).getTime())
    .filter(Number.isFinite)
    .sort((left, right) => left - right)[0], [liveRooms])
  const scheduleCoverage = liveRooms.length > 0
    ? Math.round((bookableRoomCount / liveRooms.length) * 100)
    : 0
  const hasActiveFilters =
    filters.roomName.trim().length > 0 ||
    filters.roomTierId !== 'all' ||
    filters.capacity !== 'all' ||
    filters.minBedrooms > 0 || filters.amenities.length > 0 || filters.minRating > 0 ||
    filters.availability !== 'all' ||
    filters.minNightlyPrice !== MIN_NIGHTLY_PRICE ||
    filters.maxNightlyPrice !== MAX_NIGHTLY_PRICE

  useEffect(() => {
    let isMounted = true

    void fetchRoomTypes()
      .then((tiers) => {
        if (isMounted) setRoomTiers(tiers)
      })
      .catch(() => {
        if (isMounted) setRoomTiers([])
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (rooms.length === 0) {
      setTodaySlotsByRoomId({})
      setTomorrowSlotsByRoomId({})
      setIsTodayScheduleLoading(false)
      setScheduleUpdatedAt(null)
      setScheduleErrorCount(0)
      return
    }

    let isMounted = true
    const todayKey = getTodayKey()
    const tomorrowKey = addDays(todayKey, 1)
    setIsTodayScheduleLoading(true)

    void Promise.all(
      rooms.map(async (room) => {
        if (isRoomTemporarilyUnavailable(room) || !/^\d+$/.test(room.id)) {
          return {
            roomId: room.id,
            todaySlots: [] as TimeSlot[],
            tomorrowSlots: [] as TimeSlot[],
            failed: false,
          }
        }

        try {
          const [todaySlots, tomorrowSlots] = await Promise.all([
            fetchAvailableSlots(room.id, todayKey),
            fetchAvailableSlots(room.id, tomorrowKey),
          ])
          return { roomId: room.id, todaySlots, tomorrowSlots, failed: false }
        } catch {
          return {
            roomId: room.id,
            todaySlots: undefined,
            tomorrowSlots: undefined,
            failed: true,
          }
        }
      }),
    ).then((results) => {
      if (!isMounted) return
      setTodaySlotsByRoomId(Object.fromEntries(results.map((result) => [result.roomId, result.todaySlots])))
      setTomorrowSlotsByRoomId(Object.fromEntries(results.map((result) => [result.roomId, result.tomorrowSlots])))
      setScheduleErrorCount(results.filter((result) => result.failed).length)
      setScheduleUpdatedAt(new Date())
      setIsTodayScheduleLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [rooms, scheduleRefreshKey])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setScheduleRefreshKey((current) => current + 1)
    }, 60_000)

    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const criteria = readStaySearchCriteria(window.location.search)
    if (!criteria) return
    setStayCriteria(criteria)
    setFilters((current) => ({
      ...current,
      search: criteria.keyword,
      minGuests: criteria.adults + criteria.children,
    }))
  }, [])

  useEffect(() => {
    if (!stayCriteria || rooms.length === 0) {
      setStayAvailabilityByRoomId({})
      setStayAvailabilityErrorCount(0)
      setIsStayAvailabilityLoading(false)
      return
    }

    let isMounted = true
    setIsStayAvailabilityLoading(true)
    setStayAvailabilityErrorCount(0)

    void Promise.all(rooms.map(async (room) => {
      if (!/^\d+$/.test(room.id) || isRoomTemporarilyUnavailable(room)) {
        return { roomId: room.id, available: false, failed: false }
      }
      try {
        const result = await checkRoomAvailabilityRange(
          room.id,
          stayCriteria.checkIn,
          stayCriteria.checkOut,
        )
        return { roomId: room.id, available: result.available, failed: false }
      } catch {
        return { roomId: room.id, available: false, failed: true }
      }
    })).then((results) => {
      if (!isMounted) return
      setStayAvailabilityByRoomId(Object.fromEntries(results.map((result) => [result.roomId, result.available])))
      setStayAvailabilityErrorCount(results.filter((result) => result.failed).length)
      setIsStayAvailabilityLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [rooms, stayCriteria])

  useEffect(() => {
    if (nearestHoldExpiry === undefined) return

    // Give the backend expiry sweep a short window to release the booking,
    // then refresh immediately instead of waiting for the regular 60s poll.
    const refreshDelay = Math.max(nearestHoldExpiry - Date.now() + 1_500, 10_000)
    const timeoutId = window.setTimeout(() => {
      setScheduleRefreshKey((current) => current + 1)
    }, refreshDelay)

    return () => window.clearTimeout(timeoutId)
  }, [nearestHoldExpiry])

  useEffect(() => {
    if (!shouldReopenQuickBooking(window.location.search)) return

    const draft = readQuickBookingDraft()
    if (!draft) {
      window.history.replaceState(window.history.state, '', '/rooms')
      return
    }

    try {
      const draftRoom = draft.selectedRoom ?? draft.room
      const restoredRoom = liveRooms.find((room) => room.id === draftRoom?.id) ?? draftRoom

      if (restoredRoom) {
        setQuickBooking({
          room: restoredRoom,
          initialDate: draft.selectedDate ?? draft.initialDate,
          initialEndDate: draft.selectedEndDate ?? draft.initialEndDate,
          initialStartTime: draft.selectedStartTime ?? draft.selectedSlot?.startTime ?? draft.initialStartTime,
          initialDuration: draft.selectedDuration ?? draft.initialDuration,
          initialNote: draft.customerNote ?? draft.initialNote,
        })
      }
    } catch {
      clearQuickBookingDraft()
    } finally {
      window.history.replaceState(window.history.state, '', '/rooms')
    }
  }, [liveRooms])

  useEffect(() => {
    if (isLoading || liveRooms.length === 0) return
    if (shouldReopenQuickBooking(window.location.search)) return

    const params = new URLSearchParams(window.location.search)
    const roomId = params.get('roomId')
    if (!roomId) return

    const matchedRoom = liveRooms.find((room) => room.id === roomId)
    if (!matchedRoom) return

    const durationParam = params.get('duration')
    setQuickBooking({
      room: matchedRoom,
      initialDate: params.get('date') ?? undefined,
      initialEndDate: params.get('endDate') ?? undefined,
      initialStartTime: params.get('startTime') ?? undefined,
      initialDuration: durationParam ? Number(durationParam) : undefined,
    })
    window.history.replaceState(window.history.state, '', '/rooms')
  }, [isLoading, liveRooms])

  useEffect(() => {
    const openFavoriteRoomBooking = (event: Event) => {
      const roomId = (event as CustomEvent<OpenQuickBookingEventDetail>).detail?.roomId
      if (!roomId) return

      const matchedRoom = liveRooms.find((room) => room.id === roomId)
      if (matchedRoom) setQuickBooking({ room: matchedRoom })
    }

    window.addEventListener(OPEN_QUICK_BOOKING_EVENT, openFavoriteRoomBooking)
    return () => window.removeEventListener(OPEN_QUICK_BOOKING_EVENT, openFavoriteRoomBooking)
  }, [liveRooms])

  const updateFilter = <Key extends keyof RoomFilters>(key: Key, value: RoomFilters[Key]) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const resetDetailFilters = () => {
    setFilters({
      ...defaultFilters,
      search: stayCriteria?.keyword ?? '',
      minGuests: stayCriteria ? stayCriteria.adults + stayCriteria.children : 0,
    })
    setSortBy('recommended')
  }

  const showRoomsByAvailability = (availability: RoomAvailabilityStatus) => {
    setFilters((current) => ({ ...current, availability }))
    window.requestAnimationFrame(() => {
      document.getElementById('room-catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  return (
    <main id="main-content" className="min-h-screen bg-brand-bgGray text-on-surface">

      <section className="relative min-h-[460px] overflow-hidden border-b border-outline-variant bg-secondary text-white">
        <Image
          src="/images/homestay-luxury-hero.webp"
          alt="Phòng homestay cao cấp với giường lớn, nội thất gỗ và cửa nhìn ra vườn"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,42,35,0.96)_0%,rgba(17,42,35,0.78)_44%,rgba(17,42,35,0.2)_100%)]" />
        <div className="relative mx-auto grid min-h-[460px] max-w-[1400px] gap-8 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_390px] lg:items-end">
          <div>
            <p className="eyebrow text-primary-fixed">Danh mục lưu trú</p>
            <h1 className="font-editorial mt-4 text-5xl font-semibold tracking-[-0.03em] sm:text-6xl">Tìm căn phòng của bạn</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72">
              So sánh sức chứa, tiện nghi, mức giá và lịch trống để chọn không gian phù hợp.
            </p>
          </div>
          <div className="w-full max-w-[390px] justify-self-end rounded-[20px] border border-white/16 bg-[#173a31]/88 p-4 shadow-[0_22px_64px_rgba(0,0,0,0.26)] backdrop-blur-2xl sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8dd7b4] opacity-50" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#8dd7b4]" />
                  </span>
                  <p className="font-display text-sm font-bold text-white">Lịch phòng hôm nay</p>
                </div>
                <p className="mt-1 text-[11px] text-white/50">Dữ liệu booking thật · 1 đêm = {FIRST_NIGHT_STAY_HOURS} giờ</p>
              </div>
              <button
                type="button"
                onClick={() => setScheduleRefreshKey((current) => current + 1)}
                disabled={isTodayScheduleLoading}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] text-white/72 transition hover:border-white/25 hover:bg-white/[0.12] hover:text-white disabled:cursor-wait disabled:opacity-45"
                aria-label="Cập nhật lại lịch phòng"
                title="Cập nhật lại lịch phòng"
              >
                <RefreshIcon className={isTodayScheduleLoading ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
              </button>
            </div>

            <div className="mt-3.5 grid grid-cols-4 gap-2">
                <AvailabilityMetric
                  value={isInitialScheduleLoading ? '--' : String(todayRoomSummary.available)}
                  label="Còn trống"
                  tone="available"
                  onClick={() => showRoomsByAvailability('AVAILABLE')}
                />
                <AvailabilityMetric
                  value={isInitialScheduleLoading ? '--' : String(todayRoomSummary.almostFull)}
                  label="Đang giữ"
                  tone="limited"
                  onClick={() => showRoomsByAvailability('ALMOST_FULL')}
                />
                <AvailabilityMetric
                  value={isInitialScheduleLoading ? '--' : String(todayRoomSummary.full)}
                  label="Kín lịch"
                  tone="full"
                  onClick={() => showRoomsByAvailability('FULL_TODAY')}
                />
                <AvailabilityMetric
                  value={isInitialScheduleLoading ? '--' : String(todayRoomSummary.unavailable)}
                  label="Tạm ngưng"
                  tone="paused"
                />
            </div>

            <div className="mt-3.5 flex items-center justify-between gap-3 text-[11px]">
              <span className="font-medium text-white/72">
                {isInitialScheduleLoading
                  ? 'Đang đối chiếu lịch...'
                  : `${bookableRoomCount}/${liveRooms.length} phòng có thể đặt`}
              </span>
              <span className="font-display font-bold text-[#f1d2a9]">
                {isInitialScheduleLoading ? '--' : `${scheduleCoverage}%`}
              </span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#83c8a8,#f1d2a9)] transition-[width] duration-500"
                style={{ width: `${isInitialScheduleLoading ? 0 : scheduleCoverage}%` }}
              />
            </div>

            <p className="mt-3 text-[10px] text-white/42">
              {scheduleErrorCount > 0
                ? `${scheduleErrorCount} phòng chưa đồng bộ được lịch`
                : scheduleUpdatedAt
                  ? `Cập nhật ${formatScheduleUpdateTime(scheduleUpdatedAt)} · tự động mỗi 60 giây`
                  : 'Đang kết nối dữ liệu lịch phòng'}
            </p>
          </div>
        </div>
      </section>

      <section id="room-catalog" className="mx-auto max-w-[1480px] scroll-mt-24 px-4 py-10 sm:px-7 sm:py-14">
        <div className="grid items-start gap-7 lg:grid-cols-[320px_minmax(0,1fr)] xl:gap-9">
          <aside className="self-start">
            <div className="overflow-hidden rounded-[24px] border border-[#d9cebf] bg-[#fffdfa] shadow-[0_20px_55px_rgba(29,49,41,.10)]">
              <div className="rounded-t-[23px] bg-[linear-gradient(135deg,#173a31,#285648)] px-5 py-4 text-white">
                <div className="flex items-center gap-3">
                  <FilterControlIcon name="tune" prominent />
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#e3bc8e]">Bộ lọc chi tiết</p>
                    <h2 className="mt-1 font-display text-lg font-bold">Tinh chỉnh lựa chọn</h2>
                  </div>
                </div>
                <p className="mt-2.5 text-xs leading-5 text-white/65">Lọc thêm theo loại phòng, quy mô, đánh giá, ngân sách và tiện nghi.</p>
              </div>

              <div className="space-y-5 p-4">
                <SidebarRoomNameSearch
                  value={filters.roomName}
                  onChange={(value) => updateFilter('roomName', value)}
                />

                <FilterDivider title="Loại phòng" />
                <SidebarSingleChoiceFilter
                  value={filters.roomTierId}
                  onChange={(value) => updateFilter('roomTierId', value)}
                  options={[
                    { value: 'all', label: 'Tất cả loại phòng' },
                    ...roomTiers.map((tier) => ({
                      value: String(tier.id),
                      label: getPublicRoomTierLabel(tier.typeName, {
                        category: inferRoomCategoryFromTypeName(`${tier.typeName} ${tier.description ?? ''}`),
                        capacity: tier.capacity,
                      }),
                    })),
                  ]}
                />

                <FilterDivider title="Số phòng ngủ" />
                <SidebarSingleChoiceFilter
                  value={String(filters.minBedrooms)}
                  onChange={(value) => updateFilter('minBedrooms', Number(value))}
                  options={buildCountOptions('phòng ngủ', 6)}
                  collapsedAfter={4}
                />

                <FilterDivider title="Sức chứa" />
                <SidebarSingleChoiceFilter
                  value={filters.capacity}
                  onChange={(value) => updateFilter('capacity', value as RoomCapacityFilter)}
                  options={capacityOptions}
                />

                <FilterDivider title="Điểm đánh giá" />
                <RatingFilter value={filters.minRating} onChange={(value) => updateFilter('minRating', value)} />

                <FilterDivider title="Ngân sách mỗi đêm" />
                <SidebarPriceFilter
                  min={filters.minNightlyPrice}
                  max={filters.maxNightlyPrice}
                  onMinChange={(value) => updateFilter('minNightlyPrice', value)}
                  onMaxChange={(value) => updateFilter('maxNightlyPrice', value)}
                />

                <FilterDivider title="Tiện nghi cần có" />
                <SidebarAmenitiesFilter
                  options={availableAmenities}
                  selected={filters.amenities}
                  onChange={(values) => updateFilter('amenities', values)}
                />
              </div>

              <div className="border-t border-[#e7ddcf] bg-[#fffdfa]/95 p-3 backdrop-blur">
                <button
                  type="button"
                  onClick={resetDetailFilters}
                  disabled={!hasActiveFilters && sortBy === 'recommended'}
                  className="h-10 w-full rounded-xl border border-[#cfbfaa] bg-white font-display text-sm font-bold text-secondary transition hover:border-[#aa7949] hover:bg-[#faf4eb] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#b28455]/15 disabled:cursor-default disabled:opacity-40"
                >
                  Đặt lại bộ lọc chi tiết
                </button>
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="rounded-[22px] border border-[#ded4c6] bg-white/90 px-5 py-5 shadow-[0_14px_40px_rgba(29,49,41,.07)] sm:px-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-brand-orange">Danh sách lưu trú</p>
                  <h2 className="mt-1 font-editorial text-3xl font-semibold text-secondary">
                    {isLoading ? 'Đang tải phòng...' : isStayAvailabilityLoading ? 'Đang kiểm tra lịch...' : `${filteredRooms.length} phòng phù hợp`}
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                    {isStayAvailabilityLoading
                      ? `Đang đối chiếu từ ${formatShortStayDate(stayCriteria?.checkIn)} đến ${formatShortStayDate(stayCriteria?.checkOut)}.`
                      : stayAvailabilityErrorCount > 0
                        ? `${stayAvailabilityErrorCount} phòng chưa thể đối chiếu lịch.`
                        : catalogSource === 'backend'
                          ? isRefreshing ? 'Đang cập nhật dữ liệu mới nhất...' : 'Dữ liệu phòng và đánh giá được đồng bộ từ hệ thống.'
                          : catalogError || 'Không thể tải dữ liệu phòng từ hệ thống.'}
                  </p>
                </div>
                <SortSelect value={sortBy} onChange={setSortBy} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-[#ece4da] pt-4">
                {stayCriteria ? <FilterSummaryChip label={`${formatShortStayDate(stayCriteria.checkIn)} → ${formatShortStayDate(stayCriteria.checkOut)}`} /> : null}
                {stayCriteria ? <FilterSummaryChip label={`${stayCriteria.adults} người lớn${stayCriteria.children ? ` · ${stayCriteria.children} trẻ em` : ''}`} /> : null}
                {filters.minBedrooms > 0 ? <FilterSummaryChip label={`Từ ${filters.minBedrooms} phòng ngủ`} /> : null}
                {filters.minRating > 0 ? <FilterSummaryChip label={`Từ ${filters.minRating.toFixed(1)} sao`} /> : null}
                {filters.amenities.slice(0, 2).map((amenity) => <FilterSummaryChip key={amenity} label={amenity} />)}
                {filters.amenities.length > 2 ? <FilterSummaryChip label={`+${filters.amenities.length - 2} tiện nghi`} /> : null}
                {!stayCriteria && !hasActiveFilters ? <span className="inline-flex items-center gap-2 text-xs text-[#777b75]"><span className="h-1.5 w-1.5 rounded-full bg-[#b28455]" />Chọn bộ lọc để tinh chỉnh danh sách</span> : null}
              </div>
            </div>

            {isLoading || isStayAvailabilityLoading ? (
              <RoomCatalogSkeleton count={4} variant="list" />
            ) : filteredRooms.length > 0 ? (
              <div className="mt-5 space-y-5">
                {filteredRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    todaySlots={todaySlotsByRoomId[room.id]}
                    onBook={(selectedRoom) => setQuickBooking({
                      room: selectedRoom,
                      initialDate: stayCriteria?.checkIn,
                      initialEndDate: stayCriteria?.checkOut,
                    })}
                    onViewDetail={(selectedRoom) => router.push(`/rooms/${selectedRoom.id}${stayCriteria ? `?${buildStaySearchParams(stayCriteria).toString()}` : ''}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-[22px] border border-dashed border-[#cfc2b1] bg-white px-6 py-16 text-center shadow-[var(--shadow-card)]">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f2e7d8] text-[#8d6339]"><FilterControlIcon name="tune" /></span>
                <p className="mt-5 font-editorial text-3xl font-semibold text-secondary">Chưa tìm thấy căn phù hợp</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">Hãy thay đổi ngày lưu trú, giảm số tiện nghi bắt buộc hoặc nới rộng ngân sách để xem thêm lựa chọn.</p>
                <button type="button" onClick={resetDetailFilters} className="mt-6 rounded-full bg-secondary px-6 py-3 font-display text-sm font-bold text-white transition hover:bg-[#245545]">Xem lại tất cả phòng</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {quickBooking && (
        <BookingQuickModal
          room={quickBooking.room}
          open
          initialDate={quickBooking.initialDate}
          initialEndDate={quickBooking.initialEndDate}
          initialStartTime={quickBooking.initialStartTime}
          initialDuration={quickBooking.initialDuration}
          initialNote={quickBooking.initialNote}
          sourceRoute="/rooms"
          returnPath={stayCriteria ? `/rooms?${buildStaySearchParams(stayCriteria).toString()}` : '/rooms'}
          onClose={() => setQuickBooking(null)}
        />
      )}
    </main>
  )
}

function RoomCard({
  room,
  todaySlots,
  onBook,
  onViewDetail,
}: {
  room: Room
  todaySlots?: TimeSlot[]
  onBook: (room: Room) => void
  onViewDetail: (room: Room) => void
}) {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { favoriteIds, toggleFavorite } = useFavorites()
  const availabilityStatus = room.availabilityStatus ?? 'AVAILABLE'
  const imageSrc = room.image ?? '/images/homestay-luxury-hero.webp'
  const numericRoomId = Number(room.id)
  const canFavorite = Number.isSafeInteger(numericRoomId) && numericRoomId > 0
  const isFavorite = canFavorite && favoriteIds.has(numericRoomId)
  const now = new Date()
  const availabilityState = getRoomCardAvailabilityState(room)
  const isCheckingAvailability = availabilityState.isChecking
  const canBookNow = availabilityState.canBookToday
  const canBookFutureDate = availabilityState.canBookFutureDate
  const canStartBooking = availabilityState.canStartBooking
  const isPaymentHeld = availabilityState.isPaymentHeld
  const isFullToday = availabilityState.hasBookingToday || room.todayAvailabilityReason === 'BOOKED'
  const isUnavailable = availabilityState.isUnavailable
  const nextAvailableSlotToday = getNextAvailableSlotToday(room, now, todaySlots)
  const bookingBadge = isCheckingAvailability
    ? 'Đang kiểm tra'
    : isPaymentHeld
      ? 'Chọn ngày khác'
    : canStartBooking
      ? 'Có thể đặt phòng'
      : isUnavailable
        ? 'Tạm ngưng'
        : 'Chọn ngày khác'
  const bookingHint = canBookNow
    ? `Hôm nay, ${nextAvailableSlotToday}`
    : isPaymentHeld
      ? `Đang giữ chỗ chờ thanh toán${formatHoldExpiry(room.holdExpiresAt)}`
    : canBookFutureDate
      ? 'Chọn ngày lưu trú phù hợp'
    : isUnavailable
      ? 'Phòng đang tạm ngưng nhận lịch'
      : isCheckingAvailability
        ? 'Đang đồng bộ lịch phòng'
        : `Hôm nay đã có lịch${room.nextAvailableSlot ? ` · ${room.nextAvailableSlot}` : ''}`

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent('/rooms')}`)
      return
    }
    if (!canFavorite) return

    try {
      await toggleFavorite(numericRoomId)
    } catch {
      // The favorites panel keeps and displays the API error state.
    }
  }

  return (
    <article
      className={[
        'group flex w-full flex-col overflow-hidden rounded-[22px] border bg-white shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-orange/45 hover:shadow-[var(--shadow-elevated)] md:min-h-[310px] md:flex-row',
        canStartBooking
          ? 'border-brand-orange/30'
          : isUnavailable
            ? 'border-outline-variant bg-surface-container-low opacity-60'
            : isCheckingAvailability
              ? 'border-outline-variant bg-surface-container-low opacity-90'
              : 'border-outline-variant bg-surface-container-low opacity-[0.86]',
        ].join(' ')}
    >
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-surface-container md:aspect-auto md:min-h-[310px] md:w-[36%] md:min-w-[285px] md:max-w-[390px]">
        <button
          type="button"
          onClick={() => onViewDetail(room)}
          className="absolute inset-0 block h-full w-full overflow-hidden text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-brand-orange/60"
          aria-label={`Xem chi tiết ${room.name}`}
        >
        <Image
          src={imageSrc}
          alt={room.name}
          fill
          quality={90}
          unoptimized={shouldBypassImageOptimization(imageSrc)}
          sizes="(min-width: 1280px) 390px, (min-width: 768px) 36vw, 100vw"
          className={[
            'object-cover transition duration-300 group-hover:scale-105',
            isFullToday ? 'brightness-[0.82] saturate-[0.78]' : '',
            isUnavailable ? 'brightness-75 saturate-50' : '',
            room.imageClassName,
          ].join(' ')}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(23,58,49,0.62),transparent_58%)]" />
        <span
          className={[
            'absolute left-4 top-4 rounded-full border px-3 py-1 font-display text-xs font-bold',
            isCheckingAvailability
              ? 'border-white/20 bg-white/90 text-on-surface-variant'
              : getAvailabilityClassName(availabilityStatus, isUnavailable),
          ].join(' ')}
        >
          {isUnavailable ? 'Tạm ngưng' : isCheckingAvailability ? 'Đang cập nhật lịch' : getAvailabilityLabel(availabilityStatus, room)}
        </span>
        <span
          className={[
            'absolute bottom-4 left-4 rounded-full border px-3 py-1 font-display text-[11px] font-bold',
            canStartBooking
              ? 'border-brand-orange/40 bg-primary-container text-on-primary-container'
              : 'border-white/20 bg-white/90 text-on-surface-variant',
          ].join(' ')}
        >
          {bookingBadge}
        </span>
        </button>
        <button
          type="button"
          onClick={() => void handleFavorite()}
          disabled={!canFavorite}
          aria-label={isFavorite ? `Bỏ ${room.name} khỏi danh sách yêu thích` : `Thêm ${room.name} vào danh sách yêu thích`}
          aria-pressed={isFavorite}
          title={isFavorite ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}
          className={[
            'absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border shadow-[0_8px_24px_rgba(20,35,29,.16)] backdrop-blur-md transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/75 disabled:cursor-not-allowed disabled:opacity-50',
            isFavorite
              ? 'scale-105 border-[#d94d55]/30 bg-[#fff0f0] text-[#d62f3b]'
              : 'border-white/80 bg-white/80 text-[#777b76] hover:scale-105 hover:border-[#efb7bb] hover:bg-[#fff7f7] hover:text-[#d62f3b]',
          ].join(' ')}
        >
          <HeartIcon filled={isFavorite} className="h-6 w-6" />
        </button>
      </div>

      <div className="grid min-w-0 flex-1 md:grid-cols-[minmax(0,1fr)_210px]">
        <div className="min-w-0 px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-brand-orange">{room.categoryLabel}</p>
            <span className="h-1 w-1 rounded-full bg-[#c8b8a5]" />
            <span className="text-xs font-medium text-[#777b75]">{room.location || 'The Serene Villa'}</span>
          </div>
          <button type="button" onClick={() => onViewDetail(room)} className="mt-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/35">
            <h2 className="font-editorial text-2xl font-semibold leading-tight text-secondary transition group-hover:text-[#9b6636] sm:text-[28px]">{room.name}</h2>
          </button>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {typeof room.rating === 'number' && (room.reviews ?? 0) > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff4df] px-2.5 py-1 text-xs font-bold text-[#9b641c]">
                <span aria-hidden>★</span>{room.rating.toFixed(1)} <span className="font-medium text-[#8b8176]">({room.reviews} đánh giá)</span>
              </span>
            ) : (
              <span className="rounded-full border border-[#dfd6ca] bg-[#faf8f4] px-2.5 py-1 text-xs font-medium text-[#777b75]">Chưa có đánh giá</span>
            )}
            <span className="text-xs font-semibold text-[#39775f]">✓ Xác nhận lịch theo thời gian thực</span>
          </div>

          <p className="mt-3 line-clamp-2 text-sm leading-6 text-on-surface-variant">{room.description}</p>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-y border-[#eee6dc] py-3 text-xs font-semibold text-[#56625c]">
            <span className="inline-flex items-center gap-1.5"><GuestsMiniIcon />{room.capacity}</span>
            <span className="inline-flex items-center gap-1.5"><BedroomIcon />{room.bedroomCount} phòng ngủ</span>
            <span className="inline-flex items-center gap-1.5"><BedIcon />{room.bedCount} giường</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {room.equipments.slice(0, 4).map((equipment) => (
              <span key={equipment} className="rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-[11px] font-medium text-on-surface-variant">{equipment}</span>
            ))}
            {room.equipments.length > 4 ? <span className="rounded-full border border-[#d7c5ad] bg-[#f7eee2] px-3 py-1 text-[11px] font-bold text-[#805a34]">+{room.equipments.length - 4} tiện nghi</span> : null}
          </div>
        </div>

        <div className="flex flex-col border-t border-[#e9dfd2] bg-[linear-gradient(160deg,#fcfaf6,#f7f1e8)] p-5 md:border-l md:border-t-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#888177]">Giá cho một đêm</p>
          <p className="mt-2 font-editorial text-[26px] font-semibold leading-none text-[#a66f38]">{formatCurrency(getNightlyDisplayPrice(room.pricePerHour))}</p>
          <p className="mt-1 text-xs text-[#817a70]">đã gồm trọn {FIRST_NIGHT_STAY_HOURS} giờ lưu trú</p>

          <div className="mt-5 rounded-xl border border-[#e1d5c5] bg-white/80 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a8176]">Tình trạng</p>
            <p className="mt-1 text-xs font-bold leading-5 text-secondary">{bookingHint}</p>
          </div>

          <div className="mt-auto space-y-2 pt-5" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => onViewDetail(room)} className="h-11 w-full rounded-full border border-[#cdbda8] bg-white font-display text-sm font-bold text-secondary transition hover:border-[#a77442] hover:bg-[#fbf5ec]">Xem chi tiết</button>
            <button
              type="button"
              onClick={(event) => { event.stopPropagation(); onBook(room) }}
              disabled={isUnavailable || isCheckingAvailability}
              className={[
                !isUnavailable && !isCheckingAvailability ? 'bg-secondary text-white shadow-[0_12px_28px_rgba(23,58,49,.2)] hover:-translate-y-0.5 hover:bg-[#245545]' : 'border border-outline-variant bg-surface-container text-on-surface-variant',
                'h-11 w-full rounded-full font-display text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-55',
              ].join(' ')}
            >
              {isCheckingAvailability ? 'Đang kiểm tra' : canStartBooking ? 'Đặt phòng' : isUnavailable ? 'Tạm ngưng' : 'Chọn ngày khác'}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

type FilterControlIconName = 'tier' | 'room' | 'guests' | 'amenities' | 'price' | 'calendar' | 'tune'

function FilterControlIcon({ name, prominent = false }: { name: FilterControlIconName; prominent?: boolean }) {
  const paths: Record<FilterControlIconName, ReactNode> = {
    tier: <><path d="M5 8.5h14M7 5h10M7 12h10M9 15.5h6M10 19h4" /><path d="M4 3h16v18H4z" opacity=".18" /></>,
    room: <><path d="M4 20V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v15M8 20v-5h8v5M9 8h6" /><circle cx="16.5" cy="11.5" r=".8" fill="currentColor" stroke="none" /></>,
    guests: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20v-1.5A4.5 4.5 0 0 1 8 14h2a4.5 4.5 0 0 1 4.5 4.5V20M16 6.5a2.5 2.5 0 0 1 0 5M17 14a4 4 0 0 1 3.5 4v2" /></>,
    amenities: <><path d="M12 3 9.8 8.1 4.5 9l4 3.7-.9 5.3 4.4-2.6 4.4 2.6-.9-5.3 4-3.7-5.3-.9L12 3Z" /><circle cx="12" cy="11" r="1.7" /></>,
    price: <><path d="M4 7.5h16v10H4z" /><path d="M7 7.5V5h10v2.5M7 17.5V20h10v-2.5" /><circle cx="12" cy="12.5" r="2.2" /></>,
    calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M8 3v4M16 3v4M3.5 10h17" /></>,
    tune: <><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="9" cy="6" r="2" fill="currentColor" /><circle cx="15" cy="12" r="2" fill="currentColor" /><circle cx="7" cy="18" r="2" fill="currentColor" /></>,
  }

  return (
    <span className={[
      'flex shrink-0 items-center justify-center',
      prominent
        ? 'h-11 w-11 rounded-2xl border border-white/14 bg-white/10 text-[#f0d4b2] shadow-inner'
        : 'h-10 w-10 rounded-[14px] border border-[#eadfd1] bg-[#f5ecdf] text-[#98683c]',
    ].join(' ')}>
      <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
    </span>
  )
}

function SidebarRoomNameSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block font-display text-[10px] font-bold uppercase tracking-[0.15em] text-[#765b3e]">
        Tìm tên phòng
      </span>
      <span className="flex min-h-12 items-center gap-3 rounded-[16px] border border-[#ded2c3] bg-white px-3.5 shadow-[0_5px_18px_rgba(37,57,48,.04)] transition focus-within:border-[#a9794b] focus-within:ring-4 focus-within:ring-[#b28455]/10">
        <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-[#a56f3e]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
        <input
          type="text"
          role="searchbox"
          aria-label="Tìm theo tên phòng"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ví dụ: Deluxe Garden"
          autoComplete="off"
          className="min-w-0 flex-1 border-0 bg-transparent py-3 text-sm font-medium text-secondary outline-none placeholder:text-[#aaa399]"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Xóa tên phòng đang tìm"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#8c867d] transition hover:bg-[#f3e9dc] hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b28455]/25"
          >
            <span aria-hidden>×</span>
          </button>
        ) : null}
      </span>
    </label>
  )
}

function FilterDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <h3 className="shrink-0 font-display text-[10px] font-bold uppercase tracking-[0.15em] text-[#765b3e]">{title}</h3>
      <span className="h-px flex-1 bg-[#e7ddd0]" aria-hidden />
    </div>
  )
}

function RatingFilter({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const options = [
    { value: 0, label: 'Tất cả đánh giá' },
    { value: 5, label: '5 sao', description: 'Xuất sắc' },
    { value: 4, label: '4 sao trở lên', description: 'Rất tốt' },
    { value: 3, label: '3 sao trở lên', description: 'Tốt' },
    { value: 2, label: '2 sao trở lên' },
    { value: 1, label: '1 sao trở lên' },
  ]

  return (
    <SidebarSingleChoiceFilter
      value={value}
      onChange={onChange}
      options={options}
      renderLeading={(option) => option.value > 0 ? (
        <span className="min-w-[58px] text-[11px] tracking-[0.08em] text-[#b47b3d]" aria-hidden>
          {'★'.repeat(Number(option.value))}
        </span>
      ) : null}
    />
  )
}

type SidebarChoiceValue = string | number
type SidebarChoiceOption<T extends SidebarChoiceValue> = {
  value: T
  label: string
  description?: string
}

function SidebarSingleChoiceFilter<T extends SidebarChoiceValue>({
  value,
  options,
  onChange,
  collapsedAfter,
  renderLeading,
}: {
  value: T
  options: SidebarChoiceOption<T>[]
  onChange: (value: T) => void
  collapsedAfter?: number
  renderLeading?: (option: SidebarChoiceOption<T>) => ReactNode
}) {
  const [expanded, setExpanded] = useState(false)
  const visibleOptions = collapsedAfter && !expanded ? options.slice(0, collapsedAfter) : options
  const hiddenCount = Math.max(0, options.length - visibleOptions.length)

  return (
    <div>
      <div className="space-y-1">
        {visibleOptions.map((option) => {
          const checked = value === option.value
          return (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={checked}
              className="group flex min-h-10 w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-[#faf4eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b28455]/25"
            >
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border transition ${checked ? 'border-secondary bg-secondary text-white' : 'border-[#cfc3b3] bg-white group-hover:border-[#aa8258]'}`}>
                {checked ? <SelectedIcon /> : null}
              </span>
              {renderLeading?.(option)}
              <span className="min-w-0 flex-1">
                <span className={`block text-xs font-semibold ${checked ? 'text-secondary' : 'text-[#565e59]'}`}>{option.label}</span>
                {option.description ? <span className="mt-0.5 block text-[10px] text-[#8b857c]">{option.description}</span> : null}
              </span>
            </button>
          )
        })}
      </div>
      {collapsedAfter && options.length > collapsedAfter ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-2 text-xs font-bold text-[#966438] transition hover:text-secondary hover:underline"
        >
          {expanded ? 'Thu gọn' : `Xem thêm ${hiddenCount} lựa chọn`}
        </button>
      ) : null}
    </div>
  )
}

function SidebarPriceFilter({ min, max, onMinChange, onMaxChange }: { min: number; max: number; onMinChange: (value: number) => void; onMaxChange: (value: number) => void }) {
  const range = MAX_NIGHTLY_PRICE - MIN_NIGHTLY_PRICE
  const minPosition = ((min - MIN_NIGHTLY_PRICE) / range) * 100
  const maxPosition = ((max - MIN_NIGHTLY_PRICE) / range) * 100
  const sliderClassName = 'pointer-events-none absolute inset-x-0 top-0 h-2 w-full appearance-none bg-transparent outline-none [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:mt-[-5px] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#b28455] [&::-webkit-slider-thumb]:shadow-[0_3px_10px_rgba(79,53,28,.3)] [&::-moz-range-track]:h-2 [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[#b28455]'

  return (
    <div className="rounded-[16px] border border-[#e5dbcf] bg-[#fbf8f3] p-4">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <PriceBadge label="Từ" value={min} />
        <span className="text-[#b4a99b]">–</span>
        <PriceBadge label="Đến" value={max} />
      </div>
      <div className="mt-7 px-1">
        <div className="relative h-2 rounded-full bg-[#e3dbd0]">
          <div className="absolute h-2 rounded-full bg-[linear-gradient(90deg,#b28455,#173a31)]" style={{ left: `${minPosition}%`, right: `${100 - maxPosition}%` }} />
          <input type="range" min={MIN_NIGHTLY_PRICE} max={MAX_NIGHTLY_PRICE} step={NIGHTLY_PRICE_STEP} value={min} onChange={(event) => onMinChange(Math.min(Number(event.target.value), max - NIGHTLY_PRICE_STEP))} aria-label="Giá thấp nhất mỗi đêm" className={`${sliderClassName} z-20`} />
          <input type="range" min={MIN_NIGHTLY_PRICE} max={MAX_NIGHTLY_PRICE} step={NIGHTLY_PRICE_STEP} value={max} onChange={(event) => onMaxChange(Math.max(Number(event.target.value), min + NIGHTLY_PRICE_STEP))} aria-label="Giá cao nhất mỗi đêm" className={`${sliderClassName} z-30`} />
        </div>
        <div className="mt-3 flex justify-between text-[9px] font-semibold text-[#8a847b]"><span>1 triệu</span><span>3 triệu</span><span>5 triệu</span></div>
      </div>
    </div>
  )
}

function SidebarAmenitiesFilter({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (values: string[]) => void }) {
  const [expanded, setExpanded] = useState(false)
  const visibleOptions = expanded ? options : options.slice(0, 6)
  const toggle = (amenity: string) => onChange(selected.includes(amenity) ? selected.filter((value) => value !== amenity) : [...selected, amenity])

  return (
    <div>
      <div className="space-y-1.5">
        {visibleOptions.map((amenity) => {
          const checked = selected.includes(amenity)
          return (
            <button key={amenity} type="button" onClick={() => toggle(amenity)} aria-pressed={checked} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-[#faf4eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b28455]/25">
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border ${checked ? 'border-secondary bg-secondary text-white' : 'border-[#d7cbbb] bg-white'}`}>{checked ? <SelectedIcon /> : null}</span>
              <span className="line-clamp-2 text-xs font-medium text-[#5c635e]">{amenity}</span>
            </button>
          )
        })}
        {options.length === 0 ? <p className="py-3 text-center text-xs text-on-surface-variant">Chưa có dữ liệu tiện nghi.</p> : null}
      </div>
      {options.length > 6 ? <button type="button" onClick={() => setExpanded((current) => !current)} className="mt-2 text-xs font-bold text-[#966438] hover:underline">{expanded ? 'Thu gọn' : `Xem thêm ${options.length - 6} tiện nghi`}</button> : null}
    </div>
  )
}

function SortSelect({ value, onChange }: { value: RoomSortOption; onChange: (value: RoomSortOption) => void }) {
  return (
    <div className="w-full sm:w-[260px]">
      <CompactFilterSelect
        label="Sắp xếp kết quả"
        value={value}
        onChange={(nextValue) => onChange(nextValue as RoomSortOption)}
        options={[
          { value: 'recommended', label: 'Phù hợp nhất' },
          { value: 'rating_desc', label: 'Đánh giá cao nhất' },
          { value: 'price_asc', label: 'Giá thấp đến cao' },
          { value: 'price_desc', label: 'Giá cao đến thấp' },
          { value: 'capacity_desc', label: 'Sức chứa lớn nhất' },
        ]}
      />
    </div>
  )
}

function AmenitiesFilter({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (values: string[]) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const close = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [isOpen])

  const toggle = (amenity: string) => {
    onChange(selected.includes(amenity)
      ? selected.filter((value) => value !== amenity)
      : [...selected, amenity])
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={[
          'flex min-h-[70px] w-full items-center gap-3 rounded-[18px] border px-3.5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b88857]',
          isOpen ? 'border-[#b88857] bg-white shadow-[0_0_0_3px_rgba(184,136,87,0.10)]' : 'border-[#e6ddd2] bg-[#fcfaf7] hover:border-[#d4c2ad] hover:bg-white',
        ].join(' ')}
        aria-expanded={isOpen}
      >
        <FilterControlIcon name="amenities" />
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[10px] font-bold uppercase tracking-[0.12em] text-[#817970]">Tiện nghi</span>
          <span className="mt-1 block truncate text-sm font-semibold text-on-surface">{selected.length > 0 ? `${selected.length} tiện nghi đã chọn` : 'Chọn tiện nghi'}</span>
        </span>
        <ChevronDownIcon className={['ml-3 h-4 w-4 shrink-0 text-[#8b8278] transition-transform', isOpen ? 'rotate-180' : ''].join(' ')} />
      </button>
      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 min-w-[270px] rounded-2xl border border-[#ded3c5] bg-white p-3 shadow-[0_20px_55px_rgba(29,49,41,0.17)]">
          <div className="flex items-center justify-between border-b border-[#eee7de] pb-2">
            <p className="font-display text-xs font-bold text-secondary">Tiện nghi cần có</p>
            {selected.length > 0 && <button type="button" onClick={() => onChange([])} className="text-[11px] font-bold text-[#9a6739]">Bỏ chọn</button>}
          </div>
          <div className="mt-2 max-h-64 space-y-1 overflow-y-auto pr-1">
            {options.length > 0 ? options.map((amenity) => {
              const checked = selected.includes(amenity)
              return (
                <button key={amenity} type="button" onClick={() => toggle(amenity)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm text-on-surface transition hover:bg-[#faf5ee]">
                  <span className={['flex h-5 w-5 shrink-0 items-center justify-center rounded-md border', checked ? 'border-secondary bg-secondary text-white' : 'border-[#d8cdbc] bg-white'].join(' ')}>{checked && <SelectedIcon />}</span>
                  <span className="line-clamp-2">{amenity}</span>
                </button>
              )
            }) : <p className="px-2 py-4 text-center text-xs text-on-surface-variant">Chưa có dữ liệu tiện nghi.</p>}
          </div>
        </div>
      )}
    </div>
  )
}

function FilterSummaryChip({ label }: { label: string }) {
  return <span className="rounded-full border border-[#ded3c5] bg-[#fbf8f3] px-3 py-1.5 text-[11px] font-semibold text-[#5f665f]">{label}</span>
}

function CompactFilterSelect({
  label,
  icon,
  value,
  onChange,
  options,
}: {
  label: string
  icon?: FilterControlIconName
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const selectedOption = options.find((option) => option.value === value) ?? options[0]

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={[
          'flex min-h-[70px] w-full items-center gap-3 rounded-[18px] border px-3.5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b88857]',
          isOpen
            ? 'border-[#b88857] bg-white shadow-[0_0_0_3px_rgba(184,136,87,0.10)]'
            : 'border-[#e6ddd2] bg-[#fcfaf7] hover:border-[#d4c2ad] hover:bg-white',
        ].join(' ')}
      >
        {icon && <FilterControlIcon name={icon} />}
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[10px] font-bold uppercase tracking-[0.12em] text-[#817970]">{label}</span>
          <span className="mt-1 block truncate text-sm font-semibold text-on-surface">{selectedOption?.label}</span>
        </span>
        <ChevronDownIcon className={['ml-3 h-4 w-4 shrink-0 text-[#8b8278] transition-transform duration-200', isOpen ? 'rotate-180' : ''].join(' ')} />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={label}
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 max-h-72 overflow-y-auto rounded-2xl border border-[#ded3c5] bg-white p-1.5 shadow-[0_20px_55px_rgba(29,49,41,0.17)]"
        >
          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={[
                  'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors duration-150',
                  isSelected
                    ? 'bg-[#edf4f0] font-bold text-secondary'
                    : 'font-medium text-on-surface hover:bg-[#faf5ee]',
                ].join(' ')}
              >
                <span>{option.label}</span>
                {isSelected && <SelectedIcon />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function NightlyPriceFilter({
  min,
  max,
  onMinChange,
  onMaxChange,
  onReset,
}: {
  min: number
  max: number
  onMinChange: (value: number) => void
  onMaxChange: (value: number) => void
  onReset: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const range = MAX_NIGHTLY_PRICE - MIN_NIGHTLY_PRICE
  const minPosition = ((min - MIN_NIGHTLY_PRICE) / range) * 100
  const maxPosition = ((max - MIN_NIGHTLY_PRICE) / range) * 100
  const sliderClassName =
    'pointer-events-none absolute inset-x-0 top-0 h-2 w-full appearance-none bg-transparent outline-none [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#b28455] [&::-webkit-slider-thumb]:shadow-[0_3px_12px_rgba(79,53,28,.35)] [&::-moz-range-track]:h-2 [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[#b28455]'

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setIsOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [isOpen])

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        className={[
          'flex min-h-[70px] w-full items-center gap-3 rounded-[18px] border bg-[#fcfaf7] px-3.5 text-left transition',
          isOpen
            ? 'border-[#b88857] bg-white shadow-[0_0_0_3px_rgba(184,136,87,0.10)]'
            : 'border-[#e6ddd2] hover:border-[#cfb99f] hover:bg-white',
        ].join(' ')}
      >
        <FilterControlIcon name="price" />
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[10px] font-bold uppercase tracking-[0.12em] text-[#817970]">Giá mỗi đêm</span>
          <span className="mt-1 block text-sm font-semibold text-on-surface">
            {formatCompactPrice(min)} – {formatCompactPrice(max)}
          </span>
        </span>
        <ChevronDownIcon className={['h-4 w-4 shrink-0 text-[#8b8278] transition', isOpen ? 'rotate-180' : ''].join(' ')} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+10px)] z-30 w-[min(420px,calc(100vw-2.5rem))] rounded-[20px] border border-[#ded3c5] bg-white p-5 shadow-[0_24px_70px_rgba(29,49,41,0.18)] xl:left-auto xl:right-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-sm font-bold text-secondary">Ngân sách mỗi đêm</p>
              <p className="mt-1 text-xs text-on-surface-variant">Kéo hai đầu để chọn khoảng giá.</p>
            </div>
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-semibold text-[#9a6739] hover:underline"
            >
              Đặt lại
            </button>
          </div>

          <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <PriceBadge label="Tối thiểu" value={min} />
            <span className="text-[#b5aa9c]">–</span>
            <PriceBadge label="Tối đa" value={max} />
          </div>

          <div className="mt-7 px-1">
            <div className="relative h-2 rounded-full bg-[#e3dbd0]">
              <div
                className="absolute h-2 rounded-full bg-[linear-gradient(90deg,#b28455,#173a31)]"
                style={{ left: `${minPosition}%`, right: `${100 - maxPosition}%` }}
              />
              <input
                type="range"
                min={MIN_NIGHTLY_PRICE}
                max={MAX_NIGHTLY_PRICE}
                step={NIGHTLY_PRICE_STEP}
                value={min}
                onChange={(event) => onMinChange(Math.min(Number(event.target.value), max - NIGHTLY_PRICE_STEP))}
                aria-label="Giá thấp nhất mỗi đêm"
                className={`${sliderClassName} z-20`}
              />
              <input
                type="range"
                min={MIN_NIGHTLY_PRICE}
                max={MAX_NIGHTLY_PRICE}
                step={NIGHTLY_PRICE_STEP}
                value={max}
                onChange={(event) => onMaxChange(Math.max(Number(event.target.value), min + NIGHTLY_PRICE_STEP))}
                aria-label="Giá cao nhất mỗi đêm"
                className={`${sliderClassName} z-30`}
              />
            </div>
            <div className="mt-3 flex justify-between text-[11px] font-semibold text-[#8a847b]">
              <span>1 triệu</span>
              <span>3 triệu</span>
              <span>5 triệu</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="mt-5 w-full rounded-xl bg-secondary px-4 py-3 font-display text-sm font-bold text-white shadow-[0_10px_24px_rgba(23,58,49,0.18)] transition hover:bg-[#204b40]"
          >
            Áp dụng khoảng giá
          </button>
        </div>
      )}
    </div>
  )
}

function PriceBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#e4dbd0] bg-[#fcfaf7] px-3 py-2.5">
      <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-[#8a847b]">{label}</span>
      <span className="mt-0.5 block font-display text-sm font-bold text-[#173a31]">{formatPriceInMillions(value)}</span>
    </div>
  )
}

function formatCompactPrice(value: number) {
  return formatPriceInMillions(value)
}

function formatPriceInMillions(value: number) {
  const millions = value / 1_000_000
  return `${Number.isInteger(millions) ? millions : millions.toFixed(1)} triệu`
}

function SelectedIcon() {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-white">
      <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="h-3 w-3">
        <path d="m4 8 2.4 2.4L12 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
      <path d="m7 9.5 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function AvailabilityMetric({
  value,
  label,
  tone,
  onClick,
}: {
  value: string
  label: string
  tone: 'available' | 'limited' | 'full' | 'paused'
  onClick?: () => void
}) {
  const toneClasses = {
    available: 'border-[#8dd7b4]/24 bg-[#8dd7b4]/10 text-[#a9e4c7]',
    limited: 'border-[#f1d2a9]/24 bg-[#f1d2a9]/10 text-[#f1d2a9]',
    full: 'border-white/14 bg-white/[0.06] text-white/82',
    paused: 'border-[#d9a3a3]/18 bg-[#d9a3a3]/[0.07] text-[#e8bcbc]',
  }[tone]
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
        {onClick ? <ArrowUpRightIcon className="h-3 w-3 opacity-45" /> : null}
      </div>
      <p className="mt-2 font-display text-xl font-bold leading-none">{value}</p>
      <p className="mt-1.5 text-[10px] font-medium leading-4 text-white/60">{label}</p>
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`min-w-0 rounded-[13px] border px-2.5 py-2.5 text-left transition hover:-translate-y-0.5 hover:border-white/28 hover:bg-white/[0.12] ${toneClasses}`}
        aria-label={`Xem phòng: ${label}`}
      >
        {content}
      </button>
    )
  }

  return <div className={`min-w-0 rounded-[13px] border px-2.5 py-2.5 ${toneClasses}`}>{content}</div>
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M19 8a7.5 7.5 0 1 0 .2 7.65" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M19 4v4h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ArrowUpRightIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M6 14 14 6m-6 0h6v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-3">
      <p className="font-display text-[11px] font-bold uppercase text-on-surface-variant">{label}</p>
      <p className="mt-1 font-semibold text-on-surface">{value}</p>
    </div>
  )
}

function BedroomIcon() { return <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 text-[#9b6b3c]" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 20V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v15M8 20v-5h8v5M9 8h6" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function BedIcon() { return <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 text-[#9b6b3c]" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 19v-8M21 19v-5a3 3 0 0 0-3-3H9v8M3 15h18M7 11V8h5a3 3 0 0 1 3 3" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function GuestsMiniIcon() { return <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 text-[#9b6b3c]" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="9" cy="8" r="3"/><path d="M3.5 20v-1.5A4.5 4.5 0 0 1 8 14h2a4.5 4.5 0 0 1 4.5 4.5V20M16 7a2.5 2.5 0 0 1 0 5M17 14.5a4 4 0 0 1 3 3.8V20" strokeLinecap="round"/></svg> }

function sortPublicRooms(rooms: Room[], sortBy: RoomSortOption) {
  const sortedRooms = [...rooms]
  const rating = (room: Room) => room.rating ?? -1
  const price = (room: Room) => getNightlyDisplayPrice(room.pricePerHour)
  const capacity = (room: Room) => Number(room.capacity.match(/\d+/)?.[0] ?? 0)

  if (sortBy === 'rating_desc') return sortedRooms.sort((left, right) => rating(right) - rating(left) || (right.reviews ?? 0) - (left.reviews ?? 0))
  if (sortBy === 'price_asc') return sortedRooms.sort((left, right) => price(left) - price(right))
  if (sortBy === 'price_desc') return sortedRooms.sort((left, right) => price(right) - price(left))
  if (sortBy === 'capacity_desc') return sortedRooms.sort((left, right) => capacity(right) - capacity(left))

  return sortedRooms.sort((left, right) => {
    const availabilityScore = (room: Room) => room.availabilityStatus === 'AVAILABLE' ? 2 : room.availabilityStatus === 'ALMOST_FULL' ? 1 : 0
    return availabilityScore(right) - availabilityScore(left) || rating(right) - rating(left) || price(left) - price(right)
  })
}

function buildCountOptions(unit: string, max: number) {
  return [
    { value: '0', label: `Tất cả ${unit}` },
    ...Array.from({ length: max }, (_, index) => ({
      value: String(index + 1),
      label: `Từ ${index + 1} ${unit}`,
    })),
  ]
}

function formatShortStayDate(value?: string) {
  if (!value) return '--/--/----'
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(year, month - 1, day))
}

function summarizeTodayRooms(rooms: Room[]): TodayRoomSummary {
  return rooms.reduce<TodayRoomSummary>((summary, room) => {
    if (isRoomTemporarilyUnavailable(room)) {
      summary.unavailable += 1
      return summary
    }

    if (!room.availabilityKnown || !room.availabilityStatus) {
      summary.unknown += 1
      return summary
    }

    if (room.todayAvailabilityReason === 'PAYMENT_HOLD') {
      summary.almostFull += 1
      return summary
    }

    // A room can still be bookable for a future date while its current
    // overnight stay is occupied. The dashboard summarizes today's occupancy,
    // so do not count that room as available merely because tomorrow is free.
    if (room.todayAvailabilityReason === 'TODAY_BOOKED'
      || room.todayAvailabilityReason === 'BOOKED') {
      summary.full += 1
      return summary
    }

    if (room.availabilityStatus === 'AVAILABLE') summary.available += 1
    if (room.availabilityStatus === 'ALMOST_FULL') summary.almostFull += 1
    if (room.availabilityStatus === 'FULL_TODAY') summary.full += 1
    return summary
  }, { available: 0, almostFull: 0, full: 0, unavailable: 0, unknown: 0 })
}

function formatHoldExpiry(holdExpiresAt?: string) {
  if (!holdExpiresAt) return ''
  const expiry = new Date(holdExpiresAt)
  if (Number.isNaN(expiry.getTime())) return ''

  return ` đến ${new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(expiry)}`
}

function formatScheduleUpdateTime(value: Date) {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(value)
}

function getNextAvailableSlotToday(room: Room, now: Date, todaySlots?: TimeSlot[]) {
  const bookableStartSlot = getBookableStartSlotsToday(room, now, todaySlots)[0]
  if (typeof bookableStartSlot === 'string') return bookableStartSlot
  if (bookableStartSlot) return bookableStartSlot.start

  const slotFromTime = room.nextAvailableTime?.match(/^(\d{2}:\d{2})$/)?.[1]
  if (slotFromTime && isSlotInFuture(slotFromTime, now)) {
    return slotFromTime
  }

  const slotFromLabel = room.nextAvailableSlot?.match(/^Hôm nay,\s*(\d{2}:\d{2})$/)?.[1]
  if (slotFromLabel && isSlotInFuture(slotFromLabel, now)) {
    return slotFromLabel
  }

  if (room.isAvailable && room.availabilityStatus !== 'FULL_TODAY' && (room.remainingSlots ?? 0) > 0) {
    return BOOKING_SLOT_TIMES.find((slot) => isSlotInFuture(slot, now))
  }

  return undefined
}

function getAvailabilityClassName(status: RoomAvailabilityStatus, isUnavailable = false) {
  if (isUnavailable) return 'border-white/20 bg-white/90 text-on-surface-variant'
  if (status === 'FULL_TODAY') return 'border-outline bg-white/95 text-on-surface'
  if (status === 'ALMOST_FULL') return 'border-brand-orange/35 bg-primary-container text-on-primary-container'
  return 'border-secondary-container/50 bg-[#E8F5EC] text-secondary'
}
