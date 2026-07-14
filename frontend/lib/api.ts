import axios, { type InternalAxiosRequestConfig } from 'axios'

const REFRESH_PATH = '/api/auth/refresh'
const CSRF_PATH = '/api/auth/csrf'
const AUTH_PATH_PREFIX = '/api/auth/'
const AUTH_SESSION_MARKER_KEY = 'homestay_has_auth_session'
const UNSAFE_METHODS = new Set(['post', 'put', 'patch', 'delete'])

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  withCredentials: true,
  // Spring returns a masked request token; do not let Axios overwrite it from a legacy cookie.
  xsrfCookieName: '',
})

const csrfClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  withCredentials: true,
  xsrfCookieName: '',
})

let refreshPromise: Promise<void> | null = null
let csrfPromise: Promise<{ headerName: string; token: string }> | null = null
let csrfToken: { headerName: string; token: string } | null = null
let sessionExpiryRedirectStarted = false

export function hasStoredAuthSession() {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(AUTH_SESSION_MARKER_KEY) === 'true'
}

export function rememberAuthSession() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(AUTH_SESSION_MARKER_KEY, 'true')
}

export function clearStoredAuthSession() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(AUTH_SESSION_MARKER_KEY)
}

function isAuthFlowRequest(url?: string) {
  if (!url) return false
  return url.includes(AUTH_PATH_PREFIX) && !url.includes('/session')
}

function normalizeErrorMessage(message: unknown) {
  if (typeof message !== 'string') return ''

  return message
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function shouldRetryCsrf(
  responseStatus: number | undefined,
  responseData: unknown,
  config?: InternalAxiosRequestConfig,
) {
  if (!config || !requiresCsrf(config)) return false
  if (responseStatus === 403) return true
  if (responseStatus !== 401 || !isAuthFlowRequest(config.url)) return false

  const data = responseData as { code?: unknown; message?: unknown } | undefined
  const code = typeof data?.code === 'string' ? data.code.toUpperCase() : ''
  const message = normalizeErrorMessage(data?.message)

  return code === 'CSRF_TOKEN_INVALID'
    || message.includes('csrf')
    || message.includes('phien dang nhap khong hop le')
}

function redirectToLoginAfterSessionExpiry() {
  if (typeof window === 'undefined' || sessionExpiryRedirectStarted) return

  const publicAuthPaths = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
  ]
  if (publicAuthPaths.some((path) => window.location.pathname.startsWith(path))) return

  sessionExpiryRedirectStarted = true
  const currentPath = `${window.location.pathname}${window.location.search}`
  window.location.assign(`/login?redirect=${encodeURIComponent(currentPath)}`)
}

function requiresCsrf(config: InternalAxiosRequestConfig) {
  const method = config.method?.toLowerCase()
  return Boolean(method && UNSAFE_METHODS.has(method) && !config.url?.includes(CSRF_PATH))
}

async function getCsrfToken(forceRefresh = false) {
  if (forceRefresh) csrfToken = null
  if (csrfToken) return csrfToken

  if (!csrfPromise) {
    csrfPromise = csrfClient
      .get<{ headerName: string; token: string }>(CSRF_PATH)
      .then(({ data }) => {
        csrfToken = data
        return data
      })
      .finally(() => {
        csrfPromise = null
      })
  }

  return csrfPromise
}

api.interceptors.request.use(async (config) => {
  if (typeof window === 'undefined' || !requiresCsrf(config)) return config

  const csrf = await getCsrfToken()
  config.headers.set(csrf.headerName, csrf.token)
  return config
})

export async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = api.post(REFRESH_PATH).then(() => undefined).finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const response = error.response
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean; _csrfRetry?: boolean })
      | undefined

    if (
      shouldRetryCsrf(response?.status, response?.data, originalRequest)
      && originalRequest
      && !originalRequest._csrfRetry
    ) {
      originalRequest._csrfRetry = true
      const csrf = await getCsrfToken(true)
      originalRequest.headers.set(csrf.headerName, csrf.token)
      return api(originalRequest)
    }

    if (!response || response.status !== 401 || !originalRequest) {
      return Promise.reject(error)
    }

    if (originalRequest._retry || isAuthFlowRequest(originalRequest.url) || originalRequest.url?.includes(REFRESH_PATH)) {
      return Promise.reject(error)
    }

    if (!hasStoredAuthSession()) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      await refreshSession()
      return api(originalRequest)
    } catch {
      clearStoredAuthSession()
      redirectToLoginAfterSessionExpiry()
      return Promise.reject(error)
    }
  },
)

export default api
