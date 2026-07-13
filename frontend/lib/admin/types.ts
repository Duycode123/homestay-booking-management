/** Aligns with backend BookingStatus for future API integration. */
export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'

export type PaymentStatus = 'PAID' | 'UNPAID' | 'PENDING'

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
  paymentStatus: PaymentStatus
  bookingStatus: BookingStatus
  note?: string
  paymentMethod?: string
}

export type BookingFilters = {
  query: string
  bookingStatus: BookingStatus | 'ALL'
  paymentStatus: PaymentStatus | 'ALL'
  date: string
}
