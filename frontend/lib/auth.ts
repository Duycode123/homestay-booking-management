import api, {
  beginAuthTransition,
  clearStoredAuthSession,
  endAuthTransition,
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

function requireUserRole(role?: string | null): UserRole {
  const normalizedRole = role?.trim().toUpperCase()
  if (normalizedRole === 'ADMIN' || normalizedRole === 'STAFF' || normalizedRole === 'CUSTOMER') {
    return normalizedRole
  }
  throw new Error('Invalid authenticated user role')
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
  await beginAuthTransition()
  try {
    clearStoredAuthSession()
    const response = await api.post<AuthApiUser>('/api/auth/login', { email, password })
    const authenticatedUser = normalizeAuthUser(response.data)
    authenticatedUser.role = requireUserRole(response.data.role ?? response.data.vaiTro)
    rememberAuthSession()
    return authenticatedUser
  } finally {
    endAuthTransition()
  }
}

export const getSessionRole = async () => {
  const response = await api.get<AuthApiUser>('/api/auth/session')
  const sessionUser = normalizeAuthUser(response.data)
  sessionUser.role = requireUserRole(response.data.role ?? response.data.vaiTro)
  return sessionUser
}

export const restoreSession = async () => {
  try {
    const sessionUser = await getSessionRole()
    rememberAuthSession()
    return sessionUser
  } catch (error) {
    clearStoredAuthSession()
    throw error
  }
}

export const logoutSession = async () => {
  await beginAuthTransition()
  try {
    await api.post('/api/auth/logout')
  } finally {
    clearStoredAuthSession()
    endAuthTransition()
  }
}
