'use client'

import { useEffect, useMemo, useState } from 'react'
import { addDays, getTodayKey } from '@/components/booking/booking-time-utils'
import { fetchAvailableSlots } from '@/lib/booking/bookingApi'
import type { TimeSlot } from '@/lib/booking/types'
import type { Room } from '@/lib/public/room-filters'
import {
  applyTodayAvailability,
  isRoomTemporarilyUnavailable,
} from '@/lib/public/today-room-availability'

type RoomAvailabilityById = Record<string, {
  today: TimeSlot[] | undefined
  tomorrow: TimeSlot[] | undefined
}>

export function useTodayRoomAvailability(rooms: Room[]) {
  const [availabilityByRoomId, setAvailabilityByRoomId] = useState<RoomAvailabilityById>({})
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (rooms.length === 0) {
      setAvailabilityByRoomId({})
      setIsLoading(false)
      return
    }

    let mounted = true
    const today = getTodayKey()
    const tomorrow = addDays(today, 1)
    setIsLoading(true)

    void Promise.all(rooms.map(async (room) => {
      if (isRoomTemporarilyUnavailable(room) || !/^\d+$/.test(room.id)) {
        return [room.id, { today: [] as TimeSlot[], tomorrow: [] as TimeSlot[] }] as const
      }

      try {
        const [todaySlots, tomorrowSlots] = await Promise.all([
          fetchAvailableSlots(room.id, today),
          fetchAvailableSlots(room.id, tomorrow),
        ])
        return [room.id, { today: todaySlots, tomorrow: tomorrowSlots }] as const
      } catch {
        return [room.id, { today: undefined, tomorrow: undefined }] as const
      }
    })).then((entries) => {
      if (!mounted) return
      setAvailabilityByRoomId(Object.fromEntries(entries))
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
    () => rooms.map((room) => applyTodayAvailability(
      room,
      availabilityByRoomId[room.id]?.today,
      new Date(),
      availabilityByRoomId[room.id]?.tomorrow,
    )),
    [availabilityByRoomId, rooms],
  )

  const nearestHoldExpiry = useMemo(() => liveRooms
    .filter((room) => room.todayAvailabilityReason === 'PAYMENT_HOLD' && room.holdExpiresAt)
    .map((room) => new Date(room.holdExpiresAt as string).getTime())
    .filter(Number.isFinite)
    .sort((left, right) => left - right)[0], [liveRooms])

  useEffect(() => {
    if (nearestHoldExpiry === undefined) return

    // BookingExpiryService sweeps every 10 seconds. Refresh shortly after the
    // hold expires so the homepage releases the room without waiting 60 seconds.
    const refreshDelay = Math.max(nearestHoldExpiry - Date.now() + 1_500, 10_000)
    const timeoutId = window.setTimeout(() => {
      setRefreshKey((current) => current + 1)
    }, refreshDelay)

    return () => window.clearTimeout(timeoutId)
  }, [nearestHoldExpiry])

  return { rooms: liveRooms, isLoading }
}
