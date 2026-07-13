export type ReviewApprovalStatus = 'ALL' | 'PENDING' | 'PUBLISHED' | 'HIDDEN'

export type AdminReview = {
  reviewId: number
  bookingId: number
  customerId: number
  customerName: string
  roomId: number
  roomName: string
  staffId: number | null
  staffName: string | null
  rating: number
  content: string
  approved: boolean
  createdAt: string
  adminResponse: AdminReviewReply | null
}

export type AdminReviewReply = {
  id: number
  responderRole: string
  content: string
  createdAt: string
  updatedAt: string
}

export type ReviewFilters = {
  query: string
  roomId: number | 'ALL'
  staffId: string
  approvalStatus: ReviewApprovalStatus
  rating: number | 'ALL'
  page: number
  size: number
}

export type ReviewListResult = {
  reviews: AdminReview[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export type ReviewStats = {
  total: number
  pending: number
  published: number
  hidden: number
  averageRating: number
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>
}

export type ReviewRoomOption = {
  roomId: number
  roomName: string
}
