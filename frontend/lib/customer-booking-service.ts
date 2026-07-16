import axios from 'axios'
import api from '@/lib/api'
import type { BookingAddonItem } from '@/lib/addon-service'
import {
  clearReviewDraft,
  loadReviewDraft,
  saveReviewDraft,
  type BookingReview,
  type ReviewDraft,
  type ReviewImage,
  type SubmitBookingReviewPayload,
} from '@/lib/review-service'

export type CustomerBookingStatus =
  | 'PENDING_PAYMENT'
  | 'DEPOSIT_PAID'
  | 'PAID'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'

export type CancellationRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type CustomerRefundStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RETRY_REQUIRED'

export type CustomerRefundRecord = {
  refundId: number
  amount: number
  status: CustomerRefundStatus
  method: 'ORIGINAL_PAYMENT_METHOD' | 'MANUAL_BANK_TRANSFER' | 'CASH_COUNTER'
  transactionReference?: string | null
  expectedAt?: string | null
  processingAt?: string | null
  completedAt?: string | null
  recipientBankCode?: string | null
  recipientBankName?: string | null
  recipientAccountNumber?: string | null
  recipientAccountHolder?: string | null
  transferContent?: string | null
  transferQrUrl?: string | null
}

export type RefundDestinationPayload = {
  reason: string
  refundBankCode: string
  refundBankName: string
  refundAccountNumber: string
  refundAccountHolder: string
}

export type { BookingReview, ReviewDraft, ReviewImage, SubmitBookingReviewPayload }

export type BookingHistoryItem = {
  bookingId: string
  backendBookingId?: number
  roomId: string
  roomName: string
  startDateTime?: string
  endDateTime?: string
  date: string
  startTime: string
  endTime: string
  totalAmount: number
  status: CustomerBookingStatus
  paymentMethod?: string
  addons?: BookingAddonItem[]
  note?: string
  review?: BookingReview
  canReview?: boolean
  alreadyReviewed?: boolean
  cancellationRequestStatus?: CancellationRequestStatus
  cancellationReason?: string
  cancellationRequestedAt?: string
  cancellationReviewedAt?: string
  cancellationAdminNote?: string
  refundAmount?: number
  refundPercentage?: number
  refundMethod?: string
  expectedRefundAt?: string
  refundBankCode?: string
  refundBankName?: string
  refundAccountNumber?: string
  refundAccountHolder?: string
}

type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

type PagedResponse<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

type BackendBooking = {
  bookingId: number
  bookingCode: string
  roomId: number
  roomName: string
  startTime: string
  endTime: string
  totalAmount: number | string
  status: string
  paymentMethod?: 'CASH' | 'ONLINE' | null
  note?: string | null
  equipmentNotes?: string | null
  canReview?: boolean | null
  alreadyReviewed?: boolean | null
  cancellationRequestStatus?: CancellationRequestStatus | null
  cancellationReason?: string | null
  cancellationRequestedAt?: string | null
  cancellationReviewedAt?: string | null
  cancellationAdminNote?: string | null
  refundAmount?: number | string | null
  refundPercentage?: number | null
  refundMethod?: string | null
  expectedRefundAt?: string | null
  refundBankCode?: string | null
  refundBankName?: string | null
  refundAccountNumber?: string | null
  refundAccountHolder?: string | null
  addons?: BookingAddonItem[]
}

type BackendReview = {
  id: number
  bookingId: number
  customerName?: string | null
  roomId: number
  roomName: string
  rating: number
  content: string
  images?: Array<{
    id: number
    imageUrl: string
    displayOrder: number
  }>
  createdAt: string
}

type ReviewImageUploadResponse = {
  publicId: string
  secureUrl: string
}

function parseAmount(value: number | string | null | undefined) {
  const normalized = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(normalized) ? Number(normalized) : 0
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function normalizeStatus(status?: string | null): CustomerBookingStatus {
  if (
    status === 'PENDING_PAYMENT' ||
    status === 'DEPOSIT_PAID' ||
    status === 'PAID' ||
    status === 'CHECKED_IN' ||
    status === 'COMPLETED' ||
    status === 'CANCELLED'
  ) {
    return status
  }

  return 'PENDING_PAYMENT'
}

function getPaymentMethodLabel(method?: 'CASH' | 'ONLINE' | null) {
  if (method === 'CASH') return 'Thanh toán tại quầy'
  if (method === 'ONLINE') return 'Thanh toán online'
  return undefined
}

function mapBooking(booking: BackendBooking): BookingHistoryItem {
  return {
    bookingId: booking.bookingCode || String(booking.bookingId),
    backendBookingId: booking.bookingId,
    roomId: String(booking.roomId),
    roomName: booking.roomName,
    startDateTime: booking.startTime,
    endDateTime: booking.endTime,
    date: formatDate(booking.startTime),
    startTime: formatTime(booking.startTime),
    endTime: formatTime(booking.endTime),
    totalAmount: parseAmount(booking.totalAmount),
    status: normalizeStatus(booking.status),
    paymentMethod: getPaymentMethodLabel(booking.paymentMethod),
    addons: (booking.addons ?? []).map((item) => ({
      ...item,
      unitPrice: parseAmount(item.unitPrice),
      totalAmount: parseAmount(item.totalAmount),
    })),
    note: booking.note?.trim() || booking.equipmentNotes?.trim() || undefined,
    canReview: booking.canReview ?? undefined,
    alreadyReviewed: booking.alreadyReviewed ?? undefined,
    cancellationRequestStatus: booking.cancellationRequestStatus ?? undefined,
    cancellationReason: booking.cancellationReason?.trim() || undefined,
    cancellationRequestedAt: booking.cancellationRequestedAt ?? undefined,
    cancellationReviewedAt: booking.cancellationReviewedAt ?? undefined,
    cancellationAdminNote: booking.cancellationAdminNote?.trim() || undefined,
    refundAmount: booking.refundAmount == null ? undefined : parseAmount(booking.refundAmount),
    refundPercentage: booking.refundPercentage ?? undefined,
    refundMethod: booking.refundMethod?.trim() || undefined,
    expectedRefundAt: booking.expectedRefundAt ?? undefined,
    refundBankCode: booking.refundBankCode?.trim() || undefined,
    refundBankName: booking.refundBankName?.trim() || undefined,
    refundAccountNumber: booking.refundAccountNumber?.trim() || undefined,
    refundAccountHolder: booking.refundAccountHolder?.trim() || undefined,
  }
}

function buildReviewTitle(content: string) {
  const normalizedContent = content.trim()
  return normalizedContent.slice(0, 80) || 'Đánh giá phòng'
}

function mapBackendReviewToUiReview(review: BackendReview, booking: BookingHistoryItem): BookingReview {
  const content = review.content?.trim() || ''

  return {
    id: `backend-review-${review.id}`,
    bookingId: booking.bookingId,
    roomId: booking.roomId,
    customerName: review.customerName?.trim() || 'Khach hang',
    rating: review.rating,
    title: buildReviewTitle(content),
    content,
    tags: [],
    images: (review.images ?? []).map((image, index) => ({
      id: String(image.id),
      name: `Ảnh đánh giá ${index + 1}`,
      previewUrl: image.imageUrl,
    })),
    createdAt: review.createdAt,
  }
}

function getBookingTimestamp(booking: Pick<BookingHistoryItem, 'date' | 'startTime'>) {
  const [day, month, year] = booking.date.split('/').map(Number)
  const [hour = 0, minute = 0] = booking.startTime.split(':').map(Number)
  const timestamp = new Date(year, month - 1, day, hour, minute).getTime()

  return Number.isFinite(timestamp) ? timestamp : 0
}

function sortBookingsByTime(bookings: BookingHistoryItem[]) {
  return [...bookings].sort((firstBooking, secondBooking) => {
    return getBookingTimestamp(secondBooking) - getBookingTimestamp(firstBooking)
  })
}

function mergeReviews(bookings: BookingHistoryItem[], backendReviews: BackendReview[]) {
  const backendReviewMap = new Map<number, BackendReview>(
    backendReviews.map((review) => [review.bookingId, review]),
  )

  return bookings.map((booking) => {
    const backendReview = booking.backendBookingId ? backendReviewMap.get(booking.backendBookingId) : undefined

    return {
      ...booking,
      review: backendReview ? mapBackendReviewToUiReview(backendReview, booking) : undefined,
    }
  })
}

async function fetchBackendBookings() {
  const response = await api.get<ApiResponse<PagedResponse<BackendBooking>>>('/api/bookings/my/history', {
    params: { size: 100 },
  })

  return response.data.data?.content ?? []
}

async function fetchBackendReviews() {
  const response = await api.get<ApiResponse<PagedResponse<BackendReview>>>('/api/reviews/my', {
    params: { size: 100 },
  })

  return response.data.data?.content ?? []
}

async function fetchBackendBookingDetail(backendBookingId: number) {
  const response = await api.get<ApiResponse<BackendBooking>>(`/api/bookings/my/${backendBookingId}`)
  return response.data.data
}

export function canReviewBooking(booking: Pick<BookingHistoryItem, 'status' | 'canReview'>) {
  if (typeof booking.canReview === 'boolean') {
    return booking.canReview
  }

  return booking.status === 'COMPLETED'
}

export function formatBookingStatus(status: CustomerBookingStatus) {
  const labels: Record<CustomerBookingStatus, string> = {
    DEPOSIT_PAID: 'Đã đặt cọc',
    PENDING_PAYMENT: 'Chờ thanh toán',
    PAID: 'Đã thanh toán',
    CHECKED_IN: 'Đã check-in',
    COMPLETED: 'Hoàn tất',
    CANCELLED: 'Đã hủy',
  }

  return labels[status]
}

export async function getCustomerBookings(): Promise<BookingHistoryItem[]> {
  try {
    const [bookings, reviews] = await Promise.all([fetchBackendBookings(), fetchBackendReviews()])
    return sortBookingsByTime(mergeReviews(bookings.map(mapBooking), reviews))
  } catch {
    return []
  }
}

export async function getBookingDetail(
  bookingId: string,
  backendBookingId?: number,
): Promise<BookingHistoryItem | null> {
  try {
    const bookings = await getCustomerBookings()

    if (backendBookingId) {
      const byBackendId = bookings.find((booking) => booking.backendBookingId === backendBookingId)
      if (byBackendId) return byBackendId
    }

    const byCode = bookings.find((booking) => booking.bookingId === bookingId)
    if (byCode) return byCode
  } catch {
    // Fall back to detail endpoint or pending checkout data below.
  }

  if (backendBookingId) {
    try {
      const [booking, reviews] = await Promise.all([fetchBackendBookingDetail(backendBookingId), fetchBackendReviews()])
      return mergeReviews([mapBooking(booking)], reviews)[0] ?? null
    } catch {
      return null
    }
  }

  return null
}

export async function submitBookingReview(payload: SubmitBookingReviewPayload): Promise<BookingReview> {
  if (!payload.backendBookingId) {
    throw new Error('Không tìm thấy booking backend để gửi đánh giá.')
  }

  try {
    const response = await api.post<ApiResponse<BackendReview>>('/api/reviews', {
      bookingId: payload.backendBookingId,
      rating: payload.rating,
      content: payload.content.trim(),
      imageUrls: payload.imageUrls ?? [],
    })

    const booking: BookingHistoryItem = {
      bookingId: payload.bookingId,
      backendBookingId: payload.backendBookingId,
      roomId: payload.roomId,
      roomName: '',
      startDateTime: undefined,
      endDateTime: undefined,
      date: '',
      startTime: '',
      endTime: '',
      totalAmount: 0,
      status: 'COMPLETED',
    }

    return mapBackendReviewToUiReview(response.data.data, booking)
  } catch (error) {
    if (axios.isAxiosError<{ message?: string }>(error)) {
      throw new Error(error.response?.data?.message || 'Không thể gửi đánh giá. Vui lòng thử lại.')
    }

    throw error
  }
}

export async function uploadReviewImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await api.post<ApiResponse<ReviewImageUploadResponse>>('/api/reviews/images', formData)
    return response.data.data
  } catch (error) {
    if (axios.isAxiosError<{ message?: string }>(error)) {
      throw new Error(error.response?.data?.message || 'Không thể tải ảnh đánh giá. Vui lòng thử lại.')
    }
    throw error
  }
}

export async function requestBookingCancellation(
  backendBookingId: number,
  destination: RefundDestinationPayload,
): Promise<BookingHistoryItem> {
  try {
    const response = await api.put<ApiResponse<{ booking: BackendBooking }>>(
      `/api/bookings/${backendBookingId}/cancel`,
      {
        reason: destination.reason.trim(),
        refundBankCode: destination.refundBankCode,
        refundBankName: destination.refundBankName.trim(),
        refundAccountNumber: destination.refundAccountNumber.replace(/\s+/g, ''),
        refundAccountHolder: destination.refundAccountHolder.trim().replace(/\s+/g, ' ').toLocaleUpperCase('vi-VN'),
      },
    )
    return mapBooking(response.data.data.booking)
  } catch (error) {
    if (axios.isAxiosError<{ message?: string }>(error)) {
      throw new Error(error.response?.data?.message || 'Không thể gửi yêu cầu hủy phòng. Vui lòng thử lại.')
    }
    throw error
  }
}

export async function getBookingRefund(bookingId: number): Promise<CustomerRefundRecord | null> {
  try {
    const response = await api.get<ApiResponse<CustomerRefundRecord>>(`/api/bookings/${bookingId}/refund`)
    return response.data.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null
    if (axios.isAxiosError<{ message?: string }>(error)) {
      throw new Error(error.response?.data?.message || 'Không thể tải trạng thái hoàn tiền.')
    }
    throw error
  }
}

export { clearReviewDraft, loadReviewDraft, saveReviewDraft }
