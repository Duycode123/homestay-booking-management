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

function waitForMockApi(delay = 260) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, delay))
}

function isSameUserProfile(profile: Partial<CustomerProfile>, user?: AuthUser | null) {
  if (!user) return false

  const profileId = profile.id ? String(profile.id) : ''
  const userId = user.id ? String(user.id) : ''
  const profileEmail = profile.email?.trim().toLowerCase()
  const userEmail = user.email?.trim().toLowerCase()

  if (profileId && userId) return profileId === userId
  if (profileEmail && userEmail) return profileEmail === userEmail

  return false
}

function readStoredCustomerProfile(user?: AuthUser | null): Partial<CustomerProfile> | null {
  if (typeof window === 'undefined') return null

  try {
    const rawProfile = window.localStorage.getItem(CUSTOMER_PROFILE_KEY)
    if (!rawProfile) return null

    const profile = JSON.parse(rawProfile) as Partial<CustomerProfile>
    if (isSameUserProfile(profile, user)) {
      return profile
    }

    window.localStorage.removeItem(CUSTOMER_PROFILE_KEY)
    return null
  } catch {
    return null
  }
}

function writeStoredCustomerProfile(profile: CustomerProfile) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(CUSTOMER_PROFILE_KEY, JSON.stringify(profile))
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
  const storedProfile = readStoredCustomerProfile(user)

  try {
    const response = await api.get<CurrentUserApiResponse>('/api/users/me')
    const sameUserStoredAvatar = isSameUserProfile(storedProfile ?? {}, {
      ...user,
      id: response.data.id || user?.id,
      email: response.data.email || user?.email,
      role: user?.role || 'CUSTOMER',
    })
      ? getPersistentAvatarUrl(storedProfile?.avatarUrl)
      : undefined
    const currentProfile = normalizeCurrentUser(response.data, {
      ...user,
      role: user?.role || storedProfile?.role || 'CUSTOMER',
      avatarUrl: sameUserStoredAvatar || getPersistentAvatarUrl(user?.avatarUrl),
      fullName: response.data.fullName || response.data.name || storedProfile?.fullName || user?.fullName,
      name: response.data.name || response.data.fullName || storedProfile?.fullName || user?.name,
      email: response.data.email || storedProfile?.email || user?.email,
      phone: response.data.phone || storedProfile?.phone || user?.phone,
    })

    writeStoredCustomerProfile(currentProfile)
    return currentProfile
  } catch {
    await waitForMockApi(120)
    return normalizeCurrentUser(storedProfile ?? {}, user)
  }
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

    writeStoredCustomerProfile(updatedProfile)
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

    writeStoredCustomerProfile(updatedProfile)
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
