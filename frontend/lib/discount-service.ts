import axios from 'axios'
import api from '@/lib/api'

export type DiscountValidationResult = {
  valid: boolean
  code?: string
  discountAmount?: number
  message: string
}

export type AppliedDiscount = {
  code: string
  discountAmount: number
}

type ValidateDiscountCodeParams = {
  code: string
  subtotal: number
  bookingId?: string
  roomId?: string
}

type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

type ValidateCouponApiData = {
  valid: boolean
  reason: string
  code: string | null
  discountAmount: number | string
  payableAmount: number | string
}

type ApiErrorResponse = {
  message?: string
}

function parseAmount(value: number | string | null | undefined) {
  const normalized = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(normalized) ? Number(normalized) : 0
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message || fallback
  }

  return fallback
}

export async function validateDiscountCode({
  code,
  subtotal,
}: ValidateDiscountCodeParams): Promise<DiscountValidationResult> {
  const normalizedCode = code.trim().toUpperCase()

  if (!normalizedCode) {
    return {
      valid: false,
      message: 'Vui lòng nhập mã giảm giá.',
    }
  }

  if (subtotal <= 0) {
    return {
      valid: false,
      message: 'Giá trị đơn hàng không hợp lệ để áp dụng mã giảm giá.',
    }
  }

  try {
    const response = await api.post<ApiResponse<ValidateCouponApiData>>('/api/coupons/validate', {
      code: normalizedCode,
      orderAmount: subtotal,
    })

    const { success, message, data } = response.data
    const discountAmount = parseAmount(data?.discountAmount)

    if (success && data?.valid) {
      return {
        valid: true,
        code: data.code ?? normalizedCode,
        discountAmount,
        message: message || data.reason || 'Áp dụng mã giảm giá thành công.',
      }
    }

    return {
      valid: false,
      message: message || data?.reason || 'Mã giảm giá không hợp lệ.',
    }
  } catch (error) {
    return {
      valid: false,
      message: getApiErrorMessage(error, 'Không thể kiểm tra mã giảm giá. Vui lòng thử lại.'),
    }
  }
}
