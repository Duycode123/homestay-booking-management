import api from '@/lib/api'
import type { BookingReview, RoomReviewStats } from '@/lib/review-service'
import { buildRoomReviewStats } from '@/lib/review-service'

type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

type PagedResponse<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

type PublicReviewAdminResponse = {
  id: number
  responderRole: string
  content: string
  createdAt: string
  updatedAt: string
}

type PublicReviewResponse = {
  id: number
  bookingId: number
  customerName?: string | null
  roomId: number
  roomName: string
  rating: number
  content: string
  approved?: boolean
  createdAt: string
  adminResponse?: PublicReviewAdminResponse | null
}

export type RoomReviewSummary = {
  averageRating: number
  reviewCount: number
}

export type PublicReviewQuery = {
  roomId: string
  page?: number
  size?: number
  rating?: number
}

async function fetchPublicReviewPage(page: number, size: number, roomId?: string, rating?: number) {
  const path = roomId ? `/api/reviews/rooms/${roomId}` : '/api/reviews'
  const response = await api.get<ApiResponse<PagedResponse<PublicReviewResponse>>>(path, {
    params: {
      page,
      size,
      rating,
    },
  })

  return response.data.data
}

async function fetchAllPublicReviews(roomId?: string, size = 100) {
  const reviews: PublicReviewResponse[] = []
  let page = 0

  while (true) {
    const data = await fetchPublicReviewPage(page, size, roomId)
    reviews.push(...(data?.content ?? []))

    if (!data || data.last || page + 1 >= data.totalPages) {
      break
    }

    page += 1
  }

  return reviews
}

function mapReviewToUiReview(review: PublicReviewResponse): BookingReview {
  const content = review.content?.trim() || ''

  return {
    id: `public-review-${review.id}`,
    bookingId: String(review.bookingId),
    roomId: String(review.roomId),
    customerName: review.customerName?.trim() || 'Khách hàng',
    rating: review.rating,
    title: content.slice(0, 80) || 'Đánh giá phòng',
    content,
    tags: [],
    images: [],
    createdAt: review.createdAt,
    verified: Boolean(review.bookingId),
    adminResponse: review.adminResponse
      ? {
          id: review.adminResponse.id,
          responderRole: review.adminResponse.responderRole,
          content: review.adminResponse.content,
          createdAt: review.adminResponse.createdAt,
          updatedAt: review.adminResponse.updatedAt,
        }
      : null,
  }
}

export async function fetchRoomReviewSummaries() {
  const reviews = await fetchAllPublicReviews()
  const roomBuckets = new Map<string, { totalRating: number; reviewCount: number }>()

  reviews.forEach((review) => {
    const roomId = String(review.roomId)
    const currentBucket = roomBuckets.get(roomId) ?? { totalRating: 0, reviewCount: 0 }

    currentBucket.totalRating += review.rating
    currentBucket.reviewCount += 1
    roomBuckets.set(roomId, currentBucket)
  })

  return new Map<string, RoomReviewSummary>(
    Array.from(roomBuckets.entries()).map(([roomId, bucket]) => [
      roomId,
      {
        averageRating: bucket.totalRating / bucket.reviewCount,
        reviewCount: bucket.reviewCount,
      },
    ]),
  )
}

export async function fetchPublicReviewsByRoomId(roomId: string) {
  const reviews = await fetchAllPublicReviews(roomId, 20)
  return reviews.map(mapReviewToUiReview)
}

export async function fetchRoomReviewStats(roomId: string): Promise<RoomReviewStats> {
  const reviews = (await fetchAllPublicReviews(roomId, 100)).map(mapReviewToUiReview)
  return buildRoomReviewStats(reviews)
}

export async function fetchPublicReviewsPage(query: PublicReviewQuery) {
  const data = await fetchPublicReviewPage(query.page ?? 0, query.size ?? 5, query.roomId, query.rating)

  return {
    reviews: (data?.content ?? []).map(mapReviewToUiReview),
    page: data?.page ?? 0,
    size: data?.size ?? 5,
    totalElements: data?.totalElements ?? 0,
    totalPages: data?.totalPages ?? 0,
    first: data?.first ?? true,
    last: data?.last ?? true,
  }
}
