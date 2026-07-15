'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react'
import { formatCurrency, getNightlyDisplayPrice, type BookingRoom } from '@/components/booking/booking-data'
import { HeartIcon } from '@/components/layout/FavoriteRoomsMenu'
import { useAuth } from '@/contexts/AuthContext'
import { useFavorites } from '@/contexts/FavoritesContext'

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
  if (room.todayAvailabilityReason === 'NEXT_DAY') {
    return {
      badgeLabel: 'Còn phòng để đặt',
      subStatus: room.nextAvailableSlot ?? 'Chọn ngày lưu trú',
      ctaLabel: 'Đặt phòng',
      badgeClassName: 'border-secondary-container/50 bg-secondary-container/30 text-secondary',
      subStatusClassName: 'border-primary-container/60 bg-primary-container/30 text-on-primary-container',
      ctaClassName: 'bg-secondary text-white shadow-[0_10px_26px_rgba(23,58,49,0.22)] hover:bg-secondary-container',
      cardClassName: 'bg-white shadow-[var(--shadow-card)]',
      imageClassName: '',
      overlayClassName: 'bg-[linear-gradient(to_top,rgba(4,42,22,0.6),rgba(4,42,22,0.08)_58%,transparent)]',
    }
  }

  if (room.todayAvailabilityReason === 'TODAY_BOOKED') {
    return {
      badgeLabel: 'Hôm nay đã có lịch',
      subStatus: room.nextAvailableSlot
        ? `Còn trống ${room.nextAvailableSlot.toLowerCase()}`
        : 'Vui lòng chọn ngày khác',
      ctaLabel: 'Chọn ngày khác',
      badgeClassName: 'border-outline bg-white/95 text-on-surface shadow-[0_8px_20px_rgba(26,28,30,0.08)]',
      subStatusClassName: 'border-outline-variant bg-surface-container-low text-on-surface-variant',
      ctaClassName: 'border border-secondary bg-secondary text-white shadow-[0_10px_26px_rgba(23,58,49,0.2)] hover:bg-secondary-container',
      cardClassName: 'bg-white/92 shadow-[var(--shadow-card)]',
      imageClassName: 'opacity-80 saturate-[0.9]',
      overlayClassName: 'bg-[linear-gradient(to_top,rgba(255,255,255,0.62),rgba(255,255,255,0.12)_52%,transparent)]',
    }
  }

  if (room.availabilityStatus === 'FULL_TODAY') {
    return {
      badgeLabel: 'Kín lịch hôm nay',
      subStatus: `Lịch gần nhất: ${room.nextAvailableSlot ?? 'Chưa xác định'}`,
      ctaLabel: 'Chọn ngày khác',
      badgeClassName: 'border-outline bg-white/95 text-on-surface shadow-[0_8px_20px_rgba(26,28,30,0.08)]',
      subStatusClassName: 'border-outline-variant bg-surface-container-low text-on-surface-variant',
      ctaClassName:
        'border border-secondary bg-secondary text-white shadow-[0_10px_26px_rgba(23,58,49,0.2)] hover:border-secondary-container hover:bg-secondary-container',
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
      badgeClassName: 'border-[#B28455]/35 bg-[#FFF2E8] text-[#9A4A08] shadow-[0_10px_24px_rgba(178,132,85,0.14)]',
      subStatusClassName: 'border-[#B28455]/28 bg-[#FFF7EF] text-[#9A4A08]',
      ctaClassName:
        'bg-secondary text-white shadow-[0_10px_26px_rgba(23,58,49,0.22)] hover:bg-secondary-container group-hover:shadow-[0_14px_32px_rgba(23,58,49,0.28)]',
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
      'bg-secondary text-white shadow-[0_10px_26px_rgba(23,58,49,0.22)] hover:bg-secondary-container group-hover:shadow-[0_14px_32px_rgba(23,58,49,0.28)]',
    cardClassName: 'bg-white shadow-[var(--shadow-card)]',
    imageClassName: '',
    overlayClassName: 'bg-[linear-gradient(to_top,rgba(4,42,22,0.6),rgba(4,42,22,0.08)_58%,transparent)]',
  }
}

export default function BookingRoomCard({ room, renderIcon, onOpenDetail, onBook }: BookingRoomCardProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { favoriteIds, toggleFavorite } = useFavorites()
  const availabilityMeta = getRoomAvailabilityMeta(room)
  const roomId = Number(room.id)
  const canFavorite = Number.isSafeInteger(roomId) && roomId > 0
  const isFavorite = canFavorite && favoriteIds.has(roomId)

  const openDetail = () => {
    onOpenDetail?.(room)
  }

  const handleBook = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onBook?.(room)
  }

  const handleFavorite = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()

    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent('/rooms')}`)
      return
    }
    if (!canFavorite) return

    try {
      await toggleFavorite(roomId)
    } catch {
      // The favorites panel displays the API error and keeps the previous state.
    }
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
        'group cursor-pointer overflow-hidden rounded-xl border border-outline-variant transition-all duration-300 hover:-translate-y-1 hover:border-[#B28455]/40 hover:shadow-[0_16px_44px_rgba(26,28,30,0.12)] focus:outline-none focus-visible:-translate-y-1 focus-visible:border-[#B28455]/60 focus-visible:ring-4 focus-visible:ring-[#B28455]/18',
        availabilityMeta.cardClassName,
      ].join(' ')}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-container">
        {room.image ? (
          <Image
            src={room.image}
            alt={room.name}
            fill
            unoptimized
            sizes="(min-width: 768px) 33vw, 100vw"
            className={`object-cover transition-transform duration-300 group-hover:scale-105 ${room.imageClassName}`}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,#EDE0CF,transparent_55%),linear-gradient(135deg,#F6F3ED,#E4DED3)] px-6 text-center">
            <div>
              <p className="font-display text-lg font-bold text-[#5E4328]">{room.name}</p>
              <p className="mt-2 text-sm text-[#6A6C66]">Backend chưa cung cấp ảnh phòng.</p>
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
          <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 font-display text-xs font-semibold text-on-surface shadow-sm">
            {renderIcon('star', 'h-3.5 w-3.5 text-tertiary')}
            {room.rating.toFixed(1)}
          </span>
        )}
        <button
          type="button"
          onClick={(event) => void handleFavorite(event)}
          disabled={!canFavorite}
          aria-label={isFavorite ? `Bỏ ${room.name} khỏi danh sách yêu thích` : `Thêm ${room.name} vào danh sách yêu thích`}
          aria-pressed={isFavorite}
          className={[
            'absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border shadow-[0_8px_24px_rgba(26,28,30,.16)] backdrop-blur-sm transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-50',
            isFavorite
              ? 'scale-105 border-[#d85b5b]/25 bg-[#fff0ef] text-[#c83f45]'
              : 'border-white/70 bg-white/92 text-[#6c6d68] hover:scale-105 hover:border-[#e6b7b7] hover:bg-[#fff7f6] hover:text-[#c83f45]',
          ].join(' ')}
        >
          <HeartIcon filled={isFavorite} className="h-5 w-5" />
        </button>
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
            Giá theo đêm
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
            <span className="font-display text-2xl font-bold text-on-surface">{formatCurrency(getNightlyDisplayPrice(room.pricePerHour))}</span>
            <span className="text-xs text-on-surface-variant"> / đêm</span>
          </div>
          <button
            type="button"
            onClick={handleBook}
            className={[
              'rounded-full px-5 py-2.5 font-display text-xs font-semibold transition-all duration-300 active:scale-[0.98]',
              availabilityMeta.ctaClassName,
            ].join(' ')}
          >
            {room.availabilityKnown ? availabilityMeta.ctaLabel : 'Xem lịch trống'}
          </button>
        </div>
      </div>
    </article>
  )
}
