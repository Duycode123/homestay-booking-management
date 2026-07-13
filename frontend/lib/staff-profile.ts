import { type AuthUser, type UserRole } from '@/lib/auth'

export function getDisplayName(user?: Partial<AuthUser> | null) {
  const fullName = user?.fullName?.trim()
  const username = user?.name?.trim()
  const email = user?.email?.trim()

  if (fullName) return fullName
  if (username) return username
  if (email) return email.split('@')[0] || email

  return 'Nhân viên'
}

export function getRoleLabel(role?: UserRole | string | null) {
  if (role === 'ADMIN') return 'Admin'
  if (role === 'STAFF') return 'Nhân viên'
  if (role === 'CUSTOMER') return 'Khách hàng'
  return 'Nhân viên'
}

export function getInitials(nameOrEmail?: string | null) {
  const source = nameOrEmail?.trim() || 'N'
  return source.charAt(0).toUpperCase()
}

export function getProfileValue(value?: string | null) {
  return value?.trim() || 'Chưa cập nhật'
}

export function clearStaffAuthCaches() {
  if (typeof window === 'undefined') return

  const keys = [
    'user',
    'currentUser',
    'profile',
    'avatarUrl',
    'accessToken',
    'refreshToken',
    'homestay_customer_profile',
    'homestay_auth_session',
    'homestay_has_auth_session',
  ]

  keys.forEach((key) => window.localStorage.removeItem(key))
}
