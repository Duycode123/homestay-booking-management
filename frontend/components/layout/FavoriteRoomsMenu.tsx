'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { getNightlyDisplayPrice } from '@/components/booking/booking-data'
import { useFavorites } from '@/contexts/FavoritesContext'
import { openQuickBookingOnCurrentPage } from '@/lib/quick-booking-navigation'
import { shouldBypassImageOptimization } from '@/lib/image-optimization'

type FavoriteRoomsMenuProps = {
  onNavigate?: () => void
}

export default function FavoriteRoomsMenu({ onNavigate }: FavoriteRoomsMenuProps) {
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)
  const {
    favorites,
    isLoading,
    errorMessage,
    panelOpen,
    setPanelOpen,
    toggleFavorite,
  } = useFavorites()

  useEffect(() => {
    if (!panelOpen) return
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setPanelOpen(false)
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPanelOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [panelOpen, setPanelOpen])

  const bookRoom = (roomId: number) => {
    setPanelOpen(false)
    onNavigate?.()

    if (window.location.pathname === '/rooms') {
      openQuickBookingOnCurrentPage(roomId)
      return
    }

    router.push(`/rooms?roomId=${roomId}`)
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setPanelOpen(!panelOpen)}
        aria-expanded={panelOpen}
        aria-haspopup="dialog"
        aria-label={`Phòng yêu thích${favorites.length ? `, ${favorites.length} phòng` : ''}`}
        className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-[#ddccb4] bg-[#fffdfa] text-[#715334] shadow-[0_7px_20px_rgba(32,57,48,.08)] transition-all hover:-translate-y-0.5 hover:border-[#b98853]/55 hover:bg-[#fff8ee] focus:outline-none focus:ring-2 focus:ring-brand-orange/25"
      >
        <HeartIcon filled={favorites.length > 0} className="h-5 w-5" />
        {favorites.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#b54444] px-1 text-[10px] font-bold text-white">
            {favorites.length > 9 ? '9+' : favorites.length}
          </span>
        )}
      </button>

      {panelOpen && (
        <section
          role="dialog"
          aria-label="Danh sách phòng yêu thích"
          className="serene-dropdown-enter absolute right-0 z-[95] mt-3 flex max-h-[calc(100dvh-7rem)] w-[min(390px,calc(100vw-24px))] flex-col overflow-hidden rounded-[24px] border border-[#dfd2bf] bg-[#fffdfa] shadow-[0_24px_70px_rgba(26,47,39,.22)]"
        >
          <header className="bg-[linear-gradient(145deg,#514C44,#746D63)] px-5 py-4 text-white">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#e5c69f]">Bộ sưu tập của bạn</p>
                <h2 className="mt-1 font-display text-lg font-bold">Phòng yêu thích</h2>
              </div>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold">
                {favorites.length} phòng
              </span>
            </div>
          </header>

          <div className="premium-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
            {isLoading ? (
              <div className="space-y-2 p-2" aria-label="Đang tải phòng yêu thích">
                {[1, 2].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl bg-[#f1e9dd]" />)}
              </div>
            ) : errorMessage ? (
              <p className="m-2 rounded-2xl border border-error/25 bg-error-container/30 px-4 py-3 text-sm text-error">{errorMessage}</p>
            ) : favorites.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f3e6d4] text-[#9a7045]">
                  <HeartIcon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-display text-base font-bold text-on-surface">Chưa có phòng yêu thích</h3>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">Nhấn biểu tượng trái tim trên phòng bạn muốn lưu lại.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {favorites.map((favorite) => (
                  <article key={favorite.roomId} className="group rounded-2xl border border-[#e8dece] bg-white p-2.5 transition hover:border-[#c99c69] hover:shadow-[0_10px_30px_rgba(32,55,46,.09)]">
                    <div className="flex gap-3">
                      <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-[#eee6da]">
                        {favorite.imageUrl ? (
                          <Image
                            src={favorite.imageUrl}
                            alt={favorite.roomName}
                            fill
                            quality={75}
                            unoptimized={shouldBypassImageOptimization(favorite.imageUrl)}
                            sizes="96px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center text-[#9a8061]"><HeartIcon className="h-5 w-5" /></span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#9a7045]">{favorite.roomType || 'Homestay'}</p>
                            <h3 className="mt-0.5 truncate font-display text-sm font-bold text-on-surface">{favorite.roomName}</h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => void toggleFavorite(favorite.roomId)}
                            aria-label={`Bỏ yêu thích ${favorite.roomName}`}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fff0ef] text-[#c64040] transition hover:bg-[#ffe2e0]"
                          >
                            <HeartIcon filled className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-2 flex items-end justify-between gap-2">
                          <p className="text-xs font-bold text-[#805b35]">{formatPrice(getNightlyDisplayPrice(favorite.pricePerHour ?? 0))}<span className="font-normal text-on-surface-variant">/đêm</span></p>
                          <button type="button" onClick={() => bookRoom(favorite.roomId)} className="rounded-lg bg-[#514C44] px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#3F3A34]">Đặt nhanh</button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {favorites.length > 0 && (
            <footer className="border-t border-[#eadfce] bg-[#fcf8f2] px-4 py-3">
              <button type="button" onClick={() => { setPanelOpen(false); router.push('/rooms') }} className="w-full text-center text-sm font-bold text-[#745433] hover:text-[#a56d35]">Xem tất cả phòng →</button>
            </footer>
          )}
        </section>
      )}
    </div>
  )
}

function formatPrice(value?: number | null) {
  if (value == null) return ''
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ'
}

export function HeartIcon({ filled = false, className = '' }: { filled?: boolean; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.7-7.5 1.1-1.1a5.5 5.5 0 0 0 0-7.8Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
