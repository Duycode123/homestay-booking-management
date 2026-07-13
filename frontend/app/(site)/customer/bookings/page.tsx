'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CustomerCard,
  CustomerPageHeader,
  CustomerPageShell,
} from '@/components/customer/CustomerPageShell'
import BookingDetailModal, { getReviewerName } from '@/components/customer/BookingDetailModal'
import BookingHistoryCard from '@/components/customer/BookingHistoryCard'
import BookingHistoryEmpty from '@/components/customer/BookingHistoryEmpty'
import BookingHistoryFilters from '@/components/customer/BookingHistoryFilters'
import BookingHistorySkeleton from '@/components/customer/BookingHistorySkeleton'
import BookingHistoryStats from '@/components/customer/BookingHistoryStats'
import { useAuth } from '@/contexts/AuthContext'
import {
  defaultBookingHistoryFilters,
  filterBookingHistory,
  type BookingHistoryFilterState,
} from '@/lib/customer/booking-history-filters'
import {
  getBookingDetail,
  getCustomerBookings,
  type BookingHistoryItem,
  type BookingReview,
} from '@/lib/customer-booking-service'

export default function CustomerBookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<BookingHistoryItem[]>([])
  const [filters, setFilters] = useState<BookingHistoryFilterState>(defaultBookingHistoryFilters)
  const [selectedBooking, setSelectedBooking] = useState<BookingHistoryItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const filteredBookings = useMemo(() => filterBookingHistory(bookings, filters), [bookings, filters])

  useEffect(() => {
    let mounted = true

    void getCustomerBookings()
      .then((items) => {
        if (mounted) setBookings(items)
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const handleSelectBooking = async (bookingId: string, backendBookingId?: number) => {
    const detail = await getBookingDetail(bookingId, backendBookingId)
    if (detail) setSelectedBooking(detail)
  }

  const handleReviewSubmitted = (review: BookingReview) => {
    setBookings((currentBookings) =>
      currentBookings.map((booking) =>
        booking.bookingId === review.bookingId ? { ...booking, review } : booking,
      ),
    )
    setSelectedBooking((currentBooking) =>
      currentBooking && currentBooking.bookingId === review.bookingId
        ? { ...currentBooking, review }
        : currentBooking,
    )
  }

  return (
    <CustomerPageShell>
      <CustomerPageHeader
        eyebrow="Tài khoản"
        title="Lịch sử đặt phòng"
        description="Theo dõi lịch đặt, xem chi tiết và gửi đánh giá sau khi hoàn tất buổi sử dụng."
      />

      {!isLoading && bookings.length > 0 && (
        <div className="mb-6">
          <BookingHistoryStats bookings={bookings} />
        </div>
      )}

      <CustomerCard className="!p-0">
        <div className="border-b border-outline-variant/80 px-5 py-5 sm:px-7 sm:py-6">
          <h2 className="font-display text-xl font-bold text-on-surface">Danh sách đặt phòng</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Chọn một đơn để xem chi tiết, thanh toán hoặc đánh giá.
          </p>
        </div>

        <div className="space-y-5 px-5 pt-5 sm:space-y-6 sm:px-7 sm:pt-6">
          {!isLoading && bookings.length > 0 && (
            <BookingHistoryFilters
              value={filters}
              onChange={setFilters}
              totalCount={bookings.length}
              filteredCount={filteredBookings.length}
              disabled={isLoading}
            />
          )}

          <div className="panel-scroll max-h-[min(640px,calc(100dvh-19rem))] min-h-[260px] overflow-y-auto rounded-2xl border border-outline-variant/70 bg-surface-container-low/40 p-3 sm:p-4">
            {isLoading ? (
              <BookingHistorySkeleton />
            ) : bookings.length === 0 ? (
              <BookingHistoryEmpty variant="no-bookings" />
            ) : filteredBookings.length === 0 ? (
              <BookingHistoryEmpty
                variant="no-results"
                onClearFilters={() => setFilters(defaultBookingHistoryFilters)}
              />
            ) : (
              <div className="grid gap-4">
                {filteredBookings.map((booking) => (
                  <BookingHistoryCard
                    key={booking.bookingId}
                    booking={booking}
                    onSelect={() => void handleSelectBooking(booking.bookingId, booking.backendBookingId)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="h-5 sm:h-6" aria-hidden />
      </CustomerCard>

      <BookingDetailModal
        booking={selectedBooking}
        reviewerName={getReviewerName(user)}
        onClose={() => setSelectedBooking(null)}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </CustomerPageShell>
  )
}
