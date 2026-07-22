'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { stripLocalePrefix, withLocale } from '@/i18n/config'
import { useI18n } from '@/components/i18n/LocaleProvider'

const EXCLUDED_PREFIXES = ['/api', '/admin', '/staff']

function shouldKeepCurrentHref(url: URL) {
  return url.pathname === window.location.pathname && Boolean(url.hash)
}

export default function LocalizedNavigationGuard() {
  const router = useRouter()
  const pathname = usePathname()
  const { locale } = useI18n()

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const target = event.target
      if (!(target instanceof Element)) return

      const anchor = target.closest('a[href]') as HTMLAnchorElement | null
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return

      const rawHref = anchor.getAttribute('href')
      if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) return

      const destination = new URL(anchor.href, window.location.origin)
      if (destination.origin !== window.location.origin || shouldKeepCurrentHref(destination)) return

      const unprefixedPath = stripLocalePrefix(destination.pathname)
      if (EXCLUDED_PREFIXES.some((prefix) => unprefixedPath === prefix || unprefixedPath.startsWith(`${prefix}/`))) return

      const localizedPath = withLocale(`${unprefixedPath}${destination.search}${destination.hash}`, locale)
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`

      if (localizedPath === currentPath) return

      event.preventDefault()
      router.push(localizedPath)
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [locale, pathname, router])

  return null
}
