import axios from 'axios'
import api from '@/lib/api'
import { normalizeAuthUser, type AuthUser, type UserRole } from '@/lib/auth'

const CUSTOMER_PROFILE_KEY = 'homestay-booking-management.customer-profile'

export type CustomerProfile = {
  id?: string | number
  fullName: string
  email: string
  phone: string
  avatarUrl?: string
  role: UserRole
}

export type UpdateCustomerProfilePayload = {
  fullName: string
  email: string
  phone: string
}

export type ChangeCustomerPasswordPayload = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

type ApiErrorResponse = {
  message?: string
  data?: unknown
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const message = error.response?.data?.message

    if (message) {
      return message
    }
  }

  return fallback
}

export function clearStoredCustomerProfile() {
  if (typeof window === 'undefined') return

  window.localStorage.removeItem(CUSTOMER_PROFILE_KEY)
}

function getPersistentAvatarUrl(avatarUrl?: string) {
  const normalizedAvatarUrl = avatarUrl?.trim()
  if (!normalizedAvatarUrl || normalizedAvatarUrl.startsWith('blob:')) return undefined

  return normalizedAvatarUrl
}

export function getInitials(name?: string, email?: string) {
  const source = name?.trim() || email?.trim() || 'K'
  return source.charAt(0).toUpperCase()
}

export function getCustomerDisplayName(user?: AuthUser | CustomerProfile | null) {
  const fullName = user?.fullName?.trim()
  const name = 'name' in (user ?? {}) ? (user as AuthUser).name?.trim() : ''
  const email = user?.email?.trim()

  if (fullName) return fullName
  if (name) return name
  if (email) return email.split('@')[0] || email

  return 'Khách hàng'
}

type CurrentUserApiResponse = Partial<CustomerProfile & AuthUser> & {
  role?: string
  vaiTro?: string
}

function normalizeCurrentUser(currentUser: CurrentUserApiResponse, fallback?: AuthUser | null): CustomerProfile {
  const normalizedUser = normalizeAuthUser(currentUser, fallback)

  return {
    id: currentUser.id || fallback?.id,
    fullName:
      currentUser.fullName ||
      currentUser.name ||
      fallback?.fullName ||
      fallback?.name ||
      getCustomerDisplayName({ email: currentUser.email || fallback?.email, role: normalizedUser.role }) ||
      'Khách hàng',
    email: currentUser.email || fallback?.email || '',
    phone: currentUser.phone || fallback?.phone || '',
    avatarUrl: getPersistentAvatarUrl(currentUser.avatarUrl) || getPersistentAvatarUrl(fallback?.avatarUrl),
    role: normalizedUser.role,
  }
}

export async function fetchCurrentUser(user?: AuthUser | null): Promise<CustomerProfile> {
  const response = await api.get<CurrentUserApiResponse>('/api/users/me', {
    params: { requestTime: Date.now() },
  })
  const currentProfile = normalizeCurrentUser(response.data, user)
  const expectedEmail = user?.email?.trim().toLowerCase()
  const actualEmail = currentProfile.email.trim().toLowerCase()

  if (expectedEmail && actualEmail && expectedEmail !== actualEmail) {
    clearStoredCustomerProfile()
    throw new Error('Authenticated profile does not match the current session')
  }

  return currentProfile
}

export async function updateCustomerProfile(payload: UpdateCustomerProfilePayload): Promise<CustomerProfile> {
  try {
    const response = await api.put<CustomerProfile>('/api/users/me', payload)
    const updatedProfile = normalizeCurrentUser(response.data, {
      role: response.data.role || 'CUSTOMER',
      fullName: payload.fullName,
      name: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      avatarUrl: response.data.avatarUrl,
    })

    return updatedProfile
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể cập nhật thông tin. Vui lòng thử lại.'))
  }
}

export async function uploadCustomerAvatar(file: File, fallback?: AuthUser | null): Promise<CustomerProfile> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post<CurrentUserApiResponse>('/api/users/me/avatar', formData)
    const updatedProfile = normalizeCurrentUser(response.data, fallback)

    return updatedProfile
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể tải ảnh đại diện lên. Vui lòng thử lại.'))
  }
}

export async function changeCustomerPassword(payload: ChangeCustomerPasswordPayload): Promise<void> {
  try {
    await api.put('/api/users/me/password', payload)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể cập nhật mật khẩu. Vui lòng thử lại.'))
  }
}
