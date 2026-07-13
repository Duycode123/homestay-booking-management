import type { ReportDateRange } from '@/lib/admin/reportsTypes'

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT'

export type CouponExpiryStatus = 'ACTIVE' | 'EXPIRED' | 'NO_EXPIRY'

export type AdminCoupon = {
  couponId: number
  code: string
  type: DiscountType
  value: number
  minOrderValue: number | null
  expiresAt: string | null
  expiryStatus: CouponExpiryStatus
}

export type CouponRoomOption = {
  roomId: number
  roomName: string
}

export type CouponFilters = {
  query: string
  type: DiscountType | 'ALL'
  expiryStatus: CouponExpiryStatus | 'ALL'
  sortBy: 'code' | 'value' | 'expiresAt'
  sortOrder: 'asc' | 'desc'
}

export type CouponFormData = {
  code: string
  type: DiscountType
  value: string
  minOrderValue: string
  expiresAt: string
  roomIds: number[]
  previewOrderAmount: string
}

export type CouponFormErrors = Partial<Record<keyof CouponFormData, string>>

export type CouponUsageTrendPoint = {
  date: string
  label: string
  usageCount: number
  discountAmount: number
}

export type CouponTopUsagePoint = {
  couponId: number
  code: string
  usageCount: number
  discountAmount: number
}

export type CouponUsageReport = {
  totalUsed: number
  totalDiscountGiven: number
  trend: CouponUsageTrendPoint[]
  topCoupons: CouponTopUsagePoint[]
}

export type CouponReportDateRange = ReportDateRange
