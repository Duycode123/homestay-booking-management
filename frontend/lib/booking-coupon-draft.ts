import type { AppliedDiscount } from '@/lib/discount-service'

const CONFIRMATION_COUPON_KEY = 'homestay-room.confirmation-coupon'

export type BookingCouponDraftKey = {
  roomId: string
  date: string
  startTime: string
  endTime: string
}

function buildDraftKey(key: BookingCouponDraftKey) {
  return `${key.roomId}|${key.date}|${key.startTime}|${key.endTime}`
}

export function saveConfirmationCouponDraft(key: BookingCouponDraftKey, appliedCoupon: AppliedDiscount | null) {
  if (typeof window === 'undefined') return

  if (!appliedCoupon) {
    window.sessionStorage.removeItem(CONFIRMATION_COUPON_KEY)
    return
  }

  window.sessionStorage.setItem(
    CONFIRMATION_COUPON_KEY,
    JSON.stringify({
      key: buildDraftKey(key),
      appliedCoupon,
    }),
  )
}

export function getConfirmationCouponDraft(key: BookingCouponDraftKey): AppliedDiscount | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.sessionStorage.getItem(CONFIRMATION_COUPON_KEY)
    if (!raw) return null

    const draft = JSON.parse(raw) as {
      key?: string
      appliedCoupon?: AppliedDiscount
    }

    if (draft.key !== buildDraftKey(key) || !draft.appliedCoupon) {
      return null
    }

    const { code, discountAmount } = draft.appliedCoupon
    if (typeof code !== 'string' || typeof discountAmount !== 'number') {
      return null
    }

    return { code, discountAmount }
  } catch {
    return null
  }
}

export function clearConfirmationCouponDraft() {
  if (typeof window === 'undefined') return

  window.sessionStorage.removeItem(CONFIRMATION_COUPON_KEY)
}
