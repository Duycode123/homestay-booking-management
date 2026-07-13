'use client'

import Image from 'next/image'
import HomepageModalShell from '@/components/booking/HomepageModalShell'
import RoomReviewsSection from '@/components/booking/reviews/RoomReviewsSection'
import {
  formatCurrency,
  type BookingRoom,
} from '@/components/booking/booking-data'

type RoomDetailModalProps = {
  room: BookingRoom | null
  open: boolean
  onClose: () => void
  onBook: (room: BookingRoom) => void
}

const roomPolicies = [
  'Có thể hủy trước 2 giờ',
  'Đến đúng giờ để giữ lịch',
  'Có thể thuê thêm tiện nghi khi đặt phòng',
]

function getAvailabilityLabel(room: BookingRoom) {
  if (!room.availabilityKnown) return 'Xem lịch trống theo thời gian thực'
  if (!room.isAvailable) return 'Kín lịch hôm nay'
  if (room.nextAvailableTime) return `Trống từ ${room.nextAvailableTime}`

  return 'Còn trống hôm nay'
}

function getAvailabilityDescription(room: BookingRoom) {
  if (!room.availabilityKnown) {
    return 'Backend chưa trả về trạng thái phòng theo thời gian thực. Bạn vẫn có thể mở lịch để kiểm tra khung giờ trống.'
  }

  if (room.isAvailable) {
    return 'Dữ liệu lịch trống đang được đồng bộ trực tiếp từ backend cho ngày hôm nay.'
  }

  return 'Backend đang cho biết phòng đã kín lịch trong hôm nay. Bạn có thể chọn ngày khác để kiểm tra lại.'
}

function RatingStars({ rating }: { rating?: number }) {
  const filledStars = typeof rating === 'number' ? Math.max(0, Math.min(5, Math.round(rating))) : 0
  const label = typeof rating === 'number' ? `${rating.toFixed(1)} tren 5 sao` : 'Chua co danh gia'

  return (
    <div className="mt-1 flex items-center gap-1 text-xl" aria-label={label} title={label}>
      {Array.from({ length: 5 }).map((_, index) => {
        const isFilled = index < filledStars

        return (
          <span
            key={index}
            aria-hidden="true"
            className={
              isFilled
                ? "text-[0px] before:text-xl before:text-[#FF7518] before:content-['\\2605']"
                : "text-[0px] before:text-xl before:text-[#D8D1C7] before:content-['\\2605']"
            }
          >
            ★
          </span>
        )
      })}
    </div>
  )
}

export default function RoomDetailModal({ room, open, onClose, onBook }: RoomDetailModalProps) {
  if (!open || !room) return null

  const availabilityLabel = getAvailabilityLabel(room)
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
      bodyClassName="bg-[#F5F2EC] p-0"
    >
        <div className="relative aspect-[16/9] min-h-[220px] overflow-hidden rounded-t-[24px] bg-[#042A16] sm:aspect-[21/9]">
          {room.image ? (
            <Image
              src={room.image}
              alt={room.name}
              fill
              sizes="(min-width: 768px) 880px, 100vw"
              className={`object-cover ${room.imageClassName}`}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,#FFE8D6,transparent_52%),linear-gradient(135deg,#042A16,#0B3E24)] px-6 text-center">
              <div>
                <p className="font-display text-2xl font-bold text-white">{room.name}</p>
                <p className="mt-3 text-sm text-white/72">Backend chưa cung cấp ảnh cho phòng này.</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(4,42,22,0.86),rgba(4,42,22,0.2)_55%,rgba(4,42,22,0.1))]" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#FFE8D6] px-3 py-1 font-display text-xs font-bold uppercase text-[#042A16]">
                {room.categoryLabel}
              </span>
              {room.badge && (
                <span className="rounded-full bg-[#FF7518] px-3 py-1 font-display text-xs font-bold uppercase text-white">
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
            <section className="rounded-xl border border-[#E8E4DC] bg-white p-5 shadow-[0_12px_34px_rgba(26,28,30,0.06)]">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="font-display text-xs font-bold uppercase text-[#5C5348]">Rating</p>
                  <div className="hidden">
                    {typeof room.rating === 'number' ? `${room.rating.toFixed(1)}/5` : 'Chưa có'}
                  </div>
                  <RatingStars rating={room.rating} />
                </div>
                <div>
                  <p className="font-display text-xs font-bold uppercase text-[#5C5348]">Sức chứa</p>
                  <p className="mt-1 font-display text-xl font-bold text-[#1A1C1E]">{room.capacity}</p>
                </div>
                <div>
                  <p className="font-display text-xs font-bold uppercase text-[#5C5348]">Giá theo giờ</p>
                  <p className="mt-1 font-display text-xl font-bold text-[#FF7518]">
                    {formatCurrency(room.pricePerHour)}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-[#E8E4DC] bg-white p-5 shadow-[0_12px_34px_rgba(26,28,30,0.06)]">
              <h3 className="font-display text-lg font-bold text-[#1A1C1E]">Tiện nghi có sẵn</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {room.includedEquipments.map((item) => (
                  <span
                    key={item}
                    className="rounded-lg border border-[#E8E4DC] bg-[#F5F2EC] px-3 py-2 font-display text-xs font-semibold text-[#5C5348]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-[#E8E4DC] bg-white p-5 shadow-[0_12px_34px_rgba(26,28,30,0.06)]">
              <h3 className="font-display text-lg font-bold text-[#1A1C1E]">Thông tin phòng</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {factualDetails.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-4">
                    <p className="font-display text-xs font-bold uppercase text-[#5C5348]">{item.label}</p>
                    <p className="mt-2 text-sm font-medium leading-6 text-[#1A1C1E]">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <RoomReviewsSection roomId={room.id} />
          </div>

          <aside className="space-y-5">
            <section className="rounded-xl border border-[#E8E4DC] bg-white p-5 shadow-[0_12px_34px_rgba(26,28,30,0.06)]">
              <p className="font-display text-xs font-bold uppercase text-[#FF7518]">Trạng thái hôm nay</p>
              <p className="mt-2 font-display text-2xl font-bold text-[#1A1C1E]">{availabilityLabel}</p>
              <p className="mt-2 text-sm leading-6 text-[#5C5348]">{getAvailabilityDescription(room)}</p>
            </section>

            <section className="rounded-xl border border-[#E8E4DC] bg-white p-5 shadow-[0_12px_34px_rgba(26,28,30,0.06)]">
              <h3 className="font-display text-lg font-bold text-[#1A1C1E]">Chính sách</h3>
              <div className="mt-4 space-y-3">
                {roomPolicies.map((policy) => (
                  <div key={policy} className="flex gap-2 text-sm leading-6 text-[#5C5348]">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF7518]" />
                    <span>{policy}</span>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => onBook(room)}
                className="rounded-lg bg-[#FF7518] px-5 py-3.5 font-display text-sm font-bold text-white shadow-[0_14px_34px_rgba(255,117,24,0.28)] transition hover:bg-[#E6640F]"
              >
                Đặt phòng này
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[#E8E4DC] bg-white px-5 py-3.5 font-display text-sm font-bold text-[#5C5348] transition hover:bg-[#FFE8D6] hover:text-[#1A1C1E]"
              >
                Đóng
              </button>
            </div>
          </aside>
        </div>
    </HomepageModalShell>
  )
}
