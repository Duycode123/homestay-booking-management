import type { ReactNode } from 'react'
import LocalizedNavigationGuard from '@/components/i18n/LocalizedNavigationGuard'
import SkipNavigationLink from '@/components/i18n/SkipNavigationLink'
import HomestayFooter from '@/components/layout/HomestayFooter'
import HomestayHeader from '@/components/layout/HomestayHeader'
import RouteScrollRestorer from '@/components/layout/RouteScrollRestorer'
import SereneRevealObserver from '@/components/motion/SereneRevealObserver'

export default function PublicSiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="public-site-shell flex min-h-dvh flex-col">
      <SkipNavigationLink />
      <LocalizedNavigationGuard />
      <RouteScrollRestorer />
      <SereneRevealObserver />
      <HomestayHeader />
      <div className="flex flex-1 flex-col">{children}</div>
      <HomestayFooter />
    </div>
  )
}
