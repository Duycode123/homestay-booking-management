'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { consumeForceHomepageTop } from '@/lib/navigation/scroll-restoration'
import {
  getActiveHomeSectionFromScroll,
  readHomepageHashSection,
  scrollToHomeSection,
  type HomepageAnchorSectionId,
} from '@/lib/site-nav'

export function useHomepageActiveSection() {
  const pathname = usePathname()
  const [activeSection, setActiveSection] = useState<HomepageAnchorSectionId | null>(null)

  useEffect(() => {
    if (pathname !== '/') {
      setActiveSection(null)
      return
    }

    let frameId = 0

    const syncActiveSection = () => {
      setActiveSection(getActiveHomeSectionFromScroll())
    }

    const onScroll = () => {
      window.cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(syncActiveSection)
    }

    const onHashChange = () => {
      const hashSection = readHomepageHashSection()
      if (hashSection) {
        scrollToHomeSection(hashSection)
      }
      syncActiveSection()
    }

    // Logo click asks for homepage top — never re-apply leftover #equipment / #process.
    if (consumeForceHomepageTop()) {
      if (window.location.hash) {
        window.history.replaceState(window.history.state, '', '/')
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      setActiveSection(null)
    } else {
      const hashSection = readHomepageHashSection()
      if (hashSection) {
        window.requestAnimationFrame(() => {
          if (!readHomepageHashSection()) {
            syncActiveSection()
            return
          }
          scrollToHomeSection(hashSection, 'instant')
          syncActiveSection()
        })
      } else {
        syncActiveSection()
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('hashchange', onHashChange)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [pathname])

  return activeSection
}
