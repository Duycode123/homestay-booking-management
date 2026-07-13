import type { CouponExpiryStatus, DiscountType } from './types'

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  PERCENTAGE: 'Phần trăm',
  FIXED_AMOUNT: 'Số tiền cố định',
}

export const DISCOUNT_TYPE_OPTIONS: DiscountType[] = ['PERCENTAGE', 'FIXED_AMOUNT']

export const COUPON_EXPIRY_STATUS_LABELS: Record<CouponExpiryStatus, string> = {
  ACTIVE: 'Đang hiệu lực',
  EXPIRED: 'Đã hết hạn',
  NO_EXPIRY: 'Không hết hạn',
}

export const COUPON_EXPIRY_STATUS_OPTIONS: CouponExpiryStatus[] = ['ACTIVE', 'EXPIRED', 'NO_EXPIRY']

export function formatCouponValue(type: DiscountType, value: number) {
  if (type === 'PERCENTAGE') {
    return `${value}%`
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatCouponExpiry(expiresAt: string | null) {
  if (!expiresAt) {
    return 'Không hết hạn'
  }

  const date = new Date(`${expiresAt}T00:00:00`)
  return date.toLocaleDateString('vi-VN')
}
