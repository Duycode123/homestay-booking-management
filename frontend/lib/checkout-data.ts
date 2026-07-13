import {
  detectRoomCategory,
  formatCurrency,
  formatDisplayDate,
} from '@/components/booking/booking-data'
import { fetchRooms } from '@/lib/booking/bookingApi'
import { getBookingDetail } from '@/lib/customer-booking-service'
import type { AppliedDiscount } from '@/lib/discount-service'
import { getPendingBooking } from '@/lib/pending-booking'
import type { PaymentMethod, PaymentStatus } from '@/lib/payment-service'

export type CheckoutBooking = {
  bookingId: string
  backendBookingId?: number
  roomId: string
  roomName: string
  categoryLabel: string
  image?: string
  imageClassName?: string
  date: string
  startTime: string
  endTime: string
  duration: number
  capacity: string
  location: string
  pricePerHour: number
  equipments: string[]
  addons: Array<{
    id: string
    name: string
    price: number
  }>
  discount: number
  serviceFee: number
  note?: string
  status?: string
}

export type CheckoutSummary = {
  roomPrice: number
  addonsTotal: number
  serviceFee: number
  discount: number
  subtotal: number
  total: number
}

export const paymentMethodOptions: Array<{
  id: PaymentMethod
  label: string
  description: string
}> = [
  {
    id: 'bank_transfer',
    label: 'Chuyển khoản ngân hàng',
    description: 'Dùng cho đặt cọc online qua portal SePay.',
  },
  {
    id: 'e_wallet',
    label: 'Ví điện tử',
    description: 'Chưa bật trong phiên bản hiện tại.',
  },
  {
    id: 'cash',
    label: 'Thanh toán tại quầy',
    description: 'Phù hợp với phương án thanh toán toàn bộ tại homestay.',
  },
]

export function calculateCheckoutSummary(
  booking: CheckoutBooking,
  appliedDiscount?: AppliedDiscount | null,
): CheckoutSummary {
  const roomPrice = booking.pricePerHour * booking.duration
  const addonsTotal = booking.addons.reduce((total, addon) => total + addon.price, 0)
  const subtotal = roomPrice + addonsTotal
  const discount = Math.min(appliedDiscount?.discountAmount ?? 0, subtotal)
  const total = Math.max(0, subtotal - discount)

  return {
    roomPrice,
    addonsTotal,
    serviceFee: booking.serviceFee,
    discount,
    subtotal,
    total,
  }
}

export { formatCurrency, formatDisplayDate }

export function getPaymentMethodLabel(method?: string | null) {
  return (
    paymentMethodOptions.find((option) => option.id === method)?.label ??
    (method === 'online' ? 'Thanh toán online' : method === 'cash' ? 'Thanh toán tại quầy' : 'Chưa xác định')
  )
}

export function getReturnStatusContent(status?: string | null) {
  const normalizedStatus = normalizePaymentStatus(status)

  const content = {
    success: {
      tone: 'success',
      icon: 'OK',
      title: 'Thanh toán thành công',
      message:
        'SePay đã xác nhận giao dịch. Booking đã được chuyển sang trạng thái đã thanh toán.',
      primaryLabel: 'Xem lịch đặt phòng',
      primaryHref: '/customer/bookings',
    },
    failed: {
      tone: 'failed',
      icon: '!',
      title: 'Thanh toán thất bại',
      message: 'Giao dịch chưa hoàn tất. Vui lòng thử lại hoặc chọn cách thanh toán khác.',
      primaryLabel: 'Thử lại thanh toán',
      primaryHref: '/customer/checkout',
    },
    pending: {
      tone: 'pending',
      icon: '...',
      title: 'Đang chờ thanh toán',
      message: 'Phiên thanh toán SePay đã được tạo và đang chờ portal/webhook đối soát.',
      primaryLabel: 'Xem lịch đặt phòng',
      primaryHref: '/customer/bookings',
    },
    cancelled: {
      tone: 'cancelled',
      icon: 'X',
      title: 'Thanh toán đã bị hủy',
      message: 'Bạn có thể quay lại checkout bất cứ lúc nào.',
      primaryLabel: 'Thử lại thanh toán',
      primaryHref: '/customer/checkout',
    },
    unknown: {
      tone: 'unknown',
      icon: '?',
      title: 'Không xác định được trạng thái thanh toán',
      message: 'Vui lòng kiểm tra giao dịch hoặc liên hệ hỗ trợ.',
      primaryLabel: 'Quay về trang chủ',
      primaryHref: '/',
    },
  } as const

  return content[normalizedStatus]
}

export function normalizePaymentStatus(status?: string | null): PaymentStatus | 'unknown' {
  if (status === 'success' || status === 'failed' || status === 'pending' || status === 'cancelled') {
    return status
  }

  return 'unknown'
}

export async function getCheckoutBookingFromParams(searchParams: URLSearchParams): Promise<CheckoutBooking | null> {
  const bookingId = searchParams.get('bookingId')
  if (!bookingId) return null

  const rawBackendBookingId = Number(searchParams.get('backendBookingId'))
  const backendBookingId = Number.isFinite(rawBackendBookingId) && rawBackendBookingId > 0 ? rawBackendBookingId : undefined

  const booking = await getBookingDetail(bookingId, backendBookingId)
  if (!booking) {
    return buildCheckoutBookingFromPending(bookingId, backendBookingId, searchParams)
  }

  const rooms = await fetchRooms().catch(() => [])
  const room = rooms.find((item) => item.id === booking.roomId)
  const duration = calculateDurationHours(
    booking.startDateTime,
    booking.endDateTime,
    booking.startTime,
    booking.endTime,
  )
  const categoryLabel = room?.roomTypeName?.trim() || inferCategoryLabel(searchParams.get('roomType'))
  const image = getSafeImageUrl(room?.imageUrl)
  const pricePerHour = room?.pricePerHour ?? inferPricePerHour(booking.totalAmount, duration)
  const capacity = room ? `Tối đa ${room.capacity} người` : 'Chưa rõ sức chứa'
  const location = room?.location || 'Homestay Booking'
  const equipments = room?.equipment?.length ? room.equipment : [categoryLabel]

  return {
    bookingId: booking.bookingId,
    backendBookingId: booking.backendBookingId,
    roomId: booking.roomId,
    roomName: booking.roomName,
    categoryLabel,
    image,
    imageClassName: 'object-center',
    date: normalizeDateLabel(booking.startDateTime, booking.date),
    startTime: booking.startTime,
    endTime: booking.endTime,
    duration,
    capacity,
    location,
    pricePerHour,
    equipments,
    addons: [],
    discount: 0,
    serviceFee: 0,
    note: booking.note,
    status: booking.status,
  }
}

async function buildCheckoutBookingFromPending(
  bookingId: string,
  backendBookingId: number | undefined,
  searchParams: URLSearchParams,
): Promise<CheckoutBooking | null> {
  const pending = getPendingBooking()
  if (!pending || pending.bookingId !== bookingId) {
    return null
  }

  const roomId = searchParams.get('roomId') || pending.roomId
  const rooms = await fetchRooms().catch(() => [])
  const room = rooms.find((item) => item.id === roomId)
  if (!room) {
    return null
  }

  const duration = pending.duration > 0 ? pending.duration : 1
  const categoryLabel = room.roomTypeName?.trim() || inferCategoryLabel(searchParams.get('roomType'))
  const pricePerHour = room.pricePerHour

  return {
    bookingId,
    backendBookingId,
    roomId,
    roomName: room.name,
    categoryLabel,
    image: getSafeImageUrl(room.imageUrl),
    imageClassName: 'object-center',
    date: pending.date,
    startTime: pending.startTime,
    endTime: pending.endTime,
    duration,
    capacity: `Tối đa ${room.capacity} người`,
    location: room.location || 'Homestay Booking',
    pricePerHour,
    equipments: room.equipment?.length ? room.equipment : [categoryLabel],
    addons: [],
    discount: 0,
    serviceFee: 0,
    note: pending.note,
    status: 'PENDING_PAYMENT',
  }
}

function inferCategoryLabel(roomType?: string | null) {
  if (roomType?.trim()) return roomType.trim()

  const category = detectRoomCategory(roomType)
  if (category === 'family') return 'Family Room'
  if (category === 'deluxe') return 'Deluxe Room'
  return 'Practice Room'
}

function inferPricePerHour(totalAmount: number, duration: number) {
  if (duration <= 0) return totalAmount
  return Math.round(totalAmount / duration)
}

function getSafeImageUrl(value?: string | null) {
  const normalized = value?.trim()
  return normalized && normalized.startsWith('/') ? normalized : undefined
}

function normalizeDateLabel(rawDateTime: string | undefined, fallbackDateLabel: string) {
  if (!rawDateTime) return fallbackDateLabel

  const date = new Date(rawDateTime)
  if (Number.isNaN(date.getTime())) return fallbackDateLabel

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function calculateDurationHours(
  rawStartDateTime?: string,
  rawEndDateTime?: string,
  startTime?: string,
  endTime?: string,
) {
  if (rawStartDateTime && rawEndDateTime) {
    const start = new Date(rawStartDateTime).getTime()
    const end = new Date(rawEndDateTime).getTime()

    if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
      return Math.max(1, Math.round((end - start) / (1000 * 60 * 60)))
    }
  }

  if (!startTime || !endTime) return 1

  const [startHour = 0, startMinute = 0] = startTime.split(':').map(Number)
  const [endHour = 0, endMinute = 0] = endTime.split(':').map(Number)
  const duration = (endHour * 60 + endMinute - (startHour * 60 + startMinute)) / 60

  return duration > 0 ? duration : 1
}
