'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchRecentActivities,
  fetchTodayAvailability,
  getFallbackAvailabilityStatus,
  getFallbackRecentActivities,
  type AvailabilityStatus,
  type RecentActivity,
} from '@/lib/homepage-live-service'

type HomepageLiveData = {
  availabilityStatus: AvailabilityStatus
  recentActivities: RecentActivity[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const POLLING_INTERVAL_MS = 30000

export function useHomepageLiveData(): HomepageLiveData {
  const mountedRef = useRef(false)
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>(() => getFallbackAvailabilityStatus())
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(() => getFallbackRecentActivities())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)

    try {
      const [availability, activities] = await Promise.all([
        fetchTodayAvailability(),
        fetchRecentActivities(),
      ])

      if (!mountedRef.current) return

      setAvailabilityStatus(availability)
      setRecentActivities(activities)
      setError(null)
    } catch {
      if (!mountedRef.current) return

      setError('Không thể cập nhật dữ liệu realtime. Đang hiển thị dữ liệu gần nhất.')
    } finally {
      if (!mountedRef.current) return

      if (!silent) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true

    const loadMountedData = async (silent = false) => {
      if (!mountedRef.current) return
      await loadData(silent)
    }

    void loadMountedData()

    const intervalId = window.setInterval(() => {
      void loadMountedData(true)
    }, POLLING_INTERVAL_MS)

    return () => {
      mountedRef.current = false
      window.clearInterval(intervalId)
    }
  }, [loadData])

  return {
    availabilityStatus,
    recentActivities,
    isLoading,
    error,
    refresh: () => loadData(false),
  }
}
