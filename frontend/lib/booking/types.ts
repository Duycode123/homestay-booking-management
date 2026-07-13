export type SlotStatus = 'available' | 'booked' | 'past' | 'selected'

export type PracticeRoom = {
  id: string
  name: string
  capacity: number
  pricePerHour: number
  equipment: string[]
  isVip?: boolean
  roomTypeId?: number
  roomTypeName?: string
  roomTypeDescription?: string
  location?: string
  description?: string
  imageUrl?: string
  status?: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE'
}

export type TimeSlot = {
  id: string
  start: string
  end: string
  label: string
  status: SlotStatus
}

export type BookingDraft = {
  roomId: string
  roomName: string
  date: string
  slotIds: string[]
  start: string
  end: string
  hours: number
  pricePerHour: number
}
