import axios from 'axios'
import api from '@/lib/api'

export type PaymentMethod = 'bank_transfer' | 'e_wallet' | 'cash'
export type PaymentOption = 'deposit' | 'full'

export type PaymentStatus = 'success' | 'failed' | 'pending' | 'cancelled'

export type CreatePaymentSessionPayload = {
  bookingId: number
  method: PaymentMethod
  paymentOption: PaymentOption
}

export type CreatePaymentSessionResponse = {
  paymentUrl: string
  paymentId: string
  status: PaymentStatus
  amount: number
  bookingId: number
  bookingCode: string
  method: string
  paymentOption: PaymentOption
  expiresAt?: string | null
}

export type PaymentTransactionDetail = {
  paymentId: string
  bookingId: number
  bookingCode: string
  method: string
  paymentOption: PaymentOption
  status: PaymentStatus
  amount: number
  createdAt?: string | null
  expiresAt?: string | null
  paidAt?: string | null
}

type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

type BackendPaymentSession = {
  paymentId: string
  bookingId: number
  bookingCode: string
  method: string
  paymentOption: PaymentOption
  status: PaymentStatus
  amount: number | string
  paymentUrl: string
  expiresAt?: string | null
}

type BackendPaymentTransaction = {
  paymentId: string
  bookingId: number
  bookingCode: string
  method: string
  paymentOption: PaymentOption
  status: PaymentStatus
  amount: number | string
  createdAt?: string | null
  expiresAt?: string | null
  paidAt?: string | null
}

type ApiErrorResponse = {
  message?: string
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message || fallback
  }

  return fallback
}

function parseAmount(value: number | string | null | undefined) {
  const normalized = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(normalized) ? Number(normalized) : 0
}

export async function createPaymentSession(
  payload: CreatePaymentSessionPayload,
): Promise<CreatePaymentSessionResponse> {
  try {
    const response = await api.post<ApiResponse<BackendPaymentSession>>('/api/payments/sessions', {
      bookingId: payload.bookingId,
      method: payload.method,
      paymentOption: payload.paymentOption,
    })

    return {
      paymentUrl: response.data.data.paymentUrl,
      paymentId: response.data.data.paymentId,
      status: response.data.data.status,
      amount: parseAmount(response.data.data.amount),
      bookingId: response.data.data.bookingId,
      bookingCode: response.data.data.bookingCode,
      method: response.data.data.method,
      paymentOption: response.data.data.paymentOption,
      expiresAt: response.data.data.expiresAt,
    }
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể tạo giao dịch thanh toán.'))
  }
}

export async function getPaymentTransactionDetail(paymentId: string): Promise<PaymentTransactionDetail> {
  try {
    const response = await api.get<ApiResponse<BackendPaymentTransaction>>(`/api/payments/transactions/${paymentId}`)

    return {
      paymentId: response.data.data.paymentId,
      bookingId: response.data.data.bookingId,
      bookingCode: response.data.data.bookingCode,
      method: response.data.data.method,
      paymentOption: response.data.data.paymentOption,
      status: response.data.data.status,
      amount: parseAmount(response.data.data.amount),
      createdAt: response.data.data.createdAt,
      expiresAt: response.data.data.expiresAt,
      paidAt: response.data.data.paidAt,
    }
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể kiểm tra giao dịch thanh toán.'))
  }
}
