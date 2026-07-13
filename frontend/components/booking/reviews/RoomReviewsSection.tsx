'use client'

import { useEffect, useMemo, useState } from 'react'
import RoomRatingSummary from '@/components/booking/reviews/RoomRatingSummary'
import RoomReviewCard from '@/components/booking/reviews/RoomReviewCard'
import {
  fetchPublicReviewsByRoomId,
} from '@/lib/public-room-review-service'
import {
  buildRoomReviewStats,
  filterReviewsByRating,
  paginateReviews,
  sortReviews,
  type BookingReview,
  type ReviewSortOption,
  type RoomReviewStats,
} from '@/lib/review-service'

const PAGE_SIZE = 5

const ratingFilterOptions: Array<{ value: number | 'all'; label: string }> = [
  { value: 'all', label: 'Tất cả sao' },
  { value: 5, label: '5 sao' },
  { value: 4, label: '4 sao' },
  { value: 3, label: '3 sao' },
  { value: 2, label: '2 sao' },
  { value: 1, label: '1 sao' },
]

const sortOptions: Array<{ value: ReviewSortOption; label: string }> = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'rating_high', label: 'Sao cao → thấp' },
  { value: 'rating_low', label: 'Sao thấp → cao' },
]

type RoomReviewsSectionProps = {
  roomId: string
}

const emptyStats: RoomReviewStats = {
  averageRating: 0,
  totalCount: 0,
  breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
}

export default function RoomReviewsSection({ roomId }: RoomReviewsSectionProps) {
  const [reviews, setReviews] = useState<BookingReview[]>([])
  const [stats, setStats] = useState<RoomReviewStats>(emptyStats)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all')
  const [sortBy, setSortBy] = useState<ReviewSortOption>('newest')
  const [page, setPage] = useState(0)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setErrorMessage('')
    setPage(0)

    void fetchPublicReviewsByRoomId(roomId)
      .then((roomReviews) => {
        if (!active) return

        setReviews(roomReviews)
        setStats(buildRoomReviewStats(roomReviews))
      })
      .catch(() => {
        if (!active) return

        setReviews([])
        setStats(emptyStats)
        setErrorMessage('Không thể tải đánh giá. Vui lòng thử lại sau.')
      })
      .finally(() => {
        if (!active) return

        setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [roomId])

  useEffect(() => {
    setPage(0)
  }, [ratingFilter, sortBy, roomId])

  const filteredReviews = useMemo(
    () => sortReviews(filterReviewsByRating(reviews, ratingFilter), sortBy),
    [reviews, ratingFilter, sortBy],
  )

  const pagedReviews = useMemo(
    () => paginateReviews(filteredReviews, page, PAGE_SIZE),
    [filteredReviews, page],
  )

  return (
    <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-bold text-on-surface">Đánh giá từ khách hàng</h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            {isLoading
              ? 'Đang tải đánh giá...'
              : stats.totalCount > 0
                ? `${stats.totalCount} đánh giá đã được duyệt`
                : 'Chưa có đánh giá công khai'}
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 rounded-2xl border border-error/30 bg-error-container/30 px-4 py-3 text-sm text-error">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl bg-surface-container" />
          ))}
        </div>
      ) : stats.totalCount > 0 ? (
        <>
          <div className="mt-5">
            <RoomRatingSummary stats={stats} />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
                Lọc theo sao
              </span>
              <select
                value={ratingFilter === 'all' ? 'all' : String(ratingFilter)}
                onChange={(event) => {
                  const value = event.target.value
                  setRatingFilter(value === 'all' ? 'all' : Number(value))
                }}
                className="h-11 w-full rounded-xl border border-outline bg-surface-container-lowest px-3 text-sm text-on-surface outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15"
              >
                {ratingFilterOptions.map((option) => (
                  <option key={String(option.value)} value={String(option.value)}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
                Sắp xếp
              </span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as ReviewSortOption)}
                className="h-11 w-full rounded-xl border border-outline bg-surface-container-lowest px-3 text-sm text-on-surface outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {pagedReviews.content.length > 0 ? (
            <>
              <div className="mt-4 grid gap-3">
                {pagedReviews.content.map((review) => (
                  <RoomReviewCard key={review.id} review={review} />
                ))}
              </div>

              {pagedReviews.totalPages > 1 && (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant pt-4">
                  <p className="text-xs text-on-surface-variant">
                    Trang {pagedReviews.page + 1}/{pagedReviews.totalPages} · {pagedReviews.totalElements} kết quả
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))}
                      disabled={pagedReviews.first}
                      className="rounded-lg border border-outline px-3 py-2 font-display text-xs font-medium text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
                    >
                      Trước
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((currentPage) => currentPage + 1)}
                      disabled={pagedReviews.last}
                      className="rounded-lg border border-outline px-3 py-2 font-display text-xs font-medium text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-outline-variant bg-surface-container-low/40 px-4 py-8 text-center">
              <p className="font-display text-base font-bold text-on-surface">Không có đánh giá phù hợp bộ lọc</p>
              <p className="mt-2 text-sm text-on-surface-variant">Thử chọn mức sao khác hoặc xóa bộ lọc.</p>
            </div>
          )}
        </>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-outline-variant bg-surface-container-low/40 px-4 py-10 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-container text-xl font-bold text-brand-orange">
            ★
          </div>
          <p className="font-display text-lg font-bold text-on-surface">Chưa có đánh giá</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">
            Phòng này chưa có đánh giá công khai. Hãy là người đầu tiên trải nghiệm và chia sẻ cảm nhận sau khi đặt phòng.
          </p>
        </div>
      )}
    </section>
  )
}
