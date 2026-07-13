import axios from 'axios'
import api from '@/lib/api'
import type {
  AdminReview,
  ReviewFilters,
  ReviewListResult,
  ReviewRoomOption,
  ReviewStats,
} from './types'

type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

type ApiErrorResponse = {
  message?: string
}

type BackendReviewReply = {
  id: number
  responderRole: string
  content: string
  createdAt: string
  updatedAt: string
}

type BackendReview = {
  id: number
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
  adminResponse: BackendReviewReply | null
}

type BackendPagedResponse<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

type BackendRoom = {
  id: number
  roomName: string
}

function normalizeText(value?: string | null) {
  return value?.trim() || ''
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message || fallback
  }

  return fallback
}

function mapBackendReview(item: BackendReview): AdminReview {
  return {
    reviewId: item.id,
    bookingId: item.bookingId,
    customerId: item.customerId,
    customerName: normalizeText(item.customerName) || 'Khách hàng',
    roomId: item.roomId,
    roomName: normalizeText(item.roomName) || `Phòng ${item.roomId}`,
    staffId: item.staffId,
    staffName: normalizeText(item.staffName) || null,
    rating: item.rating,
    content: normalizeText(item.content),
    approved: item.approved,
    createdAt: item.createdAt,
    adminResponse: item.adminResponse
      ? {
          id: item.adminResponse.id,
          responderRole: item.adminResponse.responderRole,
          content: item.adminResponse.content,
          createdAt: item.adminResponse.createdAt,
          updatedAt: item.adminResponse.updatedAt,
        }
      : null,
  }
}

function toListParams(filters: ReviewFilters) {
  const params: Record<string, string | number | boolean> = {
    page: filters.page,
    size: filters.size,
  }

  if (filters.query.trim()) {
    params.keyword = filters.query.trim()
  }

  if (filters.roomId !== 'ALL') {
    params.roomId = filters.roomId
  }

  const staffId = Number(filters.staffId)
  if (filters.staffId.trim() && Number.isInteger(staffId) && staffId > 0) {
    params.staffId = staffId
  }

  if (filters.rating !== 'ALL') {
    params.rating = filters.rating
  }

  if (filters.approvalStatus === 'PENDING') {
    params.approved = false
  } else if (filters.approvalStatus === 'PUBLISHED') {
    params.approved = true
  }

  return params
}

function buildBreakdown(reviews: AdminReview[]) {
  const breakdown: ReviewStats['breakdown'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

  reviews.forEach((review) => {
    const star = Math.max(1, Math.min(5, review.rating)) as keyof ReviewStats['breakdown']
    breakdown[star] += 1
  })

  return breakdown
}

async function fetchReviewCount(params: Record<string, string | number | boolean>) {
  const response = await api.get<ApiResponse<BackendPagedResponse<BackendReview>>>('/api/admin/reviews', {
    params: { ...params, page: 0, size: 1 },
  })

  return response.data.data?.totalElements ?? 0
}

async function fetchReviewsForStats() {
  const response = await api.get<ApiResponse<BackendPagedResponse<BackendReview>>>('/api/admin/reviews', {
    params: { page: 0, size: 100 },
  })

  return (response.data.data?.content ?? []).map(mapBackendReview)
}

export async function fetchReviewRooms(): Promise<ReviewRoomOption[]> {
  try {
    const response = await api.get<ApiResponse<BackendRoom[]>>('/api/rooms')
    return (response.data.data ?? [])
      .map((room) => ({
        roomId: room.id,
        roomName: normalizeText(room.roomName) || `Phòng ${room.id}`,
      }))
      .sort((a, b) => a.roomName.localeCompare(b.roomName, 'vi'))
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể tải danh sách phòng.'))
  }
}

export async function fetchAdminReviews(filters: ReviewFilters): Promise<ReviewListResult> {
  try {
    const response = await api.get<ApiResponse<BackendPagedResponse<BackendReview>>>('/api/admin/reviews', {
      params: toListParams(filters),
    })

    const data = response.data.data

    return {
      reviews: (data?.content ?? []).map(mapBackendReview),
      page: data?.page ?? 0,
      size: data?.size ?? filters.size,
      totalElements: data?.totalElements ?? 0,
      totalPages: data?.totalPages ?? 0,
      first: data?.first ?? true,
      last: data?.last ?? true,
    }
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể tải danh sách đánh giá.'))
  }
}

export async function fetchAdminReviewDetail(reviewId: number): Promise<AdminReview | null> {
  try {
    const response = await api.get<ApiResponse<BackendReview>>(`/api/admin/reviews/${reviewId}`)
    return mapBackendReview(response.data.data)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null
    }

    throw new Error(getApiErrorMessage(error, 'Không thể tải chi tiết đánh giá.'))
  }
}

export async function fetchAdminReviewStats(): Promise<ReviewStats> {
  try {
    const [total, pending, published, sampleReviews] = await Promise.all([
      fetchReviewCount({}),
      fetchReviewCount({ approved: false }),
      fetchReviewCount({ approved: true }),
      fetchReviewsForStats(),
    ])

    const averageRating =
      sampleReviews.length > 0
        ? sampleReviews.reduce((sum, review) => sum + review.rating, 0) / sampleReviews.length
        : 0

    return {
      total,
      pending,
      published,
      hidden: Math.max(0, total - published),
      averageRating,
      breakdown: buildBreakdown(sampleReviews),
    }
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể tải thống kê đánh giá.'))
  }
}

export async function updateReviewApproval(reviewId: number, approved: boolean): Promise<AdminReview> {
  try {
    const response = await api.patch<ApiResponse<BackendReview>>(`/api/admin/reviews/${reviewId}/approval`, {
      approved,
    })

    return mapBackendReview(response.data.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể cập nhật trạng thái duyệt.'))
  }
}

export async function upsertReviewResponse(reviewId: number, content: string): Promise<AdminReview> {
  const normalized = content.trim()
  if (!normalized) {
    throw new Error('Nội dung phản hồi không được để trống.')
  }

  try {
    const response = await api.put<ApiResponse<BackendReview>>(`/api/admin/reviews/${reviewId}/response`, {
      content: normalized,
    })

    return mapBackendReview(response.data.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể lưu phản hồi.'))
  }
}

export async function deleteReviewResponse(reviewId: number): Promise<void> {
  try {
    await api.delete(`/api/admin/reviews/${reviewId}/response`)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể xóa phản hồi.'))
  }
}

export async function deleteAdminReview(reviewId: number): Promise<void> {
  try {
    await api.delete(`/api/admin/reviews/${reviewId}`)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể xóa đánh giá.'))
  }
}

export async function bulkUpdateReviewApproval(reviewIds: number[], approved: boolean) {
  const results = await Promise.allSettled(reviewIds.map((id) => updateReviewApproval(id, approved)))
  const failed = results.filter((result) => result.status === 'rejected').length

  if (failed > 0) {
    throw new Error(`Không thể cập nhật ${failed}/${reviewIds.length} đánh giá.`)
  }
}

export async function bulkDeleteReviews(reviewIds: number[]) {
  const results = await Promise.allSettled(reviewIds.map((id) => deleteAdminReview(id)))
  const failed = results.filter((result) => result.status === 'rejected').length

  if (failed > 0) {
    throw new Error(`Không thể xóa ${failed}/${reviewIds.length} đánh giá.`)
  }
}
