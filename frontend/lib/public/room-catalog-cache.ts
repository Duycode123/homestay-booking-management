import type { PublicBookingRoomCatalog } from '@/lib/booking-room-service'
import { fetchPublicBookingRoomCatalog } from '@/lib/booking-room-service'

const STALE_MS = 5 * 60 * 1000

type CacheEntry = {
  catalog: PublicBookingRoomCatalog
  fetchedAt: number
}

let memoryCache: CacheEntry | null = null
let inflight: Promise<PublicBookingRoomCatalog> | null = null

export function getCachedPublicRoomCatalog() {
  return memoryCache?.catalog ?? null
}

export function isPublicRoomCatalogFresh() {
  if (!memoryCache) return false
  return Date.now() - memoryCache.fetchedAt < STALE_MS
}

export async function loadPublicRoomCatalog(options?: { force?: boolean }) {
  const force = options?.force ?? false

  if (!force && memoryCache && isPublicRoomCatalogFresh()) {
    return memoryCache.catalog
  }

  if (!force && inflight) {
    return inflight
  }

  inflight = fetchPublicBookingRoomCatalog()
    .then((catalog) => {
      memoryCache = { catalog, fetchedAt: Date.now() }
      return catalog
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}

export function invalidatePublicRoomCatalog() {
  memoryCache = null
}
