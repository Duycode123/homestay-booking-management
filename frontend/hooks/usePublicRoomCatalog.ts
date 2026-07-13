'use client'

import { useEffect, useState } from 'react'
import type { BookingRoom } from '@/components/booking/booking-data'
import {
  getCachedPublicRoomCatalog,
  loadPublicRoomCatalog,
} from '@/lib/public/room-catalog-cache'

type CatalogState = {
  rooms: BookingRoom[]
  source: 'backend' | 'fallback'
  isLoading: boolean
  isRefreshing: boolean
}

export function usePublicRoomCatalog(): CatalogState {
  const cached = getCachedPublicRoomCatalog()

  const [rooms, setRooms] = useState<BookingRoom[]>(cached?.rooms ?? [])
  const [source, setSource] = useState<'backend' | 'fallback'>(cached?.source ?? 'backend')
  const [isLoading, setIsLoading] = useState(!cached)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    let mounted = true

    const syncCatalog = async () => {
      const hasCache = Boolean(getCachedPublicRoomCatalog())
      if (hasCache) {
        setIsRefreshing(true)
      }

      try {
        const catalog = await loadPublicRoomCatalog()
        if (!mounted) return
        setRooms(catalog.rooms)
        setSource(catalog.source)
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

  return { rooms, source, isLoading, isRefreshing }
}
