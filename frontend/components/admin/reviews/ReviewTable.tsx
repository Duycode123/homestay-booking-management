'use client'

import type { AdminReview } from '@/lib/admin/reviews/types'
import { ReviewApprovalBadge, ReviewRatingBadge, ReviewReplyBadge } from './ReviewBadges'

type ReviewTableProps = {
  reviews: AdminReview[]
  isLoading: boolean
  selectedId: number | null
  selectedIds: number[]
  onSelect: (review: AdminReview) => void
  onToggleSelect: (reviewId: number) => void
  onToggleSelectAll: () => void
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN')
}

export default function ReviewTable({
  reviews,
  isLoading,
  selectedId,
  selectedIds,
  onSelect,
  onToggleSelect,
  onToggleSelectAll,
}: ReviewTableProps) {
  const allSelected = reviews.length > 0 && reviews.every((review) => selectedIds.includes(review.reviewId))

  if (isLoading) {
    return (
      <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-lg bg-surface-container" />
          ))}
        </div>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-outline-variant bg-white px-6 py-12 text-center shadow-[var(--shadow-card)]">
        <p className="font-display text-sm font-medium text-on-surface">Không tìm thấy đánh giá</p>
        <p className="mt-1 text-xs text-on-surface-variant">Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low">
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  aria-label="Chọn tất cả"
                  className="h-4 w-4 rounded border-outline text-brand-orange focus:ring-brand-orange"
                />
              </th>
              {['Khách hàng', 'Phòng', 'Sao', 'Nội dung', 'Trạng thái', 'Thời gian'].map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => {
              const active = selectedId === review.reviewId
              const checked = selectedIds.includes(review.reviewId)

              return (
                <tr
                  key={review.reviewId}
                  className={[
                    'border-b border-outline-variant/60 transition-colors last:border-0',
                    active ? 'bg-primary-container/25' : 'hover:bg-surface-container-low',
                  ].join(' ')}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleSelect(review.reviewId)}
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Chọn đánh giá ${review.reviewId}`}
                      className="h-4 w-4 rounded border-outline text-brand-orange focus:ring-brand-orange"
                    />
                  </td>
                  <td className="cursor-pointer px-4 py-3" onClick={() => onSelect(review)}>
                    <p className="font-medium text-on-surface">{review.customerName}</p>
                    <p className="text-xs text-on-surface-variant">Đơn #{review.bookingId}</p>
                  </td>
                  <td className="cursor-pointer px-4 py-3" onClick={() => onSelect(review)}>
                    <p className="font-medium text-on-surface">{review.roomName}</p>
                    {review.staffName && (
                      <p className="text-xs text-on-surface-variant">Nhân viên: {review.staffName}</p>
                    )}
                  </td>
                  <td className="cursor-pointer px-4 py-3" onClick={() => onSelect(review)}>
                    <ReviewRatingBadge rating={review.rating} />
                  </td>
                  <td className="max-w-xs cursor-pointer px-4 py-3" onClick={() => onSelect(review)}>
                    <p className="line-clamp-2 text-on-surface-variant">{review.content}</p>
                  </td>
                  <td className="cursor-pointer px-4 py-3" onClick={() => onSelect(review)}>
                    <div className="flex flex-wrap gap-1.5">
                      <ReviewApprovalBadge approved={review.approved} />
                      <ReviewReplyBadge review={review} />
                    </div>
                  </td>
                  <td className="cursor-pointer px-4 py-3 text-xs text-on-surface-variant" onClick={() => onSelect(review)}>
                    {formatDateTime(review.createdAt)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
