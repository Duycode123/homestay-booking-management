import api, {
  clearStoredAuthSession,
  hasStoredAuthSession,
  refreshSession,
  rememberAuthSession,
} from '@/lib/api'

export type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER'

export type AuthUser = {
  id?: string | number
  role: UserRole
  name?: string
  fullName?: string
  email?: string
  phone?: string
  avatarUrl?: string
}

type AuthApiUser = Partial<Omit<AuthUser, 'role'>> & {
  role?: string
  vaiTro?: string
}

export function normalizeUserRole(role?: string | null): UserRole {
  const normalizedRole = role?.trim().toUpperCase()

  if (normalizedRole === 'ADMIN' || normalizedRole === 'STAFF' || normalizedRole === 'CUSTOMER') {
    return normalizedRole
  }

  return 'CUSTOMER'
}

export function normalizeAuthUser(data: AuthApiUser, fallback?: AuthUser | null): AuthUser {
  return {
    ...fallback,
    ...data,
    role: normalizeUserRole(data.role ?? data.vaiTro ?? fallback?.role),
  }
}

export function getPostLoginPath(role: UserRole) {
  if (role === 'ADMIN') return '/admin/dashboard'
  if (role === 'STAFF') return '/staff/dashboard'
  return '/'
}

export const loginSession = async (email: string, password: string) => {
  const response = await api.post<AuthApiUser>('/api/auth/login', { email, password })
  rememberAuthSession()
  return normalizeAuthUser(response.data)
}

export const getSessionRole = async () => {
  const response = await api.get<AuthApiUser>('/api/auth/session')
  return normalizeAuthUser(response.data)
}

export const restoreSession = async () => {
  if (!hasStoredAuthSession()) {
    throw new Error('No stored auth session')
  }

  try {
    return await getSessionRole()
  } catch (error) {
    try {
      await refreshSession()
      return await getSessionRole()
    } catch (refreshError) {
      clearStoredAuthSession()
      throw refreshError
    }
  }
}

export const logoutSession = async () => {
  try {
    await api.post('/api/auth/logout')
  } catch {
    // The UI still clears local auth state and returns to the homepage if the API is temporarily unavailable.
  } finally {
    clearStoredAuthSession()
  }
}
