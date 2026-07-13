'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import BookingQuickModal from '@/components/booking/BookingQuickModal'
import RoomDetailModal from '@/components/booking/RoomDetailModal'
import { formatCurrency } from '@/components/booking/booking-data'
import { BOOKING_SLOT_TIMES, getTodayKey } from '@/components/booking/booking-time-utils'
import RoomCatalogSkeleton from '@/components/public/RoomCatalogSkeleton'
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
  filterRooms,
  getAvailabilityLabel,
  type Room,
  type RoomAvailabilityStatus,
  type RoomCapacityFilter,
  type RoomFilters,
  type RoomPriceFilter,
} from '@/lib/public/mock-data'

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

const priceOptions: Array<{ value: RoomPriceFilter; label: string }> = [
  { value: 'all', label: 'Mọi mức giá' },
  { value: 'budget', label: 'Dưới 250k/giờ' },
  { value: 'standard', label: '250k-500k/giờ' },
  { value: 'premium', label: 'Trên 500k/giờ' },
]

const defaultFilters: RoomFilters = {
  search: '',
  roomTierId: 'all',
  capacity: 'all',
  availability: 'all',
  price: 'all',
}

type RoomBookingStatus = 'AVAILABLE_NOW' | 'AVAILABLE_OTHER_TIME' | 'UNAVAILABLE'

type RoomSlotsById = Record<string, TimeSlot[] | undefined>

type QuickBookingState = {
  room: Room
  initialDate?: string
  initialStartTime?: string
  initialDuration?: number
  initialNote?: string
}

export default function RoomsPublicPage() {
  const [filters, setFilters] = useState<RoomFilters>(defaultFilters)
  const { rooms, source: catalogSource, isLoading, isRefreshing } = usePublicRoomCatalog()
  const [roomTiers, setRoomTiers] = useState<BackendRoomType[]>([])
  const [detailRoom, setDetailRoom] = useState<Room | null>(null)
  const [quickBooking, setQuickBooking] = useState<QuickBookingState | null>(null)
  const [todaySlotsByRoomId, setTodaySlotsByRoomId] = useState<RoomSlotsById>({})
  const filteredRooms = useMemo(() => filterRooms(rooms, filters), [rooms, filters])

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
      initialStartTime: params.get('startTime') ?? undefined,
      initialDuration: durationParam ? Number(durationParam) : undefined,
    })
    window.history.replaceState(window.history.state, '', '/rooms')
  }, [isLoading, rooms])

  const updateFilter = <Key extends keyof RoomFilters>(key: Key, value: RoomFilters[Key]) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  return (
    <main className="min-h-screen bg-brand-bgGray text-on-surface">

      <section className="relative overflow-hidden border-b border-outline-variant bg-secondary text-white">
        <Image
          src="/images/homestay-room-hero.png"
          alt="Phòng homestay band với trống, ampli và micro"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-62"
        />
        <div className="absolute inset-0 bg-[linear-gradient(108deg,rgba(4,42,22,0.96)_0%,rgba(4,42,22,0.82)_48%,rgba(4,42,22,0.42)_100%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            <p className="font-display text-sm font-semibold uppercase text-primary-fixed">Room Catalog</p>
            <h1 className="mt-3 font-display text-5xl font-bold tracking-tight sm:text-6xl">Phòng homestay</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/68">
              Chọn không gian tập phù hợp với khách lưu trú của bạn.
            </p>
          </div>
          <div className="rounded-2xl border border-white/12 bg-white/8 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
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

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="rounded-3xl border border-outline-variant bg-white p-5 shadow-[var(--shadow-card)]">
          <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
            <label className="block">
              <span className="mb-2 block font-display text-xs font-bold uppercase text-on-surface-variant">
                Tìm phòng
              </span>
              <input
                value={filters.search}
                onChange={(event) => updateFilter('search', event.target.value)}
                placeholder="Tên phòng, tiện nghi, loại phòng..."
                className="input-field"
              />
            </label>

            <FilterSelect
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
            <FilterSelect
              label="Sức chứa"
              value={filters.capacity}
              onChange={(value) => updateFilter('capacity', value as RoomCapacityFilter)}
              options={capacityOptions}
            />
            <FilterSelect
              label="Trạng thái"
              value={filters.availability}
              onChange={(value) => updateFilter('availability', value as 'all' | RoomAvailabilityStatus)}
              options={availabilityOptions}
            />
            <FilterSelect
              label="Khoảng giá"
              value={filters.price}
              onChange={(value) => updateFilter('price', value as RoomPriceFilter)}
              options={priceOptions}
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
                    : 'Danh sách phòng từ hệ thống Homestay Booking.'
                  : 'Không kết nối được backend, đang hiển thị dữ liệu dự phòng.'}
            </p>
          </div>
          <button type="button" onClick={() => setFilters(defaultFilters)} className="btn-secondary">
            Xóa bộ lọc
          </button>
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
                onViewDetail={setDetailRoom}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed border-outline-variant bg-white px-6 py-16 text-center shadow-[var(--shadow-card)]">
            <p className="font-display text-2xl font-bold text-on-surface">Không tìm thấy phòng</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">
              Thử đổi từ khóa tìm kiếm hoặc nới rộng bộ lọc loại phòng, sức chứa, trạng thái lịch.
            </p>
          </div>
        )}
      </section>

      {detailRoom && (
        <RoomDetailModal
          room={detailRoom}
          open
          onClose={() => setDetailRoom(null)}
          onBook={(room) => {
            setDetailRoom(null)
            setQuickBooking({ room })
          }}
        />
      )}
      {quickBooking && (
        <BookingQuickModal
          room={quickBooking.room}
          open
          initialDate={quickBooking.initialDate}
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
  const availabilityStatus = room.availabilityStatus ?? 'AVAILABLE'
  const imageSrc = room.image ?? '/images/homestay-room-hero.png'
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

  return (
    <article
      onClick={() => onViewDetail(room)}
      className={[
        'group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-3xl border bg-white shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_48px_rgba(26,28,30,0.12)]',
        canBookNow
          ? 'border-[#FF7518]/25'
          : isUnavailable
            ? 'border-outline-variant bg-surface-container-low opacity-60'
            : 'border-outline-variant bg-surface-container-low opacity-80',
      ].join(' ')}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-container">
        <Image
          src={imageSrc}
          alt={room.name}
          fill
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
          className={['object-cover transition duration-300 group-hover:scale-105', room.imageClassName].join(' ')}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(4,42,22,0.58),transparent_58%)]" />
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
              ? 'border-[#FF7518]/40 bg-[#FFE8D6] text-[#6B3200]'
              : 'border-white/20 bg-white/90 text-on-surface-variant',
          ].join(' ')}
        >
          {bookingBadge}
        </span>
        {typeof room.rating === 'number' && (
          <span className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-1 font-display text-xs font-bold text-on-surface">
            ★ {room.rating.toFixed(1)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-5 pb-4 pt-5 sm:px-6 sm:pb-4 sm:pt-6">
        <p className="font-display text-xs font-bold uppercase text-brand-orange">{room.categoryLabel}</p>
        <h2 className="mt-2 font-display text-2xl font-bold text-on-surface">{room.name}</h2>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-on-surface-variant">{room.description}</p>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <InfoPill label="Sức chứa" value={room.capacity} />
          <InfoPill label="Giá" value={`${formatCurrency(room.pricePerHour)} / giờ`} />
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
                onViewDetail(room)
              }}
              className="btn-secondary"
            >
              Chi tiết
            </button>
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

function FilterSelect({
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
  return (
    <label className="block">
      <span className="mb-2 block font-display text-xs font-bold uppercase text-on-surface-variant">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="input-field">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/8 px-3 py-4">
      <p className="font-display text-2xl font-bold text-primary-fixed">{value}</p>
      <p className="mt-1 text-xs text-white/58">{label}</p>
    </div>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-3 py-3">
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
  if (status === 'ALMOST_FULL') return 'border-[#FF7518]/35 bg-[#FFF2E8] text-[#9A4A08]'
  return 'border-secondary-container/50 bg-[#E8F5EC] text-secondary'
}
