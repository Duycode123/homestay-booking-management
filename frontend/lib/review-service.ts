export type ReviewImage = {
  id: string
  name: string
  previewUrl: string
}

export type ReviewAdminResponse = {
  id: number
  responderRole: string
  content: string
  createdAt: string
  updatedAt: string
}

export type BookingReview = {
  id: string
  bookingId: string
  roomId: string
  customerName?: string
  rating: number
  title: string
  content: string
  tags?: string[]
  images?: ReviewImage[]
  createdAt: string
  verified?: boolean
  adminResponse?: ReviewAdminResponse | null
}

export type ReviewSortOption = 'newest' | 'oldest' | 'rating_high' | 'rating_low'

export type StarBreakdown = Record<1 | 2 | 3 | 4 | 5, number>

export type RoomReviewStats = {
  averageRating: number
  totalCount: number
  breakdown: StarBreakdown
}

export type ReviewDraft = {
  rating: number
  content: string
  imageUrls: string[]
}

export type SubmitBookingReviewPayload = {
  bookingId: string
  backendBookingId?: number
  roomId: string
  customerName?: string
  rating: number
  content: string
  imageUrls?: string[]
}

const DRAFT_KEY_PREFIX = 'homestay_review_draft_'

function getDraftKey(bookingId: string) {
  return `${DRAFT_KEY_PREFIX}${bookingId}`
}

export function getAverageReviewRating(reviews: Pick<BookingReview, 'rating'>[]) {
  if (reviews.length === 0) return 0

  return reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
}

export function buildStarBreakdown(reviews: Pick<BookingReview, 'rating'>[]): StarBreakdown {
  const breakdown: StarBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

  reviews.forEach((review) => {
    const star = Math.max(1, Math.min(5, Math.round(review.rating))) as keyof StarBreakdown
    breakdown[star] += 1
  })

  return breakdown
}

export function buildRoomReviewStats(reviews: BookingReview[]): RoomReviewStats {
  return {
    averageRating: getAverageReviewRating(reviews),
    totalCount: reviews.length,
    breakdown: buildStarBreakdown(reviews),
  }
}

export function sortReviews(reviews: BookingReview[], sortBy: ReviewSortOption) {
  const sorted = [...reviews]

  sorted.sort((firstReview, secondReview) => {
    if (sortBy === 'rating_high') {
      return secondReview.rating - firstReview.rating || Date.parse(secondReview.createdAt) - Date.parse(firstReview.createdAt)
    }

    if (sortBy === 'rating_low') {
      return firstReview.rating - secondReview.rating || Date.parse(secondReview.createdAt) - Date.parse(firstReview.createdAt)
    }

    const timeDiff = Date.parse(firstReview.createdAt) - Date.parse(secondReview.createdAt)
    return sortBy === 'oldest' ? timeDiff : -timeDiff
  })

  return sorted
}

export function filterReviewsByRating(reviews: BookingReview[], rating: number | 'all') {
  if (rating === 'all') return reviews
  return reviews.filter((review) => review.rating === rating)
}

export function paginateReviews<T>(items: T[], page: number, pageSize: number) {
  const totalElements = items.length
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize))
  const safePage = Math.min(Math.max(page, 0), totalPages - 1)
  const start = safePage * pageSize

  return {
    content: items.slice(start, start + pageSize),
    page: safePage,
    size: pageSize,
    totalElements,
    totalPages,
    first: safePage === 0,
    last: safePage >= totalPages - 1,
  }
}

export function getRoomReviewsByRoomId(roomId: string, reviews: BookingReview[] = []) {
  return reviews
    .filter((review) => review.roomId === roomId)
    .sort((firstReview, secondReview) => Date.parse(secondReview.createdAt) - Date.parse(firstReview.createdAt))
}

export function saveReviewDraft(bookingId: string, draft: ReviewDraft) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(getDraftKey(bookingId), JSON.stringify(draft))
}

export function loadReviewDraft(bookingId: string): ReviewDraft | null {
  if (typeof window === 'undefined') return null

  try {
    const rawDraft = window.localStorage.getItem(getDraftKey(bookingId))
    if (!rawDraft) return null

    const draft = JSON.parse(rawDraft) as Partial<ReviewDraft>

    return {
      rating: Number.isInteger(draft.rating) ? Number(draft.rating) : 0,
      content: draft.content || '',
      imageUrls: Array.isArray(draft.imageUrls)
        ? draft.imageUrls.filter((url): url is string => typeof url === 'string').slice(0, 4)
        : [],
    }
  } catch {
    return null
  }
}

export function clearReviewDraft(bookingId: string) {
  if (typeof window === 'undefined') return

  window.localStorage.removeItem(getDraftKey(bookingId))
}
