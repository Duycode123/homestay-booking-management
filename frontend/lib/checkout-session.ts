import type { AppliedDiscount } from '@/lib/discount-service'

const CHECKOUT_SESSION_KEY = 'homestay-room.checkout-session'

export type CheckoutSession = {
  bookingId: string
  appliedCoupon: AppliedDiscount | null
}

export function saveCheckoutSession(session: CheckoutSession) {
  if (typeof window === 'undefined') return

  window.sessionStorage.setItem(CHECKOUT_SESSION_KEY, JSON.stringify(session))
}

export function getCheckoutSession(bookingId: string): CheckoutSession | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_SESSION_KEY)
    if (!raw) return null

    const session = JSON.parse(raw) as Partial<CheckoutSession>
    if (session.bookingId !== bookingId || !session.appliedCoupon) {
      return null
    }

    const coupon = session.appliedCoupon
    if (typeof coupon.code !== 'string' || typeof coupon.discountAmount !== 'number') {
      return null
    }

    return {
      bookingId,
      appliedCoupon: {
        code: coupon.code,
        discountAmount: coupon.discountAmount,
      },
    }
  } catch {
    clearCheckoutSession()
    return null
  }
}

export function clearCheckoutSession() {
  if (typeof window === 'undefined') return

  window.sessionStorage.removeItem(CHECKOUT_SESSION_KEY)
}
