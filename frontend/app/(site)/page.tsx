'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import BookingQuickModal from '@/components/booking/BookingQuickModal'
import StaySearchBar from '@/components/public/StaySearchBar'
import NewCustomerOfferModal from '@/components/public/NewCustomerOfferModal'
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
    eyebrow: 'Kết nối liền mạch',
    title: 'Wi‑Fi tốc độ cao',
    description: 'Kết nối ổn định trong từng không gian, phù hợp cho một buổi làm việc yên tĩnh hoặc giờ phút thư giãn riêng.',
    items: ['Wi‑Fi riêng', 'Phủ sóng tốt', 'Làm việc thoải mái'],
    featured: true,
    layout: 'sm:col-span-2 lg:col-span-5',
  },
  {
    icon: 'air',
    eyebrow: 'Nghỉ ngơi dễ chịu',
    title: 'Điều hòa sạch, mát lành',
    description: 'Điều hòa inverter được vệ sinh và kiểm tra định kỳ trước mỗi lượt đón khách.',
    items: ['Làm lạnh nhanh', 'Điều khiển riêng', 'Tiết kiệm điện'],
    featured: false,
    layout: 'lg:col-span-4',
  },
  {
    icon: 'tv',
    eyebrow: 'Giải trí tại phòng',
    title: 'Smart TV',
    description: 'Màn hình lớn kết nối Internet cho những giờ nghỉ ngơi trọn vẹn hơn.',
    items: ['YouTube', 'Trình chiếu', 'Màn hình lớn'],
    featured: false,
    layout: 'lg:col-span-3',
  },
  {
    icon: 'sliders',
    eyebrow: 'Thư giãn riêng tư',
    title: 'Nước nóng ổn định',
    description: 'Hệ thống nước nóng riêng, vận hành an toàn và được kiểm tra thường xuyên.',
    items: ['Nhiệt độ ổn định', 'Chống giật', 'Phòng tắm riêng'],
    featured: false,
    layout: 'lg:col-span-4',
  },
  {
    icon: 'amenities',
    eyebrow: 'Những điều nhỏ bé',
    title: 'Tiện nghi sẵn sàng',
    description: 'Tủ lạnh mini, ấm đun nước và các vật dụng cơ bản được bố trí gọn gàng trong phòng.',
    items: ['Tủ lạnh mini', 'Ấm đun nước', 'Vật dụng cơ bản'],
    featured: false,
    layout: 'lg:col-span-3',
  },
  {
    icon: 'shield',
    eyebrow: 'Chỉn chu trước khi đến',
    title: 'Sẵn sàng cho check‑in',
    description: 'Phòng được kiểm tra vệ sinh, thiết bị và ghi chú yêu cầu trước giờ nhận phòng.',
    items: ['Kiểm tra phòng', 'Đối chiếu booking', 'Hỗ trợ tại chỗ'],
    featured: false,
    layout: 'sm:col-span-2 lg:col-span-5',
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
    'mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-left font-display text-sm font-semibold transition',
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

        <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-[#646b65]">
          <span className="inline-flex items-center gap-1.5">
            <BedroomIcon />
            {room.bedroomCount} phòng ngủ
          </span>
          <span className="h-1 w-1 rounded-full bg-[#c5b7a6]" />
          <span className="inline-flex items-center gap-1.5">
            <BedIcon />
            {room.bedCount} giường
          </span>
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

function BedroomIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V9.5A2.5 2.5 0 0 1 6.5 7H9a3 3 0 0 1 3 3v10" />
      <path d="M12 12h5.5A2.5 2.5 0 0 1 20 14.5V20M4 16h16M7 11h2" />
    </svg>
  )
}

function BedIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-7a2 2 0 0 1 2-2h3a3 3 0 0 1 3 3v1h8a2 2 0 0 1 2 2v3" />
      <path d="M3 16h18M5 18v2M19 18v2" />
    </svg>
  )
}

function TrustSpotlight() {
  const promises = [
    {
      icon: 'calendar' as IconName,
      title: 'Lịch trống được đối chiếu thực tế',
      description: 'Chỉ gợi ý những căn còn phù hợp với khoảng ngày bạn đã chọn.',
    },
    {
      icon: 'shield' as IconName,
      title: 'Chi phí rõ ràng trước khi xác nhận',
      description: 'Giá lưu trú, ưu đãi và khoản cần thanh toán luôn được hiển thị trước bước tiếp theo.',
    },
    {
      icon: 'amenities' as IconName,
      title: 'Đón tiếp chu đáo theo từng kỳ lưu trú',
      description: 'Đội ngũ chuẩn bị phòng, tiện nghi và hỗ trợ đúng vào thời điểm bạn cần.',
    },
  ]

  return (
    <section id="why-serene" className="scroll-mt-24 bg-[#EFEAE1] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="relative overflow-hidden rounded-[28px] border border-secondary/10 bg-secondary px-6 py-8 text-white shadow-[0_28px_70px_rgba(23,58,49,0.2)] sm:px-9 sm:py-11 lg:px-12 lg:py-14">
          <div aria-hidden className="pointer-events-none absolute -left-28 -top-36 h-[28rem] w-[28rem] rounded-full border border-white/10" />
          <div aria-hidden className="pointer-events-none absolute -bottom-44 right-10 h-[30rem] w-[30rem] rounded-full border border-brand-orange/20" />
          <div aria-hidden className="pointer-events-none absolute right-[30%] top-0 h-full w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
            <div className="flex flex-col justify-between">
              <div>
                <p className="eyebrow text-primary-fixed">Vì sao chọn The Serene Villa</p>
                <h2 className="font-editorial mt-4 max-w-xl text-4xl font-semibold leading-[1.06] text-white sm:text-5xl lg:text-[3.5rem]">
                  Một kỳ nghỉ an tâm bắt đầu từ những điều được chuẩn bị kỹ.
                </h2>
                <p className="mt-5 max-w-xl text-base leading-8 text-white/72 sm:text-[1.05rem]">
                  Chúng tôi biến những băn khoăn trước chuyến đi thành một hành trình rõ ràng: chọn đúng căn, biết chính xác chi phí và luôn có người đồng hành khi bạn cần.
                </p>
              </div>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/rooms"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 font-display text-sm font-semibold text-secondary transition-[background-color,color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-primary-fixed hover:shadow-[0_14px_28px_rgba(0,0,0,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transform-none"
                >
                  Khám phá không gian lưu trú
                </Link>
                <Link
                  href="/process"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/25 bg-white/[0.03] px-6 font-display text-sm font-semibold text-white transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-white/45 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transform-none"
                >
                  Xem quy trình lưu trú
                </Link>
              </div>
            </div>

            <div className="grid gap-3 self-center">
              {promises.map((promise, index) => (
                <article
                  key={promise.title}
                  className="group relative overflow-hidden rounded-2xl border border-white/12 bg-white/[0.055] p-5 transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-white/28 hover:bg-white/[0.09] motion-reduce:transform-none sm:p-6"
                >
                  <div aria-hidden className="absolute inset-y-0 left-0 w-1 origin-bottom scale-y-0 bg-primary-fixed transition-transform duration-200 group-hover:scale-y-100" />
                  <div className="relative flex gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-primary-fixed transition-transform duration-200 group-hover:scale-105 motion-reduce:transform-none">
                      <Icon name={promise.icon} className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-fixed">0{index + 1}</p>
                      <h3 className="mt-1 font-display text-base font-bold text-white sm:text-[1.05rem]">{promise.title}</h3>
                      <p className="mt-1.5 text-sm leading-6 text-white/64">{promise.description}</p>
                    </div>
                  </div>
                </article>
              ))}
              <p className="pt-2 text-xs leading-5 text-white/52">The Serene Villa ưu tiên thông tin rõ ràng và trải nghiệm vừa vặn hơn những lời hứa quá mức.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function SereneExperience() {
  const moments = [
    {
      icon: 'calendar' as IconName,
      title: 'Lịch lưu trú minh bạch',
      description: 'Khoảng ngày phù hợp được đối chiếu với lịch phòng thực tế trước khi bạn tiếp tục.',
    },
    {
      icon: 'shield' as IconName,
      title: 'Chi phí rõ ràng',
      description: 'Giá phòng, ưu đãi và khoản cần thanh toán được hiển thị trước khi xác nhận.',
    },
    {
      icon: 'amenities' as IconName,
      title: 'Chăm chút đúng lúc',
      description: 'Phòng và tiện nghi được chuẩn bị theo nhịp lưu trú của từng vị khách.',
    },
  ]

  return (
    <section id="why-serene" className="scroll-mt-24 bg-[#efeae1] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid items-stretch gap-7 lg:grid-cols-[minmax(0,.92fr)_minmax(0,1.08fr)] lg:gap-12">
          <div className="flex flex-col justify-center py-3 lg:py-10">
            <p className="eyebrow text-brand-orange">Vì sao chọn The Serene Villa</p>
            <h2 className="font-editorial mt-4 max-w-xl text-4xl font-semibold leading-[1.08] text-secondary sm:text-5xl">
              Một nơi chậm lại để mỗi kỳ nghỉ có nhiều ý nghĩa hơn.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-on-surface-variant sm:text-[1.05rem]">
              The Serene Villa không chỉ là nơi nghỉ. Chúng tôi dành sự kỹ lưỡng cho những điều thường bị bỏ quên, để hành trình của bạn luôn nhẹ nhàng từ lúc chọn phòng đến khi rời đi.
            </p>

            <div className="mt-8 divide-y divide-[#dfd5c6] border-y border-[#dfd5c6]">
              {moments.map((moment, index) => (
                <article key={moment.title} className="group flex gap-4 py-4 first:pt-5 last:pb-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#dfd5c6] bg-[#fbf8f2] text-brand-orange transition-[background-color,color,transform] duration-200 group-hover:scale-105 group-hover:bg-secondary group-hover:text-white motion-reduce:transform-none">
                    <Icon name={moment.icon} className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-orange">0{index + 1}</p>
                    <h3 className="mt-0.5 font-display text-base font-bold text-secondary">{moment.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-on-surface-variant">{moment.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="group relative min-h-[360px] overflow-hidden rounded-[26px] border border-[#dfd5c6] bg-[#d9d0c2] sm:min-h-[460px]">
            <Image
              src="/images/homestay-luxury-hero.webp"
              alt="Không gian nghỉ ngơi yên tĩnh tại The Serene Villa"
              fill
              sizes="(max-width: 1023px) 100vw, 55vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025] motion-reduce:transform-none"
              priority={false}
            />
            <div className="absolute inset-0 bg-[#143c32]/30" aria-hidden />
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/25 bg-[#153d32]/88 p-5 text-white backdrop-blur-sm sm:bottom-7 sm:left-7 sm:right-auto sm:max-w-sm sm:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f2d5a8]">The Serene way</p>
              <p className="mt-2 font-editorial text-2xl font-semibold leading-tight">Không gian đủ riêng tư, dịch vụ vừa đủ gần.</p>
              <p className="mt-3 text-sm leading-6 text-white/72">Một trải nghiệm lưu trú được vận hành bằng sự rõ ràng, tôn trọng nhịp riêng và những chi tiết tử tế.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function EquipmentShowcase() {
  return (
    <section id="equipment" className="scroll-mt-20 bg-[#EFEAE1] pb-20 pt-14 sm:pb-24 sm:pt-20">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid gap-8 border-b border-outline-variant pb-9 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-3xl">
            <p className="eyebrow text-brand-orange">Tiện nghi homestay</p>
            <h2 className="font-editorial mt-3 max-w-2xl text-4xl font-semibold leading-[1.08] text-secondary sm:text-5xl">
              Những điều nhỏ bé làm nên một kỳ nghỉ dễ chịu.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-on-surface-variant">
              Mỗi không gian được chuẩn bị cho nhịp nghỉ riêng của bạn — từ kết nối, thư giãn đến những chi tiết sẵn sàng trước giờ nhận phòng.
            </p>
          </div>

          <div className="flex items-center gap-4 lg:justify-end">
            <p className="hidden max-w-44 text-right text-xs leading-5 text-on-surface-variant sm:block">Các tiện nghi cụ thể luôn được cập nhật tại từng trang phòng.</p>
            <span className="flex h-12 min-w-12 items-center justify-center rounded-full border border-outline bg-[#F7F3EC] px-3 font-display text-sm font-bold text-secondary" aria-label="6 nhóm tiện nghi chính">
              06
            </span>
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <p className="max-w-xl text-sm leading-6 text-on-surface-variant">Khám phá các nhóm tiện nghi được đội ngũ The Serene Villa duy trì trong suốt quá trình vận hành.</p>
          <Link
            href="/amenities"
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-outline bg-transparent px-5 font-display text-sm font-semibold text-secondary transition-[background-color,border-color,color,transform] duration-200 hover:-translate-y-0.5 hover:border-secondary hover:bg-secondary hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-secondary motion-reduce:transform-none"
          >
            Xem toàn bộ tiện nghi
          </Link>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:gap-5">
          {equipmentCategories.map((category) => (
            <article
              key={category.title}
              className={[
                'group relative overflow-hidden rounded-[20px] border p-6 sm:p-7',
                'transition-[transform,border-color,background-color,box-shadow] duration-200 ease-out',
                'focus-within:ring-2 focus-within:ring-secondary/35',
                category.layout,
                category.featured
                  ? 'border-secondary bg-secondary text-white shadow-[0_22px_50px_rgba(20,57,47,0.18)] hover:-translate-y-0.5 hover:bg-[#123d31]'
                  : 'border-outline-variant bg-white/90 shadow-[0_12px_30px_rgba(63,51,35,0.06)] hover:-translate-y-0.5 hover:border-brand-orange/50 hover:bg-[#FFFEFB] hover:shadow-[0_18px_36px_rgba(63,51,35,0.09)]',
              ].join(' ')}
            >
              {category.featured && <div aria-hidden className="absolute -right-20 -top-20 h-56 w-56 rounded-full border border-white/10" />}
              <div
                className={[
                  'relative mb-6 flex h-11 w-11 items-center justify-center rounded-full',
                  'transition-[background-color,color,transform] duration-200 group-hover:scale-105 motion-reduce:transform-none',
                  category.featured ? 'bg-white/12 text-primary-fixed' : 'bg-primary-container text-brand-orange group-hover:bg-brand-orange group-hover:text-white',
                ].join(' ')}
              >
                <Icon name={category.icon} />
              </div>
              <p className={category.featured ? 'relative text-xs font-semibold uppercase tracking-[0.16em] text-primary-fixed' : 'text-xs font-semibold uppercase tracking-[0.16em] text-brand-orange'}>
                {category.eyebrow}
              </p>
              <h3 className={category.featured ? 'relative mt-3 font-editorial text-3xl font-semibold leading-tight text-white sm:text-[2rem]' : 'mt-3 font-editorial text-2xl font-semibold leading-tight text-secondary'}>
                {category.title}
              </h3>
              <p className={category.featured ? 'relative mt-3 max-w-lg text-sm leading-6 text-white/72' : 'mt-3 text-sm leading-6 text-on-surface-variant'}>{category.description}</p>
              <div className={category.featured ? 'relative mt-6 flex flex-wrap gap-2 border-t border-white/15 pt-4' : 'mt-6 flex flex-wrap gap-2 border-t border-outline-variant pt-4'}>
                {category.items.map((item) => (
                  <span key={item} className={category.featured ? 'rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/88' : 'rounded-full border border-outline-variant bg-surface-container-low px-3 py-1.5 text-xs font-medium text-on-surface-variant'}>
                    {item}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>

        <p className="mt-6 border-l-2 border-brand-orange/55 pl-4 text-xs leading-5 text-on-surface-variant sm:text-sm">
          Tiện nghi riêng có thể khác theo từng hạng phòng. Vui lòng xem trang chi tiết phòng để kiểm tra danh sách chính xác trước khi đặt.
        </p>
      </div>
    </section>
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
      <NewCustomerOfferModal />

      <section className="relative flex min-h-[540px] items-center overflow-hidden bg-secondary text-white sm:min-h-[570px] lg:min-h-[610px]">
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

        <div className="relative mx-auto grid w-full max-w-[1400px] items-center gap-8 px-5 pb-20 pt-12 sm:px-8 sm:pb-24 sm:pt-14 lg:grid-cols-[1fr_360px] lg:py-14">
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

            <p className="eyebrow mb-4 text-primary-fixed">Boutique nature stay</p>
            <h1 className="font-editorial text-5xl font-semibold leading-[0.98] tracking-[-0.035em] text-white sm:text-[3.65rem] lg:text-[4.45rem]">
              Một kỳ nghỉ
              <span className="mt-2 block text-primary-fixed">
                vừa vặn với bạn.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-white/74 sm:text-[17px]">
              Không gian riêng tư, tiện nghi được chuẩn bị kỹ và lịch trống minh bạch. Chọn căn phòng phù hợp,
              đặt theo khung giờ linh hoạt và nhận hỗ trợ ngay khi cần.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-4">
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

            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-4">
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

      <div className="relative z-20 mx-auto -mt-9 w-full max-w-[1400px] px-5 sm:px-8">
        <StaySearchBar />
      </div>

      <SereneExperience />

      <section id="equipment-legacy" className="hidden">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="grid gap-8 border-b border-outline-variant pb-9 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-3xl">
              <p className="eyebrow text-brand-orange">Tiện nghi homestay</p>
              <h2 className="font-editorial mt-3 max-w-2xl text-4xl font-semibold leading-[1.08] text-secondary sm:text-5xl">
                Những điều nhỏ bé làm nên một kỳ nghỉ dễ chịu.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-on-surface-variant">
                Mỗi không gian được chuẩn bị cho nhịp nghỉ riêng của bạn — từ kết nối, thư giãn đến những chi tiết sẵn sàng trước giờ nhận phòng.
              </p>
            </div>

            <div className="flex items-center gap-4 lg:justify-end">
              <p className="hidden max-w-44 text-right text-xs leading-5 text-on-surface-variant sm:block">
                Các tiện nghi cụ thể luôn được cập nhật tại từng trang phòng.
              </p>
              <span className="flex h-12 min-w-12 items-center justify-center rounded-full border border-outline bg-[#F7F3EC] px-3 font-display text-sm font-bold text-secondary" aria-label="6 nhóm tiện nghi chính">
                06
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <p className="max-w-xl text-sm leading-6 text-on-surface-variant">
              Khám phá các nhóm tiện nghi được đội ngũ The Serene Villa duy trì trong suốt quá trình vận hành.
            </p>
            <Link
              href="/amenities"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-outline bg-transparent px-5 font-display text-sm font-semibold text-secondary transition-[background-color,border-color,color,transform] duration-200 hover:-translate-y-0.5 hover:border-secondary hover:bg-secondary hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-secondary"
            >
              Xem toàn bộ tiện nghi
            </Link>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:gap-5">
            {equipmentCategories.map((category) => (
              <article
                key={category.title}
                className={[
                  'group relative overflow-hidden rounded-[20px] border p-6 sm:p-7',
                  'transition-[transform,border-color,background-color,box-shadow] duration-200 ease-out',
                  'focus-within:ring-2 focus-within:ring-secondary/35',
                  category.layout,
                  category.featured
                    ? 'border-secondary bg-secondary text-white shadow-[0_22px_50px_rgba(20,57,47,0.18)] hover:-translate-y-0.5 hover:bg-[#123d31]'
                    : 'border-outline-variant bg-white/90 shadow-[0_12px_30px_rgba(63,51,35,0.06)] hover:-translate-y-0.5 hover:border-brand-orange/50 hover:bg-[#FFFEFB] hover:shadow-[0_18px_36px_rgba(63,51,35,0.09)]',
                ].join(' ')}
              >
                {category.featured && (
                  <div aria-hidden className="absolute -right-20 -top-20 h-56 w-56 rounded-full border border-white/10" />
                )}
                <div
                  className={[
                    'relative mb-6 flex h-11 w-11 items-center justify-center rounded-full',
                    'transition-[background-color,color,transform] duration-200 group-hover:scale-105',
                    category.featured ? 'bg-white/12 text-primary-fixed' : 'bg-primary-container text-brand-orange group-hover:bg-brand-orange group-hover:text-white',
                  ].join(' ')}
                >
                  <Icon name={category.icon} />
                </div>
                <p className={category.featured ? 'relative text-xs font-semibold uppercase tracking-[0.16em] text-primary-fixed' : 'text-xs font-semibold uppercase tracking-[0.16em] text-brand-orange'}>
                  {category.eyebrow}
                </p>
                <h3 className={category.featured ? 'relative mt-3 font-editorial text-3xl font-semibold leading-tight text-white sm:text-[2rem]' : 'mt-3 font-editorial text-2xl font-semibold leading-tight text-secondary'}>
                  {category.title}
                </h3>
                <p className={category.featured ? 'relative mt-3 max-w-lg text-sm leading-6 text-white/72' : 'mt-3 text-sm leading-6 text-on-surface-variant'}>{category.description}</p>
                <div className={category.featured ? 'relative mt-6 flex flex-wrap gap-2 border-t border-white/15 pt-4' : 'mt-6 flex flex-wrap gap-2 border-t border-outline-variant pt-4'}>
                  {category.items.map((item) => (
                    <span
                      key={item}
                      className={category.featured ? 'rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/88' : 'rounded-full border border-outline-variant bg-surface-container-low px-3 py-1.5 text-xs font-medium text-on-surface-variant'}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <p className="mt-6 border-l-2 border-brand-orange/55 pl-4 text-xs leading-5 text-on-surface-variant sm:text-sm">
            Tiện nghi riêng có thể khác theo từng hạng phòng. Vui lòng xem trang chi tiết phòng để kiểm tra danh sách chính xác trước khi đặt.
          </p>
        </div>
      </section>

      <TopRatedRoomsSection
        rooms={topRatedRooms}
        isLoading={isRoomCatalogLoading || isTopRatedAvailabilityLoading}
        onOpenDetail={(room) => router.push(`/rooms/${room.id}`)}
        onBook={(room) => setQuickBooking({ room })}
      />

      <EquipmentShowcase />

      <section aria-hidden className="hidden">
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
