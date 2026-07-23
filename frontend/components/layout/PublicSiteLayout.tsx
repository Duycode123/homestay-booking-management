import type { ReactNode } from 'react'
import { Cormorant_Garamond, Manrope } from 'next/font/google'
import LocalizedNavigationGuard from '@/components/i18n/LocalizedNavigationGuard'
import SkipNavigationLink from '@/components/i18n/SkipNavigationLink'
import HomestayFooter from '@/components/layout/HomestayFooter'
import HomestayHeader from '@/components/layout/HomestayHeader'
import RouteScrollRestorer from '@/components/layout/RouteScrollRestorer'

const publicEditorialFont = Cormorant_Garamond({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-public-editorial',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const publicSansFont = Manrope({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-public-sans',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export default function PublicSiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${publicEditorialFont.variable} ${publicSansFont.variable} public-site-shell flex min-h-dvh flex-col`}>
      <SkipNavigationLink />
      <LocalizedNavigationGuard />
      <RouteScrollRestorer />
      <HomestayHeader />
      <div className="flex flex-1 flex-col">{children}</div>
      <HomestayFooter />
    </div>
  )
}
