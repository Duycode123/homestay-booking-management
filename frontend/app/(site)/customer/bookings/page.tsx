'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { CustomerPageShell } from '@/components/customer/CustomerPageShell'
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
      <section className="relative mb-6 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#123C31] via-[#1C4B3E] to-[#315E50] px-6 py-8 text-white shadow-[0_24px_60px_rgba(20,55,46,0.18)] sm:px-8 sm:py-10">
        <div aria-hidden className="absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/10" />
        <div aria-hidden className="absolute right-8 top-8 h-40 w-40 rounded-full border border-white/10" />
        <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span aria-hidden className="h-px w-8 bg-[#D4A26C]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#E8C49D]">Hành trình của bạn</p>
            </div>
            <h1 className="mt-4 font-editorial text-4xl font-normal leading-tight sm:text-5xl">Lịch sử đặt phòng</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
              Quản lý tất cả kỳ lưu trú, theo dõi thanh toán và mở nhanh chi tiết từng booking.
            </p>
          </div>
          <Link href="/rooms" className="inline-flex min-h-[50px] w-fit items-center justify-center gap-2 rounded-2xl bg-[#D0A06B] px-6 font-display text-sm font-bold text-white shadow-[0_12px_28px_rgba(10,35,29,0.2)] transition hover:-translate-y-0.5 hover:bg-[#BB8752]">
            <PlusIcon /> Đặt phòng mới
          </Link>
        </div>
      </section>

      {!isLoading && bookings.length > 0 && (
        <div className="relative z-10 mb-6">
          <BookingHistoryStats bookings={bookings} />
        </div>
      )}

      <section>
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-orange">Booking của tôi</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-on-surface">Danh sách đặt phòng</h2>
          </div>
          {!isLoading && bookings.length > 0 && (
            <p className="text-sm text-on-surface-variant">Hiển thị <strong className="text-on-surface">{filteredBookings.length}</strong> booking</p>
          )}
        </div>

        <div className="space-y-5 sm:space-y-6">
          {!isLoading && bookings.length > 0 && (
            <BookingHistoryFilters
              value={filters}
              onChange={setFilters}
              totalCount={bookings.length}
              filteredCount={filteredBookings.length}
              disabled={isLoading}
            />
          )}

          <div className="min-h-[260px]">
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
      </section>

      <BookingDetailModal
        booking={selectedBooking}
        reviewerName={getReviewerName(user)}
        onClose={() => setSelectedBooking(null)}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </CustomerPageShell>
  )
}

function PlusIcon() {
  return <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
}
