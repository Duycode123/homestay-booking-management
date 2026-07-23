'use client'

import type { MouseEvent } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useI18n } from '@/components/i18n/LocaleProvider'
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher'
import AccountMenu from '@/components/layout/AccountMenu'
import FavoriteRoomsMenu from '@/components/layout/FavoriteRoomsMenu'
import NotificationMenu from '@/components/layout/NotificationMenu'
import SereneVillaWordmark from '@/components/layout/SereneVillaWordmark'
import { useAuth } from '@/contexts/AuthContext'
import { useHomepageActiveSection } from '@/hooks/useHomepageActiveSection'
import { stripLocalePrefix } from '@/i18n/config'
import { clearForceHomepageTop, markForceHomepageTop } from '@/lib/navigation/scroll-restoration'
import {
  getHomeSectionIdFromHref,
  goToHomepageTop,
  isHomepageAnchorHref,
  isPublicNavItemActive,
  publicNavItems,
  scrollToHomeSection,
  scrollToPageTop,
  shouldScrollToTop,
} from '@/lib/site-nav'

export default function HomestayHeader() {
  const pathname = usePathname()
  const publicPathname = stripLocalePrefix(pathname)
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { t, localizedHref } = useI18n()
  const [menuOpen, setMenuOpen] = useState(false)
  const activeHomeSection = useHomepageActiveSection()

  useEffect(() => setMenuOpen(false), [pathname])

  useEffect(() => {
    if (!menuOpen) return

    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [menuOpen])

  const navLinkClassName = (isActive: boolean) => [
    'relative inline-flex items-center gap-1.5 px-0.5 py-2 font-display text-[13px] font-semibold whitespace-nowrap transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-brand-orange after:transition-transform 2xl:text-sm',
    isActive ? 'text-secondary after:scale-x-100' : 'text-on-surface-variant after:scale-x-0 hover:text-secondary hover:after:scale-x-100',
  ].join(' ')

  const mobileNavLinkClassName = (isActive: boolean) => [
    'flex items-center justify-between border-b border-outline-variant py-4 font-display text-sm font-semibold',
    isActive ? 'text-secondary' : 'text-on-surface-variant',
  ].join(' ')

  const handleLogoClick = (event: MouseEvent<HTMLAnchorElement>) => {
    setMenuOpen(false)
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
    setMenuOpen(false)

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
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-outline-variant/75 bg-[#F4EFE6]/94 shadow-[0_10px_36px_rgba(35,77,66,0.055)] backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-orange/45 to-transparent" aria-hidden />
        <div className="mx-auto flex h-20 max-w-[1400px] items-center gap-3 px-4 sm:gap-4 sm:px-8 xl:px-6 2xl:gap-5 2xl:px-8">
          <Link href={localizedHref('/')} onClick={handleLogoClick} className="group min-w-0 shrink text-[#52766B] transition-opacity hover:text-[#234D42] hover:opacity-85 sm:shrink-0" aria-label={`${t('nav.home')} The Serene Villa`}>
            <SereneVillaWordmark compact className="max-w-[12.4rem] sm:max-w-none" />
          </Link>

          <nav className="mx-auto hidden items-center gap-5 xl:flex 2xl:gap-7" aria-label={t('nav.main')}>
            {publicNavItems.map((item) => {
              const isActive = isPublicNavItemActive(publicPathname, item.href, activeHomeSection)
              return (
                <Link key={item.href} href={localizedHref(item.href)} onClick={(event) => handleNavLinkClick(event, item.href)} className={navLinkClassName(isActive)} aria-current={isActive ? 'page' : undefined}>
                  {item.href === '/' && <HomeIcon />}
                  {t(item.translationKey ?? item.label)}
                </Link>
              )
            })}
          </nav>

          <div className="hidden min-h-[44px] shrink-0 items-center justify-end gap-3 xl:flex">
            <LanguageSwitcher />
            {isAuthenticated && user ? (
              <><FavoriteRoomsMenu /><NotificationMenu /><AccountMenu /></>
            ) : (
              <>
                <Link href={localizedHref('/register')} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-secondary/65 bg-transparent px-5 font-display text-sm font-semibold text-secondary transition-all hover:-translate-y-0.5 hover:border-secondary hover:bg-secondary hover:text-white active:translate-y-0">{t('auth.register')}</Link>
                <Link href={localizedHref('/login')} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-secondary/65 bg-transparent px-5 font-display text-sm font-semibold text-secondary transition-all hover:-translate-y-0.5 hover:border-secondary hover:bg-secondary hover:text-white active:translate-y-0">{t('auth.login')}</Link>
              </>
            )}
          </div>

          <button type="button" onClick={() => setMenuOpen((open) => !open)} className="ml-auto flex h-11 w-11 items-center justify-center rounded-xl border border-outline-variant bg-[#FBF8F2] text-secondary shadow-sm xl:hidden" aria-expanded={menuOpen} aria-controls="homestay-mobile-menu" aria-label={menuOpen ? t('menu.close') : t('menu.open')}>
            <span className="sr-only">{menuOpen ? t('menu.close') : t('menu.open')}</span>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>{menuOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}</svg>
          </button>
        </div>

        {menuOpen && (
          <div id="homestay-mobile-menu" className="premium-scrollbar max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain border-t border-outline-variant bg-[#F4EFE6]/98 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_24px_44px_rgba(35,77,66,0.11)] backdrop-blur-xl sm:px-5 xl:hidden">
            <div className="flex justify-end pt-3"><LanguageSwitcher compact /></div>
            <nav className="grid py-2" aria-label={t('nav.main')}>
              {publicNavItems.map((item) => {
                const isActive = isPublicNavItemActive(publicPathname, item.href, activeHomeSection)
                return (
                  <Link key={item.href} href={localizedHref(item.href)} onClick={(event) => handleNavLinkClick(event, item.href)} className={mobileNavLinkClassName(isActive)} aria-current={isActive ? 'page' : undefined}>
                    <span className="inline-flex items-center gap-2.5">{item.href === '/' && <HomeIcon className="h-4 w-4" />}{t(item.translationKey ?? item.label)}</span><span aria-hidden>→</span>
                  </Link>
                )
              })}
            </nav>
            {isAuthenticated && user ? (
              <div className="mt-4 flex items-center justify-end gap-3 pb-1"><FavoriteRoomsMenu onNavigate={() => setMenuOpen(false)} /><NotificationMenu onNavigate={() => setMenuOpen(false)} /><AccountMenu align="full" onNavigate={() => setMenuOpen(false)} /></div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link href={localizedHref('/register')} onClick={() => setMenuOpen(false)} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-secondary bg-[#FBF8F2] px-4 text-center font-display text-sm font-semibold text-secondary transition-colors hover:bg-secondary hover:text-white">{t('auth.register')}</Link>
                <Link href={localizedHref('/login')} onClick={() => setMenuOpen(false)} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-secondary bg-[#FBF8F2] px-4 text-center font-display text-sm font-semibold text-secondary transition-colors hover:bg-secondary hover:text-white">{t('auth.login')}</Link>
              </div>
            )}
          </div>
        )}
      </header>
      <div className="h-20 shrink-0" aria-hidden />
    </>
  )
}

function HomeIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="m4 10.5 8-6.5 8 6.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M6.5 9.5V20h11V9.5M10 20v-6h4v6" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
