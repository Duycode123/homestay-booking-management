'use client'

import type { MouseEvent, ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useI18n } from '@/components/i18n/LocaleProvider'
import SereneVillaWordmark from '@/components/layout/SereneVillaWordmark'
import { useAuth } from '@/contexts/AuthContext'
import { stripLocalePrefix } from '@/i18n/config'
import { clearForceHomepageTop, markForceHomepageTop } from '@/lib/navigation/scroll-restoration'
import {
  footerExploreLinks,
  footerLegalLinks,
  footerSupportLinks,
  getHomeSectionIdFromHref,
  goToHomepageTop,
  isHomepageAnchorHref,
  scrollToHomeSection,
  scrollToPageTop,
  shouldScrollToTop,
} from '@/lib/site-nav'

export default function HomestayFooter() {
  const pathname = usePathname()
  const publicPathname = stripLocalePrefix(pathname)
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { localizedHref, t } = useI18n()

  const handleLogoClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()

    if (publicPathname === '/') {
      clearForceHomepageTop()
      goToHomepageTop(localizedHref('/'))
      return
    }

    markForceHomepageTop()
    router.push(localizedHref('/'))
  }

  const handleNavLinkClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (publicPathname === '/' && isHomepageAnchorHref(href)) {
      event.preventDefault()
      const sectionId = getHomeSectionIdFromHref(href)
      if (sectionId) scrollToHomeSection(sectionId)
      return
    }

    if (!shouldScrollToTop(publicPathname, href)) return

    event.preventDefault()
    scrollToPageTop()
  }

  return (
    <footer className="relative overflow-hidden bg-secondary text-white">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-orange/75 to-transparent" aria-hidden />
      <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full border border-white/[0.05]" aria-hidden />
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full border border-brand-orange/10" aria-hidden />

      <div className="relative mx-auto max-w-[1400px] px-5 py-14 sm:px-8 sm:py-18">
        <div className="grid gap-12 border-b border-white/10 pb-12 lg:grid-cols-[1.4fr_0.7fr_0.8fr_1fr]">
          <div className="max-w-md">
            <Link href={localizedHref('/')} onClick={handleLogoClick} className="inline-flex text-primary-fixed transition-opacity hover:opacity-80" aria-label={`${t('nav.home')} The Serene Villa`}>
              <SereneVillaWordmark />
            </Link>
            <p className="mt-6 text-sm leading-7 text-white/68">{t('footer.description')}</p>
            <div className="mt-7 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-fixed">
              <span className="rounded-full border border-white/12 px-3 py-2">{t('footer.availability')}</span>
              <span className="rounded-full border border-white/12 px-3 py-2">{t('footer.supportOnSite')}</span>
            </div>
          </div>

          <FooterColumn title={t('footer.explore')}>
            {footerExploreLinks.map((item) => <Link key={item.href} href={localizedHref(item.href)} onClick={(event) => handleNavLinkClick(event, item.href)} className="footer-link">{t(item.translationKey ?? item.label)}</Link>)}
          </FooterColumn>

          <FooterColumn title={t('footer.information')}>
            {footerSupportLinks.map((item) => <Link key={item.href} href={localizedHref(item.href)} onClick={(event) => handleNavLinkClick(event, item.href)} className="footer-link">{t(item.translationKey ?? item.label)}</Link>)}
            {footerLegalLinks.map((item) => <Link key={item.href} href={localizedHref(item.href)} onClick={(event) => handleNavLinkClick(event, item.href)} className="footer-link">{t(item.translationKey ?? item.label)}</Link>)}
          </FooterColumn>

          <div className="border-l-0 border-white/10 lg:border-l lg:pl-8">
            <p className="eyebrow text-primary-fixed">{t('footer.ready')}</p>
            <h2 className="font-editorial mt-4 text-3xl font-semibold leading-tight">{t('footer.readyTitle')}</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={localizedHref('/rooms')} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-secondary transition hover:-translate-y-0.5">{t('footer.viewAvailableRooms')}</Link>
              {!isAuthenticated && <Link href={localizedHref('/login')} className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">{t('auth.login')}</Link>}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 pt-7 text-xs text-white/48 sm:flex-row sm:items-center sm:justify-between">
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          <p>{t('footer.activeBooking')} &middot; {t('footer.qualityExperience')}</p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return <div><h2 className="eyebrow text-primary-fixed">{title}</h2><nav className="mt-5 grid gap-3.5 text-sm text-white/64">{children}</nav></div>
}
