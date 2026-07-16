'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import BookingQuickModal from '@/components/booking/BookingQuickModal'
import StaySearchBar from '@/components/public/StaySearchBar'
import { formatCurrency, getNightlyDisplayPrice, type BookingRoom } from '@/components/booking/booking-data'
import {
  readQuickBookingDraft,
  shouldReopenQuickBooking,
} from '@/components/booking/quick-booking-draft'
import { useHomepageLiveData } from '@/hooks/useHomepageLiveData'
import { usePublicRoomCatalog } from '@/hooks/usePublicRoomCatalog'
import { useTodayRoomAvailability } from '@/hooks/useTodayRoomAvailability'
import {
  formatRelativeTime,
  getActivityActionLabel,
  maskCustomerName,
  type AvailabilityTone,
} from '@/lib/homepage-live-service'
import { getAvailabilityLabel } from '@/lib/public/room-filters'
import { shouldBypassImageOptimization } from '@/lib/image-optimization'
import {
  getRoomCardAvailabilityState,
  isRoomTemporarilyUnavailable,
} from '@/lib/public/today-room-availability'

const stats = [
  { value: 'Rõ ràng', label: 'Lịch trống & giá' },
  { value: 'Linh hoạt', label: 'Khung giờ lưu trú' },
  { value: 'Chu đáo', label: 'Hỗ trợ tại chỗ' },
]

const equipmentCategories = [
  {
    icon: 'wifi',
    title: 'Wi-Fi tốc độ cao',
    description: 'Kết nối ổn định trong toàn bộ phòng, phù hợp làm việc và giải trí.',
    items: ['Wi-Fi riêng', 'Tốc độ cao', 'Phủ sóng tốt'],
  },
  {
    icon: 'air',
    title: 'Điều hòa',
    description: 'Điều hòa inverter được vệ sinh và kiểm tra định kỳ.',
    items: ['Làm lạnh nhanh', 'Tiết kiệm điện', 'Điều khiển riêng'],
  },
  {
    icon: 'tv',
    title: 'Smart TV',
    description: 'TV kết nối Internet với các ứng dụng giải trí phổ biến.',
    items: ['YouTube', 'Trình chiếu', 'Màn hình lớn'],
  },
  {
    icon: 'sliders',
    title: 'Máy nước nóng',
    description: 'Tiện nghi nước nóng riêng, có chế độ an toàn và được kiểm tra thường xuyên.',
    items: ['Nước nóng ổn định', 'Chống giật', 'Phòng tắm riêng'],
  },
  {
    icon: 'amenities',
    title: 'Tiện nghi bổ sung',
    description: 'Tủ lạnh mini, ấm đun nước và vật dụng cá nhân cơ bản có sẵn trong phòng.',
    items: ['Tủ lạnh mini', 'Ấm đun nước', 'Đồ dùng cá nhân'],
  },
  {
    icon: 'shield',
    title: 'Chuẩn bị trước check-in',
    description: 'Nhân viên kiểm tra vệ sinh và tiện nghi trước khi khách nhận phòng.',
    items: ['Check-in', 'Kiểm tra phòng', 'Hỗ trợ tại chỗ'],
  },
] as const

const homestayStandards = [
  {
    icon: 'bed' as const,
    title: 'Không gian nghỉ dưỡng',
    description: 'Phòng sạch sẽ, yên tĩnh và được chuẩn bị kỹ trước mỗi lượt khách.',
  },
  {
    icon: 'sliders' as const,
    title: 'Tiện nghi bảo trì định kỳ',
    description: 'Wi-Fi, điều hòa, TV và máy nước nóng được kiểm tra trước mỗi lượt nhận phòng.',
  },
  {
    icon: 'users' as const,
    title: 'Đội ngũ hỗ trợ tại chỗ',
    description: 'Nhân viên homestay hỗ trợ check-in và xử lý thay đổi lịch trong giờ vận hành.',
  },
] as const

const experienceCommitments = [
  {
    name: 'Trước khi nhận phòng',
    role: 'Chuẩn bị chỉn chu',
    quote: 'Thông tin phòng, tiện nghi và mức giá được trình bày rõ trước khi bạn xác nhận.',
  },
  {
    name: 'Trong kỳ lưu trú',
    role: 'Hỗ trợ đúng lúc',
    quote: 'Đội ngũ vận hành theo dõi lịch nhận phòng và tiếp nhận sự cố ngay trên hệ thống.',
  },
]

type IconName =
  | (typeof equipmentCategories)[number]['icon']
  | 'bed'
  | 'users'
  | 'clock'
  | 'star'
  | 'check'
  | 'bolt'
  | 'calendar'
  | 'sliders'

function Icon({ name, className = 'h-5 w-5' }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    bed: (
      <>
        <path d="M3 18v-7M21 18v-5a3 3 0 0 0-3-3H9v8M3 14h18M6 10V7h5a3 3 0 0 1 3 3" />
      </>
    ),
    wifi: (
      <>
        <path d="M9 18V5l10-2v13" />
        <path d="M9 9l10-2" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="16" cy="16" r="3" />
      </>
    ),
    bolt: <path d="M13 2 4 14h7l-1 8 10-13h-7l1-7z" />,
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18" />
      </>
    ),
    sliders: (
      <>
        <path d="M4 6h16M4 12h16M4 18h16" />
        <circle cx="9" cy="6" r="2" />
        <circle cx="15" cy="12" r="2" />
        <circle cx="7" cy="18" r="2" />
      </>
    ),
    shield: <path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-5" />,
    tv: (
      <>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M6 11a6 6 0 0 0 12 0M12 17v4M8 21h8" />
      </>
    ),
    air: (
      <>
        <rect x="4" y="7" width="16" height="12" rx="2" />
        <circle cx="9" cy="13" r="2" />
        <path d="M14 11v4M17 10v6" />
      </>
    ),
    amenities: (
      <>
        <path d="M7 7a5 5 0 0 1 10 0v4a3 3 0 0 1-3 3h-1" />
        <path d="M10 14v3M14 14v3M8 20h8" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    star: (
      <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3z" />
    ),
    check: <path d="M20 6 9 17l-5-5" />,
  }

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      {paths[name]}
    </svg>
  )
}

function getAvailabilityBadgeClassName(tone: AvailabilityTone) {
  const toneClassName = {
    success: 'border-brand-orange/40 bg-white/10 text-primary-fixed hover:bg-white/15',
    warning: 'border-brand-orange/60 bg-brand-orange/15 text-primary-fixed hover:bg-brand-orange/20',
    muted: 'border-white/20 bg-white/10 text-white/65 hover:bg-white/15',
  }

  return [
    'mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-left font-display text-sm font-semibold transition',
    toneClassName[tone],
  ].join(' ')
}

function getAvailabilityDotClassName(tone: AvailabilityTone) {
  const toneClassName = {
    success: 'bg-brand-orange shadow-[0_0_0_5px_rgba(178,132,85,0.16)]',
    warning: 'bg-primary-fixed shadow-[0_0_0_5px_rgba(178,132,85,0.16)]',
    muted: 'bg-white/45',
  }

  return ['h-2 w-2 rounded-full', toneClassName[tone]].join(' ')
}

function getTopRatedRooms(rooms: BookingRoom[]) {
  return rooms
    .filter((room) => typeof room.rating === 'number' && room.rating > 4 && !isRoomTemporarilyUnavailable(room))
    .sort((a, b) => {
      const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0)
      if (ratingDiff !== 0) return ratingDiff
      return (b.reviews ?? 0) - (a.reviews ?? 0)
    })
    .slice(0, 8)
}

function TopRatedRoomsSection({
  rooms,
  isLoading,
  onOpenDetail,
  onBook,
}: {
  rooms: BookingRoom[]
  isLoading: boolean
  onOpenDetail: (room: BookingRoom) => void
  onBook: (room: BookingRoom) => void
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const [canScrollPrevious, setCanScrollPrevious] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return

    const updateScrollState = () => {
      const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth
      setCanScrollPrevious(scroller.scrollLeft > 8)
      setCanScrollNext(scroller.scrollLeft < maxScrollLeft - 8)
    }

    updateScrollState()
    scroller.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)

    return () => {
      scroller.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [rooms.length, isLoading])

  const scrollCards = (direction: 'previous' | 'next') => {
    const scroller = scrollerRef.current
    if (!scroller) return

    scroller.scrollBy({
      left: direction === 'next' ? scroller.clientWidth : -scroller.clientWidth,
      behavior: 'smooth',
    })
  }

  return (
    <section className="relative overflow-hidden border-y border-outline-variant bg-brand-bgGray py-20 sm:py-24">
      <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow text-brand-orange">
              Gợi ý từ khách hàng
            </p>
            <h2 className="font-editorial mt-3 text-4xl font-semibold leading-tight text-secondary sm:text-5xl">
              Phòng được đánh giá cao
            </h2>
            <p className="mt-4 text-base leading-7 text-on-surface-variant">
              Những phòng homestay được khách hàng yêu thích và đánh giá tốt nhất.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/rooms?sort=rating"
              className="inline-flex h-11 items-center rounded-full bg-secondary px-5 font-display text-sm font-semibold text-white shadow-[0_12px_28px_rgba(23,58,49,0.16)] transition-all hover:-translate-y-0.5 hover:bg-secondary-container"
            >
              Xem tất cả
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-[420px] animate-pulse rounded-[28px] border border-outline-variant bg-white" />
            ))}
          </div>
        ) : rooms.length > 0 ? (
          <div className="relative mt-10">
            {canScrollPrevious && (
              <button
                type="button"
                onClick={() => scrollCards('previous')}
                className="group absolute left-1 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-outline-variant bg-white text-secondary shadow-[var(--shadow-card)] transition hover:-translate-y-[54%] hover:bg-secondary hover:text-white sm:left-2"
                aria-label="Xem nhóm phòng trước"
              >
                <ChevronIcon className="h-5 w-5 rotate-180 stroke-[2.4] transition-transform duration-300 ease-out group-hover:-translate-x-0.5" />
              </button>
            )}

            {canScrollNext && (
              <button
                type="button"
                onClick={() => scrollCards('next')}
                className="group absolute right-1 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-outline-variant bg-white text-secondary shadow-[var(--shadow-card)] transition hover:-translate-y-[54%] hover:bg-secondary hover:text-white sm:right-2"
                aria-label="Xem nhóm phòng tiếp theo"
              >
                <ChevronIcon className="h-5 w-5 stroke-[2.4] transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
              </button>
            )}

            <div
              ref={scrollerRef}
              className="-mx-5 flex snap-x gap-5 overflow-x-auto scroll-smooth px-5 pb-4 sm:-mx-8 sm:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {rooms.map((room) => (
                <TopRatedRoomCard key={room.id} room={room} onOpenDetail={onOpenDetail} onBook={onBook} />
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-10 rounded-[28px] border border-dashed border-outline-variant bg-white px-6 py-12 text-center shadow-[var(--shadow-card)]">
            <p className="font-display text-lg font-bold text-on-surface">Chưa có dữ liệu đánh giá phòng.</p>
          </div>
        )}
      </div>
    </section>
  )
}

function TopRatedRoomCard({
  room,
  onOpenDetail,
  onBook,
}: {
  room: BookingRoom
  onOpenDetail: (room: BookingRoom) => void
  onBook: (room: BookingRoom) => void
}) {
  const imageSrc = room.image ?? '/images/homestay-luxury-hero.webp'
  const availabilityState = getRoomCardAvailabilityState(room)
  const availabilityStatus = room.availabilityStatus ?? 'AVAILABLE'
  const availabilityLabel = availabilityState.isUnavailable
    ? 'Tạm ngưng'
    : availabilityState.isChecking
      ? 'Đang cập nhật lịch'
      : getAvailabilityLabel(availabilityStatus, room)
  const bookingLabel = availabilityState.isChecking
    ? 'Kiểm tra lịch'
    : availabilityState.isUnavailable
      ? 'Tạm ngưng'
      : availabilityState.isPaymentHeld
        ? 'Chọn ngày khác'
        : availabilityState.canStartBooking
        ? 'Đặt phòng'
        : 'Chọn ngày khác'

  return (
    <article className="group flex w-[82vw] shrink-0 snap-start flex-col overflow-hidden rounded-[18px] border border-outline-variant bg-white shadow-[var(--shadow-card)] transition-all duration-300 hover:border-brand-orange/45 hover:shadow-[var(--shadow-elevated)] sm:w-[calc((100vw-5rem-1.25rem)/2)] xl:w-[calc((100vw-12rem-3.75rem)/4)] xl:max-w-[310px]">
      <button type="button" onClick={() => onOpenDetail(room)} className="block text-left">
        <div className="relative aspect-[16/11] overflow-hidden bg-surface-container">
          <Image
            src={imageSrc}
            alt={room.name}
            fill
            quality={90}
            unoptimized={shouldBypassImageOptimization(imageSrc)}
            sizes="(min-width: 1280px) 292px, (min-width: 768px) 46vw, 82vw"
            className={['object-cover transition duration-300 group-hover:scale-105', room.imageClassName].join(' ')}
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(23,58,49,0.58),transparent_58%)]" />
          <span className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-1 font-display text-xs font-bold text-[#242A27] shadow-sm">
            ★ {(room.rating ?? 0).toFixed(1)}
          </span>
          <span className="absolute bottom-4 left-4 rounded-full border border-white/20 bg-white/92 px-3 py-1 font-display text-xs font-bold text-[#6A6C66]">
            {availabilityLabel}
          </span>
        </div>
      </button>

      <div className="flex flex-1 flex-col p-5">
        <p className="font-display text-xs font-bold uppercase tracking-wide text-brand-orange">{room.categoryLabel}</p>
        <h3 className="mt-2 font-display text-xl font-bold leading-tight text-on-surface">{room.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-on-surface-variant">{room.description}</p>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-[#E4DED3] bg-[#FBF9F5] px-3 py-3">
            <p className="font-display text-[10px] font-bold uppercase text-[#6A6C66]">Sức chứa</p>
            <p className="mt-1 font-semibold text-[#242A27]">{room.capacity}</p>
          </div>
          <div className="rounded-2xl border border-[#E4DED3] bg-[#FBF9F5] px-3 py-3">
            <p className="font-display text-[10px] font-bold uppercase text-[#6A6C66]">Giá/đêm</p>
            <p className="mt-1 font-semibold text-brand-orange">{formatCurrency(getNightlyDisplayPrice(room.pricePerHour))}</p>
          </div>
        </div>

        <p className="mt-4 text-sm font-medium text-on-surface-variant">
          {room.reviews ? `${room.reviews} đánh giá` : 'Chưa có lượt đánh giá'}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {room.equipments.slice(0, 3).map((item) => (
            <span
              key={item}
              className="rounded-full border border-[#E4DED3] bg-[#F6F3ED] px-3 py-1 text-xs font-medium text-[#6A6C66]"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 border-t border-[#E4DED3] pt-4">
          <button
            type="button"
            onClick={() => onOpenDetail(room)}
            className="rounded-xl border border-[#E4DED3] bg-white px-4 py-2.5 font-display text-sm font-semibold text-[#6A6C66] transition-colors hover:border-brand-orange/40 hover:text-brand-orange"
          >
            Chi tiết
          </button>
          <button
            type="button"
            onClick={() => onBook(room)}
            disabled={availabilityState.isUnavailable || availabilityState.isChecking}
            className="rounded-xl bg-secondary px-4 py-2.5 font-display text-sm font-semibold text-white shadow-[0_10px_24px_rgba(23,58,49,0.16)] transition-colors hover:bg-secondary-container"
          >
            {bookingLabel}
          </button>
        </div>
      </div>
    </article>
  )
}

function ChevronIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

type QuickBookingState = {
  room: BookingRoom
  initialDate?: string
  initialEndDate?: string
  initialStartTime?: string
  initialDuration?: number
  initialNote?: string
}

export default function HomePage() {
  const router = useRouter()
  const {
    availabilityStatus,
    recentActivities,
    isLoading: isLiveDataLoading,
    error: liveDataError,
  } = useHomepageLiveData()
  const { rooms, isLoading: isRoomCatalogLoading } = usePublicRoomCatalog()
  const [availabilityHintVisible, setAvailabilityHintVisible] = useState(false)
  const [quickBooking, setQuickBooking] = useState<QuickBookingState | null>(null)
  const topRatedCandidates = useMemo(() => getTopRatedRooms(rooms), [rooms])
  const {
    rooms: topRatedRooms,
    isLoading: isTopRatedAvailabilityLoading,
  } = useTodayRoomAvailability(topRatedCandidates)

  useEffect(() => {
    if (!shouldReopenQuickBooking(window.location.search)) return

    const draft = readQuickBookingDraft()
    if (!draft) {
      window.history.replaceState(window.history.state, '', '/')
      return
    }

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

    window.history.replaceState(window.history.state, '', '/')
  }, [rooms])

  const goToRooms = () => {
    router.push('/rooms')
  }

  const handleAvailabilityBadgeClick = () => {
    if (availabilityStatus.status === 'CLOSED') {
      setAvailabilityHintVisible(true)
      return
    }

    goToRooms()
  }

  return (
    <main id="main-content" className="min-h-screen overflow-x-hidden bg-brand-bgGray text-on-surface">

      <section className="relative flex min-h-[700px] items-center overflow-hidden bg-secondary text-white lg:min-h-[calc(100svh-5rem)]">
        <Image
          src="/images/homestay-luxury-hero.webp"
          alt="Phòng ngủ homestay cao cấp với nội thất gỗ, chăn ga linen và cửa nhìn ra khu vườn"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,42,35,0.96)_0%,rgba(17,42,35,0.82)_38%,rgba(17,42,35,0.18)_72%,rgba(17,42,35,0.18)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-black/18" />

        <div className="relative mx-auto grid w-full max-w-[1400px] items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_390px] lg:py-24">
          <div className="max-w-3xl">
            <button
              type="button"
              onClick={handleAvailabilityBadgeClick}
              className={getAvailabilityBadgeClassName(availabilityStatus.tone)}
              aria-live="polite"
            >
              <span className={getAvailabilityDotClassName(availabilityStatus.tone)} />
              <span>{isLiveDataLoading ? 'Đang cập nhật lịch phòng...' : availabilityStatus.label}</span>
            </button>

            {availabilityHintVisible && availabilityStatus.status === 'CLOSED' && (
              <p className="-mt-5 mb-8 max-w-md text-sm text-white/55">
                Bạn vẫn có thể đặt lịch cho ngày tiếp theo.
              </p>
            )}

            <p className="eyebrow mb-6 text-primary-fixed">Boutique nature stay</p>
            <h1 className="font-editorial text-5xl font-semibold leading-[0.98] tracking-[-0.035em] text-white sm:text-6xl lg:text-[5.4rem]">
              Một kỳ nghỉ
              <span className="mt-2 block text-primary-fixed">
                vừa vặn với bạn.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-white/74 sm:text-lg">
              Không gian riêng tư, tiện nghi được chuẩn bị kỹ và lịch trống minh bạch. Chọn căn phòng phù hợp,
              đặt theo khung giờ linh hoạt và nhận hỗ trợ ngay khi cần.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/rooms"
                className="rounded-full bg-white px-6 py-3.5 font-display text-sm font-semibold text-secondary shadow-[0_16px_38px_rgba(0,0,0,0.18)] transition-all hover:-translate-y-0.5"
              >
                Kiểm tra phòng trống
              </Link>
              <Link
                href="/process"
                className="rounded-full border border-white/25 bg-black/10 px-6 py-3.5 font-display text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10"
              >
                Xem quy trình lưu trú
              </Link>
            </div>

            <div className="mt-14 grid max-w-2xl grid-cols-3 gap-4">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="border-l border-white/18 px-4 py-2 first:border-l-0 first:pl-0"
                >
                  <p className="font-editorial text-xl font-semibold text-primary-fixed sm:text-2xl">{item.value}</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/58">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="overflow-hidden rounded-[20px] border border-white/16 bg-[#173A31]/82 p-4 shadow-[0_20px_54px_rgba(0,0,0,0.22)] backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8dd7b4] opacity-40" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#8dd7b4]" />
                    </span>
                    <p className="font-display text-sm font-bold text-white">Đặt phòng gần đây</p>
                  </div>
                  <p className="mt-1 text-[11px] text-white/45">Cập nhật trực tiếp từ hệ thống</p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold text-white/55">
                  {recentActivities.length} hoạt động
                </span>
              </div>

              <div className="mt-3 divide-y divide-white/[0.08] overflow-hidden rounded-[14px] border border-white/10 bg-black/10">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="grid grid-cols-[10px_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5">
                      <span
                        className={[
                          'h-2 w-2 rounded-full',
                          activity.action === 'CHECKED_IN'
                            ? 'bg-[#8dd7b4]'
                            : activity.action === 'PAID'
                              ? 'bg-[#e0ad76]'
                              : 'bg-white/45',
                        ].join(' ')}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs text-white/58">
                          <span className="font-semibold text-white">{maskCustomerName(activity.customerName)}</span>{' '}
                          {getActivityActionLabel(activity.action)}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] font-semibold text-primary-fixed">{activity.roomName}</p>
                      </div>
                      <span className="shrink-0 text-[10px] text-white/32">{formatRelativeTime(activity.createdAt)}</span>
                    </div>
                  ))
                ) : (
                  <p className="px-3 py-4 text-xs text-white/45">
                    {isLiveDataLoading ? 'Đang cập nhật hoạt động...' : 'Chưa có lượt đặt phòng mới.'}
                  </p>
                )}
              </div>

              {liveDataError && <p className="mt-2 text-[10px] text-[#f1d2a9]/70">Đang hiển thị dữ liệu gần nhất.</p>}
            </div>
          </aside>
        </div>
      </section>

      <div className="relative z-20 mx-auto -mt-10 w-full max-w-[1400px] px-5 sm:px-8">
        <div className="mb-4 flex items-end justify-between gap-4 px-1 text-secondary">
          <div>
            <p className="eyebrow text-brand-orange">Tìm kỳ lưu trú</p>
            <p className="mt-1 hidden text-sm text-on-surface-variant sm:block">Chọn ngày và số khách, hệ thống sẽ đối chiếu lịch phòng thật.</p>
          </div>
          <span className="hidden text-xs font-semibold text-on-surface-variant lg:block">Nhận phòng 14:00 · Trả phòng 12:00</span>
        </div>
        <StaySearchBar />
      </div>

      <section id="equipment" className="scroll-mt-20 bg-[#EFEAE1] pb-20 pt-16 sm:pb-24 sm:pt-20">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className="eyebrow text-brand-orange">
                Tiện nghi homestay
              </p>
              <h2 className="font-editorial mt-3 text-4xl font-semibold leading-tight text-secondary sm:text-5xl">
                Những tiện nghi làm nên một kỳ nghỉ dễ chịu.
              </h2>
              <p className="mt-4 text-base leading-7 text-on-surface-variant">
                Tiện nghi thiết yếu đi kèm khi đặt phòng. Ghi chú nhu cầu khi đặt để homestay chuẩn bị
                trước giờ nhận phòng.
              </p>
            </div>
            <Link
              href="/amenities"
              className="inline-flex h-12 shrink-0 items-center rounded-full border border-outline bg-transparent px-6 font-display text-sm font-semibold text-secondary transition-colors hover:border-secondary hover:bg-secondary hover:text-white"
            >
              Khám phá toàn bộ tiện nghi
            </Link>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {equipmentCategories.map((category) => (
              <article
                key={category.title}
                className="group rounded-[18px] border border-outline-variant bg-white/88 p-6 shadow-[var(--shadow-card)] transition-colors duration-300 hover:border-brand-orange/45"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container text-brand-orange transition-colors group-hover:bg-brand-orange group-hover:text-white">
                  <Icon name={category.icon} />
                </div>
                <h3 className="font-display text-lg font-bold text-on-surface">{category.title}</h3>
                <p className="mt-3 text-sm leading-6 text-on-surface-variant">{category.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {category.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-xs font-medium text-on-surface-variant"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <TopRatedRoomsSection
        rooms={topRatedRooms}
        isLoading={isRoomCatalogLoading || isTopRatedAvailabilityLoading}
        onOpenDetail={(room) => router.push(`/rooms/${room.id}`)}
        onBook={(room) => setQuickBooking({ room })}
      />

      <section className="relative scroll-mt-24 overflow-hidden bg-white py-20 sm:py-24">
        <div className="relative mx-auto grid max-w-[1400px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-2xl">
            <p className="eyebrow text-brand-orange">Đặt phòng chủ động</p>
            <h2 className="font-editorial mt-3 text-4xl font-semibold leading-tight text-secondary sm:text-5xl">
              Chọn đúng phòng, đúng thời gian, đúng nhu cầu.
            </h2>
            <p className="mt-4 text-base leading-7 text-on-surface-variant">
              So sánh loại phòng, sức chứa, mức giá và tình trạng lịch trong một giao diện rõ ràng trước khi xác nhận.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/rooms"
                className="inline-flex h-12 items-center rounded-full bg-secondary px-6 font-display text-sm font-semibold text-white shadow-[0_14px_32px_rgba(23,58,49,0.16)] transition-all hover:-translate-y-0.5 hover:bg-secondary-container"
              >
                Vào trang Phòng homestay
              </Link>
              <Link
                href="/support"
                className="inline-flex h-12 items-center rounded-full border border-outline bg-white px-6 font-display text-sm font-semibold text-secondary transition-colors hover:border-brand-orange hover:text-brand-orange"
              >
                Cần tư vấn chọn phòng
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[18px] border border-outline-variant bg-[#F6F3ED] p-7 shadow-[var(--shadow-card)]">
            <p className="relative font-display text-sm font-bold text-on-surface">Bạn sẽ tìm thấy trên /rooms</p>
            <ul className="relative mt-5 space-y-4 text-sm leading-6 text-on-surface-variant">
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-container text-brand-orange">
                  <Icon name="calendar" className="h-4 w-4" />
                </span>
                Lịch trống theo ngày và khung giờ
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-container text-brand-orange">
                  <Icon name="sliders" className="h-4 w-4" />
                </span>
                Bộ lọc loại phòng, sức chứa, giá
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-container text-brand-orange">
                  <Icon name="bolt" className="h-4 w-4" />
                </span>
                Đặt nhanh ngay trên thẻ phòng
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section id="about" className="relative scroll-mt-24 overflow-hidden bg-secondary py-20 text-white sm:py-24">
        <div className="absolute -right-36 top-12 h-80 w-80 rounded-full border border-white/[0.05]" aria-hidden />
        <div className="absolute -right-20 top-28 h-52 w-52 rounded-full border border-brand-orange/10" aria-hidden />

        <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="max-w-3xl">
            <p className="eyebrow text-primary-fixed">Triết lý vận hành</p>
            <h2 className="font-editorial mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
              Đẹp trong hình ảnh. Chỉn chu trong từng lần đón khách.
            </h2>
            <p className="mt-5 text-base leading-8 text-white/72">
              The Serene Villa giúp khách chủ động xem lịch, chọn phòng và theo dõi đặt chỗ; đồng thời giúp đội ngũ vận hành
              chuẩn bị phòng, tiện nghi và hỗ trợ đúng thời điểm.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {homestayStandards.map((item) => (
              <article
                key={item.title}
                className="group rounded-[18px] border border-white/12 bg-white/[0.045] p-6 transition-colors duration-300 hover:border-brand-orange/40 hover:bg-white/[0.07]"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-orange/20 text-brand-orange transition-colors group-hover:bg-brand-orange group-hover:text-white">
                  <Icon name={item.icon} />
                </div>
                <h3 className="font-display text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/65">{item.description}</p>
              </article>
            ))}
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
            <div className="rounded-[18px] border border-white/15 bg-white/[0.055] p-6 sm:p-8">
              <p className="eyebrow text-primary-fixed">Cam kết dịch vụ</p>
              <h3 className="font-editorial mt-4 text-3xl font-semibold">Minh bạch trước khi đặt, đồng hành trong khi ở.</h3>
              <ul className="mt-6 space-y-4 text-sm leading-7 text-white/72">
                <li className="flex gap-3">
                  <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" />
                  Giá, sức chứa và tiện nghi được hiển thị rõ theo từng phòng
                </li>
                <li className="flex gap-3">
                  <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" />
                  Lịch trống được cập nhật để giảm trùng và nhầm thời gian lưu trú
                </li>
                <li className="flex gap-3">
                  <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" />
                  Yêu cầu hỗ trợ gắn trực tiếp với tài khoản và đơn đặt phòng
                </li>
              </ul>
              <Link
                href="/support"
                className="mt-8 inline-flex rounded-full border border-white/22 px-5 py-3 font-display text-sm font-semibold text-white transition-colors hover:border-primary-fixed hover:text-primary-fixed"
              >
                Tìm hiểu trung tâm hỗ trợ
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {experienceCommitments.map((item, index) => (
                <article
                  key={item.name}
                  className="rounded-[18px] border border-white/10 bg-white p-6 text-on-surface shadow-[var(--shadow-card)]"
                >
                  <div className="flex items-start gap-5">
                    <span className="font-editorial text-3xl text-brand-orange">0{index + 1}</span>
                    <div>
                      <p className="font-display text-base font-bold text-on-surface">{item.name}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-orange">{item.role}</p>
                      <p className="mt-4 text-sm leading-7 text-on-surface-variant">{item.quote}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

      </section>

      <section className="relative overflow-hidden border-y border-outline-variant bg-[#EFEAE1] py-16 sm:py-20">
        <div className="relative mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-8 px-5 sm:px-8 lg:flex-row lg:items-center">
          <div className="max-w-xl">
            <p className="eyebrow text-brand-orange">Bắt đầu ngay</p>
            <h2 className="font-editorial mt-3 text-4xl font-semibold tracking-tight text-secondary sm:text-5xl">
              Sẵn sàng cho kỳ lưu trú tiếp theo?
            </h2>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant sm:text-base">
              Chọn phòng, giữ khung giờ và bắt đầu lưu trú — tất cả trong vài phút.
            </p>
          </div>
          <div className="flex w-full flex-wrap gap-3 sm:w-auto">
            <Link
              href="/rooms"
              className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-secondary px-6 font-display text-sm font-semibold text-white shadow-[0_14px_32px_rgba(23,58,49,0.16)] transition-all hover:-translate-y-0.5 hover:bg-secondary-container sm:flex-none"
            >
              Khám phá phòng
            </Link>
            <Link
              href="/support"
              className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-outline bg-transparent px-6 font-display text-sm font-semibold text-secondary transition-colors hover:border-brand-orange hover:text-brand-orange sm:flex-none"
            >
              Nhận tư vấn
            </Link>
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
          sourceRoute="/"
          returnPath="/"
          onClose={() => setQuickBooking(null)}
        />
      )}
    </main>
  )
}
