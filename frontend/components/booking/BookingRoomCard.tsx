'use client'

import Image from 'next/image'
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react'
import { formatCurrency, type BookingRoom } from '@/components/booking/booking-data'

type BookingRoomCardProps = {
  room: BookingRoom
  renderIcon: (name: 'star' | 'users' | 'clock', className?: string) => ReactNode
  onOpenDetail?: (room: BookingRoom) => void
  onBook?: (room: BookingRoom) => void
}

type AvailabilityCardMeta = {
  badgeLabel: string
  subStatus: string
  ctaLabel: string
  badgeClassName: string
  subStatusClassName: string
  ctaClassName: string
  cardClassName: string
  imageClassName: string
  overlayClassName: string
}

function getRoomAvailabilityMeta(room: BookingRoom): AvailabilityCardMeta {
  if (room.availabilityStatus === 'FULL_TODAY') {
    return {
      badgeLabel: 'Kín lịch hôm nay',
      subStatus: `Lịch gần nhất: ${room.nextAvailableSlot ?? 'Ngày mai, 18:00'}`,
      ctaLabel: 'Chọn ngày khác',
      badgeClassName: 'border-outline bg-white/95 text-on-surface shadow-[0_8px_20px_rgba(26,28,30,0.08)]',
      subStatusClassName: 'border-outline-variant bg-surface-container-low text-on-surface-variant',
      ctaClassName:
        'border border-outline bg-white text-on-surface shadow-none hover:border-brand-orange/50 hover:bg-primary-container/35 hover:text-brand-orange',
      cardClassName: 'bg-white/88 shadow-[var(--shadow-card)]',
      imageClassName: 'opacity-72 saturate-[0.82]',
      overlayClassName: 'bg-[linear-gradient(to_top,rgba(255,255,255,0.74),rgba(255,255,255,0.18)_52%,rgba(255,255,255,0.08))]',
    }
  }

  if (room.availabilityStatus === 'ALMOST_FULL') {
    return {
      badgeLabel: 'Sắp kín lịch',
      subStatus: 'Còn 1 khung giờ hôm nay',
      ctaLabel: 'Đặt ngay',
      badgeClassName: 'border-[#FF7518]/35 bg-[#FFF2E8] text-[#9A4A08] shadow-[0_10px_24px_rgba(255,117,24,0.14)]',
      subStatusClassName: 'border-[#FF7518]/28 bg-[#FFF7EF] text-[#9A4A08]',
      ctaClassName:
        'bg-brand-orange text-white shadow-[0_10px_26px_rgba(255,117,24,0.24)] hover:bg-brand-orangeHover group-hover:shadow-[0_14px_32px_rgba(255,117,24,0.32)]',
      cardClassName: 'bg-white shadow-[var(--shadow-card)]',
      imageClassName: '',
      overlayClassName: 'bg-[linear-gradient(to_top,rgba(4,42,22,0.6),rgba(4,42,22,0.08)_58%,transparent)]',
    }
  }

  return {
    badgeLabel: 'Còn trống hôm nay',
    subStatus: `Còn ${room.remainingSlots} khung giờ`,
    ctaLabel: 'Đặt ngay',
    badgeClassName: 'border-secondary-container/50 bg-secondary-container/30 text-secondary',
    subStatusClassName: 'border-primary-container/60 bg-primary-container/30 text-on-primary-container',
    ctaClassName:
      'bg-brand-orange text-white shadow-[0_10px_26px_rgba(255,117,24,0.22)] hover:bg-brand-orangeHover group-hover:shadow-[0_14px_32px_rgba(255,117,24,0.3)]',
    cardClassName: 'bg-white shadow-[var(--shadow-card)]',
    imageClassName: '',
    overlayClassName: 'bg-[linear-gradient(to_top,rgba(4,42,22,0.6),rgba(4,42,22,0.08)_58%,transparent)]',
  }
}

export default function BookingRoomCard({ room, renderIcon, onOpenDetail, onBook }: BookingRoomCardProps) {
  const availabilityMeta = getRoomAvailabilityMeta(room)

  const openDetail = () => {
    onOpenDetail?.(room)
  }

  const handleBook = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onBook?.(room)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.currentTarget !== event.target) return
    if (event.key !== 'Enter' && event.key !== ' ') return

    event.preventDefault()
    openDetail()
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={openDetail}
      onKeyDown={handleKeyDown}
      aria-label={`Xem chi tiết ${room.name}`}
      className={[
        'group cursor-pointer overflow-hidden rounded-xl border border-outline-variant transition-all duration-300 hover:-translate-y-1 hover:border-[#FF7518]/40 hover:shadow-[0_16px_44px_rgba(26,28,30,0.12)] focus:outline-none focus-visible:-translate-y-1 focus-visible:border-[#FF7518]/60 focus-visible:ring-4 focus-visible:ring-[#FF7518]/18',
        availabilityMeta.cardClassName,
      ].join(' ')}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-container">
        {room.image ? (
          <Image
            src={room.image}
            alt={room.name}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className={`object-cover transition-transform duration-300 group-hover:scale-105 ${room.imageClassName}`}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,#FFE8D6,transparent_55%),linear-gradient(135deg,#F5F2EC,#E8E4DC)] px-6 text-center">
            <div>
              <p className="font-display text-lg font-bold text-[#6B3200]">{room.name}</p>
              <p className="mt-2 text-sm text-[#5C5348]">Backend chưa cung cấp ảnh phòng.</p>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(4,42,22,0.6),rgba(4,42,22,0.08)_58%,transparent)] transition-opacity duration-300 group-hover:opacity-90" />
        {room.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-primary-container px-3 py-1 font-display text-xs font-semibold text-on-primary-container">
            {room.badge}
          </span>
        )}
        {typeof room.rating === 'number' && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 font-display text-xs font-semibold text-on-surface">
            {renderIcon('star', 'h-3.5 w-3.5 text-tertiary')}
            {room.rating.toFixed(1)}
          </span>
        )}
      </div>

      <div className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display text-xs font-semibold uppercase text-on-surface-variant">{room.categoryLabel}</p>
          {room.type !== room.categoryLabel && (
            <span className="rounded-full bg-surface-container px-2.5 py-1 text-xs font-medium text-on-surface-variant">
              {room.type}
            </span>
          )}
        </div>
        <h3 className="mt-1.5 font-display text-xl font-bold text-on-surface">{room.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-on-surface-variant">
          {room.description || 'Backend chưa cung cấp mô tả cho phòng này.'}
        </p>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            {renderIcon('users', 'h-3.5 w-3.5')}
            {room.capacity}
          </span>
          <span className="flex items-center gap-1.5">
            {renderIcon('clock', 'h-3.5 w-3.5')}
            Tính theo giờ
          </span>
          <span
            className={[
              'rounded-full px-2.5 py-1 font-display font-semibold',
              room.availabilityKnown
                ? room.isAvailable
                  ? 'bg-primary-container text-on-primary-container'
                  : 'bg-surface-container text-on-surface-variant'
                : 'bg-surface-container text-on-surface-variant',
            ].join(' ')}
          >
            {room.availabilityKnown
              ? room.isAvailable
                ? room.nextAvailableTime
                  ? `Trống từ ${room.nextAvailableTime}`
                  : 'Còn trống hôm nay'
                : 'Kín lịch hôm nay'
              : 'Xem lịch trống'}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {room.equipments.map((gear) => (
            <span
              key={gear}
              className="rounded-lg border border-outline-variant bg-surface-container px-2.5 py-1 font-display text-xs font-medium text-on-surface-variant"
            >
              {gear}
            </span>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-outline-variant pt-4">
          <div>
            <span className="font-display text-2xl font-bold text-on-surface">{formatCurrency(room.pricePerHour)}</span>
            <span className="text-xs text-on-surface-variant"> / giờ</span>
          </div>
          <button
            type="button"
            onClick={handleBook}
            className={[
              'rounded-lg px-4 py-2.5 font-display text-xs font-semibold transition-all duration-300 active:scale-[0.98]',
              availabilityMeta.ctaClassName,
            ].join(' ')}
          >
            {room.availabilityKnown ? (room.isAvailable ? 'Đặt ngay' : 'Chọn ngày khác') : 'Xem lịch trống'}
          </button>
        </div>
      </div>
    </article>
  )
}
