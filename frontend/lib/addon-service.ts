import api from '@/lib/api'

type ApiResponse<T> = { success: boolean; message: string; data: T }

export type AddonSelection = { serviceId: number; quantity: number; note?: string }
export type AddonCatalogItem = {
  id: number
  name: string
  description: string
  imageUrl?: string | null
  price: number
  unit: string
  roomTierId?: number | null
  roomTierName?: string | null
  active: boolean
}
export type BookingAddonStatus = 'PENDING_PAYMENT' | 'REQUESTED' | 'CONFIRMED' | 'PREPARED' | 'DELIVERED' | 'CANCELLED'
export type BookingAddonItem = {
  id: number
  serviceId: number
  name: string
  unit: string
  unitPrice: number
  quantity: number
  totalAmount: number
  source: 'BOOKING' | 'DURING_STAY'
  status: BookingAddonStatus
  note?: string | null
  deliveredAt?: string | null
  createdAt?: string | null
}
export type AddonCatalogPayload = Omit<AddonCatalogItem, 'id' | 'roomTierName'>

function normalizeCatalog(item: AddonCatalogItem): AddonCatalogItem {
  return { ...item, price: Number(item.price) || 0 }
}
function normalizeBookingItem(item: BookingAddonItem): BookingAddonItem {
  return { ...item, unitPrice: Number(item.unitPrice) || 0, totalAmount: Number(item.totalAmount) || 0 }
}

export async function fetchAvailableAddons(roomId: string | number) {
  const response = await api.get<ApiResponse<AddonCatalogItem[]>>('/api/addons', { params: { roomId } })
  return (response.data.data ?? []).map(normalizeCatalog)
}
export async function fetchAdminAddons() {
  const response = await api.get<ApiResponse<AddonCatalogItem[]>>('/api/admin/addons')
  return (response.data.data ?? []).map(normalizeCatalog)
}
export async function saveAdminAddon(payload: AddonCatalogPayload, id?: number) {
  const response = id
    ? await api.put<ApiResponse<AddonCatalogItem>>(`/api/admin/addons/${id}`, payload)
    : await api.post<ApiResponse<AddonCatalogItem>>('/api/admin/addons', payload)
  return normalizeCatalog(response.data.data)
}
export async function setAdminAddonActive(id: number, active: boolean) {
  const response = await api.patch<ApiResponse<AddonCatalogItem>>(`/api/admin/addons/${id}/active`, undefined, { params: { value: active } })
  return normalizeCatalog(response.data.data)
}
export async function fetchCustomerBookingAddons(bookingId: number) {
  const response = await api.get<ApiResponse<BookingAddonItem[]>>(`/api/bookings/${bookingId}/addons`)
  return (response.data.data ?? []).map(normalizeBookingItem)
}
export async function requestDuringStayAddons(bookingId: number, selections: AddonSelection[]) {
  const response = await api.post<ApiResponse<BookingAddonItem[]>>(`/api/bookings/${bookingId}/addons`, selections)
  return (response.data.data ?? []).map(normalizeBookingItem)
}
export async function cancelDuringStayAddon(bookingId: number, itemId: number) {
  const response = await api.patch<ApiResponse<BookingAddonItem>>(`/api/bookings/${bookingId}/addons/${itemId}/cancel`)
  return normalizeBookingItem(response.data.data)
}
export async function fetchManagementBookingAddons(bookingId: number) {
  const response = await api.get<ApiResponse<BookingAddonItem[]>>(`/api/admin/bookings/${bookingId}/addons`)
  return (response.data.data ?? []).map(normalizeBookingItem)
}
export async function updateBookingAddonStatus(bookingId: number, itemId: number, status: BookingAddonStatus) {
  const response = await api.patch<ApiResponse<BookingAddonItem>>(`/api/admin/bookings/${bookingId}/addons/${itemId}/status`, { status })
  return normalizeBookingItem(response.data.data)
}
