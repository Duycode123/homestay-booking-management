import axios from 'axios'
import api from '@/lib/api'
import { validateDiscountCode, type DiscountValidationResult } from '@/lib/discount-service'
import type { ReportDateRange } from '@/lib/admin/reportsTypes'
import type {
  AdminCoupon,
  CouponExpiryStatus,
  CouponFilters,
  CouponFormData,
  CouponFormErrors,
  CouponRoomOption,
  CouponTopUsagePoint,
  CouponUsageReport,
  CouponUsageTrendPoint,
  DiscountType,
} from './types'

type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

type ApiErrorResponse = {
  message?: string
}

type BackendCoupon = {
  id: number
  code: string
  type: DiscountType
  value: number | string
  minOrderValue?: number | string | null
  expiresAt?: string | null
}

type BackendRoom = {
  id: number
  roomName: string
}

type BackendUsageTrendPoint = {
  date: string
  usageCount: number
  discountAmount: number | string
}

type BackendTopCoupon = {
  couponId: number
  code: string
  usageCount: number
  discountAmount: number | string
}

type BackendUsageReport = {
  totalUsed: number
  totalDiscountGiven: number | string
  trend: BackendUsageTrendPoint[]
  topCoupons: BackendTopCoupon[]
}

function normalizeText(value?: string | null) {
  return value?.trim() || ''
}

function parseAmount(value: number | string | null | undefined) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function toDateKey(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatDayLabel(dateKey: string) {
  const date = parseDateKey(dateKey)
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

function eachDayInRange(range: ReportDateRange): string[] {
  const start = parseDateKey(range.startDate)
  const end = parseDateKey(range.endDate)
  const days: string[] = []

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return days
  }

  const cursor = new Date(start)
  while (cursor <= end) {
    days.push(toDateKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}

function getExpiryStatus(expiresAt: string | null): CouponExpiryStatus {
  if (!expiresAt) {
    return 'NO_EXPIRY'
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = parseDateKey(expiresAt)
  expiry.setHours(0, 0, 0, 0)

  return expiry < today ? 'EXPIRED' : 'ACTIVE'
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message || fallback
  }

  return fallback
}

function mapBackendCoupon(item: BackendCoupon): AdminCoupon {
  const expiresAt = item.expiresAt ? item.expiresAt.slice(0, 10) : null

  return {
    couponId: item.id,
    code: normalizeText(item.code),
    type: item.type,
    value: parseAmount(item.value),
    minOrderValue: item.minOrderValue == null ? null : parseAmount(item.minOrderValue),
    expiresAt,
    expiryStatus: getExpiryStatus(expiresAt),
  }
}

function applyClientFilters(items: AdminCoupon[], filters: CouponFilters) {
  const normalizedQuery = filters.query.trim().toLowerCase()

  return items
    .filter((item) => {
      if (normalizedQuery) {
        const matchesQuery =
          item.code.toLowerCase().includes(normalizedQuery) ||
          String(item.couponId).includes(normalizedQuery)

        if (!matchesQuery) {
          return false
        }
      }

      if (filters.type !== 'ALL' && item.type !== filters.type) {
        return false
      }

      if (filters.expiryStatus !== 'ALL' && item.expiryStatus !== filters.expiryStatus) {
        return false
      }

      return true
    })
    .sort((firstItem, secondItem) => {
      const compareValue = (() => {
        if (filters.sortBy === 'value') {
          return firstItem.value - secondItem.value
        }

        if (filters.sortBy === 'expiresAt') {
          const first = firstItem.expiresAt ?? '9999-12-31'
          const second = secondItem.expiresAt ?? '9999-12-31'
          return first.localeCompare(second)
        }

        return firstItem.code.localeCompare(secondItem.code, 'vi')
      })()

      if (compareValue !== 0) {
        return filters.sortOrder === 'asc' ? compareValue : -compareValue
      }

      const tieBreaker = firstItem.couponId - secondItem.couponId
      return filters.sortOrder === 'asc' ? tieBreaker : -tieBreaker
    })
}

function mapUsageTrend(range: ReportDateRange, trend: BackendUsageTrendPoint[]): CouponUsageTrendPoint[] {
  const trendMap = new Map<string, { usageCount: number; discountAmount: number }>()

  trend.forEach((point) => {
    const date = point.date.slice(0, 10)
    trendMap.set(date, {
      usageCount: point.usageCount,
      discountAmount: parseAmount(point.discountAmount),
    })
  })

  return eachDayInRange(range).map((date) => {
    const bucket = trendMap.get(date) ?? { usageCount: 0, discountAmount: 0 }

    return {
      date,
      label: formatDayLabel(date),
      usageCount: bucket.usageCount,
      discountAmount: bucket.discountAmount,
    }
  })
}

function mapTopCoupons(topCoupons: BackendTopCoupon[]): CouponTopUsagePoint[] {
  return topCoupons.map((item) => ({
    couponId: item.couponId,
    code: normalizeText(item.code) || 'N/A',
    usageCount: item.usageCount,
    discountAmount: parseAmount(item.discountAmount),
  }))
}

export function validateCouponForm(data: CouponFormData): CouponFormErrors {
  const errors: CouponFormErrors = {}
  const code = data.code.trim().toUpperCase()
  const value = Number(data.value)
  const minOrderValue = data.minOrderValue.trim() ? Number(data.minOrderValue) : null
  const previewOrderAmount = data.previewOrderAmount.trim() ? Number(data.previewOrderAmount) : null

  if (!code) {
    errors.code = 'Vui lòng nhập mã giảm giá.'
  } else if (code.length < 3 || code.length > 32) {
    errors.code = 'Mã giảm giá phải từ 3 đến 32 ký tự.'
  }

  if (!Number.isFinite(value) || value <= 0) {
    errors.value = 'Giá trị giảm phải lớn hơn 0.'
  } else if (data.type === 'PERCENTAGE' && value > 100) {
    errors.value = 'Giảm phần trăm không được vượt quá 100%.'
  }

  if (minOrderValue != null && (!Number.isFinite(minOrderValue) || minOrderValue < 0)) {
    errors.minOrderValue = 'Giá trị đơn tối thiểu không được âm.'
  }

  if (previewOrderAmount != null && (!Number.isFinite(previewOrderAmount) || previewOrderAmount <= 0)) {
    errors.previewOrderAmount = 'Giá trị đơn xem trước phải lớn hơn 0.'
  }

  return errors
}

function formatVnd(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function validateCouponPreview(data: CouponFormData): CouponFormErrors {
  const errors: CouponFormErrors = {}
  const code = data.code.trim().toUpperCase()
  const value = Number(data.value)
  const orderAmount = Number(data.previewOrderAmount)

  if (!code) {
    errors.code = 'Vui lòng nhập mã giảm giá.'
  } else if (code.length < 3 || code.length > 32) {
    errors.code = 'Mã giảm giá phải từ 3 đến 32 ký tự.'
  }

  if (!Number.isFinite(value) || value <= 0) {
    errors.value = 'Giá trị giảm phải lớn hơn 0.'
  } else if (data.type === 'PERCENTAGE' && value > 100) {
    errors.value = 'Giảm phần trăm không được vượt quá 100%.'
  }

  if (!Number.isFinite(orderAmount) || orderAmount <= 0) {
    errors.previewOrderAmount = 'Giá trị đơn xem trước phải lớn hơn 0.'
  }

  return errors
}

export function previewCouponFromForm(data: CouponFormData, orderAmount: number): DiscountValidationResult {
  const code = data.code.trim().toUpperCase()
  const value = Number(data.value)
  const minOrderValue = data.minOrderValue.trim() ? Number(data.minOrderValue) : 0

  if (data.expiresAt) {
    const expiryDate = new Date(`${data.expiresAt}T00:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (expiryDate < today) {
      return {
        valid: false,
        code,
        message: 'Mã giảm giá đã hết hạn theo ngày đã chọn.',
      }
    }
  }

  if (Number.isFinite(minOrderValue) && minOrderValue > 0 && orderAmount < minOrderValue) {
    return {
      valid: false,
      code,
      message: `Đơn hàng chưa đạt giá trị tối thiểu ${formatVnd(minOrderValue)}.`,
    }
  }

  const rawDiscount =
    data.type === 'PERCENTAGE' ? (orderAmount * value) / 100 : value
  const discountAmount = Math.round(Math.min(rawDiscount, orderAmount) * 100) / 100
  const payableAmount = Math.max(orderAmount - discountAmount, 0)

  return {
    valid: true,
    code,
    discountAmount,
    message: `Xem trước theo form — khách trả khoảng ${formatVnd(payableAmount)}.`,
  }
}

export async function fetchCouponRooms(): Promise<CouponRoomOption[]> {
  try {
    const response = await api.get<ApiResponse<BackendRoom[]>>('/api/rooms')
    const rooms = response.data.data ?? []

    return rooms
      .map((room) => ({
        roomId: room.id,
        roomName: normalizeText(room.roomName) || `Phòng ${room.id}`,
      }))
      .sort((firstRoom, secondRoom) => firstRoom.roomName.localeCompare(secondRoom.roomName, 'vi'))
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể tải danh sách phòng.'))
  }
}

export async function fetchAdminCoupons(filters: CouponFilters): Promise<AdminCoupon[]> {
  try {
    const response = await api.get<ApiResponse<BackendCoupon[]>>('/api/admin/coupons')
    return applyClientFilters((response.data.data ?? []).map(mapBackendCoupon), filters)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể tải danh sách mã giảm giá.'))
  }
}

export async function fetchAdminCouponDetail(id: number): Promise<AdminCoupon | null> {
  try {
    const response = await api.get<ApiResponse<BackendCoupon>>(`/api/admin/coupons/${id}`)
    return mapBackendCoupon(response.data.data)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null
    }

    throw new Error(getApiErrorMessage(error, 'Không thể tải chi tiết mã giảm giá.'))
  }
}

export async function createAdminCoupon(data: CouponFormData): Promise<AdminCoupon> {
  const errors = validateCouponForm(data)
  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors)[0] || 'Dữ liệu mã giảm giá không hợp lệ.')
  }

  try {
    const response = await api.post<ApiResponse<BackendCoupon>>('/api/admin/coupons', {
      code: data.code.trim().toUpperCase(),
      type: data.type,
      value: Number(data.value),
      minOrderValue: data.minOrderValue.trim() ? Number(data.minOrderValue) : null,
      expiresAt: data.expiresAt.trim() || null,
    })

    return mapBackendCoupon(response.data.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể tạo mã giảm giá.'))
  }
}

export async function updateAdminCoupon(id: number, data: CouponFormData): Promise<AdminCoupon | null> {
  const errors = validateCouponForm(data)
  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors)[0] || 'Dữ liệu mã giảm giá không hợp lệ.')
  }

  try {
    const response = await api.put<ApiResponse<BackendCoupon>>(`/api/admin/coupons/${id}`, {
      code: data.code.trim().toUpperCase(),
      type: data.type,
      value: Number(data.value),
      minOrderValue: data.minOrderValue.trim() ? Number(data.minOrderValue) : null,
      expiresAt: data.expiresAt.trim() || null,
    })

    return mapBackendCoupon(response.data.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể cập nhật mã giảm giá.'))
  }
}

export async function deleteAdminCoupon(id: number): Promise<void> {
  try {
    await api.delete(`/api/admin/coupons/${id}`)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể xóa mã giảm giá.'))
  }
}

export async function previewCouponDiscount(code: string, orderAmount: number) {
  return validateDiscountCode({ code, subtotal: orderAmount })
}

export async function fetchCouponUsageReport(range: ReportDateRange): Promise<CouponUsageReport> {
  try {
    const response = await api.get<ApiResponse<BackendUsageReport>>('/api/admin/coupons/usage-report', {
      params: {
        startDate: range.startDate,
        endDate: range.endDate,
      },
    })

    const report = response.data.data

    return {
      totalUsed: report.totalUsed,
      totalDiscountGiven: parseAmount(report.totalDiscountGiven),
      trend: mapUsageTrend(range, report.trend ?? []),
      topCoupons: mapTopCoupons(report.topCoupons ?? []),
    }
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể tải báo cáo mã giảm giá.'))
  }
}

export function toFormData(coupon: AdminCoupon): CouponFormData {
  return {
    code: coupon.code,
    type: coupon.type,
    value: String(coupon.value),
    minOrderValue: coupon.minOrderValue == null ? '' : String(coupon.minOrderValue),
    expiresAt: coupon.expiresAt ?? '',
    roomIds: [],
    previewOrderAmount: coupon.minOrderValue ? String(coupon.minOrderValue) : '500000',
  }
}

export function defaultCouponReportRange(): ReportDateRange {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 29)
  return { startDate: toDateKey(start), endDate: toDateKey(end) }
}

export const EMPTY_COUPON_FORM: CouponFormData = {
  code: '',
  type: 'PERCENTAGE',
  value: '10',
  minOrderValue: '100000',
  expiresAt: '',
  roomIds: [],
  previewOrderAmount: '500000',
}
