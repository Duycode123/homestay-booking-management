import type { RoomReviewStats } from '@/lib/review-service'

type RoomRatingSummaryProps = {
  stats: RoomReviewStats
}

function renderRatingStars(rating: number) {
  const filledStars = Math.max(0, Math.min(5, Math.round(rating)))

  return Array.from({ length: 5 }, (_, index) => (
    <span key={index} className={index < filledStars ? 'text-brand-orange' : 'text-outline-variant'}>
      ★
    </span>
  ))
}

export default function RoomRatingSummary({ stats }: RoomRatingSummaryProps) {
  const maxCount = Math.max(...Object.values(stats.breakdown), 1)

  return (
    <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
      <div className="rounded-2xl border border-outline-variant bg-surface-container-low/40 p-4 text-center">
        <p className="font-display text-4xl font-bold text-brand-orange">{stats.averageRating.toFixed(1)}</p>
        <div className="mt-2 flex justify-center text-base">{renderRatingStars(stats.averageRating)}</div>
        <p className="mt-2 text-xs text-on-surface-variant">{stats.totalCount} đánh giá</p>
      </div>

      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = stats.breakdown[star as keyof typeof stats.breakdown]
          const width = `${(count / maxCount) * 100}%`

          return (
            <div key={star} className="grid grid-cols-[52px_1fr_36px] items-center gap-3 text-sm">
              <span className="font-display text-xs font-semibold text-on-surface-variant">{star} sao</span>
              <div className="h-2 overflow-hidden rounded-full bg-surface-container">
                <div className="h-full rounded-full bg-brand-orange transition-all" style={{ width }} />
              </div>
              <span className="text-right text-xs font-medium text-on-surface-variant">{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
