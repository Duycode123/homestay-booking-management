import api from '@/lib/api'

export const NEW_CUSTOMER_COUPON_CODE = 'SERENE10'

const DISMISSED_KEY = 'serene_new_customer_offer_dismissed'
const SELECTED_COUPON_KEY = 'serene_selected_coupon'

type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

export type NewCustomerOffer = {
  eligible: boolean
  code: string
  discountPercent: number
  message: string
}

export async function fetchNewCustomerOffer() {
  const response = await api.get<ApiResponse<NewCustomerOffer>>('/api/coupons/new-customer-offer')
  return response.data.data
}

export function hasDismissedNewCustomerOffer() {
  if (typeof window === 'undefined') return true
  return window.sessionStorage.getItem(DISMISSED_KEY) === 'true'
}

export function dismissNewCustomerOffer() {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(DISMISSED_KEY, 'true')
}

export function rememberSelectedCoupon(code: string) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(SELECTED_COUPON_KEY, code.trim().toUpperCase())
}

export function readSelectedCoupon() {
  if (typeof window === 'undefined') return ''
  return window.sessionStorage.getItem(SELECTED_COUPON_KEY) ?? ''
}

export function clearSelectedCoupon() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(SELECTED_COUPON_KEY)
}
