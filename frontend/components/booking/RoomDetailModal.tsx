'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import HomepageModalShell from '@/components/booking/HomepageModalShell'
import RoomReviewsSection from '@/components/booking/reviews/RoomReviewsSection'
import {
  formatCurrency,
  getNightlyDisplayPrice,
  getTodayDateString,
  type BookingRoom,
} from '@/components/booking/booking-data'
import { fetchAvailableSlots } from '@/lib/booking/bookingApi'
import type { TimeSlot } from '@/lib/booking/types'

type RoomDetailModalProps = {
  room: BookingRoom | null
  open: boolean
  onClose: () => void
  onBook: (room: BookingRoom) => void
}

const roomPolicies = [
  'Hoàn tiền khi hủy trước ít nhất 24 giờ',
  'Đến đúng giờ để giữ lịch',
  'Có thể thuê thêm tiện nghi khi đặt phòng',
]

function RatingStars({ rating }: { rating?: number }) {
  const normalizedRating = Math.max(0, Math.min(5, rating ?? 0))
  const label = typeof rating === 'number' ? `${rating.toFixed(1)} trên 5 sao` : 'Chưa có đánh giá'

  return (
    <div className="flex items-center gap-0.5" aria-label={label} title={label}>
      {Array.from({ length: 5 }).map((_, index) => {
        const fillPercentage = Math.max(0, Math.min(1, normalizedRating - index)) * 100

        return (
          <span key={index} aria-hidden="true" className="relative inline-block h-5 w-5 text-xl leading-5 text-[#ddd5ca]">
            ★
            <span className="absolute inset-0 overflow-hidden text-[#b88952]" style={{ width: `${fillPercentage}%` }}>
              ★
            </span>
          </span>
        )
      })}
    </div>
  )
}

type TodayAvailabilityState = {
  status: 'idle' | 'loading' | 'ready' | 'error'
  slots: TimeSlot[]
  updatedAt?: Date
}

export default function RoomDetailModal({ room, open, onClose, onBook }: RoomDetailModalProps) {
  const [todayAvailability, setTodayAvailability] = useState<TodayAvailabilityState>({
    status: 'idle',
    slots: [],
  })

  useEffect(() => {
    if (!open || !room?.id) return

    let active = true
    setTodayAvailability({ status: 'loading', slots: [] })

    void fetchAvailableSlots(room.id, getTodayDateString())
      .then((slots) => {
        if (!active) return
        setTodayAvailability({ status: 'ready', slots, updatedAt: new Date() })
      })
      .catch(() => {
        if (!active) return
        setTodayAvailability({ status: 'error', slots: [] })
      })

    return () => {
      active = false
    }
  }, [open, room?.id])

  const todayStatus = useMemo(() => {
    const availableSlots = todayAvailability.slots.filter((slot) => slot.status === 'available')
    const firstAvailableSlot = availableSlots[0]
    const isOperational = room?.operationalStatus !== 'MAINTENANCE' && room?.operationalStatus !== 'INACTIVE'

    if (!isOperational) {
      return {
        tone: 'closed' as const,
        eyebrow: 'Tạm ngưng phục vụ',
        title: 'Phòng đang bảo trì',
        description: 'Phòng chưa nhận booking mới. Vui lòng chọn một phòng khác.',
      }
    }
    if (todayAvailability.status === 'loading' || todayAvailability.status === 'idle') {
      return {
        tone: 'loading' as const,
        eyebrow: 'Đang đồng bộ',
        title: 'Kiểm tra lịch hôm nay…',
        description: 'Hệ thống đang đối chiếu các booking hiện tại.',
      }
    }
    if (todayAvailability.status === 'error') {
      return {
        tone: 'error' as const,
        eyebrow: 'Chưa thể đồng bộ',
        title: 'Mở lịch để kiểm tra',
        description: 'Kết nối lịch tạm thời gián đoạn. Bạn vẫn có thể chọn ngày và kiểm tra lại.',
      }
    }
    if (availableSlots.length === 0) {
      return {
        tone: 'full' as const,
        eyebrow: 'Lịch hôm nay',
        title: 'Đã kín khung giờ',
        description: 'Hôm nay không còn khung giờ phù hợp. Hãy chuyển sang ngày khác.',
      }
    }

    return {
      tone: 'available' as const,
      eyebrow: 'Cập nhật theo thời gian thực',
      title: `${availableSlots.length} khung giờ còn trống`,
      description: firstAvailableSlot
        ? `Khung gần nhất: ${firstAvailableSlot.start} – ${firstAvailableSlot.end}`
        : 'Bạn có thể chọn giờ nhận phòng phù hợp.',
    }
  }, [room?.operationalStatus, todayAvailability])

  if (!open || !room) return null

  const factualDetails = [
    { label: 'Loại phòng', value: room.type },
    { label: 'Vị trí', value: room.location },
    { label: 'Sức chứa', value: room.capacity },
  ]

  return (
    <HomepageModalShell
      open={open}
      onClose={onClose}
      labelledBy="room-detail-title"
      maxWidthClassName="max-w-[1040px]"
      bodyClassName="bg-[#F6F3ED] p-0"
    >
        <div className="relative aspect-[16/9] min-h-[220px] overflow-hidden rounded-t-[24px] bg-[#173A31] sm:aspect-[21/9]">
          {room.image ? (
            <Image
              src={room.image}
              alt={room.name}
              fill
              unoptimized
              sizes="(min-width: 768px) 880px, 100vw"
              className={`object-cover ${room.imageClassName}`}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,#EDE0CF,transparent_52%),linear-gradient(135deg,#173A31,#0B3E24)] px-6 text-center">
              <div>
                <p className="font-display text-2xl font-bold text-white">{room.name}</p>
                <p className="mt-3 text-sm text-white/72">Backend chưa cung cấp ảnh cho phòng này.</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(4,42,22,0.86),rgba(4,42,22,0.2)_55%,rgba(4,42,22,0.1))]" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#EDE0CF] px-3 py-1 font-display text-xs font-bold uppercase text-[#173A31]">
                {room.categoryLabel}
              </span>
              {room.badge && (
                <span className="rounded-full bg-[#B28455] px-3 py-1 font-display text-xs font-bold uppercase text-white">
                  {room.badge}
                </span>
              )}
            </div>
            <h2 id="room-detail-title" className="font-display text-3xl font-bold text-white sm:text-4xl">
              {room.name}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/72">
              {room.description || 'Backend chưa cung cấp mô tả chi tiết cho phòng này.'}
            </p>
          </div>
        </div>

        <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1fr_300px]">
          <div className="space-y-5">
            <section className="rounded-xl border border-[#E4DED3] bg-white p-5 shadow-[0_12px_34px_rgba(26,28,30,0.06)]">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="min-w-0">
                  <p className="font-display text-xs font-bold uppercase tracking-[0.08em] text-[#6A6C66]">Đánh giá khách hàng</p>
                  {typeof room.rating === 'number' && (room.reviews ?? 0) > 0 ? (
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-display text-2xl font-bold text-[#242A27]">{room.rating.toFixed(1)}</span>
                      <RatingStars rating={room.rating} />
                      <span className="w-full text-xs font-medium text-[#77786f]">Từ {room.reviews} đánh giá đã xác thực</span>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="font-display text-base font-bold text-[#242A27]">Chưa có đánh giá</p>
                      <p className="mt-1 text-xs text-[#77786f]">Hãy là khách hàng đầu tiên nhận xét phòng này.</p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-display text-xs font-bold uppercase text-[#6A6C66]">Sức chứa</p>
                  <p className="mt-1 font-display text-xl font-bold text-[#242A27]">{room.capacity}</p>
                </div>
                <div>
                  <p className="font-display text-xs font-bold uppercase text-[#6A6C66]">Giá mỗi đêm</p>
                  <p className="mt-1 font-display text-xl font-bold text-[#B28455]">
                    {formatCurrency(getNightlyDisplayPrice(room.pricePerHour))} / đêm
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-[#E4DED3] bg-white p-5 shadow-[0_12px_34px_rgba(26,28,30,0.06)]">
              <h3 className="font-display text-lg font-bold text-[#242A27]">Tiện nghi có sẵn</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {room.includedEquipments.map((item) => (
                  <span
                    key={item}
                    className="rounded-lg border border-[#E4DED3] bg-[#F6F3ED] px-3 py-2 font-display text-xs font-semibold text-[#6A6C66]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-[#E4DED3] bg-white p-5 shadow-[0_12px_34px_rgba(26,28,30,0.06)]">
              <h3 className="font-display text-lg font-bold text-[#242A27]">Thông tin phòng</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {factualDetails.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-[#E4DED3] bg-[#FBF9F5] p-4">
                    <p className="font-display text-xs font-bold uppercase text-[#6A6C66]">{item.label}</p>
                    <p className="mt-2 text-sm font-medium leading-6 text-[#242A27]">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <RoomReviewsSection roomId={room.id} />
          </div>

          <aside className="space-y-5">
            <section className={[
              'overflow-hidden rounded-2xl border p-5 shadow-[0_14px_36px_rgba(26,28,30,0.07)]',
              todayStatus.tone === 'available' ? 'border-[#b9d7ca] bg-[linear-gradient(145deg,#f2faf6,#fff)]' :
              todayStatus.tone === 'full' || todayStatus.tone === 'closed' ? 'border-[#e2c7bd] bg-[linear-gradient(145deg,#fff7f3,#fff)]' :
              'border-[#e4d8c8] bg-[linear-gradient(145deg,#fbf7f1,#fff)]',
            ].join(' ')}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-[#9a6e3f]">{todayStatus.eyebrow}</p>
                <span className={[
                  'h-2.5 w-2.5 rounded-full',
                  todayStatus.tone === 'available' ? 'bg-[#3f8068] shadow-[0_0_0_5px_rgba(63,128,104,.12)]' :
                  todayStatus.tone === 'loading' ? 'animate-pulse bg-[#b88952]' :
                  'bg-[#b45f53] shadow-[0_0_0_5px_rgba(180,95,83,.10)]',
                ].join(' ')} aria-hidden />
              </div>
              <p className="mt-3 font-display text-[26px] font-bold leading-tight text-[#242A27]">{todayStatus.title}</p>
              <p className="mt-2 text-sm leading-6 text-[#666b65]">{todayStatus.description}</p>
              {todayAvailability.updatedAt && todayStatus.tone !== 'error' && (
                <p className="mt-3 border-t border-black/5 pt-3 text-[11px] font-medium text-[#85867e]">
                  Cập nhật lúc {todayAvailability.updatedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
              <button
                type="button"
                onClick={() => onBook(room)}
                className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#d7c2a8] bg-white text-sm font-bold text-[#715334] transition hover:border-[#b88952] hover:bg-[#f7efe4]"
              >
                Xem lịch & chọn khung giờ
                <span aria-hidden>→</span>
              </button>
            </section>

            <section className="rounded-xl border border-[#E4DED3] bg-white p-5 shadow-[0_12px_34px_rgba(26,28,30,0.06)]">
              <h3 className="font-display text-lg font-bold text-[#242A27]">Chính sách</h3>
              <div className="mt-4 space-y-3">
                {roomPolicies.map((policy) => (
                  <div key={policy} className="flex gap-2 text-sm leading-6 text-[#6A6C66]">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B28455]" />
                    <span>{policy}</span>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => onBook(room)}
                className="rounded-lg bg-[#B28455] px-5 py-3.5 font-display text-sm font-bold text-white shadow-[0_14px_34px_rgba(178,132,85,0.28)] transition hover:bg-[#946A42]"
              >
                Đặt phòng này
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[#E4DED3] bg-white px-5 py-3.5 font-display text-sm font-bold text-[#6A6C66] transition hover:bg-[#EDE0CF] hover:text-[#242A27]"
              >
                Đóng
              </button>
            </div>
          </aside>
        </div>
    </HomepageModalShell>
  )
}
