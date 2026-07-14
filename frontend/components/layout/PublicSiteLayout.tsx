import type { ReactNode } from 'react'
import HomestayFooter from '@/components/layout/HomestayFooter'
import HomestayHeader from '@/components/layout/HomestayHeader'
import RouteScrollRestorer from '@/components/layout/RouteScrollRestorer'

export default function PublicSiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main-content" className="skip-link">
        Bỏ qua điều hướng
      </a>
      <RouteScrollRestorer />
      <HomestayHeader />
      <div className="flex flex-1 flex-col">{children}</div>
      <HomestayFooter />
    </div>
  )
}
