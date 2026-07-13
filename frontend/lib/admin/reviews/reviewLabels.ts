import type { ReviewApprovalStatus } from './types'

export const REVIEW_APPROVAL_STATUS_LABELS: Record<ReviewApprovalStatus, string> = {
  ALL: 'Tất cả trạng thái',
  PENDING: 'Chờ duyệt',
  PUBLISHED: 'Đã công khai',
  HIDDEN: 'Đã ẩn',
}

export const REVIEW_APPROVAL_STATUS_OPTIONS: ReviewApprovalStatus[] = [
  'ALL',
  'PENDING',
  'PUBLISHED',
  'HIDDEN',
]

export const REVIEW_RATING_OPTIONS: Array<number | 'ALL'> = ['ALL', 5, 4, 3, 2, 1]

export function formatReviewRatingLabel(rating: number | 'ALL') {
  return rating === 'ALL' ? 'Tất cả sao' : `${rating} sao`
}

export function renderReviewStars(rating: number) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)))
  return '★'.repeat(filled) + '☆'.repeat(5 - filled)
}
