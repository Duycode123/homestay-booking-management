'use client'

import { useEffect, useState } from 'react'
import { renderReviewStars } from '@/lib/admin/reviews/reviewLabels'
import type { AdminReview } from '@/lib/admin/reviews/types'
import { ReviewApprovalBadge, ReviewRatingBadge } from './ReviewBadges'

type ReviewDetailPanelProps = {
  review: AdminReview | null
  onClose: () => void
  onPublish: (reviewId: number) => Promise<void>
  onHide: (reviewId: number) => Promise<void>
  onDelete: (reviewId: number) => Promise<void>
  onSaveReply: (reviewId: number, content: string) => Promise<void>
  onDeleteReply: (reviewId: number) => Promise<void>
}

export default function ReviewDetailPanel({
  review,
  onClose,
  onPublish,
  onHide,
  onDelete,
  onSaveReply,
  onDeleteReply,
}: ReviewDetailPanelProps) {
  const [replyContent, setReplyContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!review) return
    setReplyContent(review.adminResponse?.content ?? '')
    setConfirmDelete(false)
    setMessage('')
  }, [review])

  if (!review) return null

  const runAction = async (action: () => Promise<void>, successMessage: string) => {
    setIsSaving(true)
    setMessage('')
    try {
      await action()
      setMessage(successMessage)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể thực hiện thao tác.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveReply = async () => {
    await runAction(() => onSaveReply(review.reviewId, replyContent), 'Đã lưu phản hồi.')
  }

  const handleDelete = async () => {
    setIsSaving(true)
    setMessage('')
    try {
      await onDelete(review.reviewId)
      onClose()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể xóa đánh giá.')
      setConfirmDelete(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Đóng chi tiết"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-inverse-surface/50 backdrop-blur-sm"
      />

      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-outline-variant bg-white shadow-[var(--shadow-elevated)]">
        <header className="border-b border-outline-variant px-5 py-4">
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.15em] text-brand-orange">
            RV-{String(review.reviewId).padStart(4, '0')}
          </p>
          <h2 className="font-display text-xl font-bold text-on-surface">{review.customerName}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ReviewApprovalBadge approved={review.approved} />
            <ReviewRatingBadge rating={review.rating} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <Section title="Thông tin">
            <InfoRow label="Phòng" value={review.roomName} />
            <InfoRow label="Đơn đặt" value={`#${review.bookingId}`} />
            <InfoRow label="Nhân viên" value={review.staffName ?? 'Chưa gán'} />
            <InfoRow label="Thời gian" value={new Date(review.createdAt).toLocaleString('vi-VN')} />
          </Section>

          <Section title="Đánh giá">
            <p className="text-sm leading-6 text-on-surface">{review.content}</p>
            <p className="mt-2 text-sm text-brand-orange">{renderReviewStars(review.rating)}</p>
          </Section>

          <Section title="Phản hồi quản trị">
            <textarea
              value={replyContent}
              onChange={(event) => setReplyContent(event.target.value)}
              rows={5}
              maxLength={1000}
              placeholder="Nhập phản hồi hiển thị công khai..."
              className="w-full rounded-xl border border-outline bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15"
            />
            <p className="mt-1 text-right text-[10px] text-on-surface-variant">{replyContent.length}/1000</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => void handleSaveReply()}
                className="rounded-xl bg-brand-orange px-4 py-2 font-display text-sm font-medium text-white hover:bg-brand-orangeHover disabled:opacity-50"
              >
                Lưu phản hồi
              </button>
              {review.adminResponse && (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() =>
                    void runAction(() => onDeleteReply(review.reviewId), 'Đã xóa phản hồi.')
                  }
                  className="rounded-xl border border-outline px-4 py-2 font-display text-sm font-medium text-on-surface-variant hover:bg-surface-container-low disabled:opacity-50"
                >
                  Xóa phản hồi
                </button>
              )}
            </div>
          </Section>

          {message && (
            <p className="mt-4 rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant">
              {message}
            </p>
          )}
        </div>

        <footer className="space-y-2 border-t border-outline-variant bg-surface-container-low/50 px-5 py-4">
          {confirmDelete ? (
            <div className="space-y-3">
              <p className="text-sm text-on-surface-variant">Xác nhận xóa đánh giá này?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={isSaving}
                  className="flex-1 rounded-xl border border-outline py-2.5 font-display text-sm font-medium text-on-surface-variant hover:bg-white disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={isSaving}
                  className="flex-1 rounded-xl bg-error py-2.5 font-display text-sm font-medium text-white hover:bg-error/90 disabled:opacity-50"
                >
                  {isSaving ? 'Đang xóa...' : 'Xóa'}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-3">
              {!review.approved ? (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => void runAction(() => onPublish(review.reviewId), 'Đã công khai đánh giá.')}
                  className="rounded-xl bg-secondary py-2.5 font-display text-sm font-medium text-white hover:bg-secondary/90 disabled:opacity-50"
                >
                  Công khai
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => void runAction(() => onHide(review.reviewId), 'Đã ẩn đánh giá.')}
                  className="rounded-xl border border-outline py-2.5 font-display text-sm font-medium text-on-surface-variant hover:bg-white disabled:opacity-50"
                >
                  Ẩn
                </button>
              )}
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setConfirmDelete(true)}
                className="rounded-xl border border-error/30 py-2.5 font-display text-sm font-medium text-error hover:bg-error-container/30 disabled:opacity-50"
              >
                Xóa
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-outline bg-white py-2.5 font-display text-sm font-medium text-on-surface-variant hover:text-on-surface"
              >
                Đóng
              </button>
            </div>
          )}
        </footer>
      </aside>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 first:mt-0">
      <h3 className="mb-2 font-display text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
        {title}
      </h3>
      {children}
    </section>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2 text-sm">
      <p className="text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-0.5 font-medium text-on-surface">{value}</p>
    </div>
  )
}
