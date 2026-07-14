import type { BookingRoom } from '@/components/booking/booking-data'

export const QUICK_BOOKING_DRAFT_KEY = 'homestay.homepage.quickBookingDraft'
export const QUICK_BOOKING_REOPEN_PARAM = 'reopenQuickBooking'
export const LEGACY_QUICK_BOOKING_RESTORE_PARAM = 'quickBooking'
export const LEGACY_QUICK_BOOKING_RESTORE_VALUE = 'restore'
const QUICK_BOOKING_DRAFT_MAX_AGE_MS = 60 * 60 * 1000

export type QuickBookingSourceRoute = '/' | '/rooms'

export type QuickBookingDraft = {
  sourceRoute: QuickBookingSourceRoute
  selectedRoom: BookingRoom
  room?: BookingRoom
  selectedDate?: string
  selectedEndDate?: string
  selectedSlot?: {
    startTime: string
    endTime: string
  }
  selectedTimeRange?: {
    startTime: string
    endTime: string
  }
  selectedSlots?: string[]
  selectedStartTime?: string
  selectedEndTime?: string
  selectedDuration?: number
  customerNote?: string
  totalPrice?: number
  currentStep?: string
  timestamp: number
  initialDate?: string
  initialEndDate?: string
  initialStartTime?: string
  initialDuration?: number
  initialNote?: string
  returnPath?: string
}

export function getQuickBookingRestoreHref(sourceRoute: QuickBookingSourceRoute = '/') {
  return `${sourceRoute}?${QUICK_BOOKING_REOPEN_PARAM}=1`
}

export function saveQuickBookingDraft(draft: QuickBookingDraft) {
  window.sessionStorage.setItem(QUICK_BOOKING_DRAFT_KEY, JSON.stringify(draft))
}

export function clearQuickBookingDraft() {
  window.sessionStorage.removeItem(QUICK_BOOKING_DRAFT_KEY)
}

export function readQuickBookingDraft(): QuickBookingDraft | null {
  const rawDraft = window.sessionStorage.getItem(QUICK_BOOKING_DRAFT_KEY)
  if (!rawDraft) return null

  try {
    const draft = JSON.parse(rawDraft) as QuickBookingDraft
    if (!isValidQuickBookingDraft(draft)) {
      clearQuickBookingDraft()
      return null
    }

    return draft
  } catch {
    clearQuickBookingDraft()
    return null
  }
}

export function shouldReopenQuickBooking(search: string) {
  const searchParams = new URLSearchParams(search)

  return (
    searchParams.get(QUICK_BOOKING_REOPEN_PARAM) === '1' ||
    searchParams.get(LEGACY_QUICK_BOOKING_RESTORE_PARAM) === LEGACY_QUICK_BOOKING_RESTORE_VALUE
  )
}

function isValidQuickBookingDraft(draft: QuickBookingDraft) {
  const room = draft.selectedRoom ?? draft.room
  const startTime = draft.selectedStartTime ?? draft.selectedSlot?.startTime ?? draft.selectedTimeRange?.startTime
  const endTime = draft.selectedEndTime ?? draft.selectedSlot?.endTime ?? draft.selectedTimeRange?.endTime
  const duration = draft.selectedDuration ?? draft.initialDuration
  const isFresh = typeof draft.timestamp === 'number' && Date.now() - draft.timestamp <= QUICK_BOOKING_DRAFT_MAX_AGE_MS

  return Boolean(
    room &&
      draft.selectedDate &&
      startTime &&
      endTime &&
      duration &&
      duration > 0 &&
      draft.currentStep === 'confirmation' &&
      isFresh,
  )
}
