'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import NightStayPicker from '@/components/booking/NightStayPicker'
import HomepageModalShell from '@/components/booking/HomepageModalShell'
import {
  clearQuickBookingDraft,
  getQuickBookingRestoreHref,
  saveQuickBookingDraft,
  type QuickBookingSourceRoute,
} from '@/components/booking/quick-booking-draft'
import { useAuth } from '@/contexts/AuthContext'
import { shouldBypassImageOptimization } from '@/lib/image-optimization'
import {
  DEFAULT_DURATION,
  FIRST_NIGHT_STAY_HOURS,
  formatCurrency,
  getNightlyDisplayPrice,
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
  initialEndDate?: string
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
  initialEndDate,
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
  const [endDate, setEndDate] = useState(initialEndDate || '')
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

    queueMicrotask(() => {
      setDate(initialDate || getTodayDateString())
      setEndDate(initialEndDate || '')
      const shouldPrefillTime = Boolean(initialStartTime && initialDuration && initialDuration > 0)
      setStartTime(shouldPrefillTime ? initialStartTime || '' : '')
      setDuration(shouldPrefillTime ? normalizeDuration(initialDuration ?? DEFAULT_DURATION) : 0)
      setEndTime('')
      setSelectedSlots([])
      setNote(initialNote ?? '')
      setError('')
    })
  }, [initialDate, initialDuration, initialEndDate, initialNote, initialStartTime, open, room.id])

  const handleScheduleChange = useCallback((value: BookingScheduleValue) => {
    setDate(value.date)
    setEndDate(value.endDate ?? '')
    setStartTime(value.startTime)
    setEndTime(value.endTime)
    setDuration(value.duration)
    setSelectedSlots(value.selectedSlots)
    setError('')
  }, [])

  if (!open) return null

  const handleContinue = () => {
    if (!date || !endDate || !startTime || !endTime || duration < FIRST_NIGHT_STAY_HOURS) {
      setError('Vui lòng chọn tối thiểu 1 đêm (nhận phòng 14:00, trả phòng 12:00 hôm sau).')
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
        selectedEndDate: endDate,
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
        initialEndDate: endDate,
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
      endDate,
      startTime,
      endTime,
      duration: String(duration),
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
      if (room.baseNightlyRate && room.baseNightlyRate > 0) {
        params.set('baseNightlyRate', String(room.baseNightlyRate))
      }
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
      title="Chọn kỳ lưu trú"
      description="Chọn ngày nhận phòng và trả phòng theo số đêm. Lịch được kiểm tra trực tiếp trước khi tiếp tục."
      maxWidthClassName="max-w-[900px]"
      bodyClassName="space-y-0 bg-white"
      footer={
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="h-12 rounded-2xl border border-[#C9C1B4] bg-transparent font-display font-semibold text-[#242A27] transition hover:bg-[#FBF9F5]"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!endDate || duration < FIRST_NIGHT_STAY_HOURS}
            className="h-12 rounded-full bg-secondary px-6 font-display font-semibold text-white shadow-[0_12px_28px_rgba(23,58,49,.22)] transition hover:-translate-y-0.5 hover:bg-secondary-container active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
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
              quality={90}
              unoptimized={shouldBypassImageOptimization(room.image)}
              className={`h-[150px] w-full rounded-2xl object-cover ${room.imageClassName}`}
            />
          ) : (
            <div className="flex h-[150px] w-full items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top,#EDE0CF,transparent_55%),linear-gradient(135deg,#F6F3ED,#E4DED3)] px-4 text-center">
              <div>
                <p className="font-display text-lg font-bold text-[#5E4328]">{room.name}</p>
                <p className="mt-2 text-sm text-[#6A6C66]">Backend chưa cung cấp ảnh phòng.</p>
              </div>
            </div>
          )}

          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="font-display text-xl font-bold text-[#242A27]">{room.name}</h3>
              {room.badge && (
                <span className="rounded-full bg-[#EDE0CF] px-3 py-1 font-display text-xs font-semibold uppercase tracking-wide text-[#5E4328]">
                  {room.badge}
                </span>
              )}
              {typeof room.rating === 'number' && (
                <span className="font-display text-sm font-semibold text-[#B45309]">★ {room.rating.toFixed(1)}</span>
              )}
            </div>

            <div className="space-y-2 text-sm text-[#6A6C66]">
              <p>{room.type}</p>
              <p>{room.capacity}</p>
            </div>

            <p className="mt-4 font-display text-2xl font-bold text-[#242A27]">
              {formatCurrency(getNightlyDisplayPrice(room.pricePerHour))}
              <span className="ml-1 text-sm font-medium text-[#6A6C66]">/ đêm</span>
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {room.equipments.map((item) => (
            <span key={item} className="rounded-full bg-[#EFEAE1] px-3 py-1 text-sm text-[#6A6C66]">
              {item}
            </span>
          ))}
        </div>

        <NightStayPicker
          key={`${room.id}-${initialDate ?? 'today'}-${initialEndDate ?? 'tomorrow'}`}
          roomId={room.id}
          initialDate={date}
          initialEndDate={endDate || undefined}
          onChange={handleScheduleChange}
          className="mt-6"
        />

        <Field label="Yêu cầu thêm cho kỳ lưu trú (không bắt buộc)" className="mt-6 block">
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            placeholder="Ví dụ: Gia đình có trẻ nhỏ, cần chuẩn bị nôi em bé hoặc ưu tiên phòng yên tĩnh."
            className="w-full resize-none rounded-2xl border border-[#C9C1B4] bg-white px-3 py-3 text-sm text-[#242A27] outline-none transition placeholder:text-[#8A8176] focus:border-[#B28455] focus:ring-2 focus:ring-[#B28455]/20"
          />
        </Field>

        <div className="mt-5 rounded-2xl border border-[#E4DED3] bg-[#FBF9F5] p-4">
          <SummaryRow label="Giá tham khảo mỗi đêm" value={`${formatCurrency(getNightlyDisplayPrice(room.pricePerHour))} / đêm`} />
          <SummaryRow label="Ngày lưu trú" value={date && endDate ? `${date} → ${endDate}` : 'Chưa chọn'} />
          <SummaryRow label="Thời lượng" value={duration > 0 ? `${Math.max(1, Math.round((duration + 2) / 24))} đêm · ${duration} giờ` : 'Chưa chọn'} />
          <SummaryRow label="Nhận / trả phòng" value={startTime && endTime ? `${startTime} / ${endTime}` : 'Chưa chọn'} />
          <SummaryRow label="Tiền phòng" value={formatCurrency(roomSubtotal)} />
          <div className="my-3 h-px bg-[#E4DED3]" />
          <div className="flex items-center justify-between">
            <span className="font-display font-semibold text-[#242A27]">Tạm tính</span>
            <span className="font-display text-2xl font-bold text-[#B28455]">{formatCurrency(roomSubtotal)}</span>
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
      <span className="mb-1 block font-display text-xs font-bold uppercase tracking-wider text-[#6A6C66]">
        {label}
      </span>
      {children}
    </label>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-[#6A6C66]">{label}</span>
      <span className="font-semibold text-[#242A27]">{value}</span>
    </div>
  )
}
