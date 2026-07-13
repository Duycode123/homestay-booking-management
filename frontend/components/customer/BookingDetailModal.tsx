'use client'

import { useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'
import { formatCurrency } from '@/components/booking/booking-data'
import BookingStatusBadge from '@/components/customer/BookingStatusBadge'
import { IconCalendar, IconClock, IconClose } from '@/components/customer/CustomerIcons'
import type { AuthUser } from '@/lib/auth'
import {
  canReviewBooking,
  clearReviewDraft,
  getBookingDetail,
  loadReviewDraft,
  saveReviewDraft,
  submitBookingReview,
  type BookingHistoryItem,
  type BookingReview,
} from '@/lib/customer-booking-service'

const minContentLength = 20
const maxContentLength = 700

type BookingDetailModalProps = {
  booking: BookingHistoryItem | null
  reviewerName: string
  onClose: () => void
  onReviewSubmitted: (review: BookingReview) => void
}

export default function BookingDetailModal({
  booking,
  reviewerName,
  onClose,
  onReviewSubmitted,
}: BookingDetailModalProps) {
  if (!booking) return null

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-detail-title"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-[900px] overflow-y-auto rounded-t-[28px] border border-outline-variant bg-surface sm:rounded-[28px] shadow-[var(--shadow-elevated)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative overflow-hidden border-b border-outline-variant bg-white px-5 py-6 sm:px-7">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-brand-orange/10 blur-2xl"
          />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
                Chi tiết đặt phòng
              </p>
              <h2 id="booking-detail-title" className="mt-2 font-display text-2xl font-bold text-on-surface">
                {booking.roomName}
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">Mã: {booking.bookingId}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-white text-on-surface transition hover:border-brand-orange/40 hover:bg-primary-container"
              aria-label="Đóng chi tiết đặt phòng"
            >
              <IconClose className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-5 p-5 sm:p-7">
          <section className="rounded-[20px] border border-outline-variant bg-white p-5 shadow-[var(--shadow-card)]">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-lg font-bold text-on-surface">Thông tin đặt phòng</h3>
              <BookingStatusBadge status={booking.status} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Detail
                icon={<IconCalendar className="h-4 w-4 text-brand-orange" />}
                label="Ngày đặt"
                value={booking.date}
              />
              <Detail
                icon={<IconClock className="h-4 w-4 text-brand-orange" />}
                label="Khung giờ"
                value={`${booking.startTime} – ${booking.endTime}`}
              />
              <Detail label="Tổng tiền" value={formatCurrency(booking.totalAmount)} highlight />
              <Detail label="Phương thức thanh toán" value={booking.paymentMethod || 'Chưa cập nhật'} />
              <Detail label="Dịch vụ thuê thêm" value={booking.addons?.length ? booking.addons.join(', ') : 'Không có'} />
              <Detail label="Ghi chú" value={booking.note || 'Không có ghi chú'} />
            </div>
          </section>

          <ReviewSection booking={booking} reviewerName={reviewerName} onReviewSubmitted={onReviewSubmitted} />
        </div>
      </div>
    </div>
  )
}

function ReviewSection({
  booking,
  reviewerName,
  onReviewSubmitted,
}: {
  booking: BookingHistoryItem
  reviewerName: string
  onReviewSubmitted: (review: BookingReview) => void
}) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [content, setContent] = useState('')
  const [restoreMessage, setRestoreMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [draftReady, setDraftReady] = useState(false)

  useEffect(() => {
    if (booking.review) return

    const draft = loadReviewDraft(booking.bookingId)

    if (draft) {
      setRating(draft.rating)
      setContent(draft.content.slice(0, maxContentLength))
      setRestoreMessage('Bản nháp đánh giá đã được khôi phục.')
    } else {
      setRating(0)
      setContent('')
      setRestoreMessage('')
    }

    setDraftReady(true)
  }, [booking.bookingId, booking.review])

  const validation = useMemo(() => {
    const trimmedContent = content.trim()

    return {
      rating: rating < 1 ? 'Vui lòng chọn số sao đánh giá.' : '',
      content: trimmedContent.length < minContentLength ? 'Nội dung đánh giá cần ít nhất 20 ký tự.' : '',
    }
  }, [content, rating])

  const isFormValid = !validation.rating && !validation.content && content.length <= maxContentLength

  useEffect(() => {
    if (!draftReady || booking.review) return

    const timeout = window.setTimeout(() => {
      const hasDraftContent = rating > 0 || content.trim().length > 0

      if (!hasDraftContent) {
        clearReviewDraft(booking.bookingId)
        return
      }

      saveReviewDraft(booking.bookingId, { rating, content })
    }, 500)

    return () => window.clearTimeout(timeout)
  }, [booking.bookingId, booking.review, content, draftReady, rating])

  if (booking.review) {
    return <SubmittedReview review={booking.review} reviewerName={reviewerName} />
  }

  if (!canReviewBooking(booking)) {
    return (
      <section className="rounded-[20px] border border-outline-variant bg-white p-5 shadow-[var(--shadow-card)]">
        <h3 className="font-display text-lg font-bold text-on-surface">Đánh giá phòng</h3>
        <p className="mt-3 rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
          Bạn có thể đánh giá sau khi buổi đặt phòng đã hoàn tất.
        </p>
      </section>
    )
  }

  const handleStarKeyDown = (event: KeyboardEvent<HTMLButtonElement>, starValue: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setRating(starValue)
    }
  }

  const handleSubmit = async () => {
    if (!isFormValid) return

    setIsSubmitting(true)
    setSuccessMessage('')
    setSubmitError('')

    try {
      const review = await submitBookingReview({
        bookingId: booking.bookingId,
        backendBookingId: booking.backendBookingId,
        roomId: booking.roomId,
        customerName: reviewerName,
        rating,
        content,
      })
      clearReviewDraft(booking.bookingId)
      onReviewSubmitted(review)
      setSuccessMessage('Cảm ơn bạn đã gửi đánh giá.')
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Không thể gửi đánh giá. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="rounded-[20px] border border-outline-variant bg-white p-5 shadow-[var(--shadow-card)]">
      <div>
        <h3 className="font-display text-lg font-bold text-on-surface">Đánh giá phòng</h3>
        <p className="mt-1 text-sm text-on-surface-variant">
          Chia sẻ trải nghiệm về phòng homestay, tiện nghi và hỗ trợ tại homestay.
        </p>
      </div>

      {restoreMessage && (
        <p className="mt-4 rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
          {restoreMessage}
        </p>
      )}

      <div className="mt-5">
        <p className="font-display text-xs font-bold uppercase tracking-wider text-on-surface-variant">Số sao</p>
        <div className="mt-2 flex gap-1" onMouseLeave={() => setHoverRating(0)}>
          {Array.from({ length: 5 }, (_, index) => {
            const starValue = index + 1
            const active = starValue <= (hoverRating || rating)

            return (
              <button
                key={starValue}
                type="button"
                onClick={() => setRating(starValue)}
                onKeyDown={(event) => handleStarKeyDown(event, starValue)}
                onMouseEnter={() => setHoverRating(starValue)}
                className={['text-3xl transition', active ? 'text-brand-orange' : 'text-outline'].join(' ')}
                aria-label={`${starValue} sao`}
                aria-pressed={rating === starValue}
              >
                ★
              </button>
            )
          })}
        </div>
        {validation.rating && <FieldError message={validation.rating} />}
      </div>

      <label className="mt-4 block">
        <span className="font-display text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Nội dung đánh giá
        </span>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value.slice(0, maxContentLength))}
          rows={5}
          placeholder="Chia sẻ trải nghiệm của bạn về phòng homestay, tiện nghi, tiện nghi và hỗ trợ tại homestay."
          className="mt-2 w-full resize-none rounded-2xl border border-outline bg-white px-4 py-3 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/60 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
        />
      </label>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-on-surface-variant">
          {content.length}/{maxContentLength}
        </p>
        {validation.content && <FieldError message={validation.content} />}
      </div>

      {successMessage && <p className="mt-4 text-sm font-semibold text-brand-greenLight">{successMessage}</p>}
      {submitError && <p className="mt-4 text-sm font-semibold text-error">{submitError}</p>}

      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={!isFormValid || isSubmitting}
        className="mt-5 h-12 rounded-xl bg-brand-orange px-5 font-display text-sm font-semibold text-white shadow-[0_10px_26px_rgba(255,117,24,0.24)] transition hover:bg-brand-orangeHover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Đang gửi đánh giá...' : 'Gửi đánh giá'}
      </button>
    </section>
  )
}

function SubmittedReview({ review, reviewerName }: { review: BookingReview; reviewerName: string }) {
  return (
    <section className="rounded-[20px] border border-outline-variant bg-white p-5 shadow-[var(--shadow-card)]">
      <h3 className="font-display text-lg font-bold text-on-surface">Bạn đã đánh giá phòng này</h3>
      <p className="mt-2 rounded-2xl border border-brand-greenLight/20 bg-secondary-container/10 px-4 py-3 text-sm font-medium text-brand-greenLight">
        Cảm ơn bạn đã gửi đánh giá.
      </p>
      <ReviewCard review={review} reviewerName={reviewerName} />
    </section>
  )
}

function ReviewCard({ review, reviewerName }: { review: BookingReview; reviewerName: string }) {
  return (
    <article className="mt-4 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-sm font-bold text-on-surface">{getReviewCustomerName(review, reviewerName)}</p>
          <div className="mt-1 flex text-xl text-brand-orange" aria-label={`${review.rating} trên 5 sao`}>
            {renderStars(review.rating)}
          </div>
        </div>
        <span className="text-xs font-medium text-on-surface-variant">{formatReviewDate(review.createdAt)}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-on-surface-variant">{review.content}</p>
    </article>
  )
}

function Detail({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string
  value: string
  icon?: ReactNode
  highlight?: boolean
}) {
  return (
    <div className="rounded-xl border border-outline-variant/80 bg-surface-container-low/50 px-4 py-3">
      <p className="flex items-center gap-1.5 font-display text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
        {icon}
        {label}
      </p>
      <p
        className={[
          'mt-1 text-sm font-semibold leading-6',
          highlight ? 'font-display text-lg text-brand-orange' : 'text-on-surface',
        ].join(' ')}
      >
        {value}
      </p>
    </div>
  )
}

function FieldError({ message }: { message: string }) {
  return <p className="text-xs font-semibold text-error">{message}</p>
}

function getReviewCustomerName(review: BookingReview, reviewerName: string) {
  const storedName = review.customerName?.trim()
  if (storedName && storedName !== 'Khách hàng') return storedName
  return reviewerName
}

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, index) => (
    <span key={index} className={index < rating ? 'text-brand-orange' : 'text-outline'}>
      ★
    </span>
  ))
}

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function getReviewerName(user: AuthUser | null | undefined) {
  return user?.fullName?.trim() || user?.name?.trim() || user?.email?.trim() || 'Khách hàng'
}
