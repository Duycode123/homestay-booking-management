'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { scrollToTopInstant } from '@/lib/navigation/scroll-restoration'

export default function RouteScrollRestorer() {
  const pathname = usePathname()
  const previousPathname = useRef(pathname)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (previousPathname.current === pathname) return

    previousPathname.current = pathname

    // Keep intentional anchor links working, but every normal route transition
    // should begin at the top rather than restoring the previous page position.
    if (window.location.hash) return

    requestAnimationFrame(() => {
      scrollToTopInstant()
    })
  }, [pathname])

  return null
}
