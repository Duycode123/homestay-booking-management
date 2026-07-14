export const OPEN_QUICK_BOOKING_EVENT = 'homestay:open-quick-booking'

export type OpenQuickBookingEventDetail = {
  roomId: string
}

export function openQuickBookingOnCurrentPage(roomId: number) {
  window.dispatchEvent(new CustomEvent<OpenQuickBookingEventDetail>(OPEN_QUICK_BOOKING_EVENT, {
    detail: { roomId: String(roomId) },
  }))
}
