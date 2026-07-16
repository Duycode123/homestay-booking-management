'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'
import AdminToast from '@/components/admin/AdminToast'
import { IconBookings, IconCheckCircle, IconClock, IconRefresh } from '@/components/admin/AdminIcons'
import BookingDetailPanel from '@/components/admin/bookings/BookingDetailPanel'
import BookingFiltersBar from '@/components/admin/bookings/BookingFiltersBar'
import BookingTable from '@/components/admin/bookings/BookingTable'
import { fetchAdminBookings, formatAdminPrice, formatBookingDateTime, getAdminBookingById, reviewCancellationRequest, settleAdminBookingAtCheckout, updateAdminBookingStatus } from '@/lib/admin/adminBookingApi'
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
  const [reviewingBookingId, setReviewingBookingId] = useState<number | null>(null)
  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({})

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
      pendingCancellation: bookings.filter((booking) => booking.cancellationRequestStatus === 'PENDING').length,
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

  const handleSettleCheckout = async (bookingId: number) => {
    const updated = await settleAdminBookingAtCheckout(bookingId)
    setToast('Đã thu phần tiền còn lại và hoàn tất checkout.')
    await loadBookings()
    setSelected(updated)
  }

  const handleAddonChanged = async (bookingId: number) => {
    const detail = await getAdminBookingById(bookingId)
    if (detail) {
      setSelected(detail)
      setBookings((current) => current.map((item) => item.bookingId === bookingId ? detail : item))
    }
  }

  const handleCancellationReview = async (bookingId: number, approved: boolean) => {
    setReviewingBookingId(bookingId)
    setErrorMessage('')
    try {
      await reviewCancellationRequest(bookingId, approved, reviewNotes[bookingId])
      setToast(approved ? 'Đã duyệt hủy phòng và tạo hồ sơ chờ hoàn tiền.' : 'Đã từ chối yêu cầu hủy phòng.')
      await loadBookings()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể xử lý yêu cầu hủy phòng.')
    } finally {
      setReviewingBookingId(null)
    }
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

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
            <AdminStatCard
              label="Yêu cầu hủy"
              value={isLoading ? '…' : stats.pendingCancellation}
              hint="Đang chờ admin duyệt"
              accent="tertiary"
              icon={<IconClock className="h-5 w-5" />}
            />
          </div>

          {stats.pendingCancellation > 0 && (
            <section className="overflow-hidden rounded-[24px] border border-[#dfd0bb] bg-white shadow-[0_16px_50px_rgba(38,57,49,.08)]">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[linear-gradient(135deg,#163f35,#285c4d)] px-5 py-4 text-white sm:px-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e2bd8c]">Cần xử lý</p>
                  <h2 className="mt-1 font-display text-lg font-bold">Yêu cầu hủy & hoàn tiền</h2>
                </div>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold">
                  {stats.pendingCancellation} yêu cầu chờ duyệt
                </span>
              </div>
              <div className="divide-y divide-[#eee3d4]">
                {bookings.filter((booking) => booking.cancellationRequestStatus === 'PENDING').map((booking) => (
                  <article key={booking.bookingId} className="grid gap-4 p-5 lg:grid-cols-[1fr_1.1fr_auto] lg:items-center lg:px-6">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#f2e3ce] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#805e35]">{booking.bookingCode}</span>
                        <span className="text-xs text-on-surface-variant">{booking.cancellationRequestedAt ? formatBookingDateTime(booking.cancellationRequestedAt) : ''}</span>
                      </div>
                      <h3 className="mt-2 font-display text-base font-bold text-on-surface">{booking.customerName} · {booking.roomName}</h3>
                      <p className="mt-1 text-sm text-on-surface-variant">Nhận phòng: {formatBookingDateTime(booking.startTime)}</p>
                    </div>
                    <div className="rounded-2xl border border-[#eadfce] bg-[#fcf8f2] px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#907657]">Lý do của khách</p>
                      <p className="mt-1 text-sm leading-6 text-on-surface">{booking.cancellationReason}</p>
                      <div className="mt-2 flex items-center justify-between gap-3 border-t border-[#eadfce] pt-2 text-sm">
                        <span className="text-on-surface-variant">Hoàn dự kiến 100%</span>
                        <strong className="text-[#8f6333]">{formatAdminPrice(booking.refundAmount ?? booking.paidAmount)}</strong>
                      </div>
                    </div>
                    <div className="min-w-[220px]">
                      <input
                        value={reviewNotes[booking.bookingId] ?? ''}
                        onChange={(event) => setReviewNotes((current) => ({ ...current, [booking.bookingId]: event.target.value.slice(0, 500) }))}
                        placeholder="Ghi chú cho khách (không bắt buộc)"
                        className="h-10 w-full rounded-xl border border-outline bg-white px-3 text-sm outline-none focus:border-brand-orange"
                      />
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button type="button" disabled={reviewingBookingId === booking.bookingId} onClick={() => void handleCancellationReview(booking.bookingId, false)} className="h-10 rounded-xl border border-error/30 bg-white text-sm font-bold text-error transition hover:bg-error-container disabled:opacity-50">Từ chối</button>
                        <button type="button" disabled={reviewingBookingId === booking.bookingId} onClick={() => void handleCancellationReview(booking.bookingId, true)} className="h-10 rounded-xl bg-[#17493c] text-sm font-bold text-white transition hover:bg-[#0f392f] disabled:opacity-50">Duyệt hủy</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

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
          onSettleCheckout={handleSettleCheckout}
          onAddonChanged={handleAddonChanged}
        />
    </>
  )
}
