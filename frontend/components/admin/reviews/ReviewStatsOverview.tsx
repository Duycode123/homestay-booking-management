'use client'

import type { ReviewStats } from '@/lib/admin/reviews/types'

type ReviewStatsOverviewProps = {
  stats: ReviewStats | null
  isLoading: boolean
}

export default function ReviewStatsOverview({ stats, isLoading }: ReviewStatsOverviewProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl bg-surface-container" />
        ))}
      </div>
    )
  }

  const cards = [
    { label: 'Tổng đánh giá', value: stats.total, hint: 'Toàn hệ thống' },
    { label: 'Chờ duyệt', value: stats.pending, hint: 'Chưa công khai' },
    { label: 'Đã công khai', value: stats.published, hint: 'Hiển thị cho khách hàng' },
    { label: 'Điểm TB', value: stats.averageRating.toFixed(1), hint: 'Mẫu 100 đánh giá gần nhất' },
  ]

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-outline-variant bg-white p-4 shadow-[var(--shadow-card)]"
          >
            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
              {card.label}
            </p>
            <p className="mt-2 font-display text-3xl font-bold text-on-surface">{card.value}</p>
            <p className="mt-1 text-xs text-on-surface-variant">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-outline-variant bg-white p-4 shadow-[var(--shadow-card)]">
        <p className="font-display text-sm font-bold text-on-surface">Phân bổ sao</p>
        <div className="mt-3 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="grid grid-cols-[40px_1fr_24px] items-center gap-2 text-xs">
              <span className="text-on-surface-variant">{star}★</span>
              <div className="h-2 rounded-full bg-surface-container">
                <div
                  className="h-full rounded-full bg-brand-orange"
                  style={{
                    width: `${stats.total > 0 ? (stats.breakdown[star as keyof typeof stats.breakdown] / Math.max(...Object.values(stats.breakdown), 1)) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-right text-on-surface-variant">
                {stats.breakdown[star as keyof typeof stats.breakdown]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
