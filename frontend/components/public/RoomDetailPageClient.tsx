'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import BookingQuickModal from '@/components/booking/BookingQuickModal'
import { formatCurrency, getNightlyDisplayPrice, type BookingRoom } from '@/components/booking/booking-data'
import { HeartIcon } from '@/components/layout/FavoriteRoomsMenu'
import { useAuth } from '@/contexts/AuthContext'
import { useFavorites } from '@/contexts/FavoritesContext'
import { fetchCommonAmenities, type CommonAmenity } from '@/lib/common-amenity-service'
import { fetchPublicRoomEquipment } from '@/lib/public-room-equipment-service'
import { fetchPublicReviewsByRoomId } from '@/lib/public-room-review-service'
import type { BookingReview } from '@/lib/review-service'
import { mapBackendRoomToBookingRoom } from '@/lib/room-mappers'
import { fetchRoom, fetchRooms, type BackendRoom } from '@/lib/rooms-api'

export default function RoomDetailPageClient({ roomId }: { roomId: string }) {
  const { isAuthenticated } = useAuth()
  const { favoriteIds, toggleFavorite } = useFavorites()
  const [room, setRoom] = useState<BookingRoom | null>(null)
  const [commonAmenities, setCommonAmenities] = useState<CommonAmenity[]>([])
  const [reviews, setReviews] = useState<BookingReview[]>([])
  const [similarRooms, setSimilarRooms] = useState<BookingRoom[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [bookingOpen, setBookingOpen] = useState(false)
  const numericRoomId = Number(roomId)
  const isFavorite = favoriteIds.has(numericRoomId)

  useEffect(() => {
    let mounted = true
    setIsLoading(true)
    setSimilarRooms([])
    Promise.all([
      fetchRoom(roomId),
      fetchPublicRoomEquipment({ roomId }).catch(() => []),
      fetchPublicReviewsByRoomId(roomId).catch(() => []),
      fetchCommonAmenities().catch(() => []),
      fetchRooms().catch(() => []),
    ]).then(async ([backendRoom, equipment, roomReviews, amenities, allRooms]) => {
      if (!mounted) return
      if (!backendRoom) {
        setError('Không tìm thấy phòng homestay.')
        return
      }
      const averageRating = roomReviews.length
        ? roomReviews.reduce((total, review) => total + review.rating, 0) / roomReviews.length
        : 0
      setRoom(mapBackendRoomToBookingRoom(backendRoom, 0, { averageRating, reviewCount: roomReviews.length }, equipment))
      setReviews(roomReviews)
      setCommonAmenities(amenities)
      const candidates = getSimilarRoomCandidates(backendRoom, allRooms).slice(0, 4)
      const recommendations = await Promise.all(candidates.map(async (candidate, index) => {
        const candidateReviews = await fetchPublicReviewsByRoomId(String(candidate.id)).catch(() => [])
        const averageRating = candidateReviews.length
          ? candidateReviews.reduce((total, review) => total + review.rating, 0) / candidateReviews.length
          : 0
        return mapBackendRoomToBookingRoom(candidate, index, {
          averageRating,
          reviewCount: candidateReviews.length,
        })
      }))
      if (mounted) setSimilarRooms(recommendations)
    }).catch(() => {
      if (mounted) setError('Không thể tải chi tiết phòng. Vui lòng thử lại.')
    }).finally(() => {
      if (mounted) setIsLoading(false)
    })
    return () => { mounted = false }
  }, [roomId])

  const gallery = useMemo(() => room?.images?.slice(0, 4) ?? (room?.image ? [room.image] : []), [room])

  if (isLoading) return <div className="mx-auto min-h-screen max-w-[1400px] animate-pulse px-5 py-12 sm:px-8"><div className="h-[560px] rounded-[28px] bg-surface-container" /></div>
  if (!room || error) return <div className="mx-auto min-h-[60vh] max-w-3xl px-5 py-24 text-center"><h1 className="font-editorial text-4xl text-secondary">Không thể mở phòng</h1><p className="mt-4 text-on-surface-variant">{error}</p><Link href="/rooms" className="btn-primary mt-8 inline-flex">Quay lại danh sách phòng</Link></div>

  const toggle = async () => {
    if (!isAuthenticated) {
      window.location.assign(`/login?redirect=${encodeURIComponent(`/rooms/${roomId}`)}`)
      return
    }
    await toggleFavorite(numericRoomId).catch(() => undefined)
  }

  return (
    <main className="min-h-screen bg-[#f8f5ef] pb-20 text-on-surface">
      <section className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 sm:py-12">
        <nav className="mb-6 flex items-center gap-2 text-sm text-on-surface-variant"><Link href="/rooms" className="hover:text-brand-orange">Phòng homestay</Link><span>/</span><span className="font-semibold text-on-surface">{room.name}</span></nav>

        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="eyebrow text-brand-orange">{room.categoryLabel}</p><h1 className="font-editorial mt-2 text-4xl font-semibold tracking-tight text-secondary sm:text-6xl">{room.name}</h1><div className="mt-4 flex flex-wrap gap-4 text-sm"><span>★ {room.rating ? `${room.rating.toFixed(1)} · ${room.reviews} đánh giá` : 'Chưa có đánh giá'}</span><span>⌖ {room.location}</span><span>👥 {room.capacity}</span></div></div>
          <button type="button" onClick={() => void toggle()} className={['inline-flex h-12 items-center gap-2 rounded-full border px-5 font-bold shadow-sm transition', isFavorite ? 'border-red-200 bg-red-50 text-red-600' : 'border-outline bg-white text-on-surface hover:text-red-500'].join(' ')}><HeartIcon filled={isFavorite} className="h-5 w-5" />{isFavorite ? 'Đã yêu thích' : 'Lưu phòng'}</button>
        </div>

        <Gallery images={gallery} roomName={room.name} />

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-8">
            <section className="rounded-[26px] border border-outline-variant bg-white p-6 shadow-[var(--shadow-card)] sm:p-8"><h2 className="font-editorial text-3xl font-semibold text-secondary">Không gian lưu trú</h2><p className="mt-4 text-base leading-8 text-on-surface-variant">{room.description}</p><div className="mt-6 grid gap-3 sm:grid-cols-3"><Info label="Hạng phòng" value={room.type} /><Info label="Sức chứa" value={room.capacity} /><Info label="Lưu trú tối thiểu" value="1 đêm" /></div></section>

            <AmenitySection title="Tiện ích riêng của phòng" subtitle="Các thiết bị và tiện nghi được bố trí riêng trong phòng này." items={room.includedEquipments.map((name) => ({ name, description: 'Sẵn sàng phục vụ trong phòng.', iconName: 'private' }))} />
            <AmenitySection title="Tiện ích chung của homestay" subtitle="Khách lưu trú tại phòng được sử dụng các khu vực chung dưới đây." items={commonAmenities} />

            <section className="rounded-[26px] border border-outline-variant bg-white p-6 sm:p-8"><h2 className="font-editorial text-3xl font-semibold text-secondary">Chính sách lưu trú</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><Policy title="Khung lưu trú" text="Nhận phòng từ 14:00 và trả phòng trước 12:00 ngày cuối cùng; thời gian tối thiểu 1 đêm." /><Policy title="Nhận phòng" text="Khách có thể check-in sớm tối đa 5 phút khi phòng đã sẵn sàng." /><Policy title="Hủy phòng" text="Gửi yêu cầu trước ít nhất 24 giờ để được admin xem xét hoàn tiền." /><Policy title="Sử dụng tiện ích chung" text="Giữ gìn vệ sinh, tuân thủ giờ hoạt động và hướng dẫn an toàn tại từng khu vực." /></div></section>
            <HouseRulesSection />
            <ReviewSection reviews={reviews} />
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start"><div className="rounded-[26px] border border-[#dbc6a9] bg-white p-6 shadow-[0_24px_70px_rgba(29,49,41,.13)]"><p className="text-sm text-on-surface-variant">Giá tham khảo mỗi đêm</p><p className="mt-1 font-editorial text-4xl font-semibold text-secondary">{formatCurrency(getNightlyDisplayPrice(room.pricePerHour))}<span className="font-display text-sm font-medium text-on-surface-variant"> / đêm</span></p><div className="my-5 h-px bg-outline-variant" /><p className="rounded-2xl bg-primary-container/50 px-4 py-3 text-sm leading-6 text-on-primary-container">Nhận phòng 14:00 · Trả phòng 12:00 · Giá chính xác được tính theo toàn bộ thời gian lưu trú.</p><button type="button" onClick={() => setBookingOpen(true)} className="mt-5 h-14 w-full rounded-2xl bg-brand-orange font-bold text-white shadow-lg transition hover:bg-brand-orangeHover">Chọn ngày lưu trú</button><p className="mt-3 text-center text-xs text-on-surface-variant">Chưa tính phí phát sinh hoặc mã giảm giá</p></div></aside>
        </div>

        <SimilarStaysSection rooms={similarRooms} />
      </section>
      <BookingQuickModal room={room} open={bookingOpen} sourceRoute="/rooms" returnPath={`/rooms/${roomId}`} onClose={() => setBookingOpen(false)} />
    </main>
  )
}

function getSimilarRoomCandidates(currentRoom: BackendRoom, rooms: BackendRoom[]) {
  const currentTierId = currentRoom.roomType?.id
  const currentTierName = currentRoom.roomType?.typeName?.trim().toLocaleLowerCase('vi-VN')

  return rooms
    .filter((candidate) => {
      if (candidate.id === currentRoom.id || candidate.status === 'INACTIVE') return false
      if (currentTierId != null) return candidate.roomType?.id === currentTierId
      return Boolean(currentTierName && candidate.roomType?.typeName?.trim().toLocaleLowerCase('vi-VN') === currentTierName)
    })
    .sort((first, second) => {
      const firstAvailable = first.status === 'AVAILABLE' ? 0 : 1
      const secondAvailable = second.status === 'AVAILABLE' ? 0 : 1
      if (firstAvailable !== secondAvailable) return firstAvailable - secondAvailable
      return first.roomName.localeCompare(second.roomName, 'vi')
    })
}

function SimilarStaysSection({ rooms }: { rooms: BookingRoom[] }) {
  return (
    <section className="mt-16 border-t border-[#ded3c5] pt-10" aria-labelledby="similar-stays-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-brand-orange">Gợi ý dành cho bạn</p>
          <h2 id="similar-stays-title" className="mt-1 font-editorial text-3xl font-semibold text-secondary sm:text-4xl">Chỗ ở tương tự</h2>
          <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">Một vài lựa chọn có trải nghiệm lưu trú tương đương.</p>
        </div>
        <Link href="/rooms" className="inline-flex items-center gap-2 self-start text-sm font-bold text-secondary transition hover:text-brand-orange sm:self-auto">
          Xem tất cả phòng
          <ArrowIcon />
        </Link>
      </div>

      {rooms.length > 0 ? (
        <div className="mt-6 flex snap-x gap-4 overflow-x-auto pb-4 [scrollbar-width:thin]">
          {rooms.map((similarRoom) => <SimilarStayCard key={similarRoom.id} room={similarRoom} />)}
        </div>
      ) : (
        <div className="mt-8 rounded-[24px] border border-dashed border-[#d8cbbb] bg-white/70 px-6 py-10 text-center">
          <p className="font-display text-base font-bold text-secondary">Chưa có phòng cùng hạng để gợi ý</p>
          <p className="mt-2 text-sm text-on-surface-variant">Bạn có thể xem thêm các hạng phòng khác trong danh sách phòng homestay.</p>
        </div>
      )}
    </section>
  )
}

function SimilarStayCard({ room }: { room: BookingRoom }) {
  const nightlyPrice = getNightlyDisplayPrice(room.pricePerHour)
  const amenities = room.includedEquipments.slice(0, 2)
  const isUnavailableToday = room.operationalStatus === 'IN_USE' || room.operationalStatus === 'MAINTENANCE'

  return (
    <article className="group w-[82vw] max-w-[300px] shrink-0 snap-start overflow-hidden rounded-[20px] border border-[#ded2c3] bg-white shadow-[0_12px_34px_rgba(31,54,44,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_46px_rgba(31,54,44,0.12)] sm:w-[290px]">
      <Link href={`/rooms/${room.id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange" aria-label={`Xem chi tiết ${room.name}`}>
        <div className="relative aspect-[16/10] overflow-hidden bg-[#e9e3d8]">
          <Image src={room.image || room.images?.[0] || '/images/homestay-luxury-hero.webp'} alt={room.name} fill quality={90} sizes="300px" className="object-cover transition duration-700 group-hover:scale-[1.035]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b211a]/75 via-transparent to-[#0b211a]/5" />
          <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2 text-white">
            <span className="rounded-full border border-white/20 bg-black/25 px-2.5 py-1 text-[10px] font-semibold backdrop-blur-md">{room.capacity}</span>
            <span className="rounded-full border border-white/20 bg-black/25 px-2.5 py-1 text-[10px] font-bold backdrop-blur-md">
              <span className="text-[#f2c15f]">★</span> {room.rating ? `${room.rating.toFixed(1)} (${room.reviews})` : 'Chưa đánh giá'}
            </span>
          </div>
        </div>

        <div className="p-4">
          <h3 className="line-clamp-1 font-editorial text-[22px] font-semibold leading-tight text-secondary transition group-hover:text-brand-orange">{room.name}</h3>
          <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#4d806d]"><LocationIcon />{room.location}</p>

          <div className="mt-3 flex min-h-6 flex-nowrap gap-1.5 overflow-hidden">
            {amenities.length > 0 ? amenities.map((amenity) => (
              <span key={amenity} className="shrink-0 rounded-full border border-[#e1d6c9] bg-[#fbf8f3] px-2 py-1 text-[9px] font-semibold text-on-surface-variant">{amenity}</span>
            )) : <span className="text-xs text-on-surface-variant">Đầy đủ tiện nghi lưu trú</span>}
          </div>

          <div className="mt-4 flex items-end justify-between gap-2 border-t border-[#e8dfd4] pt-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">Từ</p>
              <p className="mt-0.5 font-editorial text-xl font-semibold text-brand-orange">{formatCurrency(nightlyPrice)}<span className="font-display text-[10px] font-medium text-on-surface-variant"> / đêm</span></p>
            </div>
            <span className={['inline-flex min-h-9 items-center rounded-full px-3 text-[10px] font-bold transition', isUnavailableToday ? 'border border-[#d6c9bb] bg-[#f6f1ea] text-on-surface-variant' : 'bg-secondary text-white group-hover:bg-brand-orange'].join(' ')}>
              {isUnavailableToday ? 'Chọn ngày khác' : 'Xem phòng'}
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}

function ArrowIcon() {
  return <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-5-5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function LocationIcon() {
  return <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>
}

function Gallery({ images, roomName }: { images: string[]; roomName: string }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const slots = Array.from({ length: 4 }, (_, index) => images[index])
  const cellClasses = [
    'col-span-2 min-h-[260px] lg:col-span-2 lg:row-span-2 lg:min-h-0',
    'min-h-40 lg:col-span-2 lg:min-h-0',
    'min-h-40 lg:min-h-0',
    'col-span-2 min-h-40 lg:col-span-1 lg:min-h-0',
  ]

  useEffect(() => {
    if (selectedIndex === null) return

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedIndex(null)
      if (event.key === 'ArrowLeft') {
        setSelectedIndex((current) => current === null ? null : (current - 1 + images.length) % images.length)
      }
      if (event.key === 'ArrowRight') {
        setSelectedIndex((current) => current === null ? null : (current + 1) % images.length)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [images.length, selectedIndex])

  return (
    <>
      <section className="grid grid-cols-2 grid-rows-[minmax(260px,70vw)_160px_160px] gap-2 overflow-hidden rounded-[28px] bg-surface-container lg:aspect-[8/3] lg:grid-cols-4 lg:grid-rows-2">
        {slots.map((image, index) => image ? (
          <button
            key={index}
            type="button"
            onClick={() => setSelectedIndex(index)}
            className={`group relative overflow-hidden bg-[#e9e3d8] text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white/90 ${cellClasses[index]}`}
            aria-label={`Xem ảnh ${index + 1} của ${roomName}`}
          >
            <Image
              src={image}
              alt={`${roomName} - ảnh ${index + 1}`}
              fill
              priority={index === 0}
              quality={90}
              sizes={
                index < 2
                  ? '(min-width: 1400px) 668px, (min-width: 1024px) 50vw, 100vw'
                  : '(min-width: 1400px) 334px, (min-width: 1024px) 25vw, 50vw'
              }
              className="object-cover transition duration-500 group-hover:scale-[1.015]"
            />
            <span className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
            <span className="pointer-events-none absolute bottom-4 right-4 flex h-10 w-10 translate-y-2 items-center justify-center rounded-full border border-white/40 bg-black/45 text-white opacity-0 shadow-lg backdrop-blur-md transition group-hover:translate-y-0 group-hover:opacity-100" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4M8.5 11h5M11 8.5v5" strokeLinecap="round" /></svg>
            </span>
          </button>
        ) : (
          <div key={index} className={`relative overflow-hidden bg-[#e9e3d8] ${cellClasses[index]}`}>
            <div className="flex h-full items-center justify-center px-4 text-center text-sm font-semibold text-on-surface-variant">
              Chưa thiết lập ảnh {index + 1}
            </div>
          </div>
        ))}
      </section>

      {selectedIndex !== null && images[selectedIndex] && (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-[#07130f]/88 p-4 backdrop-blur-md sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`Ảnh phòng ${roomName}`}
          onClick={() => setSelectedIndex(null)}
        >
          <div className="absolute left-1/2 top-5 -translate-x-1/2 rounded-full border border-white/15 bg-black/25 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-md">
            {selectedIndex + 1} / {images.length}
          </div>
          <button type="button" onClick={() => setSelectedIndex(null)} className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/30 text-2xl text-white shadow-lg backdrop-blur-md transition hover:bg-white/15" aria-label="Đóng ảnh">×</button>

          {images.length > 1 && (
            <>
              <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedIndex((selectedIndex - 1 + images.length) % images.length) }} className="absolute left-3 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/30 text-3xl text-white shadow-lg backdrop-blur-md transition hover:bg-white/15 sm:left-7" aria-label="Ảnh trước">‹</button>
              <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedIndex((selectedIndex + 1) % images.length) }} className="absolute right-3 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/30 text-3xl text-white shadow-lg backdrop-blur-md transition hover:bg-white/15 sm:right-7" aria-label="Ảnh tiếp theo">›</button>
            </>
          )}

          <div className="relative h-[min(78vh,800px)] w-[min(88vw,1120px)] overflow-hidden rounded-[24px] border border-white/15 bg-black/20 shadow-[0_30px_100px_rgba(0,0,0,.55)]" onClick={(event) => event.stopPropagation()}>
            <Image src={images[selectedIndex]} alt={`${roomName} - ảnh ${selectedIndex + 1}`} fill quality={95} sizes="88vw" className="object-contain" />
          </div>
          <p className="absolute bottom-5 left-1/2 max-w-[75vw] -translate-x-1/2 truncate text-center text-sm font-medium text-white/80">{roomName}</p>
        </div>
      )}
    </>
  )
}

function AmenitySection({ title, subtitle, items }: { title: string; subtitle: string; items: Array<{ name: string; description: string; iconName?: string; imageUrl?: string | null }> }) {
  return <section className="rounded-[26px] border border-outline-variant bg-white p-6 sm:p-8"><h2 className="font-editorial text-3xl font-semibold text-secondary">{title}</h2><p className="mt-2 text-on-surface-variant">{subtitle}</p>{items.length ? <div className="mt-7 grid gap-x-8 gap-y-6 sm:grid-cols-2">{items.map((item) => <article key={item.name} className="flex gap-4"><div className="relative flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#eee3d3] text-secondary">{item.imageUrl ? <Image src={item.imageUrl} alt="" fill unoptimized sizes="96px" className="object-cover" /> : <AmenityIcon name={item.name} iconName={item.iconName} />}</div><div><h3 className="font-display text-base font-bold text-secondary">{item.name}</h3><p className="mt-1 text-sm leading-6 text-on-surface-variant">{item.description}</p></div></article>)}</div> : <p className="mt-6 rounded-2xl bg-surface-container px-4 py-3 text-sm text-on-surface-variant">Chưa có dữ liệu tiện ích.</p>}</section>
}

function AmenityIcon({ name, iconName }: { name: string; iconName?: string }) {
  const normalized = `${name} ${iconName ?? ''}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const commonProps = { className: 'h-8 w-8', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }

  if (normalized.includes('wifi') || normalized.includes('internet')) return <svg {...commonProps}><path d="M4.5 9.5a11 11 0 0 1 15 0"/><path d="M7.5 12.5a6.8 6.8 0 0 1 9 0"/><path d="M10.5 15.5a2.5 2.5 0 0 1 3 0"/><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none"/></svg>
  if (normalized.includes('tv') || normalized.includes('may chieu')) return <svg {...commonProps}><rect x="3" y="5" width="18" height="13" rx="2"/><path d="m9 21 3-3 3 3"/><path d="M8 9h8"/></svg>
  if (normalized.includes('dieu hoa') || normalized.includes('quat')) return <svg {...commonProps}><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4"/><circle cx="12" cy="12" r="3"/></svg>
  if (normalized.includes('ket') || normalized.includes('an toan')) return <svg {...commonProps}><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M12 9v3l2 1M7 8h1M7 16h1"/></svg>
  if (normalized.includes('say toc')) return <svg {...commonProps}><path d="M4 8h8a4 4 0 0 1 0 8H8l-2 5H3l2-6a4 4 0 0 1-1-7Z"/><path d="M16 10h5M17 13h4M16 16h5"/></svg>
  if (normalized.includes('nuoc nong') || normalized.includes('tam')) return <svg {...commonProps}><path d="M5 11a7 7 0 0 1 14 0"/><path d="M5 11h14M8 14v1M12 14v2M16 14v1M7 19h10"/></svg>
  if (normalized.includes('minibar') || normalized.includes('tu lanh')) return <svg {...commonProps}><rect x="6" y="3" width="12" height="18" rx="2"/><path d="M6 10h12M9 6v2M9 13v3"/></svg>
  if (normalized.includes('ban lam viec') || normalized.includes('ghe')) return <svg {...commonProps}><path d="M4 12h16M6 12v8M18 12v8M8 12V7h8v5M10 7V4h4v3"/></svg>
  if (normalized.includes('ao choang') || normalized.includes('moc')) return <svg {...commonProps}><path d="M12 5a2 2 0 1 0-2-2"/><path d="m12 5 8 6H4l8-6ZM7 11v8h10v-8"/></svg>
  if (normalized.includes('parking') || normalized.includes('do xe')) return <svg {...commonProps}><circle cx="12" cy="12" r="9"/><path d="M10 17V7h3a3 3 0 0 1 0 6h-3"/></svg>
  if (normalized.includes('pool') || normalized.includes('be ')) return <svg {...commonProps}><path d="M4 9h16M7 5v8M17 5v8M3 16c2-2 4 2 6 0s4 2 6 0 4 2 6 0M3 20c2-2 4 2 6 0s4 2 6 0 4 2 6 0"/></svg>
  if (normalized.includes('bbq') || normalized.includes('bep')) return <svg {...commonProps}><path d="M5 11h14a7 7 0 0 1-14 0ZM9 18l-1 3M15 18l1 3M8 7c0-2 2-2 2-4M13 7c0-2 2-2 2-4"/></svg>
  return <svg {...commonProps}><path d="M12 3 9.5 8.5 4 11l5.5 2.5L12 19l2.5-5.5L20 11l-5.5-2.5L12 3Z"/></svg>
}
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-surface-container-low p-4"><p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">{label}</p><p className="mt-2 font-bold text-secondary">{value}</p></div> }
function Policy({ title, text }: { title: string; text: string }) { return <div className="rounded-2xl bg-surface-container-low p-5"><h3 className="font-bold text-secondary">{title}</h3><p className="mt-2 text-sm leading-6 text-on-surface-variant">{text}</p></div> }

const houseRules = [
  { title: 'Nhận phòng từ 14:00', description: 'Có mặt đúng lịch đã xác nhận; hỗ trợ sớm tối đa 5 phút khi phòng sẵn sàng.', tone: 'positive' as const },
  { title: 'Trả phòng trước 12:00', description: 'Bàn giao phòng và các thiết bị đi kèm trước giờ checkout.', tone: 'positive' as const },
  { title: 'Mang theo CCCD hoặc hộ chiếu', description: 'Giấy tờ hợp lệ được dùng để xác nhận thông tin người lưu trú.', tone: 'positive' as const },
  { title: 'Giữ yên tĩnh sau 22:00', description: 'Hạn chế âm thanh lớn để đảm bảo không gian nghỉ dưỡng chung.', tone: 'positive' as const },
  { title: 'Không hút thuốc trong phòng', description: 'Chỉ hút thuốc tại khu vực ngoài trời được homestay chỉ dẫn.', tone: 'restricted' as const },
  { title: 'Không tự ý đưa thêm khách', description: 'Mọi khách lưu trú phải được khai báo và không vượt quá sức chứa phòng.', tone: 'restricted' as const },
  { title: 'Thú cưng cần được xác nhận trước', description: 'Liên hệ homestay trước khi đến để kiểm tra điều kiện tiếp nhận.', tone: 'restricted' as const },
  { title: 'Tiệc và nấu ăn theo khu vực', description: 'Chỉ tổ chức khi đã được đồng ý và sử dụng đúng khu bếp hoặc BBQ.', tone: 'restricted' as const },
]

function HouseRulesSection() {
  return (
    <section className="overflow-hidden rounded-[26px] border border-outline-variant bg-white" id="house-rules">
      <div className="border-b border-outline-variant bg-[linear-gradient(115deg,#173a31,#285246)] px-6 py-6 text-white sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e7c49c]">Thông tin cần biết</p>
        <h2 className="font-editorial mt-2 text-3xl font-semibold">Nội quy chỗ ở</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/68">Vui lòng tuân thủ để kỳ lưu trú an toàn, riêng tư và thoải mái cho mọi khách.</p>
      </div>
      <div className="grid gap-x-8 px-6 py-4 sm:px-8 md:grid-cols-2">
        {houseRules.map((rule) => (
          <article key={rule.title} className="flex gap-4 border-b border-outline-variant/70 py-5 last:border-b-0 md:[&:nth-last-child(-n+2)]:border-b-0">
            <HouseRuleIcon tone={rule.tone} />
            <div>
              <h3 className="font-display text-sm font-bold text-secondary">{rule.title}</h3>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">{rule.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function HouseRuleIcon({ tone }: { tone: 'positive' | 'restricted' }) {
  return (
    <span className={['flex h-10 w-10 shrink-0 items-center justify-center rounded-full', tone === 'positive' ? 'bg-[#eaf4ef] text-secondary' : 'bg-[#fff0ed] text-[#b84d43]'].join(' ')}>
      {tone === 'positive' ? (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="m6.5 12.5 3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" /><path d="m7.2 7.2 9.6 9.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
      )}
    </span>
  )
}

function ReviewSection({ reviews }: { reviews: BookingReview[] }) {
  if (reviews.length === 0) {
    return (
      <section className="rounded-[26px] border border-outline-variant bg-white p-6 sm:p-8" id="reviews">
        <p className="eyebrow text-brand-orange">Đánh giá phòng</p>
        <div className="mt-5 flex flex-col items-center rounded-[22px] border border-dashed border-[#d9cbb8] bg-[#fcfaf6] px-6 py-10 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f2e5d3] text-[#b28455]" aria-hidden>
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" strokeLinejoin="round" /></svg>
          </span>
          <h2 className="font-editorial mt-5 text-3xl font-semibold text-secondary">Chưa có ai đánh giá phòng này</h2>
          <p className="mt-3 max-w-lg text-sm leading-7 text-on-surface-variant">Đánh giá chỉ được ghi nhận từ khách đã hoàn tất kỳ lưu trú. Hãy là người đầu tiên chia sẻ trải nghiệm sau khi checkout.</p>
          <div className="mt-5 flex items-center gap-1 text-xl text-[#d8d2c9]" aria-label="Chưa có điểm đánh giá"><span>☆</span><span>☆</span><span>☆</span><span>☆</span><span>☆</span></div>
        </div>
      </section>
    )
  }

  const average = reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((review) => review.rating === star).length }))

  return (
    <section className="rounded-[26px] border border-outline-variant bg-white p-6 sm:p-8" id="reviews">
      <div className="grid gap-7 border-b border-outline-variant pb-8 md:grid-cols-[220px_1fr]">
        <div><p className="eyebrow text-brand-orange">Đánh giá thực tế</p><div className="mt-3 flex items-end gap-3"><span className="font-editorial text-6xl font-semibold text-secondary">{average.toFixed(1)}</span><span className="pb-2 text-sm text-on-surface-variant">/ 5</span></div><p className="mt-2 text-lg tracking-wider text-[#d79b35]" aria-label={`${average.toFixed(1)} trên 5 sao`}>{'★'.repeat(Math.round(average))}<span className="text-outline">{'☆'.repeat(5 - Math.round(average))}</span></p><p className="mt-2 text-sm text-on-surface-variant">Từ {reviews.length} khách đã lưu trú</p></div>
        <div className="space-y-2">{breakdown.map(({ star, count }) => <div key={star} className="grid grid-cols-[42px_1fr_30px] items-center gap-3 text-sm"><span>{star} ★</span><div className="h-2 overflow-hidden rounded-full bg-surface-container"><div className="h-full rounded-full bg-brand-orange" style={{ width: `${(count / reviews.length) * 100}%` }} /></div><span className="text-right text-on-surface-variant">{count}</span></div>)}</div>
      </div>
      <div className="mt-7 grid gap-4 md:grid-cols-2">{reviews.map((review) => <PublicReviewCard key={review.id} review={review} />)}</div>
    </section>
  )
}

function PublicReviewCard({ review }: { review: BookingReview }) {
  return (
    <article className="rounded-2xl border border-outline-variant bg-[#fcfaf6] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-secondary">{review.customerName || 'Khách hàng'}</h3>
          <p className="mt-1 text-xs text-on-surface-variant">{new Date(review.createdAt).toLocaleDateString('vi-VN')} · {review.verified ? 'Đã lưu trú' : 'Đánh giá'}</p>
        </div>
        <span className="rounded-full bg-[#fff3dc] px-3 py-1 text-sm font-bold text-[#a66f19]">{review.rating} ★</span>
      </div>
      <p className="mt-4 text-sm leading-7 text-on-surface-variant">{review.content}</p>
      {review.images && review.images.length > 0 && <ReviewPhotoGallery images={review.images} customerName={review.customerName || 'Khách hàng'} />}
      {review.adminResponse && <div className="mt-4 rounded-xl bg-white p-4 text-sm leading-6"><p className="font-bold text-secondary">Phản hồi từ Homestay</p><p className="mt-1 text-on-surface-variant">{review.adminResponse.content}</p></div>}
    </article>
  )
}

function ReviewPhotoGallery({ images, customerName }: { images: NonNullable<BookingReview['images']>; customerName: string }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  return (
    <>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {images.map((image, index) => (
          <button key={image.id} type="button" onClick={() => setSelectedImage(image.previewUrl)} className="group relative aspect-square overflow-hidden rounded-xl bg-surface-container focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange" aria-label={`Xem ảnh đánh giá ${index + 1} của ${customerName}`}>
            <Image src={image.previewUrl} alt={`Ảnh đánh giá ${index + 1} của ${customerName}`} fill unoptimized sizes="160px" className="object-cover transition duration-300 group-hover:scale-105" />
          </button>
        ))}
      </div>
      {selectedImage && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Ảnh đánh giá" onClick={() => setSelectedImage(null)}>
          <button type="button" onClick={() => setSelectedImage(null)} className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-2xl text-white transition hover:bg-white/25" aria-label="Đóng ảnh">×</button>
          <div className="relative h-[min(78vh,760px)] w-[min(92vw,1040px)] overflow-hidden rounded-[22px]" onClick={(event) => event.stopPropagation()}>
            <Image src={selectedImage} alt={`Ảnh đánh giá của ${customerName}`} fill unoptimized sizes="92vw" className="object-contain" />
          </div>
        </div>
      )}
    </>
  )
}
