const HIDDEN_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/admin',
  '/staff',
  '/unauthorized',
]

const HIDDEN_EXACT = new Set(['/customer/checkout'])

const VISIBLE_PREFIXES = ['/', '/rooms', '/customer', '/payment/return']

export function shouldShowChatbot(pathname: string | null): boolean {
  if (!pathname) return false

  if (HIDDEN_EXACT.has(pathname)) return false
  if (HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return false
  }

  if (pathname === '/') return true
  if (pathname === '/rooms') return true
  if (pathname.startsWith('/customer')) return true
  if (pathname.startsWith('/payment/return')) return true

  return VISIBLE_PREFIXES.some(
    (prefix) => prefix !== '/' && (pathname === prefix || pathname.startsWith(`${prefix}/`)),
  )
}
