'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchAvailableSlots } from '@/lib/booking/bookingApi'
import {
  applySlotSelection,
  deselectSlotClick,
  getSelectedIdsFromSlots,
  selectSlotClick,
} from '@/lib/booking/slotSelection'
import type { TimeSlot } from '@/lib/booking/types'

const POLL_INTERVAL_MS = 15_000

export function useAvailableSlots(roomId: string | null, date: string) {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState('')
  const selectedIdsRef = useRef<Set<string>>(new Set())

  const load = useCallback(async () => {
    if (!roomId || !date) {
      setSlots([])
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const data = await fetchAvailableSlots(roomId, date)
      setSlots(applySlotSelection(data, selectedIdsRef.current))
      setLastUpdated(new Date())
    } catch {
      setError('Không thể tải lịch trống. Thử lại sau.')
    } finally {
      setIsLoading(false)
    }
  }, [roomId, date])

  const selectSlot = useCallback((slotId: string) => {
    setSlots((prev) => {
      const current = getSelectedIdsFromSlots(prev)
      const selectedIds = selectSlotClick(prev, slotId, current)
      selectedIdsRef.current = selectedIds
      return applySlotSelection(prev, selectedIds)
    })
  }, [])

  const deselectSlot = useCallback((slotId: string) => {
    setSlots((prev) => {
      const current = getSelectedIdsFromSlots(prev)
      const selectedIds = deselectSlotClick(prev, slotId, current)
      selectedIdsRef.current = selectedIds
      return applySlotSelection(prev, selectedIds)
    })
  }, [])

  const clearSelection = useCallback(() => {
    selectedIdsRef.current = new Set()
    setSlots((prev) => applySlotSelection(prev, new Set()))
  }, [])

  useEffect(() => {
    selectedIdsRef.current = new Set()
    load()
  }, [load])

  useEffect(() => {
    if (!roomId || !date) return
    const timer = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [roomId, date, load])

  return {
    slots,
    isLoading,
    lastUpdated,
    error,
    refresh: load,
    selectSlot,
    deselectSlot,
    clearSelection,
  }
}
