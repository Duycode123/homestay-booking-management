import type { AdminReview } from '@/lib/admin/reviews/types'

type ReviewBadgesProps = {
  approved: boolean
}

export function ReviewApprovalBadge({ approved }: ReviewBadgesProps) {
  return (
    <span
      className={[
        'inline-flex rounded-full px-2.5 py-1 font-display text-[10px] font-semibold uppercase tracking-wide',
        approved ? 'bg-secondary-container/50 text-secondary' : 'bg-primary-container/50 text-brand-orange',
      ].join(' ')}
    >
      {approved ? 'Đã công khai' : 'Chưa công khai'}
    </span>
  )
}

export function ReviewRatingBadge({ rating }: { rating: number }) {
  return (
    <span className="inline-flex rounded-full bg-surface-container px-2.5 py-1 font-display text-xs font-bold text-on-surface">
      {rating} ★
    </span>
  )
}

export function ReviewReplyBadge({ review }: { review: AdminReview }) {
  if (!review.adminResponse?.content) return null

  return (
    <span className="inline-flex rounded-full border border-outline-variant bg-white px-2.5 py-1 text-[10px] font-semibold text-on-surface-variant">
      Đã phản hồi
    </span>
  )
}
