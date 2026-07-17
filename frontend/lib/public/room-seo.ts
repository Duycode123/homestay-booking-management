import 'server-only'

export type PublicRoomSeoData = {
  id: number
  roomName: string
  description?: string | null
  imageUrl?: string | null
  imageUrls?: string[] | null
  maxPeople?: number | null
  bedroomCount?: number | null
  bedCount?: number | null
  roomType?: {
    typeName?: string | null
    pricePerHour?: number | string | null
  } | null
}

type ApiEnvelope<T> = { data?: T } | T

function getBackendApiUrl() {
  return (process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/+$/, '')
}

function readApiData<T>(payload: ApiEnvelope<T>): T | undefined {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data?: T }).data
  }
  return payload as T
}

async function fetchPublicRoomApi<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${getBackendApiUrl()}${path}`, {
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(8_000),
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return null
    return readApiData<T>(await response.json()) ?? null
  } catch {
    return null
  }
}

export function getPublicRoomForSeo(roomId: string) {
  if (!/^\d+$/.test(roomId)) return Promise.resolve(null)
  return fetchPublicRoomApi<PublicRoomSeoData>(`/api/rooms/${roomId}`)
}

export async function getPublicRoomsForSeo() {
  return (await fetchPublicRoomApi<PublicRoomSeoData[]>('/api/rooms')) ?? []
}

export function getRoomSocialImage(room: PublicRoomSeoData | null) {
  return room?.imageUrl || room?.imageUrls?.find(Boolean) || '/images/homestay-social.webp'
}

export function getRoomSeoDescription(room: PublicRoomSeoData | null) {
  if (!room) return 'Xem thông tin phòng, sức chứa, tiện nghi, giá mỗi đêm và lịch trống tại The Serene Villa.'

  const details = [
    room.maxPeople ? `tối đa ${room.maxPeople} khách` : '',
    room.bedroomCount ? `${room.bedroomCount} phòng ngủ` : '',
    room.bedCount ? `${room.bedCount} giường` : '',
  ].filter(Boolean).join(', ')
  const source = room.description?.trim() || `${room.roomName}${details ? ` dành cho ${details}` : ''} tại The Serene Villa.`

  return source.length > 155 ? `${source.slice(0, 152).trimEnd()}...` : source
}
