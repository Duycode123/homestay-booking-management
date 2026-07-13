import axios from 'axios'

const REFRESH_PATH = '/api/auth/refresh'
const AUTH_PATH_PREFIX = '/api/auth/'
const AUTH_SESSION_MARKER_KEY = 'homestay_has_auth_session'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  withCredentials: true,
})

let refreshPromise: Promise<void> | null = null

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
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined

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
      return Promise.reject(error)
    }
  },
)

export default api
