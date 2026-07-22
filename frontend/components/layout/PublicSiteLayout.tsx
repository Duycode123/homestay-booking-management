import type { ReactNode } from 'react'
import LocalizedNavigationGuard from '@/components/i18n/LocalizedNavigationGuard'
import SkipNavigationLink from '@/components/i18n/SkipNavigationLink'
import HomestayFooter from '@/components/layout/HomestayFooter'
import HomestayHeader from '@/components/layout/HomestayHeader'
import RouteScrollRestorer from '@/components/layout/RouteScrollRestorer'

export default function PublicSiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipNavigationLink />
      <LocalizedNavigationGuard />
      <RouteScrollRestorer />
      <HomestayHeader />
      <div className="flex flex-1 flex-col">{children}</div>
      <HomestayFooter />
    </div>
  )
}
