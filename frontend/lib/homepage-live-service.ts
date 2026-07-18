import api from '@/lib/api'
import { fetchAvailableSlots, fetchRooms } from '@/lib/booking/bookingApi'
import type { HomestayRoom, TimeSlot } from '@/lib/booking/types'

export type AvailabilityTone = 'success' | 'warning' | 'muted'

export type AvailabilityStatus = {
  status: 'OPEN' | 'LOW_AVAILABILITY' | 'FULLY_BOOKED' | 'CLOSING_SOON' | 'CLOSED'
  label: string
  count: number
  tone: AvailabilityTone
}

export type RecentActivity = {
  id: string
  customerName: string
  roomName: string
  action: 'BOOKED' | 'PAID' | 'CHECKED_IN' | 'CANCELLED'
  createdAt: string
}

type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

type HomestayBusinessHours = {
  openTime: string
  closeTime: string
}

const businessHours: HomestayBusinessHours = {
  openTime: '08:00',
  closeTime: '24:00',
}

const publicActivityActions = new Set<RecentActivity['action']>(['BOOKED', 'PAID', 'CHECKED_IN'])

function getTodayKey(now = new Date()) {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function timeToMinutes(value: string) {
  const [hourValue, minuteValue] = value.split(':').map(Number)
  const hour = Number.isFinite(hourValue) ? hourValue : 0
  const minute = Number.isFinite(minuteValue) ? minuteValue : 0

  return hour * 60 + minute
}

function getMinutesNow(now = new Date()) {
  return now.getHours() * 60 + now.getMinutes()
}

export function isHomestayOpenNow(openTime: string, closeTime: string, now = new Date()) {
  const currentMinutes = getMinutesNow(now)
  return currentMinutes >= timeToMinutes(openTime) && currentMinutes < timeToMinutes(closeTime)
}

export function getMinutesUntilClose(closeTime: string, now = new Date()) {
  return Math.max(0, timeToMinutes(closeTime) - getMinutesNow(now))
}

function createAvailabilityStatus(availableCount: number, hours: HomestayBusinessHours, now = new Date()): AvailabilityStatus {
  const minutesUntilClose = getMinutesUntilClose(hours.closeTime, now)

  if (!isHomestayOpenNow(hours.openTime, hours.closeTime, now)) {
    return {
      status: 'CLOSED',
      label: `Đã đóng cửa · Mở lại lúc ${hours.openTime} ngày mai`,
      count: availableCount,
      tone: 'muted',
    }
  }

  if (minutesUntilClose <= 60) {
    return {
      status: 'CLOSING_SOON',
      label: `Sắp đóng cửa · Còn ${minutesUntilClose} phút nhận lịch hôm nay`,
      count: availableCount,
      tone: 'warning',
    }
  }

  if (availableCount === 0) {
    return {
      status: 'FULLY_BOOKED',
      label: 'Đang mở · Hôm nay đã kín lịch',
      count: 0,
      tone: 'warning',
    }
  }

  if (availableCount <= 2) {
    return {
      status: 'LOW_AVAILABILITY',
      label: `Đang mở · Chỉ còn ${availableCount} phòng trống hôm nay`,
      count: availableCount,
      tone: 'warning',
    }
  }

  return {
    status: 'OPEN',
    label: `Đang mở · ${availableCount} phòng còn trống hôm nay`,
    count: availableCount,
    tone: 'success',
  }
}

export function maskCustomerName(customerName: string) {
  const normalizedName = customerName.trim()

  if (!normalizedName) return 'Một khách hàng'
  if (normalizedName.toLowerCase().startsWith('the ')) return normalizedName

  const parts = normalizedName.split(/\s+/)
  if (parts.length === 1) return parts[0]

  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`
}

export function formatRelativeTime(createdAt: string, now = new Date()) {
  const createdDate = new Date(createdAt)
  if (Number.isNaN(createdDate.getTime())) return ''

  const diffInMinutes = Math.max(0, Math.floor((now.getTime() - createdDate.getTime()) / 60000))

  if (diffInMinutes < 1) return 'vừa xong'
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} giờ trước`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays} ngày trước`

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(createdDate)
}

export function getActivityActionLabel(action: RecentActivity['action']) {
  if (action === 'PAID') return 'đã thanh toán'
  if (action === 'CHECKED_IN') return 'đã check-in'
  return 'đã đặt'
}

export function getRecentActivities(activities: RecentActivity[]) {
  return activities
    .filter((activity) => publicActivityActions.has(activity.action))
    .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
    .slice(0, 3)
}

export function getFallbackAvailabilityStatus() {
  return {
    status: 'CLOSED',
    label: 'Đang cập nhật lịch phòng từ backend...',
    count: 0,
    tone: 'muted',
  } satisfies AvailabilityStatus
}

export function getFallbackRecentActivities() {
  return [] satisfies RecentActivity[]
}

function isRoomOperational(room: HomestayRoom) {
  return room.status !== 'MAINTENANCE'
}

function getAvailableRoomCount(slotsByRoom: TimeSlot[][]) {
  return slotsByRoom.filter((slots) => slots.some((slot) => slot.status === 'available')).length
}

export async function fetchTodayAvailability(): Promise<AvailabilityStatus> {
  const now = new Date()
  const today = getTodayKey(now)
  const rooms = (await fetchRooms()).filter(isRoomOperational)
  const slotResponses = await Promise.all(rooms.map((room) => fetchAvailableSlots(room.id, today)))
  const availableCount = getAvailableRoomCount(slotResponses)

  return createAvailabilityStatus(availableCount, businessHours, now)
}

export async function fetchRecentActivities(): Promise<RecentActivity[]> {
  const response = await api.get<ApiResponse<RecentActivity[]>>('/api/homepage/recent-activities')
  return getRecentActivities(response.data.data ?? [])
}
