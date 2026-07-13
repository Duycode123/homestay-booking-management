import type { PracticeRoom } from './types'

export const PRACTICE_ROOMS: PracticeRoom[] = [
  {
    id: 'standard-garden-101',
    name: 'Standard Garden 101',
    capacity: 2,
    pricePerHour: 350_000,
    equipment: ['Wi-Fi', 'Điều hòa', 'Smart TV', 'Máy nước nóng'],
  },
  {
    id: 'standard-garden-102',
    name: 'Standard Garden 102',
    capacity: 2,
    pricePerHour: 350_000,
    equipment: ['Wi-Fi', 'Điều hòa', 'Smart TV', 'Máy nước nóng'],
  },
  {
    id: 'deluxe-balcony-201',
    name: 'Deluxe Balcony 201',
    capacity: 3,
    pricePerHour: 550_000,
    equipment: ['Wi-Fi 5G', 'Điều hòa âm trần', 'Smart TV 50 inch', 'Máy nước nóng'],
  },
  {
    id: 'family-suite-301',
    name: 'Family Suite 301',
    capacity: 6,
    pricePerHour: 750_000,
    equipment: ['Wi-Fi gia đình', 'Hai điều hòa', 'Smart TV 55 inch', 'Bình nước nóng'],
    isVip: true,
  },
]
