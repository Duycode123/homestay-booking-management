import {
  bookingRooms,
  type BookingRoom,
  type RoomAvailabilityStatus,
  type RoomCategory,
} from '@/components/booking/booking-data'

export type Room = BookingRoom
export type { RoomAvailabilityStatus, RoomCategory }

export type RoomCapacityFilter = 'all' | 'small' | 'medium' | 'large'
export type RoomPriceFilter = 'all' | 'budget' | 'standard' | 'premium'

export type RoomFilters = {
  search: string
  roomTierId: 'all' | string
  capacity: RoomCapacityFilter
  availability: 'all' | RoomAvailabilityStatus
  price: RoomPriceFilter
}

export function getRooms(): Room[] {
  return bookingRooms
}

export function filterRooms(rooms: Room[], filters: RoomFilters) {
  const query = filters.search.trim().toLowerCase()

  return rooms.filter((room) => {
    const capacity = getRoomCapacityNumber(room)
    const matchesSearch =
      !query ||
      [room.name, room.categoryLabel, room.type, room.description, room.location, ...room.equipments]
        .join(' ')
        .toLowerCase()
        .includes(query)
    const matchesRoomTier = filters.roomTierId === 'all' || String(room.roomTierId) === filters.roomTierId
    const matchesAvailability = filters.availability === 'all' || room.availabilityStatus === filters.availability
    const matchesCapacity =
      filters.capacity === 'all' ||
      (filters.capacity === 'small' && capacity <= 4) ||
      (filters.capacity === 'medium' && capacity >= 5 && capacity <= 8) ||
      (filters.capacity === 'large' && capacity >= 9)
    const matchesPrice =
      filters.price === 'all' ||
      (filters.price === 'budget' && room.pricePerHour < 250000) ||
      (filters.price === 'standard' && room.pricePerHour >= 250000 && room.pricePerHour <= 500000) ||
      (filters.price === 'premium' && room.pricePerHour > 500000)

    return matchesSearch && matchesRoomTier && matchesAvailability && matchesCapacity && matchesPrice
  })
}

export function getAvailabilityLabel(status: RoomAvailabilityStatus) {
  if (status === 'FULL_TODAY') return 'Kín lịch hôm nay'
  if (status === 'ALMOST_FULL') return 'Sắp kín lịch'
  return 'Còn trống hôm nay'
}

function getRoomCapacityNumber(room: Room) {
  const [capacity] = room.capacity.match(/\d+/) ?? ['0']
  return Number(capacity)
}
