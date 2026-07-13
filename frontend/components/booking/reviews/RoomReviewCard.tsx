import { formatRelativeTime, maskCustomerName } from '@/components/booking/booking-data'
import type { BookingReview } from '@/lib/review-service'

type RoomReviewCardProps = {
  review: BookingReview
}

function getAvatarInitial(customerName?: string) {
  return customerName?.trim().charAt(0).toUpperCase() || 'K'
}

function renderRatingStars(rating: number) {
  const filledStars = Math.max(0, Math.min(5, Math.round(rating)))

  return Array.from({ length: 5 }, (_, index) => (
    <span key={index} className={index < filledStars ? 'text-brand-orange' : 'text-outline-variant'}>
      ★
    </span>
  ))
}

export default function RoomReviewCard({ review }: RoomReviewCardProps) {
  const customerName = review.customerName || 'Khách hàng'

  return (
    <article className="rounded-2xl border border-outline-variant bg-surface-container-low/40 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-container font-display text-sm font-bold text-brand-orange">
          {getAvatarInitial(customerName)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-sm font-bold text-on-surface">{maskCustomerName(customerName)}</p>
            {review.verified && (
              <span className="inline-flex items-center gap-1 rounded-full border border-secondary-container/60 bg-secondary-container/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary">
                <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor" aria-hidden>
                  <path d="M6.2 10.7 3.8 8.3l-.9.9 3.3 3.3 6.7-6.7-.9-.9-5.8 5.8z" />
                </svg>
                Đã xác minh
              </span>
            )}
            <span className="ml-auto text-xs font-medium text-on-surface-variant">{formatRelativeTime(review.createdAt)}</span>
          </div>

          <div className="mt-1 flex text-sm" aria-label={`${review.rating} trên 5 sao`}>
            {renderRatingStars(review.rating)}
          </div>

          <p className="mt-3 text-sm leading-6 text-on-surface">{review.content}</p>

          {review.adminResponse?.content && (
            <div className="mt-4 rounded-xl border border-brand-greenDark/15 bg-secondary-container/20 p-3">
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.12em] text-secondary">
                Phản hồi từ quản trị viên
              </p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">{review.adminResponse.content}</p>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
