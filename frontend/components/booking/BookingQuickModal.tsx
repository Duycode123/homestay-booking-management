'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import BookingSchedulePicker from '@/components/booking/BookingSchedulePicker'
import HomepageModalShell from '@/components/booking/HomepageModalShell'
import {
  clearQuickBookingDraft,
  getQuickBookingRestoreHref,
  saveQuickBookingDraft,
  type QuickBookingSourceRoute,
} from '@/components/booking/quick-booking-draft'
import { useAuth } from '@/contexts/AuthContext'
import {
  DEFAULT_DURATION,
  formatCurrency,
  getTodayDateString,
  getRoomSubtotal,
  isApiBackedBookingRoom,
  normalizeDuration,
  type BookingRoom,
} from '@/components/booking/booking-data'
import type { BookingScheduleValue } from '@/components/booking/booking-time-utils'

type BookingQuickModalProps = {
  room: BookingRoom
  open: boolean
  initialDate?: string
  initialStartTime?: string
  initialDuration?: number
  initialNote?: string
  sourceRoute?: QuickBookingSourceRoute
  returnPath?: string
  onClose: () => void
}

export default function BookingQuickModal({
  room,
  open,
  initialDate,
  initialStartTime,
  initialDuration,
  initialNote,
  sourceRoute = '/',
  returnPath,
  onClose,
}: BookingQuickModalProps) {
  const router = useRouter()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const hasInitialTime = Boolean(initialStartTime && initialDuration && initialDuration > 0)
  const [date, setDate] = useState(initialDate || getTodayDateString())
  const [startTime, setStartTime] = useState(hasInitialTime ? initialStartTime || '' : '')
  const [duration, setDuration] = useState(hasInitialTime ? normalizeDuration(initialDuration ?? DEFAULT_DURATION) : 0)
  const [endTime, setEndTime] = useState('')
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])
  const [note, setNote] = useState(initialNote ?? '')
  const [error, setError] = useState('')

  const roomSubtotal = useMemo(() => getRoomSubtotal(room, duration), [room, duration])
  const restoreHref = getQuickBookingRestoreHref(sourceRoute)

  const handleClose = () => {
    clearQuickBookingDraft()
    onClose()
  }

  useEffect(() => {
    if (!open) return

    setDate(initialDate || getTodayDateString())
    const shouldPrefillTime = Boolean(initialStartTime && initialDuration && initialDuration > 0)
    setStartTime(shouldPrefillTime ? initialStartTime || '' : '')
    setDuration(shouldPrefillTime ? normalizeDuration(initialDuration ?? DEFAULT_DURATION) : 0)
    setEndTime('')
    setSelectedSlots([])
    setNote(initialNote ?? '')
    setError('')
  }, [initialDate, initialDuration, initialNote, initialStartTime, open, room.id])

  if (!open) return null

  const handleScheduleChange = useCallback((value: BookingScheduleValue) => {
    setDate(value.date)
    setStartTime(value.startTime)
    setEndTime(value.endTime)
    setDuration(value.duration)
    setSelectedSlots(value.selectedSlots)
    setError('')
  }, [])

  const handleContinue = () => {
    if (!date || !startTime || !endTime || duration < 1 || selectedSlots.length === 0) {
      setError('Vui lòng chọn khung giờ đặt phòng.')
      return
    }

    if (isAuthLoading) {
      setError('Hệ thống đang kiểm tra phiên đăng nhập. Vui lòng thử lại sau vài giây.')
      return
    }

    if (!isAuthenticated) {
      saveQuickBookingDraft({
        sourceRoute,
        selectedRoom: room,
        room,
        selectedDate: date,
        selectedSlot: {
          startTime,
          endTime,
        },
        selectedTimeRange: {
          startTime,
          endTime,
        },
        selectedSlots,
        selectedStartTime: startTime,
        selectedEndTime: endTime,
        selectedDuration: duration,
        customerNote: note,
        totalPrice: roomSubtotal,
        currentStep: 'confirmation',
        timestamp: Date.now(),
        initialDate: date,
        initialStartTime: startTime,
        initialDuration: duration,
        initialNote: note,
        returnPath: restoreHref,
      })
      router.push(`/login?returnUrl=${encodeURIComponent(restoreHref)}`)
      return
    }

    const params = new URLSearchParams({
      roomId: room.id,
      date,
      startTime,
      endTime,
      duration: String(duration),
      slots: selectedSlots.join(','),
      note,
      returnTo: returnPath ?? restoreHref,
    })

    if (isApiBackedBookingRoom(room)) {
      params.set('source', 'api-booking')
      params.set('roomName', room.name)
      params.set('roomType', room.type)
      params.set('roomCapacity', room.capacity.replace(/[^\d]/g, ''))
      params.set('roomLocation', room.location)
      if (room.description) {
        params.set('roomDescription', room.description)
      }
      params.set('roomHighlights', room.includedEquipments.join(','))
      params.set('pricePerHour', String(room.pricePerHour))
      if (room.image) {
        params.set('roomImage', room.image)
      }
    }

    router.push(`/rooms/confirmation?${params.toString()}`)
  }

  return (
    <HomepageModalShell
      open={open}
      onClose={handleClose}
      labelledBy="quick-booking-title"
      eyebrow="Đặt phòng"
      title="Xác nhận nhanh"
      description="Đặt phòng nhanh này đã bỏ add-on mock và chỉ giữ thông tin mà backend hiện đang xử lý được."
      maxWidthClassName="max-w-[720px]"
      bodyClassName="space-y-0 bg-white"
      footer={
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="h-12 rounded-2xl border border-[#C9C2B6] bg-transparent font-display font-semibold text-[#1A1C1E] transition hover:bg-[#FAF8F4]"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleContinue}
            disabled={duration < 1 || selectedSlots.length === 0}
            className="h-12 rounded-2xl bg-[#FF7518] font-display font-semibold text-white transition hover:bg-[#E6640F] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Tiếp tục đặt phòng
          </button>
        </div>
      }
    >
        <div className="grid gap-5 sm:grid-cols-[170px_1fr]">
          {room.image ? (
            <Image
              src={room.image}
              alt={room.name}
              width={340}
              height={250}
              className={`h-[150px] w-full rounded-2xl object-cover ${room.imageClassName}`}
              priority
            />
          ) : (
            <div className="flex h-[150px] w-full items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top,#FFE8D6,transparent_55%),linear-gradient(135deg,#F5F2EC,#E8E4DC)] px-4 text-center">
              <div>
                <p className="font-display text-lg font-bold text-[#6B3200]">{room.name}</p>
                <p className="mt-2 text-sm text-[#5C5348]">Backend chưa cung cấp ảnh phòng.</p>
              </div>
            </div>
          )}

          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="font-display text-xl font-bold text-[#1A1C1E]">{room.name}</h3>
              {room.badge && (
                <span className="rounded-full bg-[#FFE8D6] px-3 py-1 font-display text-xs font-semibold uppercase tracking-wide text-[#6B3200]">
                  {room.badge}
                </span>
              )}
              {typeof room.rating === 'number' && (
                <span className="font-display text-sm font-semibold text-[#B45309]">★ {room.rating.toFixed(1)}</span>
              )}
            </div>

            <div className="space-y-2 text-sm text-[#5C5348]">
              <p>{room.type}</p>
              <p>{room.capacity}</p>
            </div>

            <p className="mt-4 font-display text-2xl font-bold text-[#1A1C1E]">
              {formatCurrency(room.pricePerHour)}
              <span className="ml-1 text-sm font-medium text-[#5C5348]">/ giờ</span>
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {room.equipments.map((item) => (
            <span key={item} className="rounded-full bg-[#F0EDE6] px-3 py-1 text-sm text-[#5C5348]">
              {item}
            </span>
          ))}
        </div>

        <BookingSchedulePicker
          key={`${room.id}-${initialDate ?? 'today'}-${initialStartTime ?? 'empty'}-${initialDuration ?? 0}`}
          roomId={room.id}
          initialDate={date}
          initialStartTime={startTime}
          initialDuration={duration}
          onChange={handleScheduleChange}
          className="mt-6"
        />

        <section className="mt-6 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-4 text-sm text-[#5C5348]">
          Add-on hiện không còn được đề xuất trong quick booking vì backend chưa có contract phần này.
        </section>

        <Field label="Ghi chú khách hàng" className="mt-6 block">
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            placeholder="Ví dụ: Cần chuẩn bị phòng trước 15 phút, ưu tiên tiện nghi vocal rõ."
            className="w-full resize-none rounded-2xl border border-[#C9C2B6] bg-white px-3 py-3 text-sm text-[#1A1C1E] outline-none transition placeholder:text-[#8A8176] focus:border-[#FF7518] focus:ring-2 focus:ring-[#FF7518]/20"
          />
        </Field>

        <div className="mt-5 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-4">
          <SummaryRow label="Giá phòng" value={`${formatCurrency(room.pricePerHour)} / giờ`} />
          <SummaryRow label="Thời lượng" value={duration > 0 ? `${duration} giờ` : 'Chưa chọn'} />
          <SummaryRow label="Khung giờ" value={startTime && endTime ? `${startTime} - ${endTime}` : 'Chưa chọn'} />
          <SummaryRow label="Tiền phòng" value={formatCurrency(roomSubtotal)} />
          <div className="my-3 h-px bg-[#E8E4DC]" />
          <div className="flex items-center justify-between">
            <span className="font-display font-semibold text-[#1A1C1E]">Tạm tính</span>
            <span className="font-display text-2xl font-bold text-[#FF7518]">{formatCurrency(roomSubtotal)}</span>
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-2xl border border-[#C62828]/20 bg-[#FFEBEE] px-4 py-3 text-sm text-[#C62828]">
            {error}
          </p>
        )}
    </HomepageModalShell>
  )
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={className}>
      <span className="mb-1 block font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">
        {label}
      </span>
      {children}
    </label>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-[#5C5348]">{label}</span>
      <span className="font-semibold text-[#1A1C1E]">{value}</span>
    </div>
  )
}
