import axios from 'axios'
import api from '@/lib/api'
import { logoutSession, normalizeAuthUser, type AuthUser, type UserRole } from '@/lib/auth'

export type StaffProfile = {
  id?: string | number
  fullName: string
  email: string
  phone: string
  avatarUrl?: string
  role: UserRole
}

export type UpdateStaffProfilePayload = {
  fullName: string
  email: string
  phone: string
}

export type StaffNotificationSettings = {
  newBooking: boolean
  bookingReminder: boolean
  shiftReminder: boolean
  roomIssue: boolean
  equipmentIssue: boolean
}

export type ChangeStaffPasswordPayload = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export type StaffUiPreferences = {
  displayDensity: 'comfortable' | 'compact'
  preferredView: 'card' | 'table'
  reduceMotion: boolean
}

type ApiErrorResponse = {
  message?: string
  data?: unknown
}

const UI_PREFERENCES_KEY = 'staff-ui-preferences'
const defaultNotificationSettings: StaffNotificationSettings = {
  newBooking: true,
  bookingReminder: true,
  shiftReminder: true,
  roomIssue: true,
  equipmentIssue: true,
}

export const defaultStaffUiPreferences: StaffUiPreferences = {
  displayDensity: 'comfortable',
  preferredView: 'card',
  reduceMotion: false,
}

function containsRawServerError(message: string) {
  const normalizedMessage = message.toLowerCase()
  return [
    'preparedstatementcallback',
    'sqlexception',
    'sql state',
    'insert into',
    'on conflict',
    'current transaction is aborted',
    'commands ignored until end of transaction block',
    'org.springframework',
  ].some((pattern) => normalizedMessage.includes(pattern))
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const message = error.response?.data?.message
    if (!message || containsRawServerError(message)) return fallback
    return message
  }

  return fallback
}

function normalizeProfile(data: Partial<StaffProfile & AuthUser>, fallback?: AuthUser | null): StaffProfile {
  const normalizedUser = normalizeAuthUser(data, fallback)
  const email = data.email || fallback?.email || ''
  const displayName = data.fullName || data.name || fallback?.fullName || fallback?.name || (email.includes('@') ? email.split('@')[0] : email)

  return {
    id: data.id || fallback?.id,
    fullName: displayName || 'Nhân viên',
    email,
    phone: data.phone || fallback?.phone || '',
    avatarUrl: data.avatarUrl || fallback?.avatarUrl,
    role: normalizedUser.role,
  }
}

export async function getCurrentUser(fallback?: AuthUser | null) {
  try {
    const response = await api.get<Partial<StaffProfile & AuthUser>>('/api/users/me')
    return normalizeProfile(response.data, fallback)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể tải hồ sơ nhân viên. Vui lòng thử lại.'))
  }
}

export async function updateMyProfile(payload: UpdateStaffProfilePayload) {
  try {
    const response = await api.patch<Partial<StaffProfile & AuthUser>>('/api/users/me', payload)
    return normalizeProfile(response.data, {
      role: 'STAFF',
      fullName: payload.fullName,
      name: payload.fullName,
      email: payload.email,
      phone: payload.phone,
    })
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể lưu hồ sơ nhân viên. Vui lòng thử lại.'))
  }
}

export async function uploadMyAvatar(file: File, fallback?: AuthUser | null) {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post<Partial<StaffProfile & AuthUser>>('/api/users/me/avatar', formData)
    return normalizeProfile(response.data, fallback)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể tải ảnh đại diện lên. Vui lòng thử lại.'))
  }
}

export async function getNotificationSettings() {
  try {
    const response = await api.get<StaffNotificationSettings>('/api/users/me/notification-settings')
    return { ...defaultNotificationSettings, ...response.data }
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể tải tùy chọn thông báo. Vui lòng thử lại.'))
  }
}

export async function updateNotificationSettings(settings: StaffNotificationSettings) {
  try {
    const response = await api.put<StaffNotificationSettings>('/api/users/me/notification-settings', settings)
    return { ...defaultNotificationSettings, ...response.data }
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể lưu cài đặt. Vui lòng thử lại.'))
  }
}

export async function changePassword(payload: ChangeStaffPasswordPayload) {
  try {
    await api.put('/api/users/me/password', payload)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể cập nhật mật khẩu. Vui lòng thử lại.'))
  }
}

export async function logout() {
  await logoutSession()
}

export function loadUiPreferences(): StaffUiPreferences {
  if (typeof window === 'undefined') return defaultStaffUiPreferences

  try {
    const rawPreferences = window.localStorage.getItem(UI_PREFERENCES_KEY)
    if (!rawPreferences) return defaultStaffUiPreferences

    const preferences = JSON.parse(rawPreferences) as Partial<StaffUiPreferences>
    return {
      displayDensity: preferences.displayDensity === 'compact' ? 'compact' : 'comfortable',
      preferredView: preferences.preferredView === 'table' ? 'table' : 'card',
      reduceMotion: Boolean(preferences.reduceMotion),
    }
  } catch {
    return defaultStaffUiPreferences
  }
}

export function saveUiPreferences(preferences: StaffUiPreferences) {
  if (typeof window === 'undefined') return

  // TODO: Move staff UI preferences to a backend user-preferences API when that module exists.
  window.localStorage.setItem(UI_PREFERENCES_KEY, JSON.stringify(preferences))
  applyUiPreferences(preferences)
}

export function applyUiPreferences(preferences: StaffUiPreferences) {
  if (typeof document === 'undefined') return

  document.documentElement.classList.toggle('staff-density-compact', preferences.displayDensity === 'compact')
  document.documentElement.classList.toggle('staff-reduced-motion', preferences.reduceMotion)
}
