'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import BookingQuickModal from '@/components/booking/BookingQuickModal'
import RoomDetailModal from '@/components/booking/RoomDetailModal'
import { formatCurrency, type BookingRoom } from '@/components/booking/booking-data'
import {
  readQuickBookingDraft,
  shouldReopenQuickBooking,
} from '@/components/booking/quick-booking-draft'
import { useHomepageLiveData } from '@/hooks/useHomepageLiveData'
import { usePublicRoomCatalog } from '@/hooks/usePublicRoomCatalog'
import {
  formatRelativeTime,
  formatSlotDateLabel,
  getActivityActionLabel,
  maskCustomerName,
  type AvailabilityTone,
} from '@/lib/homepage-live-service'

const stats = [
  { value: '2.400+', label: 'Lượt đặt mỗi tháng' },
  { value: '48', label: 'Khung giờ mỗi ngày' },
  { value: '4.9/5', label: 'Điểm đánh giá' },
]

const equipmentCategories = [
  {
    icon: 'music',
    title: 'Wi-Fi tốc độ cao',
    description: 'Kết nối ổn định trong toàn bộ phòng, phù hợp làm việc và giải trí.',
    items: ['Wi-Fi riêng', 'Tốc độ cao', 'Phủ sóng tốt'],
  },
  {
    icon: 'amp',
    title: 'Điều hòa',
    description: 'Điều hòa inverter được vệ sinh và kiểm tra định kỳ.',
    items: ['Làm lạnh nhanh', 'Tiết kiệm điện', 'Điều khiển riêng'],
  },
  {
    icon: 'mic',
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
    icon: 'cable',
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

const steps = [
  {
    number: '01',
    title: 'Chọn phòng',
    description: 'Vào trang Phòng homestay, lọc theo số khách, tiện nghi và ngân sách.',
  },
  {
    number: '02',
    title: 'Chọn giờ nhận phòng',
    description: 'Xem khung giờ trống và giữ chỗ ngay trong lịch.',
  },
  {
    number: '03',
    title: 'Xác nhận',
    description: 'Hoàn tất đặt phòng và nhận thông tin check-in.',
  },
]

const homestayStandards = [
  {
    icon: 'music' as const,
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

const testimonials = [
  {
    name: 'Marcus Reeves',
    role: 'Khách lưu trú',
    quote:
      'Deluxe Balcony 201 có ban công thoáng, phòng sạch, tiện nghi đầy đủ và đặt lịch rất nhanh.',
  },
  {
    name: 'Gia đình Minh Anh',
    role: 'Khách gia đình',
    quote:
      'Gia đình mình rất thích phần lịch trống theo thời gian thực. Việc chọn phòng Family và giữ chỗ rất thuận tiện.',
  },
]

type IconName =
  | (typeof equipmentCategories)[number]['icon']
  | 'music'
  | 'users'
  | 'clock'
  | 'star'
  | 'check'
  | 'bolt'
  | 'calendar'
  | 'sliders'

function Icon({ name, className = 'h-5 w-5' }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    music: (
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
    mic: (
      <>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M6 11a6 6 0 0 0 12 0M12 17v4M8 21h8" />
      </>
    ),
    amp: (
      <>
        <rect x="4" y="7" width="16" height="12" rx="2" />
        <circle cx="9" cy="13" r="2" />
        <path d="M14 11v4M17 10v6" />
      </>
    ),
    cable: (
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
    warning: 'border-[#FF7518]/60 bg-[#FF7518]/15 text-[#FFD8B8] hover:bg-[#FF7518]/20',
    muted: 'border-white/20 bg-white/10 text-white/65 hover:bg-white/15',
  }

  return [
    'mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-left font-display text-sm font-semibold transition',
    toneClassName[tone],
  ].join(' ')
}

function getAvailabilityDotClassName(tone: AvailabilityTone) {
  const toneClassName = {
    success: 'bg-brand-orange shadow-[0_0_0_5px_rgba(255,117,24,0.16)]',
    warning: 'bg-[#FFB15F] shadow-[0_0_0_5px_rgba(255,177,95,0.16)]',
    muted: 'bg-white/45',
  }

  return ['h-2 w-2 rounded-full', toneClassName[tone]].join(' ')
}

function getTopRatedRooms(rooms: BookingRoom[]) {
  return rooms
    .filter((room) => typeof room.rating === 'number' && room.rating > 4 && !isRoomUnavailable(room))
    .sort((a, b) => {
      const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0)
      if (ratingDiff !== 0) return ratingDiff
      return (b.reviews ?? 0) - (a.reviews ?? 0)
    })
    .slice(0, 8)
}

function isRoomUnavailable(room: BookingRoom) {
  return ['MAINTENANCE', 'INACTIVE', 'UNAVAILABLE', 'DISABLED', 'CLOSED'].includes(room.operationalStatus ?? '')
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
    <section className="relative overflow-hidden bg-brand-bgGray py-20 sm:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-12 h-64 w-64 rounded-full bg-brand-orange/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-brand-orange">
              Gợi ý từ khách hàng
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-on-surface sm:text-4xl">
              Phòng được đánh giá cao
            </h2>
            <p className="mt-4 text-base leading-7 text-on-surface-variant">
              Những phòng homestay được khách hàng yêu thích và đánh giá tốt nhất.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/rooms?sort=rating"
              className="inline-flex h-11 items-center rounded-xl bg-brand-orange px-5 font-display text-sm font-semibold text-white shadow-[0_12px_28px_rgba(255,117,24,0.28)] transition-all hover:bg-brand-orangeHover active:scale-[0.98]"
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
                className="group absolute left-1 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-[linear-gradient(135deg,#FF8A33_0%,#FF7518_52%,#E6640F_100%)] text-white shadow-[0_18px_44px_rgba(230,100,15,0.28),0_4px_12px_rgba(26,28,30,0.12),inset_0_1px_0_rgba(255,255,255,0.36)] outline-none transition-all duration-300 ease-out before:pointer-events-none before:absolute before:inset-[1px] before:rounded-full before:border before:border-white/20 hover:scale-[1.05] hover:bg-[linear-gradient(135deg,#FF9B4A_0%,#FF8126_52%,#F06D15_100%)] hover:shadow-[0_24px_54px_rgba(230,100,15,0.36),0_8px_18px_rgba(26,28,30,0.14),inset_0_1px_0_rgba(255,255,255,0.46)] focus-visible:ring-4 focus-visible:ring-brand-orange/25 active:scale-[0.96] active:shadow-[0_12px_30px_rgba(230,100,15,0.22),0_3px_8px_rgba(26,28,30,0.1)] sm:left-2"
                aria-label="Xem nhóm phòng trước"
              >
                <ChevronIcon className="h-5 w-5 rotate-180 stroke-[2.4] transition-transform duration-300 ease-out group-hover:-translate-x-0.5" />
              </button>
            )}

            {canScrollNext && (
              <button
                type="button"
                onClick={() => scrollCards('next')}
                className="group absolute right-1 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-[linear-gradient(135deg,#FF8A33_0%,#FF7518_52%,#E6640F_100%)] text-white shadow-[0_18px_44px_rgba(230,100,15,0.28),0_4px_12px_rgba(26,28,30,0.12),inset_0_1px_0_rgba(255,255,255,0.36)] outline-none transition-all duration-300 ease-out before:pointer-events-none before:absolute before:inset-[1px] before:rounded-full before:border before:border-white/20 hover:scale-[1.05] hover:bg-[linear-gradient(135deg,#FF9B4A_0%,#FF8126_52%,#F06D15_100%)] hover:shadow-[0_24px_54px_rgba(230,100,15,0.36),0_8px_18px_rgba(26,28,30,0.14),inset_0_1px_0_rgba(255,255,255,0.46)] focus-visible:ring-4 focus-visible:ring-brand-orange/25 active:scale-[0.96] active:shadow-[0_12px_30px_rgba(230,100,15,0.22),0_3px_8px_rgba(26,28,30,0.1)] sm:right-2"
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
  const imageSrc = room.image ?? '/images/homestay-room-hero.png'

  return (
    <article className="group flex w-[82vw] shrink-0 snap-start flex-col overflow-hidden rounded-[28px] border border-[#E8E4DC] bg-white shadow-[0_16px_42px_rgba(26,28,30,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-brand-orange/30 hover:shadow-[0_22px_56px_rgba(26,28,30,0.12)] sm:w-[calc((100vw-5rem-1.25rem)/2)] xl:w-[calc((100vw-12rem-3.75rem)/4)] xl:max-w-[292px]">
      <button type="button" onClick={() => onOpenDetail(room)} className="block text-left">
        <div className="relative aspect-[16/11] overflow-hidden bg-surface-container">
          <Image
            src={imageSrc}
            alt={room.name}
            fill
            sizes="(min-width: 1280px) 292px, (min-width: 768px) 46vw, 82vw"
            className={['object-cover transition duration-300 group-hover:scale-105', room.imageClassName].join(' ')}
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(4,42,22,0.54),transparent_58%)]" />
          <span className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-1 font-display text-xs font-bold text-[#1A1C1E] shadow-sm">
            ★ {(room.rating ?? 0).toFixed(1)}
          </span>
          <span className="absolute bottom-4 left-4 rounded-full border border-white/20 bg-white/92 px-3 py-1 font-display text-xs font-bold text-[#5C5348]">
            {room.availabilityStatus === 'FULL_TODAY' ? 'Chọn ngày khác' : 'Có thể đặt lịch'}
          </span>
        </div>
      </button>

      <div className="flex flex-1 flex-col p-5">
        <p className="font-display text-xs font-bold uppercase tracking-wide text-brand-orange">{room.categoryLabel}</p>
        <h3 className="mt-2 font-display text-xl font-bold leading-tight text-on-surface">{room.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-on-surface-variant">{room.description}</p>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] px-3 py-3">
            <p className="font-display text-[10px] font-bold uppercase text-[#5C5348]">Sức chứa</p>
            <p className="mt-1 font-semibold text-[#1A1C1E]">{room.capacity}</p>
          </div>
          <div className="rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] px-3 py-3">
            <p className="font-display text-[10px] font-bold uppercase text-[#5C5348]">Giá/giờ</p>
            <p className="mt-1 font-semibold text-[#FF7518]">{formatCurrency(room.pricePerHour)}</p>
          </div>
        </div>

        <p className="mt-4 text-sm font-medium text-on-surface-variant">
          {room.reviews ? `${room.reviews} đánh giá` : 'Chưa có lượt đánh giá'}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {room.equipments.slice(0, 3).map((item) => (
            <span
              key={item}
              className="rounded-full border border-[#E8E4DC] bg-[#F5F2EC] px-3 py-1 text-xs font-medium text-[#5C5348]"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 border-t border-[#E8E4DC] pt-4">
          <button
            type="button"
            onClick={() => onOpenDetail(room)}
            className="rounded-xl border border-[#E8E4DC] bg-white px-4 py-2.5 font-display text-sm font-semibold text-[#5C5348] transition-colors hover:border-brand-orange/40 hover:text-brand-orange"
          >
            Chi tiết
          </button>
          <button
            type="button"
            onClick={() => onBook(room)}
            className="rounded-xl bg-brand-orange px-4 py-2.5 font-display text-sm font-semibold text-white shadow-[0_10px_24px_rgba(255,117,24,0.24)] transition-colors hover:bg-brand-orangeHover"
          >
            Đặt phòng
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
  initialStartTime?: string
  initialDuration?: number
  initialNote?: string
}

export default function HomePage() {
  const router = useRouter()
  const {
    availabilityStatus,
    recentActivities,
    nextAvailableSlot,
    isLoading: isLiveDataLoading,
    error: liveDataError,
  } = useHomepageLiveData()
  const { rooms, isLoading: isRoomCatalogLoading } = usePublicRoomCatalog()
  const [availabilityHintVisible, setAvailabilityHintVisible] = useState(false)
  const [detailRoom, setDetailRoom] = useState<BookingRoom | null>(null)
  const [quickBooking, setQuickBooking] = useState<QuickBookingState | null>(null)
  const topRatedRooms = useMemo(() => getTopRatedRooms(rooms), [rooms])

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

  const handleNextSlotBooking = () => {
    if (!nextAvailableSlot) {
      goToRooms()
      return
    }

    const params = new URLSearchParams({
      roomId: nextAvailableSlot.roomId,
      date: nextAvailableSlot.date,
      startTime: nextAvailableSlot.startTime,
      duration: String(nextAvailableSlot.duration),
    })
    router.push(`/rooms?${params.toString()}`)
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-brand-bgGray text-on-surface">

      <section className="relative flex min-h-[720px] items-center overflow-hidden bg-secondary pt-6 text-white md:min-h-screen md:pt-8">
        <Image
          src="/images/homestay-room-hero.png"
          alt="Phòng homestay band chuyên nghiệp với trống, ampli guitar và micro"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-[linear-gradient(108deg,rgba(4,42,22,0.98)_0%,rgba(4,42,22,0.88)_42%,rgba(4,42,22,0.36)_72%,rgba(4,42,22,0.64)_100%)]" />
        <div aria-hidden className="pointer-events-none absolute -left-20 top-24 h-72 w-72 rounded-full bg-brand-orange/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-16 bottom-32 h-80 w-80 rounded-full bg-brand-greenLight/15 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(to_bottom,transparent,var(--color-brand-bgGray))]" />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-5 pb-20 sm:px-8 lg:grid-cols-[1fr_380px]">
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

            <h1 className="font-display text-5xl font-bold leading-none text-white sm:text-6xl lg:text-7xl">
              Không gian của bạn.
              <span className="mt-2 block bg-[linear-gradient(90deg,var(--color-brand-orange),#FFB07A)] bg-clip-text text-transparent">
                Âm nhạc của bạn.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/70">
              Phòng homestay chuyên nghiệp dành cho nhạc sĩ, khách lưu trú và người sáng tạo. Đặt chỗ nhanh,
              tiện nghi sẵn sàng, lịch đặt phòng rõ ràng trên trang Phòng homestay riêng.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/rooms"
                className="rounded-xl bg-brand-orange px-6 py-3.5 font-display text-sm font-semibold text-white shadow-[0_14px_36px_rgba(255,117,24,0.4)] transition-all hover:bg-brand-orangeHover hover:shadow-[0_18px_40px_rgba(255,117,24,0.48)] active:scale-[0.98]"
              >
                Khám phá phòng
              </Link>
              <a
                href="#process"
                className="rounded-xl border border-white/25 bg-white/5 px-6 py-3.5 font-display text-sm font-semibold text-white/90 backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/10"
              >
                Xem quy trình
              </a>
            </div>

            <div className="mt-14 grid max-w-2xl grid-cols-3 gap-4">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-md transition-colors hover:border-brand-orange/30 hover:bg-white/10"
                >
                  <p className="font-display text-2xl font-bold text-primary-fixed sm:text-3xl">{item.value}</p>
                  <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-white/50">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="hidden space-y-4 lg:block">
            <div className="rounded-2xl border border-brand-orange/35 bg-secondary/60 p-5 shadow-[0_18px_48px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-display text-xs font-semibold uppercase text-brand-orange">Hoạt động trực tiếp</p>
                <span className="h-2 w-2 rounded-full bg-brand-orange" />
              </div>
              <div className="space-y-3">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between gap-3 text-sm">
                      <p>
                        <span className="font-semibold text-white">{maskCustomerName(activity.customerName)}</span>
                        <span className="text-white/45"> {getActivityActionLabel(activity.action)} </span>
                        <span className="font-semibold text-primary-fixed">{activity.roomName}</span>
                      </p>
                      <span className="shrink-0 text-xs text-white/35">{formatRelativeTime(activity.createdAt)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-white/45">Chưa có hoạt động mới</p>
                )}
              </div>
              {liveDataError && <p className="mt-4 text-xs text-white/40">{liveDataError}</p>}
            </div>

            <div className="rounded-2xl border border-white/15 bg-secondary/60 p-5 shadow-[0_18px_48px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <p className="font-display text-xs font-semibold uppercase text-on-secondary-container">Khung giờ tiếp theo</p>
              {nextAvailableSlot ? (
                <div className="mt-3 flex items-end justify-between gap-4">
                  <div>
                    <p className="font-display text-lg font-bold text-white">{nextAvailableSlot.roomName}</p>
                    <p className="mt-1 text-sm text-white/45">
                      {formatSlotDateLabel(nextAvailableSlot.date)} · {nextAvailableSlot.startTime} đến{' '}
                      {nextAvailableSlot.endTime}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleNextSlotBooking}
                    className="rounded-lg bg-brand-orange px-4 py-2 font-display text-xs font-semibold text-white hover:bg-brand-orangeHover"
                  >
                    Đặt
                  </button>
                </div>
              ) : (
                <div className="mt-3">
                  <p className="font-display text-lg font-bold text-white">Hôm nay đã kín lịch</p>
                  <p className="mt-1 text-sm text-white/45">Vui lòng chọn ngày khác để đặt phòng.</p>
                  <button
                    type="button"
                    onClick={handleNextSlotBooking}
                    className="mt-4 rounded-lg border border-white/20 px-4 py-2 font-display text-xs font-semibold text-white/80 hover:bg-white/10"
                  >
                    Chọn ngày khác
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>

      <section id="equipment" className="scroll-mt-20 bg-surface-container py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-brand-orange">
                Tiện nghi homestay
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-on-surface sm:text-4xl">
                Tiện nghi &amp; tiện nghi có sẵn trong phòng
              </h2>
              <p className="mt-4 text-base leading-7 text-on-surface-variant">
                Tiện nghi đi kèm khi đặt phòng — không cần mang cả dàn nhạc. Ghi chú nhu cầu khi đặt để homestay chuẩn bị
                trước giờ nhận phòng.
              </p>
            </div>
            <Link
              href="/rooms"
              className="inline-flex h-12 shrink-0 items-center rounded-xl border border-outline-variant bg-white px-6 font-display text-sm font-semibold text-on-surface transition-colors hover:border-brand-orange/40 hover:text-brand-orange"
            >
              Chọn phòng có tiện nghi phù hợp
            </Link>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {equipmentCategories.map((category) => (
              <article
                key={category.title}
                className="group rounded-2xl border border-outline-variant bg-white p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-brand-orange/25 hover:shadow-[var(--shadow-elevated)]"
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
        isLoading={isRoomCatalogLoading}
        onOpenDetail={setDetailRoom}
        onBook={(room) => setQuickBooking({ room })}
      />

      <section className="relative scroll-mt-24 overflow-hidden bg-brand-bgGray py-20 sm:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(26,28,30,0.05) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 top-10 h-64 w-64 rounded-full bg-brand-orange/10 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-2xl">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-brand-orange">Đặt phòng</p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-on-surface sm:text-4xl">
              Trang Phòng homestay riêng — lọc, so sánh và đặt lịch
            </h2>
            <p className="mt-4 text-base leading-7 text-on-surface-variant">
              Danh sách phòng, bộ lọc theo loại phòng, sức chứa, giá và lịch trống được tách sang trang riêng để bạn
              tập trung đặt chỗ mà không bị phân tán trên trang chủ.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/rooms"
                className="inline-flex h-12 items-center rounded-xl bg-brand-orange px-6 font-display text-sm font-semibold text-white shadow-[0_14px_32px_rgba(255,117,24,0.35)] transition-all hover:bg-brand-orangeHover active:scale-[0.98]"
              >
                Vào trang Phòng homestay
              </Link>
              <Link
                href="/customer/support"
                className="inline-flex h-12 items-center rounded-xl border border-outline-variant bg-white px-6 font-display text-sm font-semibold text-on-surface transition-colors hover:border-brand-orange/40 hover:text-brand-orange"
              >
                Cần tư vấn chọn phòng
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-outline-variant bg-white p-6 shadow-[var(--shadow-elevated)]">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-orange/10 blur-2xl"
            />
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

      <section id="process" className="scroll-mt-20 bg-surface-container py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-brand-orange">Cách thức hoạt động</p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-on-surface sm:text-4xl">
              Đặt phòng chỉ trong 3 bước.
            </h2>
          </div>

          <div className="relative mt-14 grid gap-6 md:grid-cols-3">
            <div className="absolute left-[16%] right-[16%] top-12 hidden h-px bg-gradient-to-r from-transparent via-outline-variant to-transparent md:block" />
            {steps.map((step) => (
              <article
                key={step.number}
                className="group relative rounded-2xl border border-outline-variant bg-white p-6 text-center shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-brand-orange/25 hover:shadow-[var(--shadow-elevated)]"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-outline-variant bg-primary-container font-display text-lg font-bold text-brand-orange transition-all duration-300 group-hover:border-brand-orange group-hover:bg-brand-orange group-hover:text-white group-hover:shadow-[0_12px_28px_rgba(255,117,24,0.35)]">
                  {step.number}
                </div>
                <h3 className="mt-5 font-display text-xl font-bold text-on-surface transition-colors group-hover:text-brand-orange">
                  {step.title}
                </h3>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-on-surface-variant">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="relative scroll-mt-24 overflow-hidden bg-gradient-to-br from-secondary via-[#06361c] to-brand-greenLight py-20 text-white sm:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,117,24,0.14),transparent_55%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(10,77,39,0.55),transparent_50%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.35) 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-brand-orange/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 bottom-10 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-3xl">
            <p className="font-display text-sm font-semibold uppercase text-brand-orange">Về chúng tôi</p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">
              Homestay được xây cho những kỳ lưu trú thật — không chỉ để chụp ảnh.
            </h2>
            <p className="mt-5 text-base leading-7 text-white/70">
              Homestay Booking ra đời từ nhu cầu của các khách lưu trú độc lập: cần không gian ổn định, tiện nghi tin cậy và lịch
              đặt minh bạch. Chúng tôi kết hợp đặt phòng online với đội ngũ homestay tại chỗ để bạn tập trung vào âm nhạc.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {homestayStandards.map((item) => (
              <article
                key={item.title}
                className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:border-brand-orange/35 hover:bg-white/10"
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
            <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-white/12 to-white/5 p-6 backdrop-blur-md sm:p-8">
              <p className="font-display text-xs font-semibold uppercase tracking-wider text-brand-orange">
                Cộng đồng nhạc sĩ
              </p>
              <h3 className="mt-3 font-display text-2xl font-bold">Được tin dùng bởi nghệ sĩ và khách lưu trú độc lập</h3>
              <ul className="mt-6 space-y-4 text-sm leading-6 text-white/70">
                <li className="flex gap-3">
                  <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" />
                  Hơn 2.400 lượt đặt mỗi tháng từ lưu trú đến thu demo
                </li>
                <li className="flex gap-3">
                  <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" />
                  Lịch trống cập nhật theo thời gian thực, giảm trùng lượt lưu trú
                </li>
                <li className="flex gap-3">
                  <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" />
                  Hỗ trợ setup tiện nghi và check-in ngay tại homestay
                </li>
              </ul>
              <Link
                href="/customer/support"
                className="mt-8 inline-flex rounded-lg border border-white/20 px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors hover:border-brand-orange hover:text-brand-orange"
              >
                Liên hệ tham quan homestay
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {testimonials.map((item) => (
                <article
                  key={item.name}
                  className="rounded-xl border border-white/10 bg-white p-6 text-on-surface shadow-[var(--shadow-card)]"
                >
                  <div className="mb-4 flex gap-1 text-tertiary">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Icon key={index} name="star" className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm leading-6 text-on-surface-variant">&ldquo;{item.quote}&rdquo;</p>
                  <div className="mt-5 border-t border-outline-variant pt-4">
                    <p className="font-display text-sm font-bold text-on-surface">{item.name}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{item.role}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-brand-bgGray"
        />
      </section>

      <section className="relative overflow-hidden border-y border-outline-variant/60 bg-gradient-to-r from-brand-bgGray via-white to-primary-container/40 py-14 sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-brand-orange/10 blur-3xl"
        />
        <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 sm:px-8 lg:flex-row lg:items-center">
          <div className="max-w-xl">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-brand-orange">Bắt đầu ngay</p>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
              Sẵn sàng cho kỳ lưu trú tiếp theo?
            </h2>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant sm:text-base">
              Chọn phòng, giữ khung giờ và bắt đầu lưu trú — tất cả trong vài phút.
            </p>
          </div>
          <div className="flex w-full flex-wrap gap-3 sm:w-auto">
            <Link
              href="/rooms"
              className="inline-flex h-12 flex-1 items-center justify-center rounded-xl bg-brand-orange px-6 font-display text-sm font-semibold text-white shadow-[0_14px_32px_rgba(255,117,24,0.35)] transition-all hover:bg-brand-orangeHover hover:shadow-[0_18px_36px_rgba(255,117,24,0.42)] active:scale-[0.98] sm:flex-none"
            >
              Khám phá phòng
            </Link>
            <Link
              href="/customer/support"
              className="inline-flex h-12 flex-1 items-center justify-center rounded-xl border border-outline-variant bg-white px-6 font-display text-sm font-semibold text-on-surface transition-colors hover:border-brand-orange/40 hover:text-brand-orange sm:flex-none"
            >
              Nhận tư vấn
            </Link>
          </div>
        </div>
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
          sourceRoute="/"
          returnPath="/"
          onClose={() => setQuickBooking(null)}
        />
      )}
    </main>
  )
}
