'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import BookingQuickModal from '@/components/booking/BookingQuickModal'
import { formatCurrency, getNightlyDisplayPrice } from '@/components/booking/booking-data'
import { BOOKING_SLOT_TIMES, getTodayKey } from '@/components/booking/booking-time-utils'
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
import { fetchAvailableSlots } from '@/lib/booking/bookingApi'
import type { TimeSlot } from '@/lib/booking/types'
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

const MIN_NIGHTLY_PRICE = 1_000_000
const MAX_NIGHTLY_PRICE = 5_000_000
const NIGHTLY_PRICE_STEP = 100_000

const availabilityOptions: Array<{ value: 'all' | RoomAvailabilityStatus; label: string }> = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'AVAILABLE', label: 'Còn trống hôm nay' },
  { value: 'ALMOST_FULL', label: 'Sắp kín lịch' },
  { value: 'FULL_TODAY', label: 'Kín lịch hôm nay' },
]

const capacityOptions: Array<{ value: RoomCapacityFilter; label: string }> = [
  { value: 'all', label: 'Mọi sức chứa' },
  { value: 'small', label: '1-4 người' },
  { value: 'medium', label: '5-8 người' },
  { value: 'large', label: '9+ người' },
]

const defaultFilters: RoomFilters = {
  search: '',
  roomTierId: 'all',
  capacity: 'all',
  availability: 'all',
  minNightlyPrice: MIN_NIGHTLY_PRICE,
  maxNightlyPrice: MAX_NIGHTLY_PRICE,
}

type RoomBookingStatus = 'AVAILABLE_NOW' | 'AVAILABLE_OTHER_TIME' | 'UNAVAILABLE'

type RoomSlotsById = Record<string, TimeSlot[] | undefined>

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
  const { rooms, source: catalogSource, isLoading, isRefreshing, error: catalogError } = usePublicRoomCatalog()
  const [roomTiers, setRoomTiers] = useState<BackendRoomType[]>([])
  const [quickBooking, setQuickBooking] = useState<QuickBookingState | null>(null)
  const [todaySlotsByRoomId, setTodaySlotsByRoomId] = useState<RoomSlotsById>({})
  const filteredRooms = useMemo(() => filterRooms(rooms, filters), [rooms, filters])
  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.roomTierId !== 'all' ||
    filters.capacity !== 'all' ||
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
      return
    }

    let isMounted = true
    const todayKey = getTodayKey()

    void Promise.all(
      rooms.map(async (room) => {
        if (isRoomTemporarilyUnavailable(room) || !/^\d+$/.test(room.id)) {
          return [room.id, undefined] as const
        }

        try {
          const slots = await fetchAvailableSlots(room.id, todayKey)
          return [room.id, slots] as const
        } catch {
          return [room.id, undefined] as const
        }
      }),
    ).then((entries) => {
      if (!isMounted) return
      setTodaySlotsByRoomId(Object.fromEntries(entries))
    })

    return () => {
      isMounted = false
    }
  }, [rooms])

  useEffect(() => {
    if (!shouldReopenQuickBooking(window.location.search)) return

    const draft = readQuickBookingDraft()
    if (!draft) {
      window.history.replaceState(window.history.state, '', '/rooms')
      return
    }

    try {
      const draftRoom = draft.selectedRoom ?? draft.room
      const restoredRoom = rooms.find((room) => room.id === draftRoom?.id) ?? draftRoom

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
  }, [rooms])

  useEffect(() => {
    if (isLoading || rooms.length === 0) return
    if (shouldReopenQuickBooking(window.location.search)) return

    const params = new URLSearchParams(window.location.search)
    const roomId = params.get('roomId')
    if (!roomId) return

    const matchedRoom = rooms.find((room) => room.id === roomId)
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
  }, [isLoading, rooms])

  useEffect(() => {
    const openFavoriteRoomBooking = (event: Event) => {
      const roomId = (event as CustomEvent<OpenQuickBookingEventDetail>).detail?.roomId
      if (!roomId) return

      const matchedRoom = rooms.find((room) => room.id === roomId)
      if (matchedRoom) setQuickBooking({ room: matchedRoom })
    }

    window.addEventListener(OPEN_QUICK_BOOKING_EVENT, openFavoriteRoomBooking)
    return () => window.removeEventListener(OPEN_QUICK_BOOKING_EVENT, openFavoriteRoomBooking)
  }, [rooms])

  const updateFilter = <Key extends keyof RoomFilters>(key: Key, value: RoomFilters[Key]) => {
    setFilters((current) => ({ ...current, [key]: value }))
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
        <div className="relative mx-auto grid min-h-[460px] max-w-[1400px] gap-8 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            <p className="eyebrow text-primary-fixed">Danh mục lưu trú</p>
            <h1 className="font-editorial mt-4 text-5xl font-semibold tracking-[-0.03em] sm:text-6xl">Tìm căn phòng của bạn</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72">
              So sánh sức chứa, tiện nghi, mức giá và lịch trống để chọn không gian phù hợp.
            </p>
          </div>
          <div className="rounded-[18px] border border-white/15 bg-secondary/72 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.20)] backdrop-blur-xl">
            <p className="font-display text-sm font-bold text-white">Lịch phòng hôm nay</p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <Metric
                value={isLoading ? '--' : String(rooms.filter((room) => room.availabilityStatus === 'AVAILABLE').length)}
                label="Còn trống"
              />
              <Metric
                value={isLoading ? '--' : String(rooms.filter((room) => room.availabilityStatus === 'ALMOST_FULL').length)}
                label="Sắp kín"
              />
              <Metric
                value={isLoading ? '--' : String(rooms.filter((room) => room.availabilityStatus === 'FULL_TODAY').length)}
                label="Kín lịch"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 sm:py-14">
        <div className="rounded-[22px] border border-[#ded5c9] bg-white p-3 shadow-[0_18px_50px_rgba(29,49,41,0.09)] sm:p-4">
          <div className="flex flex-col gap-3 border-b border-[#eee7de] px-2 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-base font-bold text-secondary">Tìm kỳ nghỉ phù hợp</p>
              <p className="mt-0.5 text-xs text-on-surface-variant">Chọn nhanh nhu cầu và ngân sách cho một đêm lưu trú.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#eef5f1] px-3 py-1.5 text-xs font-bold text-secondary">
                {filteredRooms.length} phòng
              </span>
              <button
                type="button"
                onClick={() => setFilters(defaultFilters)}
                disabled={!hasActiveFilters}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-[#9a6739] transition hover:bg-[#f8efe5] disabled:cursor-default disabled:opacity-35"
              >
                Đặt lại
              </button>
            </div>
          </div>

          <div className="grid gap-2 pt-3 md:grid-cols-2 xl:grid-cols-[1.55fr_repeat(4,minmax(0,1fr))]">
            <SearchField value={filters.search} onChange={(value) => updateFilter('search', value)} />

            <CompactFilterSelect
              label="Loại phòng"
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
            <CompactFilterSelect
              label="Sức chứa"
              value={filters.capacity}
              onChange={(value) => updateFilter('capacity', value as RoomCapacityFilter)}
              options={capacityOptions}
            />
            <CompactFilterSelect
              label="Trạng thái"
              value={filters.availability}
              onChange={(value) => updateFilter('availability', value as 'all' | RoomAvailabilityStatus)}
              options={availabilityOptions}
            />
            <NightlyPriceFilter
              min={filters.minNightlyPrice}
              max={filters.maxNightlyPrice}
              onMinChange={(value) => updateFilter('minNightlyPrice', value)}
              onMaxChange={(value) => updateFilter('maxNightlyPrice', value)}
              onReset={() => {
                updateFilter('minNightlyPrice', MIN_NIGHTLY_PRICE)
                updateFilter('maxNightlyPrice', MAX_NIGHTLY_PRICE)
              }}
            />
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-xl font-bold text-on-surface">
              {isLoading ? 'Đang tải phòng...' : `${filteredRooms.length} phòng phù hợp`}
            </p>
            <p className="mt-1 text-sm text-on-surface-variant">
              {isLoading
                ? 'Đang tải danh sách phòng...'
                : catalogSource === 'backend'
                  ? isRefreshing
                    ? 'Đang cập nhật dữ liệu mới nhất...'
                    : 'Danh sách phòng từ hệ thống The Serene Villa.'
                  : catalogError || 'Không thể tải dữ liệu phòng từ hệ thống.'}
            </p>
          </div>
          <p className="text-xs font-medium text-on-surface-variant">Giá đã bao gồm trọn một đêm lưu trú</p>
        </div>

        {isLoading ? (
          <RoomCatalogSkeleton />
        ) : filteredRooms.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                todaySlots={todaySlotsByRoomId[room.id]}
                onBook={(room) => setQuickBooking({ room })}
                onViewDetail={(room) => router.push(`/rooms/${room.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-[18px] border border-dashed border-outline-variant bg-white px-6 py-16 text-center shadow-[var(--shadow-card)]">
            <p className="font-display text-2xl font-bold text-on-surface">Không tìm thấy phòng</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">
              Thử đổi từ khóa tìm kiếm hoặc nới rộng bộ lọc loại phòng, sức chứa, trạng thái lịch.
            </p>
          </div>
        )}
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
          returnPath="/rooms"
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
  const bookingStatus = getRoomBookingStatus(room, now, todaySlots)
  const canBookNow = bookingStatus === 'AVAILABLE_NOW'
  const isUnavailable = bookingStatus === 'UNAVAILABLE'
  const nextAvailableSlotToday = getNextAvailableSlotToday(room, now, todaySlots)
  const bookingBadge = canBookNow ? 'Có thể đặt ngay' : isUnavailable ? 'Tạm ngưng' : 'Chọn ngày khác'
  const bookingHint = canBookNow
    ? `Hôm nay, ${nextAvailableSlotToday}`
    : isUnavailable
      ? 'Phòng đang tạm ngưng nhận lịch'
      : 'Không có khung giờ còn đặt được hôm nay'

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
        'group flex h-full w-full flex-col overflow-hidden rounded-[18px] border bg-white shadow-[var(--shadow-card)] transition-all duration-300 hover:border-brand-orange/45 hover:shadow-[var(--shadow-elevated)]',
        canBookNow
          ? 'border-brand-orange/30'
          : isUnavailable
            ? 'border-outline-variant bg-surface-container-low opacity-60'
            : 'border-outline-variant bg-surface-container-low opacity-80',
      ].join(' ')}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-container">
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
          unoptimized
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
          className={['object-cover transition duration-300 group-hover:scale-105', room.imageClassName].join(' ')}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(23,58,49,0.62),transparent_58%)]" />
        <span
          className={[
            'absolute left-4 top-4 rounded-full border px-3 py-1 font-display text-xs font-bold',
            getAvailabilityClassName(availabilityStatus, isUnavailable),
          ].join(' ')}
        >
          {isUnavailable ? 'Tạm ngưng' : getAvailabilityLabel(availabilityStatus)}
        </span>
        <span
          className={[
            'absolute bottom-4 left-4 rounded-full border px-3 py-1 font-display text-xs font-bold',
            canBookNow
              ? 'border-brand-orange/40 bg-primary-container text-on-primary-container'
              : 'border-white/20 bg-white/90 text-on-surface-variant',
          ].join(' ')}
        >
          {bookingBadge}
        </span>
        {typeof room.rating === 'number' && (
          <span className="absolute right-4 top-[4.25rem] rounded-full bg-white/95 px-3 py-1 font-display text-xs font-bold text-on-surface shadow-sm">
            ★ {room.rating.toFixed(1)}
          </span>
        )}
        <span className="absolute bottom-4 right-4 rounded-full border border-white/25 bg-secondary/85 px-3 py-1.5 font-display text-xs font-bold text-white opacity-0 shadow-lg backdrop-blur-sm transition group-hover:opacity-100 group-focus-within:opacity-100">
          Xem chi tiết
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

      <div className="flex flex-1 flex-col px-5 pb-4 pt-5 sm:px-6 sm:pb-4 sm:pt-6">
        <p className="font-display text-xs font-bold uppercase text-brand-orange">{room.categoryLabel}</p>
        <h2 className="font-editorial mt-2 text-2xl font-semibold text-secondary">{room.name}</h2>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-on-surface-variant">{room.description}</p>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <InfoPill label="Sức chứa" value={room.capacity} />
          <InfoPill label="Giá mỗi đêm" value={`${formatCurrency(getNightlyDisplayPrice(room.pricePerHour))} / đêm`} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2 pb-4">
          {room.equipments.slice(0, 3).map((equipment) => (
            <span
              key={equipment}
              className="rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-xs font-medium text-on-surface-variant"
            >
              {equipment}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-outline-variant pt-4">
          <p className="text-sm text-on-surface-variant">{bookingHint}</p>
          <div
            className="flex flex-wrap justify-end gap-2"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onBook(room)
              }}
              disabled={isUnavailable}
              className={canBookNow ? 'btn-warm' : 'btn-secondary'}
            >
              {canBookNow ? 'Đặt phòng' : isUnavailable ? 'Tạm ngưng' : 'Chọn ngày khác'}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

function SearchField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="group flex min-h-[62px] items-center gap-3 rounded-2xl bg-[#f8f4ee] px-4 transition-all duration-200 hover:bg-[#f5efe7] focus-within:bg-white focus-within:shadow-[0_0_0_2px_rgba(184,136,87,0.32),0_8px_24px_rgba(29,49,41,0.08)]">
      <SearchIcon />
      <div className="min-w-0 flex-1">
        <label htmlFor="room-catalog-search" className="block font-display text-[10px] font-bold uppercase tracking-[0.12em] text-[#817970]">
          Tìm phòng
        </label>
        <input
          id="room-catalog-search"
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="off"
          placeholder="Tên phòng hoặc tiện nghi"
          className="room-catalog-search-input mt-1 w-full bg-transparent text-sm font-medium text-on-surface placeholder:font-normal placeholder:text-[#aaa39a]"
        />
      </div>
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Xóa nội dung tìm kiếm"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#8d857c] transition hover:bg-[#eee7de] hover:text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b88857]"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  )
}

function CompactFilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
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
          'flex min-h-[62px] w-full items-center justify-between rounded-2xl border px-4 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b88857]',
          isOpen
            ? 'border-[#b88857] bg-white shadow-[0_0_0_3px_rgba(184,136,87,0.10)]'
            : 'border-[#e6ddd2] bg-[#fcfaf7] hover:border-[#d4c2ad] hover:bg-white',
        ].join(' ')}
      >
        <span className="min-w-0">
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
          'flex min-h-[62px] w-full items-center justify-between rounded-2xl border bg-[#fcfaf7] px-4 text-left transition',
          isOpen
            ? 'border-[#b88857] bg-white shadow-[0_0_0_3px_rgba(184,136,87,0.10)]'
            : 'border-[#e6ddd2] hover:border-[#cfb99f] hover:bg-white',
        ].join(' ')}
      >
        <span>
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

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 text-[#9a6739] transition-transform duration-200 group-focus-within:scale-110">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="m6 6 8 8m0-8-8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
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

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-white/12 bg-white/[0.07] px-3 py-4">
      <p className="font-display text-2xl font-bold text-primary-fixed">{value}</p>
      <p className="mt-1 text-xs text-white/58">{label}</p>
    </div>
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

function isSlotInFuture(slot: string | undefined, now: Date) {
  if (!slot) return false

  const [hourValue, minuteValue] = slot.split(':').map(Number)
  if (!Number.isFinite(hourValue) || !Number.isFinite(minuteValue)) return false

  const slotDate = new Date(now)
  slotDate.setHours(hourValue, minuteValue, 0, 0)

  if (slot === '24:00') {
    slotDate.setDate(slotDate.getDate() + 1)
    slotDate.setHours(0, 0, 0, 0)
  }

  return slotDate.getTime() > now.getTime()
}

function getAvailableFutureSlotsToday(room: Room, now: Date, todaySlots?: TimeSlot[]) {
  if (todaySlots) {
    return todaySlots.filter((slot) => isAvailableSlot(slot) && isSlotInFuture(slot.start, now))
  }

  if (!room.isAvailable || room.availabilityStatus === 'FULL_TODAY' || (room.remainingSlots ?? 0) <= 0) {
    return []
  }

  const nextSlot = getNextAvailableSlotToday(room, now)
  if (nextSlot) return [nextSlot]

  return BOOKING_SLOT_TIMES.filter((slot) => isSlotInFuture(slot, now)).slice(0, room.remainingSlots)
}

function getNextAvailableSlotToday(room: Room, now: Date, todaySlots?: TimeSlot[]) {
  const futureAvailableSlot = todaySlots?.find((slot) => isAvailableSlot(slot) && isSlotInFuture(slot.start, now))
  if (futureAvailableSlot) return futureAvailableSlot.start

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

function getRoomBookingStatus(room: Room, now: Date, todaySlots?: TimeSlot[]): RoomBookingStatus {
  if (isRoomTemporarilyUnavailable(room)) return 'UNAVAILABLE'

  return getAvailableFutureSlotsToday(room, now, todaySlots).length > 0 ? 'AVAILABLE_NOW' : 'AVAILABLE_OTHER_TIME'
}

function isRoomTemporarilyUnavailable(room: Room) {
  return ['MAINTENANCE', 'INACTIVE', 'UNAVAILABLE', 'DISABLED', 'CLOSED'].includes(room.operationalStatus ?? '')
}

function isAvailableSlot(slot: TimeSlot) {
  return slot.status === 'available' && (slot as TimeSlot & { canSelect?: boolean }).canSelect !== false
}

function getAvailabilityClassName(status: RoomAvailabilityStatus, isUnavailable = false) {
  if (isUnavailable) return 'border-white/20 bg-white/90 text-on-surface-variant'
  if (status === 'FULL_TODAY') return 'border-outline bg-white/95 text-on-surface'
  if (status === 'ALMOST_FULL') return 'border-brand-orange/35 bg-primary-container text-on-primary-container'
  return 'border-secondary-container/50 bg-[#E8F5EC] text-secondary'
}
