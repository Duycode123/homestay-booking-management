const STORAGE_PREFIX = 'homestay:scroll:'
const FORCE_HOME_TOP_KEY = 'homestay:force-home-top'

/** Paths that should restore scroll position when revisited (product-style back navigation). */
const RESTORE_SCROLL_PATHS = new Set(['/rooms', '/customer/bookings', '/customer/support'])

export function saveScrollPosition(pathname: string) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(`${STORAGE_PREFIX}${pathname}`, String(window.scrollY))
}

export function clearScrollPosition(pathname: string) {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(`${STORAGE_PREFIX}${pathname}`)
}

export function markForceHomepageTop() {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(FORCE_HOME_TOP_KEY, '1')
  clearScrollPosition('/')
}

export function clearForceHomepageTop() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(FORCE_HOME_TOP_KEY)
}

export function consumeForceHomepageTop() {
  if (typeof window === 'undefined') return false
  const shouldForce = sessionStorage.getItem(FORCE_HOME_TOP_KEY) === '1'
  if (shouldForce) {
    sessionStorage.removeItem(FORCE_HOME_TOP_KEY)
  }
  return shouldForce
}

export function isForceHomepageTopPending() {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(FORCE_HOME_TOP_KEY) === '1'
}

export function restoreScrollPosition(pathname: string) {
  if (typeof window === 'undefined') return false
  if (!RESTORE_SCROLL_PATHS.has(pathname)) return false

  const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${pathname}`)
  if (!raw) return false

  const top = Number(raw)
  if (!Number.isFinite(top) || top < 0) return false

  window.scrollTo({ top, left: 0, behavior: 'auto' })
  return true
}

export function scrollToTopInstant() {
  if (typeof window === 'undefined') return
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
}
