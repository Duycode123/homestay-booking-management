'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'
import { formatCurrency } from '@/components/booking/booking-data'
import BookingStatusBadge from '@/components/customer/BookingStatusBadge'
import ProjectSelect from '@/components/ui/ProjectSelect'
import { IconCalendar, IconClock, IconClose } from '@/components/customer/CustomerIcons'
import type { AuthUser } from '@/lib/auth'
import { findRefundBank, REFUND_BANKS } from '@/lib/refund-banks'
import {
  canReviewBooking,
  clearReviewDraft,
  getBookingDetail,
  getBookingRefund,
  loadReviewDraft,
  requestBookingCancellation,
  saveReviewDraft,
  submitBookingReview,
  uploadReviewImage,
  type BookingHistoryItem,
  type BookingReview,
  type CustomerRefundRecord,
  type ReviewImage,
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

          <CancellationSection booking={booking} />

          <ReviewSection booking={booking} reviewerName={reviewerName} onReviewSubmitted={onReviewSubmitted} />
        </div>
      </div>
    </div>
  )
}

function CancellationSection({ booking }: { booking: BookingHistoryItem }) {
  const [currentBooking, setCurrentBooking] = useState(booking)
  const [showForm, setShowForm] = useState(false)
  const [reason, setReason] = useState('')
  const [refundBankCode, setRefundBankCode] = useState('')
  const [refundAccountNumber, setRefundAccountNumber] = useState('')
  const [refundAccountHolder, setRefundAccountHolder] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [refund, setRefund] = useState<CustomerRefundRecord | null>(null)
  const [isLoadingRefund, setIsLoadingRefund] = useState(false)

  useEffect(() => {
    setCurrentBooking(booking)
    setShowForm(false)
    setReason('')
    setRefundBankCode('')
    setRefundAccountNumber('')
    setRefundAccountHolder('')
    setErrorMessage('')
    setRefund(null)
  }, [booking])

  const requestStatus = currentBooking.cancellationRequestStatus

  useEffect(() => {
    if (requestStatus !== 'APPROVED' || !currentBooking.backendBookingId) return
    let active = true
    setIsLoadingRefund(true)
    void getBookingRefund(currentBooking.backendBookingId)
      .then((data) => { if (active) setRefund(data) })
      .catch((error) => { if (active) setErrorMessage(error instanceof Error ? error.message : 'Không thể tải trạng thái hoàn tiền.') })
      .finally(() => { if (active) setIsLoadingRefund(false) })
    return () => { active = false }
  }, [currentBooking.backendBookingId, requestStatus])
  const startTimestamp = currentBooking.startDateTime ? new Date(currentBooking.startDateTime).getTime() : 0
  const hoursUntilCheckIn = startTimestamp ? (startTimestamp - Date.now()) / 3_600_000 : 0
  const canRequest =
    !requestStatus &&
    (currentBooking.status === 'PAID' || currentBooking.status === 'DEPOSIT_PAID') &&
    hoursUntilCheckIn >= 24
  const selectedRefundBank = findRefundBank(refundBankCode)
  const isRefundDestinationValid = Boolean(
    selectedRefundBank
      && /^\d{6,30}$/.test(refundAccountNumber)
      && refundAccountHolder.trim().length >= 2,
  )

  if (!requestStatus && !canRequest) return null

  const submitRequest = async () => {
    if (!currentBooking.backendBookingId || reason.trim().length < 10 || !selectedRefundBank || !isRefundDestinationValid) return
    setIsSubmitting(true)
    setErrorMessage('')
    try {
      const updated = await requestBookingCancellation(currentBooking.backendBookingId, {
        reason,
        refundBankCode: selectedRefundBank.code,
        refundBankName: `${selectedRefundBank.shortName} - ${selectedRefundBank.name}`,
        refundAccountNumber,
        refundAccountHolder,
      })
      setCurrentBooking((current) => ({ ...current, ...updated }))
      setShowForm(false)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể gửi yêu cầu hủy phòng.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const statusPresentation = requestStatus
    ? {
        PENDING: {
          title: 'Yêu cầu đang chờ admin duyệt',
          description: 'Phòng vẫn được giữ cho bạn cho đến khi admin đưa ra quyết định.',
          tone: 'border-[#d9b477]/45 bg-[#fff8ec] text-[#805f31]',
        },
        APPROVED: {
          title: 'Yêu cầu hủy đã được duyệt',
          description: currentBooking.expectedRefundAt
            ? `Khoản hoàn dự kiến được xử lý trước ${formatReviewDate(currentBooking.expectedRefundAt)}.`
            : 'Khoản hoàn tiền đang được bộ phận thanh toán xử lý.',
          tone: 'border-[#70a38e]/40 bg-[#eef8f3] text-[#245d4b]',
        },
        REJECTED: {
          title: 'Yêu cầu hủy chưa được chấp thuận',
          description: currentBooking.cancellationAdminNote || 'Booking vẫn giữ nguyên. Bạn có thể liên hệ hỗ trợ để được giải đáp.',
          tone: 'border-[#d99292]/40 bg-[#fff3f2] text-[#9b3c3c]',
        },
      }[requestStatus]
    : null

  return (
    <section className="overflow-hidden rounded-[20px] border border-[#dfd2bf] bg-white shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-4 bg-[linear-gradient(135deg,#f8f2e9,#fff)] p-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a47743]">Chính sách linh hoạt</p>
          <h3 className="mt-1 font-display text-lg font-bold text-on-surface">Yêu cầu hủy phòng</h3>
          <p className="mt-1 max-w-xl text-sm leading-6 text-on-surface-variant">
            Gửi trước giờ nhận phòng ít nhất 24 giờ. Admin sẽ kiểm tra và duyệt; chỉ sau khi được duyệt booking mới bị hủy và hoàn 100% số tiền đã thu.
          </p>
        </div>
        {canRequest && !showForm && (
          <button type="button" onClick={() => setShowForm(true)} className="rounded-xl border border-[#b88b55] bg-white px-4 py-2.5 text-sm font-bold text-[#8a6236] transition hover:bg-[#f6ebdc]">
            Gửi yêu cầu hủy
          </button>
        )}
      </div>

      {statusPresentation && (
        <div className="p-5 pt-0">
          <div className={['rounded-2xl border px-4 py-3', statusPresentation.tone].join(' ')}>
            <p className="font-display text-sm font-bold">{statusPresentation.title}</p>
            <p className="mt-1 text-sm leading-6 opacity-85">{statusPresentation.description}</p>
            {currentBooking.refundAmount != null && requestStatus !== 'REJECTED' && (
              <p className="mt-2 text-sm font-bold">Khoản hoàn dự kiến: {formatCurrency(currentBooking.refundAmount)}</p>
            )}
          </div>
        </div>
      )}

      {requestStatus === 'APPROVED' && (
        <RefundTimeline refund={refund} isLoading={isLoadingRefund} fallbackAmount={currentBooking.refundAmount} />
      )}

      {showForm && (
        <div className="border-t border-[#eadfce] p-5">
          <label className="block text-sm font-bold text-on-surface">
            Lý do hủy
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value.slice(0, 500))}
              rows={4}
              placeholder="Cho admin biết lý do bạn cần hủy phòng (ít nhất 10 ký tự)..."
              className="mt-2 w-full resize-none rounded-2xl border border-outline bg-[#fffdfa] px-4 py-3 text-sm font-normal outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15"
            />
          </label>
          <div className="mt-2 flex items-center justify-between text-xs text-on-surface-variant">
            <span>{reason.trim().length < 10 ? 'Cần ít nhất 10 ký tự' : 'Lý do đã hợp lệ'}</span>
            <span>{reason.length}/500</span>
          </div>
          <div className="mt-5 rounded-[20px] border border-[#dfd2bf] bg-[#fbf8f3] p-4">
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#a47743]">Tài khoản nhận hoàn tiền</p>
              <p className="mt-1 text-xs leading-5 text-on-surface-variant">Admin sẽ chuyển đúng số tiền được duyệt vào tài khoản này. Vui lòng kiểm tra kỹ trước khi gửi.</p>
            </div>
            <label className="block text-sm font-bold text-on-surface">
              Ngân hàng
              <ProjectSelect value={refundBankCode} onChange={(event) => setRefundBankCode(event.target.value)} className="mt-2 h-12 rounded-2xl bg-white">
                <option value="">Chọn ngân hàng nhận tiền</option>
                {REFUND_BANKS.map((bank) => <option key={bank.code} value={bank.code}>{bank.shortName} · {bank.name}</option>)}
              </ProjectSelect>
            </label>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-bold text-on-surface">
                Số tài khoản
                <input inputMode="numeric" autoComplete="off" value={refundAccountNumber} onChange={(event) => setRefundAccountNumber(event.target.value.replace(/\D/g, '').slice(0, 30))} placeholder="Chỉ nhập chữ số" className="input-field mt-2" />
              </label>
              <label className="block text-sm font-bold text-on-surface">
                Tên chủ tài khoản
                <input autoComplete="name" value={refundAccountHolder} onChange={(event) => setRefundAccountHolder(event.target.value.slice(0, 100).toLocaleUpperCase('vi-VN'))} placeholder="NGUYEN VAN A" className="input-field mt-2" />
              </label>
            </div>
            <p className="mt-3 text-xs leading-5 text-[#6f675c]">Homestay không yêu cầu mật khẩu, mã OTP hoặc số dư tài khoản ngân hàng.</p>
          </div>
          {errorMessage && <p className="mt-3 rounded-xl bg-error-container px-3 py-2 text-sm text-error">{errorMessage}</p>}
          <div className="mt-4 flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="h-11 flex-1 rounded-xl border border-outline bg-white text-sm font-semibold text-on-surface">Để sau</button>
            <button type="button" disabled={reason.trim().length < 10 || !isRefundDestinationValid || isSubmitting} onClick={() => void submitRequest()} className="h-11 flex-[1.5] rounded-xl bg-[#17493c] text-sm font-bold text-white transition hover:bg-[#0f392f] disabled:cursor-not-allowed disabled:opacity-50">
              {isSubmitting ? 'Đang gửi...' : 'Xác nhận gửi yêu cầu'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function RefundTimeline({
  refund,
  isLoading,
  fallbackAmount,
}: {
  refund: CustomerRefundRecord | null
  isLoading: boolean
  fallbackAmount?: number
}) {
  const currentStep = refund?.status === 'COMPLETED' ? 3 : refund?.status === 'PROCESSING' ? 2 : 1
  const needsRetry = refund?.status === 'RETRY_REQUIRED' || refund?.status === 'FAILED'

  return (
    <div className="border-t border-[#eadfce] p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a47743]">Tiến trình hoàn tiền</p>
          <h4 className="mt-1 font-display text-base font-bold text-on-surface">
            {isLoading ? 'Đang đồng bộ trạng thái...' : needsRetry ? 'Khoản hoàn đang được xử lý lại' : refund?.status === 'COMPLETED' ? 'Đã hoàn tiền thành công' : refund?.status === 'PROCESSING' ? 'Bộ phận tài chính đang xử lý' : 'Đã tiếp nhận khoản hoàn'}
          </h4>
        </div>
        <p className="font-display text-lg font-bold text-brand-orange">{formatCurrency(refund?.amount ?? fallbackAmount ?? 0)}</p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {[
          { step: 1, label: 'Đã duyệt hủy' },
          { step: 2, label: 'Đang xử lý' },
          { step: 3, label: 'Đã hoàn tiền' },
        ].map((item) => {
          const active = currentStep >= item.step
          return (
            <div key={item.step} className="relative text-center">
              <div className={['mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ring-4 ring-white', active ? 'bg-secondary text-white' : 'bg-[#ece7df] text-on-surface-variant'].join(' ')}>{active && currentStep > item.step ? '✓' : item.step}</div>
              <div className={['absolute left-[calc(50%+16px)] right-[calc(-50%+16px)] top-4 -z-0 h-px', item.step < 3 && currentStep > item.step ? 'bg-secondary' : 'bg-[#ddd3c6]'].join(' ')} />
              <p className={['relative mt-2 text-[11px] font-bold', active ? 'text-secondary' : 'text-on-surface-variant'].join(' ')}>{item.label}</p>
            </div>
          )
        })}
      </div>

      {refund?.recipientAccountNumber && (
        <div className="mt-4 rounded-2xl border border-[#e1d6c8] bg-[#fbf8f3] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-on-surface-variant">Tài khoản nhận hoàn</p>
          <p className="mt-1 text-sm font-bold text-on-surface">{refund.recipientBankName || refund.recipientBankCode} · •••• {refund.recipientAccountNumber.slice(-4)}</p>
          <p className="mt-1 text-xs text-on-surface-variant">{refund.recipientAccountHolder}</p>
        </div>
      )}

      {needsRetry && <p className="mt-4 rounded-xl bg-[#fff4ef] px-3 py-2 text-xs font-semibold text-[#a34f35]">Giao dịch đang được bộ phận vận hành xử lý lại. Bạn không cần gửi thêm yêu cầu.</p>}
      {refund?.status === 'COMPLETED' && refund.transactionReference && <p className="mt-4 rounded-xl bg-[#edf5f1] px-3 py-2 text-xs text-secondary">Mã đối soát: <strong>{refund.transactionReference}</strong></p>}
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
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [images, setImages] = useState<ReviewImage[]>([])
  const [imageError, setImageError] = useState('')
  const [draftReady, setDraftReady] = useState(false)

  useEffect(() => {
    if (booking.review) return

    const draft = loadReviewDraft(booking.bookingId)

    if (draft) {
      setRating(draft.rating)
      setContent(draft.content.slice(0, maxContentLength))
      setImages(draft.imageUrls.map((url, index) => ({ id: `draft-${index}-${url}`, name: `Ảnh ${index + 1}`, previewUrl: url })))
      setRestoreMessage('Bản nháp đánh giá đã được khôi phục.')
    } else {
      setRating(0)
      setContent('')
      setImages([])
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
      const hasDraftContent = rating > 0 || content.trim().length > 0 || images.length > 0

      if (!hasDraftContent) {
        clearReviewDraft(booking.bookingId)
        return
      }

      saveReviewDraft(booking.bookingId, { rating, content, imageUrls: images.map((image) => image.previewUrl) })
    }, 500)

    return () => window.clearTimeout(timeout)
  }, [booking.bookingId, booking.review, content, draftReady, images, rating])

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
    if (!isFormValid || isUploadingImages) return

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
        imageUrls: images.map((image) => image.previewUrl),
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

  const handleImageSelection = async (files: FileList | null) => {
    const selectedFiles = Array.from(files ?? [])
    if (selectedFiles.length === 0) return

    setImageError('')
    const remainingSlots = 4 - images.length
    if (remainingSlots <= 0) {
      setImageError('Mỗi đánh giá chỉ được đính kèm tối đa 4 ảnh.')
      return
    }

    const filesToUpload = selectedFiles.slice(0, remainingSlots)
    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
    const invalidFile = filesToUpload.find((file) => !allowedTypes.has(file.type) || file.size > 5 * 1024 * 1024)
    if (invalidFile) {
      setImageError('Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP và mỗi ảnh không quá 5MB.')
      return
    }

    setIsUploadingImages(true)
    const uploadedImages: ReviewImage[] = []
    try {
      for (const file of filesToUpload) {
        const uploaded = await uploadReviewImage(file)
        uploadedImages.push({ id: uploaded.publicId, name: file.name, previewUrl: uploaded.secureUrl })
      }
      setImages((current) => [...current, ...uploadedImages].slice(0, 4))
      if (selectedFiles.length > remainingSlots) {
        setImageError(`Chỉ ${remainingSlots} ảnh đầu tiên được thêm do giới hạn 4 ảnh.`)
      }
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Không thể tải ảnh đánh giá. Vui lòng thử lại.')
      if (uploadedImages.length > 0) {
        setImages((current) => [...current, ...uploadedImages].slice(0, 4))
      }
    } finally {
      setIsUploadingImages(false)
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

      <div className="mt-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-wider text-on-surface-variant">Ảnh trải nghiệm</p>
            <p className="mt-1 text-xs text-on-surface-variant">Không bắt buộc · Tối đa 4 ảnh, mỗi ảnh 5MB</p>
          </div>
          <span className="text-xs font-bold text-secondary">{images.length}/4</span>
        </div>

        {images.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((image) => (
              <div key={image.id} className="group relative aspect-square overflow-hidden rounded-2xl bg-surface-container">
                <Image src={image.previewUrl} alt={image.name} fill unoptimized sizes="160px" className="object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((current) => current.filter((item) => item.id !== image.id))}
                  aria-label={`Xóa ${image.name}`}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-sm font-bold text-white shadow-lg transition hover:bg-error"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {images.length < 4 && (
          <label className="mt-3 flex cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-[#cdbb9f] bg-[#fcfaf6] px-4 py-4 text-center transition hover:border-brand-orange hover:bg-[#fff8ef]">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f2e5d3] text-xl text-brand-orange">＋</span>
            <span className="text-left">
              <span className="block text-sm font-bold text-secondary">{isUploadingImages ? 'Đang tải ảnh...' : 'Thêm ảnh thực tế'}</span>
              <span className="mt-0.5 block text-xs text-on-surface-variant">JPG, PNG hoặc WebP</span>
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={isUploadingImages || isSubmitting}
              onChange={(event) => {
                void handleImageSelection(event.currentTarget.files)
                event.currentTarget.value = ''
              }}
              className="sr-only"
            />
          </label>
        )}
        {imageError && <p className="mt-2 text-xs font-semibold text-error">{imageError}</p>}
      </div>

      {successMessage && <p className="mt-4 text-sm font-semibold text-brand-greenLight">{successMessage}</p>}
      {submitError && <p className="mt-4 text-sm font-semibold text-error">{submitError}</p>}

      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={!isFormValid || isSubmitting || isUploadingImages}
        className="mt-5 h-12 rounded-xl bg-brand-orange px-5 font-display text-sm font-semibold text-white shadow-[0_10px_26px_rgba(178,132,85,0.24)] transition hover:bg-brand-orangeHover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isUploadingImages ? 'Đang tải ảnh...' : isSubmitting ? 'Đang gửi đánh giá...' : 'Gửi đánh giá'}
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
      {review.images && review.images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {review.images.map((image) => (
            <div key={image.id} className="relative aspect-square overflow-hidden rounded-xl bg-surface-container">
              <Image src={image.previewUrl} alt={image.name} fill unoptimized sizes="140px" className="object-cover" />
            </div>
          ))}
        </div>
      )}
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
