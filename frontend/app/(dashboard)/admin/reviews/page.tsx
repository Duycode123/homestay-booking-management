'use client'

import { useCallback, useEffect, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminToast from '@/components/admin/AdminToast'
import { IconRefresh, IconReviews } from '@/components/admin/AdminIcons'
import ReviewDetailPanel from '@/components/admin/reviews/ReviewDetailPanel'
import ReviewFiltersBar from '@/components/admin/reviews/ReviewFiltersBar'
import ReviewStatsOverview from '@/components/admin/reviews/ReviewStatsOverview'
import ReviewTable from '@/components/admin/reviews/ReviewTable'
import {
  bulkDeleteReviews,
  bulkUpdateReviewApproval,
  deleteAdminReview,
  deleteReviewResponse,
  fetchAdminReviewDetail,
  fetchAdminReviewStats,
  fetchAdminReviews,
  fetchReviewRooms,
  updateReviewApproval,
  upsertReviewResponse,
} from '@/lib/admin/reviews/adminReviewApi'
import type { AdminReview, ReviewFilters, ReviewRoomOption, ReviewStats } from '@/lib/admin/reviews/types'

const DEFAULT_FILTERS: ReviewFilters = {
  query: '',
  roomId: 'ALL',
  staffId: '',
  approvalStatus: 'ALL',
  rating: 'ALL',
  page: 0,
  size: 10,
}

export default function AdminReviewsPage() {
  const [filters, setFilters] = useState<ReviewFilters>(DEFAULT_FILTERS)
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [rooms, setRooms] = useState<ReviewRoomOption[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isStatsLoading, setIsStatsLoading] = useState(true)
  const [selected, setSelected] = useState<AdminReview | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [toast, setToast] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)

  const loadReviews = useCallback(async () => {
    setIsLoading(true)

    try {
      const data = await fetchAdminReviews(filters)
      setReviews(data.reviews)
      setTotalElements(data.totalElements)
      setTotalPages(data.totalPages)
      setErrorMessage('')
      setSelectedIds((current) => current.filter((id) => data.reviews.some((review) => review.reviewId === id)))
      setSelected((current) => {
        if (!current) return null
        return data.reviews.find((review) => review.reviewId === current.reviewId) ?? current
      })
    } catch (error) {
      setReviews([])
      setTotalElements(0)
      setTotalPages(0)
      setSelected(null)
      setSelectedIds([])
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải danh sách đánh giá.')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  const loadStats = useCallback(async () => {
    setIsStatsLoading(true)
    try {
      const data = await fetchAdminReviewStats()
      setStats(data)
    } catch {
      setStats(null)
    } finally {
      setIsStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchReviewRooms()
      .then((data) => setRooms(data))
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => void loadReviews(), 200)
    return () => clearTimeout(timer)
  }, [loadReviews])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  const refreshAll = async () => {
    await Promise.all([loadReviews(), loadStats()])
  }

  const handleSelectReview = async (review: AdminReview) => {
    setSelected(review)
    try {
      const detail = await fetchAdminReviewDetail(review.reviewId)
      if (detail) setSelected(detail)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải chi tiết đánh giá.')
    }
  }

  const handlePublish = async (reviewId: number) => {
    const updated = await updateReviewApproval(reviewId, true)
    setSelected(updated)
    setToast('Đã công khai đánh giá.')
    await refreshAll()
  }

  const handleHide = async (reviewId: number) => {
    const updated = await updateReviewApproval(reviewId, false)
    setSelected(updated)
    setToast('Đã ẩn đánh giá.')
    await refreshAll()
  }

  const handleDelete = async (reviewId: number) => {
    await deleteAdminReview(reviewId)
    setSelected(null)
    setToast('Đã xóa đánh giá.')
    await refreshAll()
  }

  const handleSaveReply = async (reviewId: number, content: string) => {
    const updated = await upsertReviewResponse(reviewId, content)
    setSelected(updated)
    setToast('Đã lưu phản hồi.')
    await refreshAll()
  }

  const handleDeleteReply = async (reviewId: number) => {
    await deleteReviewResponse(reviewId)
    const detail = await fetchAdminReviewDetail(reviewId)
    if (detail) setSelected(detail)
    setToast('Đã xóa phản hồi.')
    await refreshAll()
  }

  const toggleSelect = (reviewId: number) => {
    setSelectedIds((current) =>
      current.includes(reviewId) ? current.filter((id) => id !== reviewId) : [...current, reviewId],
    )
  }

  const toggleSelectAll = () => {
    const pageIds = reviews.map((review) => review.reviewId)
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id))
    setSelectedIds((current) =>
      allSelected ? current.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...current, ...pageIds])),
    )
  }

  const runBulkAction = async (action: 'publish' | 'hide' | 'delete') => {
    if (selectedIds.length === 0) return

    setIsBulkProcessing(true)
    try {
      if (action === 'publish') {
        await bulkUpdateReviewApproval(selectedIds, true)
        setToast(`Đã công khai ${selectedIds.length} đánh giá.`)
      } else if (action === 'hide') {
        await bulkUpdateReviewApproval(selectedIds, false)
        setToast(`Đã ẩn ${selectedIds.length} đánh giá.`)
      } else {
        await bulkDeleteReviews(selectedIds)
        setToast(`Đã xóa ${selectedIds.length} đánh giá.`)
        setSelected(null)
      }

      setSelectedIds([])
      await refreshAll()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể thực hiện thao tác hàng loạt.')
    } finally {
      setIsBulkProcessing(false)
    }
  }

  return (
    <>
        <AdminPageHeader
          eyebrow="Đánh giá"
          title="Quản lý đánh giá"
          description="Duyệt, ẩn, phản hồi và theo dõi đánh giá khách hàng."
          breadcrumbs={[
            { label: 'Tổng quan', href: '/admin/dashboard' },
            { label: 'Đánh giá' },
          ]}
          actions={
            <button
              type="button"
              onClick={() => void Promise.all([loadReviews(), loadStats()])}
              disabled={isLoading || isStatsLoading}
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
                  isLoading || isStatsLoading ? 'animate-spin' : 'group-hover:rotate-180',
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

          <ReviewStatsOverview stats={stats} isLoading={isStatsLoading} />

          <ReviewFiltersBar
            filters={filters}
            rooms={rooms}
            onChange={setFilters}
            totalElements={totalElements}
          />

          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-brand-orange/25 bg-primary-container/20 px-4 py-3">
              <p className="font-display text-sm font-semibold text-on-surface">
                Đã chọn {selectedIds.length} đánh giá
              </p>
              <button
                type="button"
                disabled={isBulkProcessing}
                onClick={() => void runBulkAction('publish')}
                className="rounded-lg bg-secondary px-3 py-1.5 font-display text-xs font-medium text-white disabled:opacity-50"
              >
                Công khai hàng loạt
              </button>
              <button
                type="button"
                disabled={isBulkProcessing}
                onClick={() => void runBulkAction('hide')}
                className="rounded-lg border border-outline bg-white px-3 py-1.5 font-display text-xs font-medium text-on-surface-variant disabled:opacity-50"
              >
                Ẩn hàng loạt
              </button>
              <button
                type="button"
                disabled={isBulkProcessing}
                onClick={() => void runBulkAction('delete')}
                className="rounded-lg border border-error/30 bg-white px-3 py-1.5 font-display text-xs font-medium text-error disabled:opacity-50"
              >
                Xóa hàng loạt
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="ml-auto rounded-lg px-3 py-1.5 font-display text-xs font-medium text-brand-orange"
              >
                Bỏ chọn
              </button>
            </div>
          )}

          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-on-surface">Danh sách đánh giá</h2>
              <p className="text-xs text-on-surface-variant">Nhấn dòng để xem chi tiết và phản hồi</p>
            </div>

            <ReviewTable
              reviews={reviews}
              isLoading={isLoading}
              selectedId={selected?.reviewId ?? null}
              selectedIds={selectedIds}
              onSelect={(review) => void handleSelectReview(review)}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
            />

            {totalPages > 1 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-on-surface-variant">
                  Trang {filters.page + 1}/{totalPages} · {totalElements} kết quả
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={filters.page <= 0 || isLoading}
                    onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}
                    className="rounded-lg border border-outline px-3 py-2 font-display text-xs font-medium text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    disabled={filters.page + 1 >= totalPages || isLoading}
                    onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
                    className="rounded-lg border border-outline px-3 py-2 font-display text-xs font-medium text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        <ReviewDetailPanel
          review={selected}
          onClose={() => setSelected(null)}
          onPublish={handlePublish}
          onHide={handleHide}
          onDelete={handleDelete}
          onSaveReply={handleSaveReply}
          onDeleteReply={handleDeleteReply}
        />
    </>
  )
}
