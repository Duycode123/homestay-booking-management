'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_BOOKING_DATE,
  DEFAULT_START_TIME,
  EMPTY_BOOKING_ROOM,
  EMPTY_NOTE_TEXT,
  calculateEndTime,
  detectRoomCategory,
  formatCurrency,
  getNightlyDisplayPrice,
  formatDisplayDate,
  normalizeDuration,
  type BookingRoom,
} from '@/components/booking/booking-data'
import { useAuth } from '@/contexts/AuthContext'
import { clearQuickBookingDraft } from '@/components/booking/quick-booking-draft'
import { resolveBookingRoom } from '@/lib/booking-room-service'
import { savePendingBooking } from '@/lib/pending-booking'
import { shouldBypassImageOptimization } from '@/lib/image-optimization'

export default function BookingConfirmationClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const roomId = searchParams.get('roomId')
  const apiRoom = useMemo(() => getApiBookingRoom(searchParams), [searchParams])
  const shouldResolveBackendRoom = Boolean(roomId && !apiRoom)

  const [room, setRoom] = useState<BookingRoom>(apiRoom ?? EMPTY_BOOKING_ROOM)
  const [roomMissing, setRoomMissing] = useState(Boolean(!roomId && !apiRoom))
  const [isResolvingRoom, setIsResolvingRoom] = useState(shouldResolveBackendRoom)
  const [confirmError, setConfirmError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const displayRoom = apiRoom ?? room
  const roomSubtotal = displayRoom.pricePerHour * getBookingDuration(searchParams)
  const paymentMethod = 'bank_transfer' as const
  const selectionHref = '/rooms'
  const date = searchParams.get('date') || DEFAULT_BOOKING_DATE
  const endDate = searchParams.get('endDate') || date
  const startTime = searchParams.get('startTime') || DEFAULT_START_TIME
  const duration = getBookingDuration(searchParams)
  const endTime = searchParams.get('endTime') || calculateEndTime(startTime, duration)
  const note = searchParams.get('note')?.trim() || EMPTY_NOTE_TEXT
  useEffect(() => {
    if (apiRoom) {
      setRoom(apiRoom)
      setRoomMissing(false)
      setIsResolvingRoom(false)
      return
    }

    let active = true
    setRoom(EMPTY_BOOKING_ROOM)
    setRoomMissing(!roomId)
    setIsResolvingRoom(shouldResolveBackendRoom)

    async function loadRoom() {
      const resolvedRoom = await resolveBookingRoom(roomId)
      if (!active) return

      setRoom(resolvedRoom ?? EMPTY_BOOKING_ROOM)
      setRoomMissing(!resolvedRoom)
      setIsResolvingRoom(false)
    }

    void loadRoom()

    return () => {
      active = false
    }
  }, [apiRoom, roomId, shouldResolveBackendRoom])

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

    if (!date || !endDate || !startTime || !duration) {
      setConfirmError('Vui lòng kiểm tra ngày đặt, giờ bắt đầu và thời lượng.')
      return
    }

    setConfirmError('')
    setIsSubmitting(true)

    try {
      const checkoutDraftId = `DRAFT-${displayRoom.id}-${Date.now()}`
      savePendingBooking({
        bookingId: checkoutDraftId,
        roomId: displayRoom.id,
        date,
        endDate,
        startTime,
        endTime,
        duration,
        addons: [],
        note,
        method: paymentMethod,
      })

      clearQuickBookingDraft()

      const params = new URLSearchParams({
        bookingId: checkoutDraftId,
        roomId: displayRoom.id,
        method: paymentMethod,
      })

      router.push(`/customer/checkout?${params.toString()}`)
    } catch {
      setConfirmError('Không thể mở bước thanh toán. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F6F3ED] text-[#242A27]">

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2 font-display text-sm text-[#6A6C66]">
              <Link href="/" className="hover:text-[#242A27]">
                Trang chủ
              </Link>
              <span>/</span>
              <Link href={selectionHref} className="hover:text-[#242A27]">
                Phòng homestay
              </Link>
              <span>/</span>
              <span className="text-[#242A27]">Xác nhận đặt phòng</span>
            </div>

            <h1 className="font-display text-4xl font-bold tracking-tight">Xác nhận đặt phòng</h1>
            <p className="mt-2 text-[#6A6C66]">Kiểm tra lần cuối. Phòng chỉ được giữ khi bạn tạo mã QR ở bước thanh toán.</p>
          </div>

          <span className="w-fit rounded-full bg-[#245545] px-4 py-2 font-display text-sm font-semibold text-white">
            Sẵn sàng xác nhận
          </span>
        </div>

        <div className="mb-6 grid overflow-hidden rounded-[20px] border border-[#E4DED3] bg-white shadow-[0_4px_20px_rgba(26,28,30,0.04)] sm:grid-cols-3">
          <BookingStep number="1" label="Chọn phòng & thời gian" state="done" />
          <BookingStep number="2" label="Xác nhận thông tin" state="current" />
          <BookingStep number="3" label="Thanh toán" state="upcoming" />
        </div>

        {roomMissing && !isResolvingRoom && (
          <div className="mb-6 rounded-2xl border border-[#B28455]/30 bg-[#EDE0CF] px-4 py-3 text-sm font-medium text-[#5E4328]">
            Không tìm thấy phòng đã chọn. Hệ thống đang hiển thị phòng mặc định để bạn kiểm tra.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <section className="rounded-[24px] border border-[#E4DED3] bg-white p-6 shadow-[0_4px_24px_rgba(26,28,30,0.06)]">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold">Thông tin đặt phòng</h2>
              {displayRoom.badge && (
                <span className="rounded-full bg-[#EDE0CF] px-3 py-1 font-display text-xs font-bold uppercase tracking-wide text-[#5E4328]">
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
                quality={90}
                unoptimized={shouldBypassImageOptimization(displayRoom.image)}
                className={`h-[260px] w-full rounded-2xl object-cover ${displayRoom.imageClassName}`}
                priority
              />
            ) : (
              <div className="flex h-[260px] w-full items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top,#EDE0CF,transparent_55%),linear-gradient(135deg,#F6F3ED,#E4DED3)] px-6 text-center">
                <div>
                  <p className="font-display text-2xl font-bold text-[#5E4328]">{displayRoom.name}</p>
                  <p className="mt-2 text-sm text-[#6A6C66]">Hệ thống chưa có ảnh phòng cho mục này.</p>
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <h3 className="font-display text-2xl font-bold">{displayRoom.name}</h3>
              {typeof displayRoom.rating === 'number' && (
                <span className="font-display font-semibold text-[#B45309]">* {displayRoom.rating.toFixed(1)}</span>
              )}
            </div>

            <p className="mt-1 text-[#6A6C66]">{displayRoom.type}</p>

            <div className="mt-6 grid gap-4 border-b border-[#E4DED3] pb-6 sm:grid-cols-2">
              <Detail label="Nhận phòng" value={`${formatDisplayDate(date)} · ${startTime}`} />
              <Detail label="Trả phòng" value={`${formatDisplayDate(endDate)} · ${endTime}`} />
              <Detail label="Thời lượng" value={`${Math.max(1, Math.round((duration + 2) / 24))} đêm · ${duration} giờ`} />
              <Detail label="Số người" value={displayRoom.capacity} />
              <Detail label="Địa điểm" value={displayRoom.location} />
            </div>

            <InfoSection title="Tiện nghi hiển thị" items={displayRoom.includedEquipments} />

            <div className="mt-6">
              <h3 className="font-display text-lg font-bold">Ghi chú khách hàng</h3>
              <div className="mt-3 whitespace-pre-wrap rounded-2xl border border-[#E4DED3] bg-[#FBF9F5] p-4 text-[#6A6C66]">
                {note}
              </div>
            </div>
          </section>

          <aside className="h-fit rounded-[24px] border border-[#E4DED3] bg-white p-6 shadow-[0_4px_24px_rgba(26,28,30,0.06)] lg:sticky lg:top-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                  <p className="font-display text-xs font-bold uppercase tracking-wider text-[#6A6C66]">
                    Tóm tắt thanh toán
                  </p>
                  <p className="mt-1 font-display font-semibold">Chưa tạo booking và chưa giữ phòng ở bước này</p>
                </div>
                <span className="rounded-full bg-[#EDE0CF] px-3 py-1 font-display text-xs font-bold text-[#5E4328]">
                  Chưa giữ chỗ
                </span>
              </div>

            <PaymentRow label="Giá tham khảo" value={`${formatCurrency(getNightlyDisplayPrice(displayRoom.pricePerHour))} / đêm`} />
            <PaymentRow label="Thời lượng" value={`${Math.max(1, Math.round((duration + 2) / 24))} đêm · ${duration} giờ`} />

            <div className="my-4 h-px bg-[#E4DED3]" />

            <PaymentRow label="Tiền phòng" value={formatCurrency(roomSubtotal)} />

            <div className="my-5 rounded-2xl bg-[#FBF9F5] p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="font-display text-lg font-bold">Tổng tham chiếu</span>
                <span className="font-display text-3xl font-bold text-[#B28455]">
                  {formatCurrency(roomSubtotal)}
                </span>
              </div>
            </div>

            {confirmError && (
              <p className="mt-4 rounded-2xl border border-[#C62828]/20 bg-[#FFEBEE] px-4 py-3 text-sm text-[#C62828]">
                {confirmError}
              </p>
            )}

            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={isSubmitting}
              className="mt-6 h-12 w-full rounded-full bg-secondary px-6 font-display font-semibold text-white shadow-[0_12px_28px_rgba(23,58,49,.22)] transition hover:-translate-y-0.5 hover:bg-secondary-container active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Đang chuyển bước...' : 'Tiếp tục đến thanh toán'}
            </button>

            <Link
              href={selectionHref}
              className="mt-3 flex h-12 w-full items-center justify-center rounded-2xl border border-[#C9C1B4] bg-transparent font-display font-semibold text-[#242A27] transition hover:bg-[#FBF9F5]"
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
      <p className="font-display text-xs font-bold uppercase tracking-wider text-[#6A6C66]">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  )
}

function BookingStep({
  number,
  label,
  state,
}: {
  number: string
  label: string
  state: 'done' | 'current' | 'upcoming'
}) {
  return (
    <div
      className={[
        'flex items-center gap-3 border-[#E4DED3] px-4 py-4 sm:border-r sm:last:border-r-0',
        state === 'current' ? 'bg-[#F3E8D9]' : 'bg-white',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold',
          state === 'done'
            ? 'bg-[#245545] text-white'
            : state === 'current'
              ? 'bg-[#B28455] text-white'
              : 'bg-[#EFEAE1] text-[#6A6C66]',
        ].join(' ')}
      >
        {state === 'done' ? '✓' : number}
      </span>
      <span className={state === 'upcoming' ? 'text-sm text-[#6A6C66]' : 'text-sm font-bold text-[#242A27]'}>
        {label}
      </span>
    </div>
  )
}

function InfoSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-6">
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full bg-[#EFEAE1] px-3 py-1 text-sm text-[#6A6C66]">
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
      <span className="text-[#6A6C66]">{label}</span>
      <span className={['font-semibold', green ? 'text-[#245545]' : 'text-[#242A27]'].join(' ')}>{value}</span>
    </div>
  )
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

  const roomType = searchParams.get('roomType')?.trim() || 'Phòng homestay'
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
    location: searchParams.get('roomLocation')?.trim() || 'The Serene Villa',
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
