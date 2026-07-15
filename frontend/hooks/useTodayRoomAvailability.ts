'use client'

import { useEffect, useMemo, useState } from 'react'
import { getTodayKey } from '@/components/booking/booking-time-utils'
import { fetchAvailableSlots } from '@/lib/booking/bookingApi'
import type { TimeSlot } from '@/lib/booking/types'
import type { Room } from '@/lib/public/room-filters'
import {
  applyTodayAvailability,
  isRoomTemporarilyUnavailable,
} from '@/lib/public/today-room-availability'

type RoomSlotsById = Record<string, TimeSlot[] | undefined>

export function useTodayRoomAvailability(rooms: Room[]) {
  const [slotsByRoomId, setSlotsByRoomId] = useState<RoomSlotsById>({})
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (rooms.length === 0) {
      setSlotsByRoomId({})
      setIsLoading(false)
      return
    }

    let mounted = true
    const today = getTodayKey()
    setIsLoading(true)

    void Promise.all(rooms.map(async (room) => {
      if (isRoomTemporarilyUnavailable(room) || !/^\d+$/.test(room.id)) {
        return [room.id, [] as TimeSlot[]] as const
      }

      try {
        return [room.id, await fetchAvailableSlots(room.id, today)] as const
      } catch {
        return [room.id, undefined] as const
      }
    })).then((entries) => {
      if (!mounted) return
      setSlotsByRoomId(Object.fromEntries(entries))
      setIsLoading(false)
    })

    return () => {
      mounted = false
    }
  }, [rooms, refreshKey])

  useEffect(() => {
    const intervalId = window.setInterval(() => setRefreshKey((current) => current + 1), 60_000)
    return () => window.clearInterval(intervalId)
  }, [])

  const liveRooms = useMemo(
    () => rooms.map((room) => applyTodayAvailability(room, slotsByRoomId[room.id], new Date())),
    [rooms, slotsByRoomId],
  )

  return { rooms: liveRooms, isLoading }
}
