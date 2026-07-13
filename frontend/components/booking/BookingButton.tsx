'use client'

import { useState, type MouseEvent, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import BookingQuickModal from '@/components/booking/BookingQuickModal'
import { useAuth } from '@/contexts/AuthContext'
import type { BookingRoom } from '@/components/booking/booking-data'

type BookingButtonProps = {
  room: BookingRoom
  initialDate?: string
  initialStartTime?: string
  initialDuration?: number
  className?: string
  children?: ReactNode
  stopPropagation?: boolean
}

export default function BookingButton({
  room,
  initialDate,
  initialStartTime,
  initialDuration,
  className = 'rounded-lg bg-brand-orange px-4 py-2.5 font-display text-xs font-semibold text-white transition-colors hover:bg-brand-orangeHover',
  children = 'Đặt ngay',
  stopPropagation = false,
}: BookingButtonProps) {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const [open, setOpen] = useState(false)

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) {
      event.stopPropagation()
    }

    if (isLoading) return

    if (!isAuthenticated) {
      const redirectPath =
        typeof window === 'undefined'
          ? '/'
          : `${window.location.pathname}${window.location.search}`

      router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`)
      return
    }

    setOpen(true)
  }

  return (
    <>
      <button type="button" onClick={handleClick} disabled={isLoading} className={className}>
        {children}
      </button>

      <BookingQuickModal
        room={room}
        open={open}
        initialDate={initialDate}
        initialStartTime={initialStartTime}
        initialDuration={initialDuration}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
