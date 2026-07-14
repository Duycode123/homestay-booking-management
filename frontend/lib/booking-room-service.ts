import type { BookingRoom } from '@/components/booking/booking-data'
import {
  findBookingRoomInCatalog,
  mapBackendRoomToBookingRoom,
} from '@/lib/room-mappers'
import { fetchRoom, fetchRooms } from '@/lib/rooms-api'
import { fetchPublicRoomEquipment, type PublicRoomEquipment } from '@/lib/public-room-equipment-service'
import { fetchRoomReviewSummaries } from '@/lib/public-room-review-service'

export type PublicBookingRoomCatalog = {
  rooms: BookingRoom[]
  source: 'backend'
}

export async function fetchPublicBookingRoomCatalog(): Promise<PublicBookingRoomCatalog> {
  const [rooms, reviewSummaries, equipment] = await Promise.all([
    fetchRooms(),
    fetchRoomReviewSummaries().catch(() => new Map()),
    fetchPublicRoomEquipment().catch(() => []),
  ])
  const equipmentByRoomId = groupEquipmentByRoomId(equipment)

  return {
    rooms: rooms.map((room, index) =>
      mapBackendRoomToBookingRoom(room, index, reviewSummaries.get(String(room.id)), equipmentByRoomId.get(room.id)),
    ),
    source: 'backend',
  }
}

export async function fetchPublicBookingRooms(): Promise<BookingRoom[]> {
  const { rooms } = await fetchPublicBookingRoomCatalog()
  return rooms
}

export async function resolveBookingRoom(roomId: string | null, catalog: BookingRoom[] = []) {
  if (!roomId) return null

  const backendCatalogRoom = await resolveBackendCatalogRoom(roomId)
  if (backendCatalogRoom) return backendCatalogRoom

  const catalogRoom = findBookingRoomInCatalog(roomId, catalog)
  if (catalogRoom) return catalogRoom

  try {
    const [room, reviewSummaries] = await Promise.all([
      fetchRoom(roomId),
      fetchRoomReviewSummaries().catch(() => new Map()),
    ])

    if (!room) return null

    const equipment = await fetchPublicRoomEquipment({ roomId: room.id }).catch(() => [])

    return mapBackendRoomToBookingRoom(room, 0, reviewSummaries.get(String(room.id)), equipment)
  } catch {
    return null
  }
}

function groupEquipmentByRoomId(equipment: PublicRoomEquipment[]) {
  return equipment.reduce((groups, item) => {
    const roomEquipment = groups.get(item.roomId) ?? []
    roomEquipment.push(item)
    groups.set(item.roomId, roomEquipment)
    return groups
  }, new Map<number, PublicRoomEquipment[]>())
}

async function resolveBackendCatalogRoom(roomId: string) {
  try {
    const catalog = await fetchPublicBookingRoomCatalog()
    return findBookingRoomInCatalog(roomId, catalog.rooms)
  } catch {
    return null
  }
}
