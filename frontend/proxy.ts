import { NextResponse, type NextRequest } from 'next/server'
import {
  defaultLocale,
  getLocaleFromPathname,
  localeCookieName,
  localeHeaderName,
  stripLocalePrefix,
  type Locale,
} from './i18n/config'

const LOGIN_PATH = '/login'
const ACCESS_COOKIE_NAME = 'access_token'
const AUTH_COOKIE_NAMES = [ACCESS_COOKIE_NAME, 'refresh_token']
const TOKEN_EXPIRY_SKEW_SECONDS = 5
const ENFORCE_HTTPS = process.env.NODE_ENV === 'production' && process.env.ENFORCE_HTTPS === 'true'

function hasAuthCookie(request: NextRequest) {
  return AUTH_COOKIE_NAMES.some((name) => request.cookies.has(name))
}

function hasRefreshCookie(request: NextRequest) {
  return request.cookies.has('refresh_token')
}

function decodeJwtPayload(token: string) {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null

    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
    return JSON.parse(atob(padded)) as { exp?: number; role?: string }
  } catch {
    return null
  }
}

function getAccessTokenPayload(request: NextRequest) {
  const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value
  return token ? decodeJwtPayload(token) : null
}

function isExpired(payload: { exp?: number } | null) {
  if (!payload?.exp) return true
  return payload.exp <= Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SKEW_SECONDS
}

function resolveLocale(request: NextRequest): Locale {
  const localeFromPath = getLocaleFromPathname(request.nextUrl.pathname)
  if (localeFromPath) return localeFromPath

  const localeFromCookie = request.cookies.get(localeCookieName)?.value
  return localeFromCookie === 'en' ? 'en' : defaultLocale
}

function createRequestHeaders(request: NextRequest, locale: Locale) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(localeHeaderName, locale)
  return requestHeaders
}

function redirectToLogin(request: NextRequest, locale: Locale) {
  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = locale === defaultLocale ? LOGIN_PATH : `/${locale}${LOGIN_PATH}`
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search)
  return NextResponse.redirect(loginUrl)
}

function isProtectedPath(pathname: string) {
  return [
    '/admin',
    '/staff',
    '/customer/checkout',
    '/customer/profile',
    '/customer/account-settings',
    '/customer/security',
    '/customer/bookings',
    '/customer/support',
    '/customer/report-issue',
    '/customer/accessibility',
  ].some((protectedPath) => pathname === protectedPath || pathname.startsWith(`${protectedPath}/`))
}

function applyLocaleCookie(response: NextResponse, locale: Locale) {
  response.cookies.set(localeCookieName, locale, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  })
  return response
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  const forwardedProtocol = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  if (ENFORCE_HTTPS && forwardedProtocol === 'http') {
    const secureUrl = request.nextUrl.clone()
    secureUrl.protocol = 'https'
    secureUrl.port = ''
    return NextResponse.redirect(secureUrl, 308)
  }

  const locale = resolveLocale(request)
  const rawPathname = stripLocalePrefix(pathname)

  if (isProtectedPath(rawPathname)) {
    if (!hasAuthCookie(request)) return redirectToLogin(request, locale)

    const accessTokenPayload = getAccessTokenPayload(request)
    if (isExpired(accessTokenPayload) && !hasRefreshCookie(request)) {
      return redirectToLogin(request, locale)
    }
  }

  const requestHeaders = createRequestHeaders(request, locale)
  const localeInPath = getLocaleFromPathname(pathname)

  if (localeInPath) {
    const destination = request.nextUrl.clone()
    destination.pathname = rawPathname
    destination.search = search
    return applyLocaleCookie(
      NextResponse.redirect(destination),
      locale,
    )
  }

  return applyLocaleCookie(NextResponse.next({ request: { headers: requestHeaders } }), locale)
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|robots.txt|sitemap.xml|.*\\..*).*)',
  ],
}
