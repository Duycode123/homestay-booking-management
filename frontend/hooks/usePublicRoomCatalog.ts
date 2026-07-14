'use client'

import { useEffect, useState } from 'react'
import type { BookingRoom } from '@/components/booking/booking-data'
import {
  getCachedPublicRoomCatalog,
  loadPublicRoomCatalog,
} from '@/lib/public/room-catalog-cache'

type CatalogState = {
  rooms: BookingRoom[]
  source: 'backend' | 'error'
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
}

export function usePublicRoomCatalog(): CatalogState {
  const cached = getCachedPublicRoomCatalog()

  const [rooms, setRooms] = useState<BookingRoom[]>(cached?.rooms ?? [])
  const [source, setSource] = useState<'backend' | 'error'>(cached?.source ?? 'error')
  const [isLoading, setIsLoading] = useState(!cached)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const syncCatalog = async () => {
      const hasCache = Boolean(getCachedPublicRoomCatalog())
      if (hasCache) {
        setIsRefreshing(true)
      }

      try {
        // Render cached data immediately, then always reconcile with the backend.
        // Admin edits can change the primary room image while this SPA is open.
        const catalog = await loadPublicRoomCatalog({ force: true })
        if (!mounted) return
        setRooms(catalog.rooms)
        setSource(catalog.source)
        setError(null)
      } catch {
        if (!mounted) return
        setRooms([])
        setSource('error')
        setError('Không thể kết nối backend. Vui lòng kiểm tra dịch vụ và thử lại.')
      } finally {
        if (!mounted) return
        setIsLoading(false)
        setIsRefreshing(false)
      }
    }

    void syncCatalog()

    return () => {
      mounted = false
    }
  }, [])

  return { rooms, source, isLoading, isRefreshing, error }
}
