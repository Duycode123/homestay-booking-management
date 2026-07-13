'use client'

import axios from 'axios'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_BOOKING_DATE,
  DEFAULT_START_TIME,
  EMPTY_NOTE_TEXT,
  calculateEndTime,
  detectRoomCategory,
  findBookingRoom,
  formatCurrency,
  formatDisplayDate,
  getBookingRoomOrFallback,
  normalizeDuration,
  paymentMethods,
  type BookingRoom,
  type PaymentMethod,
  type PaymentMethodId,
} from '@/components/booking/booking-data'
import { useAuth } from '@/contexts/AuthContext'
import CheckoutCouponInput from '@/components/checkout/CheckoutCouponInput'
import { clearQuickBookingDraft } from '@/components/booking/quick-booking-draft'
import {
  clearConfirmationCouponDraft,
  getConfirmationCouponDraft,
  saveConfirmationCouponDraft,
} from '@/lib/booking-coupon-draft'
import { resolveBookingRoom } from '@/lib/booking-room-service'
import { createBooking, mapPaymentMethodToBackend } from '@/lib/booking/bookingApi'
import type { AppliedDiscount } from '@/lib/discount-service'
import { savePendingBooking } from '@/lib/pending-booking'

export default function BookingConfirmationClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const roomId = searchParams.get('roomId')
  const staticRoom = useMemo(() => findBookingRoom(roomId), [roomId])
  const fallbackRoom = staticRoom ?? getBookingRoomOrFallback(roomId)
  const apiRoom = useMemo(() => getApiBookingRoom(searchParams), [searchParams])
  const shouldResolveBackendRoom = Boolean(roomId && !apiRoom && !isNumericRoomId(roomId))

  const [room, setRoom] = useState<BookingRoom>(apiRoom ?? fallbackRoom)
  const [roomMissing, setRoomMissing] = useState(Boolean(roomId && !staticRoom && !apiRoom))
  const [isResolvingRoom, setIsResolvingRoom] = useState(shouldResolveBackendRoom || Boolean(roomId && !staticRoom && !apiRoom))
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('bank_transfer')
  const [confirmError, setConfirmError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null)

  const displayRoom = apiRoom ?? room
  const roomSubtotal = displayRoom.pricePerHour * getBookingDuration(searchParams)
  const discountAmount = Math.min(appliedDiscount?.discountAmount ?? 0, roomSubtotal)
  const totalAfterDiscount = Math.max(0, roomSubtotal - discountAmount)
  const activePaymentMethod = paymentMethods.find((method) => method.id === paymentMethod) ?? paymentMethods[0]
  const selectionHref = '/rooms'
  const date = searchParams.get('date') || DEFAULT_BOOKING_DATE
  const startTime = searchParams.get('startTime') || DEFAULT_START_TIME
  const duration = getBookingDuration(searchParams)
  const endTime = searchParams.get('endTime') || calculateEndTime(startTime, duration)
  const note = searchParams.get('note')?.trim() || EMPTY_NOTE_TEXT
  const couponDraftKey = {
    roomId: displayRoom.id,
    date,
    startTime,
    endTime,
  }

  useEffect(() => {
    if (!displayRoom.id) return

    setAppliedDiscount(getConfirmationCouponDraft(couponDraftKey))
  }, [date, displayRoom.id, endTime, startTime])

  useEffect(() => {
    if (apiRoom) {
      setRoom(apiRoom)
      setRoomMissing(false)
      setIsResolvingRoom(false)
      return
    }

    let active = true
    setRoom(fallbackRoom)
    setRoomMissing(Boolean(roomId && !staticRoom))
    setIsResolvingRoom(shouldResolveBackendRoom || Boolean(roomId && !staticRoom))

    async function loadRoom() {
      const resolvedRoom = await resolveBookingRoom(roomId)
      if (!active) return

      setRoom(resolvedRoom ?? fallbackRoom)
      setRoomMissing(Boolean(roomId && (!resolvedRoom || !isNumericRoomId(resolvedRoom.id))))
      setIsResolvingRoom(false)
    }

    void loadRoom()

    return () => {
      active = false
    }
  }, [apiRoom, fallbackRoom, roomId, shouldResolveBackendRoom, staticRoom])

  const handleConfirm = async () => {
    if (isAuthLoading) {
      setConfirmError('Hệ thống đang kiểm tra phiên đăng nhập. Vui lòng thử lại sau vài giây.')
      return
    }

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (isResolvingRoom) {
      setConfirmError('Đang tải thông tin phòng. Vui lòng thử lại sau vài giây.')
      return
    }

    if (!displayRoom.id || roomMissing || !isNumericRoomId(displayRoom.id)) {
      setConfirmError('Vui lòng quay lại bước chọn phòng và chọn một phòng hợp lệ.')
      return
    }

    if (!date || !startTime || !duration || !paymentMethod) {
      setConfirmError('Vui lòng kiểm tra ngày đặt, giờ bắt đầu, thời lượng và phương thức thanh toán.')
      return
    }

    setConfirmError('')
    setIsSubmitting(true)

    try {
      const booking = await createBooking({
        roomId: displayRoom.id,
        date,
        startTime,
        endTime,
        paymentMethod: mapPaymentMethodToBackend(paymentMethod),
        couponCode: appliedDiscount?.code,
        note: note === EMPTY_NOTE_TEXT ? '' : note,
      })

      savePendingBooking({
        bookingId: booking.bookingCode || String(booking.bookingId),
        roomId: displayRoom.id,
        date,
        startTime,
        endTime,
        duration,
        addons: [],
        note,
        method: paymentMethod,
        discountCode: appliedDiscount?.code,
        discountAmount: appliedDiscount?.discountAmount,
      })

      clearConfirmationCouponDraft()
      clearQuickBookingDraft()

      const params = new URLSearchParams({
        bookingId: booking.bookingCode || String(booking.bookingId),
        backendBookingId: String(booking.bookingId),
        roomId: displayRoom.id,
        method: paymentMethod,
      })

      if (appliedDiscount) {
        params.set('discountCode', appliedDiscount.code)
        params.set('discountAmount', String(appliedDiscount.discountAmount))
      }

      router.push(`/customer/checkout?${params.toString()}`)
    } catch (error) {
      setConfirmError(getBookingErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F2EC] text-[#1A1C1E]">

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2 font-display text-sm text-[#5C5348]">
              <Link href="/" className="hover:text-[#1A1C1E]">
                Trang chủ
              </Link>
              <span>/</span>
              <Link href={selectionHref} className="hover:text-[#1A1C1E]">
                Phòng homestay
              </Link>
              <span>/</span>
              <span className="text-[#1A1C1E]">Xác nhận đặt phòng</span>
            </div>

            <h1 className="font-display text-4xl font-bold tracking-tight">Xác nhận đặt phòng</h1>
            <p className="mt-2 text-[#5C5348]">
              Bước này sẽ tạo booking thật trên hệ thống trước khi chuyển sang checkout.
            </p>
          </div>

          <span className="w-fit rounded-full bg-[#0A4D27] px-4 py-2 font-display text-sm font-semibold text-white">
            Sẵn sàng xác nhận
          </span>
        </div>

        {roomMissing && !isResolvingRoom && (
          <div className="mb-6 rounded-2xl border border-[#FF7518]/30 bg-[#FFE8D6] px-4 py-3 text-sm font-medium text-[#6B3200]">
            Không tìm thấy phòng đã chọn. Hệ thống đang hiển thị phòng mặc định để bạn kiểm tra.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <section className="rounded-[24px] border border-[#E8E4DC] bg-white p-6 shadow-[0_4px_24px_rgba(26,28,30,0.06)]">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold">Thông tin đặt phòng</h2>
              {displayRoom.badge && (
                <span className="rounded-full bg-[#FFE8D6] px-3 py-1 font-display text-xs font-bold uppercase tracking-wide text-[#6B3200]">
                  {displayRoom.badge}
                </span>
              )}
            </div>

            {displayRoom.image ? (
              <Image
                src={displayRoom.image}
                alt={displayRoom.name}
                width={900}
                height={420}
                className={`h-[260px] w-full rounded-2xl object-cover ${displayRoom.imageClassName}`}
                priority
              />
            ) : (
              <div className="flex h-[260px] w-full items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top,#FFE8D6,transparent_55%),linear-gradient(135deg,#F5F2EC,#E8E4DC)] px-6 text-center">
                <div>
                  <p className="font-display text-2xl font-bold text-[#6B3200]">{displayRoom.name}</p>
                  <p className="mt-2 text-sm text-[#5C5348]">Hệ thống chưa có ảnh phòng cho mục này.</p>
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <h3 className="font-display text-2xl font-bold">{displayRoom.name}</h3>
              {typeof displayRoom.rating === 'number' && (
                <span className="font-display font-semibold text-[#B45309]">* {displayRoom.rating.toFixed(1)}</span>
              )}
            </div>

            <p className="mt-1 text-[#5C5348]">{displayRoom.type}</p>

            <div className="mt-6 grid gap-4 border-b border-[#E8E4DC] pb-6 sm:grid-cols-2">
              <Detail label="Ngày đặt" value={formatDisplayDate(date)} />
              <Detail label="Khung giờ" value={`${startTime} - ${endTime}`} />
              <Detail label="Thời lượng" value={`${duration} giờ`} />
              <Detail label="Số người" value={displayRoom.capacity} />
              <Detail label="Địa điểm" value={displayRoom.location} />
            </div>

            <InfoSection title="Tiện nghi hiển thị" items={displayRoom.includedEquipments} />

            <div className="mt-6">
              <h3 className="font-display text-lg font-bold">Ghi chú khách hàng</h3>
              <div className="mt-3 whitespace-pre-wrap rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-4 text-[#5C5348]">
                {note}
              </div>
            </div>
          </section>

          <aside className="h-fit rounded-[24px] border border-[#E8E4DC] bg-white p-6 shadow-[0_4px_24px_rgba(26,28,30,0.06)] lg:sticky lg:top-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                  <p className="font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">
                    Tóm tắt thanh toán
                  </p>
                  <p className="mt-1 font-display font-semibold">Booking sẽ được tạo trước khi vào checkout</p>
                </div>
                <span className="rounded-full bg-[#FFE8D6] px-3 py-1 font-display text-xs font-bold text-[#6B3200]">
                  Chờ thanh toán
                </span>
              </div>

            <PaymentRow label="Giá phòng" value={`${formatCurrency(displayRoom.pricePerHour)} / giờ`} />
            <PaymentRow label="Thời lượng" value={`${duration} giờ`} />

            <div className="my-4 h-px bg-[#E8E4DC]" />

            <PaymentRow label="Tiền phòng" value={formatCurrency(roomSubtotal)} />

            <div className="my-4">
              <CheckoutCouponInput
                subtotal={roomSubtotal}
                appliedDiscount={appliedDiscount}
                disabled={isSubmitting}
                onApplied={(discount) => {
                  setAppliedDiscount(discount)
                  saveConfirmationCouponDraft(couponDraftKey, discount)
                  setConfirmError('')
                }}
                onRemoved={() => {
                  setAppliedDiscount(null)
                  saveConfirmationCouponDraft(couponDraftKey, null)
                }}
              />
            </div>

            {appliedDiscount && (
              <PaymentRow
                label={`Mã giảm giá (${appliedDiscount.code})`}
                value={`-${formatCurrency(discountAmount)}`}
                green
              />
            )}

            <div className="my-5 rounded-2xl bg-[#FAF8F4] p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="font-display text-lg font-bold">Tổng tham chiếu</span>
                <span className="font-display text-3xl font-bold text-[#FF7518]">
                  {formatCurrency(totalAfterDiscount)}
                </span>
              </div>
            </div>

            <h3 className="font-display text-lg font-bold">Phương thức thanh toán</h3>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
              {paymentMethods.map((method) => (
                <PaymentMethodOption
                  key={method.id}
                  method={method}
                  active={paymentMethod === method.id}
                  onSelect={() => {
                    setPaymentMethod(method.id)
                    setConfirmError('')
                  }}
                />
              ))}
            </div>

            <PaymentInstruction method={activePaymentMethod} />

            {confirmError && (
              <p className="mt-4 rounded-2xl border border-[#C62828]/20 bg-[#FFEBEE] px-4 py-3 text-sm text-[#C62828]">
                {confirmError}
              </p>
            )}

            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={isSubmitting}
              className="mt-6 h-12 w-full rounded-2xl bg-[#FF7518] font-display font-semibold text-white transition hover:bg-[#E6640F] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt phòng'}
            </button>

            <Link
              href={selectionHref}
              className="mt-3 flex h-12 w-full items-center justify-center rounded-2xl border border-[#C9C2B6] bg-transparent font-display font-semibold text-[#1A1C1E] transition hover:bg-[#FAF8F4]"
            >
              Quay lại chọn phòng
            </Link>
          </aside>
        </div>
      </section>
    </main>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  )
}

function InfoSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-6">
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full bg-[#F0EDE6] px-3 py-1 text-sm text-[#5C5348]">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function PaymentRow({ label, value, green = false }: { label: string; value: string; green?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-[#5C5348]">{label}</span>
      <span className={['font-semibold', green ? 'text-[#0A4D27]' : 'text-[#1A1C1E]'].join(' ')}>{value}</span>
    </div>
  )
}

function PaymentMethodOption({
  method,
  active,
  onSelect,
}: {
  method: PaymentMethod
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'min-h-16 rounded-2xl px-3 text-left font-display text-xs font-semibold transition',
        active
          ? 'border border-[#FF7518] bg-[#FFE8D6] text-[#6B3200]'
          : 'border border-[#E8E4DC] bg-white text-[#5C5348] hover:bg-[#FAF8F4]',
      ].join(' ')}
      aria-pressed={active}
    >
      <span className="flex items-center justify-between gap-2">
        <span>{method.label}</span>
        {active && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF7518] text-xs text-white">
            OK
          </span>
        )}
      </span>
    </button>
  )
}

function PaymentInstruction({ method }: { method: PaymentMethod }) {
  return (
    <div className="mt-5 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-4 text-sm text-[#5C5348]">
      <p className="font-display font-semibold text-[#1A1C1E]">{method.label}</p>
      <p className="mt-2">{method.description}</p>
      <p className="mt-2">Ở bước tiếp theo, bạn sẽ chọn đặt cọc 50.000 VND hoặc thanh toán toàn bộ.</p>
    </div>
  )
}

function getBookingErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || 'Không thể tạo booking. Vui lòng thử lại.'
  }

  return error instanceof Error ? error.message : 'Không thể tạo booking. Vui lòng thử lại.'
}

function getBookingDuration(searchParams: { get(name: string): string | null }) {
  return normalizeDuration(searchParams.get('duration'))
}

function formatCapacityLabel(value: string | null, fallback: string) {
  if (!value) return fallback

  const normalized = value.trim()
  if (!normalized) return fallback
  if (/\D/.test(normalized)) return normalized

  return `Tối đa ${normalized} người`
}

function getApiBookingRoom(searchParams: { get(name: string): string | null }): BookingRoom | null {
  const source = searchParams.get('source')

  if (source !== 'dashboard-booking' && source !== 'api-booking') {
    return null
  }

  const roomId = searchParams.get('roomId')
  const roomName = searchParams.get('roomName')?.trim()

  if (!roomId || !roomName) {
    return null
  }

  const roomType = searchParams.get('roomType')?.trim() || 'Practice Room'
  const roomHighlights = parseCsvParam(searchParams.get('roomHighlights'))
  const rawPrice = Number(searchParams.get('pricePerHour'))
  const pricePerHour = Number.isFinite(rawPrice) && rawPrice > 0 ? rawPrice : 0
  const roomImage = searchParams.get('roomImage')?.trim()
  const safeImage = roomImage?.startsWith('/') ? roomImage : undefined
  const category = detectRoomCategory(roomType)

  return {
    id: roomId,
    code: `PENDING-${roomId}`,
    name: roomName,
    category,
    categoryLabel: roomType,
    type: roomType,
    roomTierId: undefined,
    roomTierName: roomType,
    roomTierDescription: undefined,
    badge: undefined,
    rating: undefined,
    reviews: undefined,
    capacity: formatCapacityLabel(searchParams.get('roomCapacity'), 'Chưa rõ sức chứa'),
    location: searchParams.get('roomLocation')?.trim() || 'Homestay Booking',
    image: safeImage,
    imageClassName: 'object-center',
    pricePerHour,
    equipments: roomHighlights,
    includedEquipments: roomHighlights.length > 0 ? roomHighlights : [roomType],
    addons: [],
    description: searchParams.get('roomDescription')?.trim() || undefined,
    availabilityStatus: undefined,
    remainingSlots: undefined,
    nextAvailableSlot: undefined,
    isAvailable: false,
    availabilityKnown: false,
    nextAvailableTime: undefined,
    note: undefined,
  }
}

function parseCsvParam(value: string | null) {
  if (!value) return []

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function isNumericRoomId(value: string | null | undefined) {
  return Boolean(value && /^\d+$/.test(value))
}
