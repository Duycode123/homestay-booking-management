import { NextResponse, type NextRequest } from 'next/server'

const LOGIN_PATH = '/login'
const HOME_PATH = '/'
const ACCESS_COOKIE_NAME = 'access_token'
const AUTH_COOKIE_NAMES = [ACCESS_COOKIE_NAME, 'refresh_token']
const TOKEN_EXPIRY_SKEW_SECONDS = 5

function hasAuthCookie(request: NextRequest) {
  return AUTH_COOKIE_NAMES.some((name) => request.cookies.has(name))
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

function getRoleFromPayload(payload: { role?: string } | null) {
  return payload?.role?.trim().toUpperCase() ?? null
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = LOGIN_PATH
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

function redirectUnauthorized(request: NextRequest) {
  const homeUrl = request.nextUrl.clone()
  homeUrl.pathname = HOME_PATH
  homeUrl.search = ''
  homeUrl.searchParams.set('error', 'unauthorized')
  return NextResponse.redirect(homeUrl)
}

export function proxy(request: NextRequest) {
  if (!hasAuthCookie(request)) {
    return redirectToLogin(request)
  }

  const accessTokenPayload = getAccessTokenPayload(request)
  if (isExpired(accessTokenPayload)) {
    return redirectToLogin(request)
  }

  if (request.nextUrl.pathname.startsWith('/admin')) {
    const role = getRoleFromPayload(accessTokenPayload)
    if (role !== 'ADMIN') {
      return redirectUnauthorized(request)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/staff/:path*',
    '/customer/checkout',
    '/customer/checkout/:path*',
    '/customer/profile',
    '/customer/profile/:path*',
    '/customer/security',
    '/customer/security/:path*',
    '/customer/bookings',
    '/customer/bookings/:path*',
    '/customer/support',
    '/customer/support/:path*',
    '/customer/report-issue',
    '/customer/report-issue/:path*',
    '/customer/accessibility',
    '/customer/accessibility/:path*',
  ],
}
