import { getNightlyDisplayPrice, type BookingRoom, type RoomAvailabilityStatus } from '@/components/booking/booking-data'

export type Room = BookingRoom
export type { RoomAvailabilityStatus }

export type RoomCapacityFilter = 'all' | 'small' | 'medium' | 'large'

export type RoomFilters = {
  search: string
  roomTierId: 'all' | string
  capacity: RoomCapacityFilter
  availability: 'all' | RoomAvailabilityStatus
  minNightlyPrice: number
  maxNightlyPrice: number
}

export function filterRooms(rooms: Room[], filters: RoomFilters) {
  const query = filters.search.trim().toLowerCase()

  return rooms.filter((room) => {
    const capacity = getRoomCapacityNumber(room)
    const matchesSearch = !query || [room.name, room.categoryLabel, room.type, room.description, room.location, ...room.equipments].join(' ').toLowerCase().includes(query)
    const matchesRoomTier = filters.roomTierId === 'all' || String(room.roomTierId) === filters.roomTierId
    const matchesAvailability = filters.availability === 'all' || room.availabilityStatus === filters.availability
    const matchesCapacity = filters.capacity === 'all' || (filters.capacity === 'small' && capacity <= 4) || (filters.capacity === 'medium' && capacity >= 5 && capacity <= 8) || (filters.capacity === 'large' && capacity >= 9)
    const nightlyPrice = getNightlyDisplayPrice(room.pricePerHour)
    const matchesPrice = nightlyPrice >= filters.minNightlyPrice && nightlyPrice <= filters.maxNightlyPrice

    return matchesSearch && matchesRoomTier && matchesAvailability && matchesCapacity && matchesPrice
  })
}

export function getAvailabilityLabel(status: RoomAvailabilityStatus, room?: Room) {
  if (room?.todayAvailabilityReason === 'NEXT_DAY') return 'Còn phòng để đặt'
  if (room?.todayAvailabilityReason === 'TODAY_BOOKED') return 'Hôm nay đã có lịch'
  if (status === 'FULL_TODAY') return 'Kín lịch hôm nay'
  if (status === 'ALMOST_FULL') return 'Sắp kín lịch'
  return 'Còn trống hôm nay'
}

function getRoomCapacityNumber(room: Room) {
  const [capacity] = room.capacity.match(/\d+/) ?? ['0']
  return Number(capacity)
}
