import axios from 'axios'
import api from '@/lib/api'

export type RefundStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RETRY_REQUIRED'
export type RefundMethod = 'ORIGINAL_PAYMENT_METHOD' | 'MANUAL_BANK_TRANSFER' | 'CASH_COUNTER'

export type RefundRecord = {
  refundId: number
  bookingId: number
  bookingCode: string
  customerName: string
  customerEmail: string
  roomName: string
  recipientBankCode?: string | null
  recipientBankName?: string | null
  recipientAccountNumber?: string | null
  recipientAccountHolder?: string | null
  transferContent?: string | null
  transferQrUrl?: string | null
  originalPaymentTransactionId?: number | null
  amount: number
  method: RefundMethod
  status: RefundStatus
  transactionReference?: string | null
  proofImageUrl?: string | null
  adminNote?: string | null
  failureReason?: string | null
  processedBy?: string | null
  expectedAt?: string | null
  createdAt: string
  updatedAt: string
  processingAt?: string | null
  completedAt?: string | null
}

type ApiResponse<T> = { success: boolean; message: string; data: T }

function errorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ message?: string }>(error)) return error.response?.data?.message || fallback
  return fallback
}

export async function fetchRefunds(status?: RefundStatus | 'ALL', search?: string) {
  try {
    const response = await api.get<ApiResponse<RefundRecord[]>>('/api/admin/refunds', {
      params: {
        status: status && status !== 'ALL' ? status : undefined,
        search: search?.trim() || undefined,
      },
    })
    return response.data.data
  } catch (error) {
    throw new Error(errorMessage(error, 'Không thể tải danh sách hoàn tiền.'))
  }
}

export async function startRefund(refundId: number) {
  try {
    const response = await api.post<ApiResponse<RefundRecord>>(`/api/admin/refunds/${refundId}/start`)
    return response.data.data
  } catch (error) {
    throw new Error(errorMessage(error, 'Không thể bắt đầu xử lý hoàn tiền.'))
  }
}

export async function completeRefund(
  refundId: number,
  payload: { transactionReference?: string; proofImageUrl?: string; adminNote?: string },
) {
  try {
    const response = await api.post<ApiResponse<RefundRecord>>(`/api/admin/refunds/${refundId}/complete`, payload)
    return response.data.data
  } catch (error) {
    throw new Error(errorMessage(error, 'Không thể xác nhận hoàn tiền.'))
  }
}

export async function failRefund(refundId: number, failureReason: string) {
  try {
    const response = await api.post<ApiResponse<RefundRecord>>(`/api/admin/refunds/${refundId}/fail`, {
      failureReason,
    })
    return response.data.data
  } catch (error) {
    throw new Error(errorMessage(error, 'Không thể ghi nhận giao dịch cần xử lý lại.'))
  }
}

export async function uploadRefundProof(file: File) {
  try {
    const body = new FormData()
    body.append('file', file)
    const response = await api.post<ApiResponse<{ publicId: string; secureUrl: string }>>(
      '/api/admin/refunds/proofs',
      body,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return response.data.data
  } catch (error) {
    throw new Error(errorMessage(error, 'Không thể tải ảnh biên lai.'))
  }
}

export async function fetchCustomerRefund(bookingId: number) {
  try {
    const response = await api.get<ApiResponse<RefundRecord>>(`/api/bookings/${bookingId}/refund`)
    return response.data.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null
    throw new Error(errorMessage(error, 'Không thể tải trạng thái hoàn tiền.'))
  }
}
