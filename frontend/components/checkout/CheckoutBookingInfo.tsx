'use client'

import Image from 'next/image'
import { formatDisplayDate, type CheckoutBooking } from '@/lib/checkout-data'
import { useState, type ReactNode } from 'react'

export default function CheckoutBookingInfo({ booking }: { booking: CheckoutBooking }) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const roomImage = booking.image ?? ''

  const showRoomImage = Boolean(roomImage) && failedImageUrl !== roomImage

  return (
    <section className="overflow-hidden rounded-[28px] border border-[#DED7CB] bg-white shadow-[0_18px_50px_rgba(45,42,36,0.08)]">
      <div className="relative min-h-[190px] overflow-hidden bg-gradient-to-br from-[#234D42] via-[#52766B] to-[#B28455]">
        {showRoomImage ? (
          <Image
            src={roomImage}
            alt={`Ảnh đại diện phòng ${booking.roomName}`}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 720px"
            className="absolute inset-0 h-full w-full object-cover"
            priority
            onError={() => setFailedImageUrl(roomImage)}
          />
        ) : (
          <div aria-hidden className="absolute inset-0 opacity-30">
            <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full border border-white/40" />
            <div className="absolute right-10 top-8 h-36 w-36 rounded-full border border-white/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#234D42]/85 via-[#234D42]/15 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">{booking.categoryLabel}</p>
              <h2 className="mt-1 font-display text-2xl font-bold">{booking.roomName}</h2>
            </div>
            <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-bold backdrop-blur-sm">{booking.bookingId}</span>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A97643]">Thông tin lưu trú</p>
            <p className="mt-1 text-sm text-[#6A6C66]">Kiểm tra lại trước khi thanh toán</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF4EF] px-3 py-1.5 text-xs font-bold text-[#205746]">
            <CheckIcon /> Đã xác nhận
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Detail icon={<CalendarIcon />} label="Nhận phòng" value={`${formatDisplayDate(booking.date)} · ${booking.startTime}`} />
          <Detail icon={<CalendarIcon />} label="Trả phòng" value={`${formatDisplayDate(booking.endDate)} · ${booking.endTime}`} />
          <Detail icon={<DurationIcon />} label="Thời lượng" value={`${Math.max(1, Math.round((booking.duration + 2) / 24))} đêm · ${booking.duration} giờ`} />
          <Detail icon={<LocationIcon />} label="Địa điểm" value={booking.location} />
        </div>

        {booking.equipments.length > 0 && (
          <div className="mt-6 border-t border-[#E9E3D9] pt-5">
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#6A6C66]">Tiện nghi nổi bật</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {booking.equipments.slice(0, 6).map((item) => (
                <span key={item} className="rounded-full border border-[#E5DDD1] bg-[#FAF7F2] px-3 py-1.5 text-xs font-medium text-[#5F655F]">{item}</span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#E7E0D5] bg-[#FCFAF6] p-4 text-sm leading-6 text-[#666B65]">
          <InfoIcon />
          <p>Phòng được giữ trong thời gian thanh toán. Nếu chọn đặt cọc, nhân viên sẽ kết toán phần còn lại khi checkout.</p>
        </div>
      </div>
    </section>
  )
}

function Detail({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#E9E3D9] bg-[#FCFAF7] p-3.5">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#7A7D76]">{icon}{label}</p>
      <p className="mt-2 text-sm font-bold leading-5 text-[#29302C]">{value}</p>
    </div>
  )
}

function CheckIcon() { return <svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m6 12.5 4 4L18 8" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function CalendarIcon() { return <svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4m8-4v4M4 10h16" /></svg> }
function DurationIcon() { return <svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 3h10M7 21h10M8 3c0 4 1.5 6 4 9-2.5 3-4 5-4 9m8-18c0 4-1.5 6-4 9 2.5 3 4 5 4 9" strokeLinecap="round" /></svg> }
function LocationIcon() { return <svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" /><circle cx="12" cy="10" r="2" /></svg> }
function InfoIcon() { return <svg aria-hidden viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-[#A97643]" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" strokeLinecap="round" /></svg> }
