/** Aligns with backend BookingStatus for future API integration. */
import type { BookingAddonItem } from '@/lib/addon-service'
export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'DEPOSIT_PAID'
  | 'PAID'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'

export type PaymentStatus = 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' | 'PENDING'
export type CancellationRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type AdminBooking = {
  bookingId: number
  bookingCode: string
  customerName: string
  customerEmail: string
  customerPhone: string
  roomId: number
  roomName: string
  roomType: string
  startTime: string
  endTime: string
  durationHours: number
  equipment: string[]
  totalPrice: number
  paidAmount: number
  remainingAmount: number
  paymentStatus: PaymentStatus
  bookingStatus: BookingStatus
  note?: string
  paymentMethod?: string
  paymentMethodCode?: 'CASH' | 'ONLINE'
  cancellationRequestStatus?: CancellationRequestStatus
  cancellationReason?: string
  cancellationRequestedAt?: string
  cancellationReviewedAt?: string
  cancellationAdminNote?: string
  refundAmount?: number
  refundPercentage?: number
  refundMethod?: string
  expectedRefundAt?: string
  roomAmount?: number
  addonAmount?: number
  addons?: BookingAddonItem[]
}

export type BookingFilters = {
  query: string
  bookingStatus: BookingStatus | 'ALL'
  paymentStatus: PaymentStatus | 'ALL'
  date: string
}
