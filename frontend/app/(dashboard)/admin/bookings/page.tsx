'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'
import AdminToast from '@/components/admin/AdminToast'
import { IconBookings, IconCheckCircle, IconClock, IconRefresh } from '@/components/admin/AdminIcons'
import BookingDetailPanel from '@/components/admin/bookings/BookingDetailPanel'
import BookingFiltersBar from '@/components/admin/bookings/BookingFiltersBar'
import BookingTable from '@/components/admin/bookings/BookingTable'
import { fetchAdminBookings, getAdminBookingById, updateAdminBookingStatus } from '@/lib/admin/adminBookingApi'
import type { AdminBooking, BookingFilters, BookingStatus } from '@/lib/admin/types'

const DEFAULT_FILTERS: BookingFilters = {
  query: '',
  bookingStatus: 'ALL',
  paymentStatus: 'ALL',
  date: '',
}

export default function AdminBookingsPage() {
  const [filters, setFilters] = useState<BookingFilters>(DEFAULT_FILTERS)
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selected, setSelected] = useState<AdminBooking | null>(null)
  const [toast, setToast] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const loadBookings = useCallback(async () => {
    setIsLoading(true)

    try {
      const data = await fetchAdminBookings(filters)
      setBookings(data)
      setErrorMessage('')
      setSelected((current) => {
        if (!current) return null
        return data.find((booking) => booking.bookingId === current.bookingId) ?? null
      })
    } catch (error) {
      setBookings([])
      setSelected(null)
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải danh sách đơn đặt.')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    const timer = setTimeout(() => void loadBookings(), 200)
    return () => clearTimeout(timer)
  }, [loadBookings])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      active: bookings.filter((booking) => booking.bookingStatus === 'CHECKED_IN').length,
      pending: bookings.filter((booking) => booking.bookingStatus === 'PENDING_PAYMENT').length,
    }
  }, [bookings])

  const handleSelectBooking = useCallback(async (booking: AdminBooking) => {
    setSelected(booking)

    try {
      const detail = await getAdminBookingById(booking.bookingId)
      if (detail) {
        setSelected(detail)
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải chi tiết đơn đặt.')
    }
  }, [])

  const handleStatusChange = async (bookingId: number, status: BookingStatus) => {
    const updated = await updateAdminBookingStatus(bookingId, status)
    if (!updated) {
      throw new Error('Không tìm thấy đơn cần cập nhật.')
    }

    setToast('Cập nhật trạng thái đơn thành công.')
    await loadBookings()
    setSelected(updated)
  }

  return (
    <>
        <AdminPageHeader
          eyebrow="Đơn đặt phòng"
          title="Quản lý đơn đặt phòng"
          description="Danh sách theo ngày sử dụng — lọc nhanh hôm nay/mai, theo dõi thanh toán và trạng thái đơn."
          breadcrumbs={[
            { label: 'Tổng quan', href: '/admin/dashboard' },
            { label: 'Đơn đặt phòng' },
          ]}
          actions={
            <button
              type="button"
              onClick={() => void loadBookings()}
              disabled={isLoading}
              title="Làm mới"
              aria-label="Làm mới"
              className={[
                'group flex h-10 w-10 items-center justify-center rounded-full',
                'border border-outline-variant bg-white text-on-surface-variant shadow-sm',
                'transition-all hover:border-brand-orange/40 hover:text-brand-orange',
                'disabled:cursor-not-allowed disabled:opacity-50',
              ].join(' ')}
            >
              <IconRefresh
                className={[
                  'h-[15px] w-[15px] transition-transform duration-300',
                  isLoading ? 'animate-spin' : 'group-hover:rotate-180',
                ].join(' ')}
              />
            </button>
          }
        />

        <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
          <AdminToast message={toast} onDismiss={() => setToast('')} />

          {errorMessage && (
            <div className="rounded-xl border border-error/30 bg-error-container/30 px-4 py-3 text-sm text-error">
              {errorMessage}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <AdminStatCard
              label="Kết quả lọc"
              value={isLoading ? '…' : stats.total}
              hint="Theo bộ lọc hiện tại"
              icon={<IconBookings className="h-5 w-5" />}
            />
            <AdminStatCard
              label="Đang sử dụng"
              value={isLoading ? '…' : stats.active}
              hint="Đang sử dụng phòng"
              accent="secondary"
              icon={<IconCheckCircle className="h-5 w-5" />}
            />
            <AdminStatCard
              label="Chờ thanh toán"
              value={isLoading ? '…' : stats.pending}
              hint="Cần theo dõi"
              accent="tertiary"
              icon={<IconClock className="h-5 w-5" />}
            />
          </div>

          <BookingFiltersBar filters={filters} onChange={setFilters} resultCount={bookings.length} />

          <BookingTable
            bookings={bookings}
            isLoading={isLoading}
            selectedId={selected?.bookingId ?? null}
            onSelect={handleSelectBooking}
          />
        </div>

        <BookingDetailPanel
          booking={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
    </>
  )
}
