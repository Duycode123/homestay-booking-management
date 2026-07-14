import type { BookingStatus, PaymentStatus } from './types'
import { inferRoomCategoryFromTypeName } from '@/lib/room-mappers'
import { roomCategoryLabels } from '@/lib/admin/rooms/types'

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  DEPOSIT_PAID: 'Đã đặt cọc',
  PENDING_PAYMENT: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  CHECKED_IN: 'Đang sử dụng',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PAID: 'Đã thanh toán',
  PARTIALLY_PAID: 'Đã cọc 50%',
  UNPAID: 'Chưa thanh toán',
  PENDING: 'Đang chờ',
}

export const BOOKING_STATUS_OPTIONS: BookingStatus[] = [
  'PENDING_PAYMENT',
  'DEPOSIT_PAID',
  'PAID',
  'CHECKED_IN',
  'COMPLETED',
  'CANCELLED',
]

export const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = ['PAID', 'PARTIALLY_PAID', 'UNPAID', 'PENDING']

export function formatAdminRoomTypeLabel(typeName: string) {
  const trimmed = typeName.trim()
  if (!trimmed || trimmed === 'Chưa xác định') return 'Chưa xác định'
  return roomCategoryLabels[inferRoomCategoryFromTypeName(trimmed)] ?? trimmed
}
