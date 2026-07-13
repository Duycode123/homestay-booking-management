'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import AccountMenu from '@/components/layout/AccountMenu'
import { useAuth } from '@/contexts/AuthContext'
import { useHomepageActiveSection } from '@/hooks/useHomepageActiveSection'
import {
  clearForceHomepageTop,
  markForceHomepageTop,
} from '@/lib/navigation/scroll-restoration'
import { isPublicNavItemActive, publicNavItems, scrollToHomeSection, scrollToPageTop, shouldScrollToTop, getHomeSectionIdFromHref, isHomepageAnchorHref, goToHomepageTop } from '@/lib/site-nav'

function MusicLogo({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M9 18V5l10-2v13" />
      <path d="M9 9l10-2" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="16" cy="16" r="3" />
    </svg>
  )
}

export default function HomestayHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const activeHomeSection = useHomepageActiveSection()

  const navLinkClassName = (isActive: boolean) =>
    [
      'rounded-lg px-4 py-2 font-display text-sm font-medium transition-colors',
      isActive ? 'bg-white/10 text-brand-orange' : 'text-white/75 hover:bg-white/10 hover:text-white',
    ].join(' ')

  const mobileNavLinkClassName = (isActive: boolean) =>
    [
      'border-b border-white/10 py-3 font-display text-sm font-semibold',
      isActive ? 'text-brand-orange' : 'text-white/85',
    ].join(' ')

  const handleBookClick = () => {
    setMenuOpen(false)

    if (isAuthLoading) return
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    if (user?.role === 'CUSTOMER') {
      router.push('/customer/booking')
      return
    }

    router.push('/rooms')
  }

  const navItemsForPage =
    pathname === '/'
      ? publicNavItems.map((item) => (item.href.startsWith('/#') ? { ...item, href: item.href.slice(1) } : item))
      : publicNavItems

  const handleLogoClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    setMenuOpen(false)
    event.preventDefault()

    // Always land on homepage top — never keep leftover #equipment / #process hash.
    if (pathname === '/') {
      clearForceHomepageTop()
      goToHomepageTop()
      return
    }

    markForceHomepageTop()
    router.push('/')
  }

  const handleNavLinkClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setMenuOpen(false)

    if (pathname === '/' && isHomepageAnchorHref(href)) {
      event.preventDefault()
      const sectionId = getHomeSectionIdFromHref(href)
      if (sectionId) scrollToHomeSection(sectionId)
      return
    }

    if (!shouldScrollToTop(pathname, href)) return

    event.preventDefault()
    scrollToPageTop()
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-secondary/90 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center gap-4 px-5 sm:px-8">
          <Link
            href="/"
            onClick={handleLogoClick}
            className="flex shrink-0 items-center gap-3"
            aria-label="Homestay Booking homepage"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-orange text-white shadow-[0_8px_24px_rgba(255,117,24,0.45)]">
              <MusicLogo />
            </span>
            <span className="font-display text-lg font-bold text-white">Homestay Booking</span>
          </Link>

          <nav className="mx-auto hidden items-center gap-6 md:flex">
            {navItemsForPage.map((item) => {
              const isActive = isPublicNavItemActive(pathname, item.href, activeHomeSection)

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={(event) => handleNavLinkClick(event, item.href)}
                  className={navLinkClassName(isActive)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="hidden min-h-[44px] items-center justify-end gap-3 md:flex">
            {isAuthenticated && user ? (
              <AccountMenu />
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 font-display text-sm font-semibold text-white/80 transition-colors hover:text-white"
                >
                  Đăng nhập
                </Link>
                <button
                  type="button"
                  onClick={handleBookClick}
                  disabled={isAuthLoading}
                  className="rounded-lg bg-brand-orange px-5 py-2.5 font-display text-sm font-semibold text-white shadow-[0_10px_28px_rgba(255,117,24,0.28)] transition-all hover:bg-brand-orangeHover active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
                >
                  Đặt phòng
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="ml-auto rounded-lg border border-white/20 bg-white/10 px-3 py-2 font-display text-sm font-semibold text-white backdrop-blur-sm md:hidden"
            aria-expanded={menuOpen}
            aria-controls="homestay-mobile-menu"
          >
            {menuOpen ? 'Đóng' : 'Menu'}
          </button>
        </div>

        {menuOpen && (
          <div
            id="homestay-mobile-menu"
            className="border-t border-white/10 bg-secondary/95 px-5 pb-5 backdrop-blur-xl md:hidden"
          >
            <nav className="grid py-2">
              {navItemsForPage.map((item) => {
                const isActive = isPublicNavItemActive(pathname, item.href, activeHomeSection)

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={(event) => {
                      setMenuOpen(false)
                      handleNavLinkClick(event, item.href)
                    }}
                    className={mobileNavLinkClassName(isActive)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            {isAuthenticated && user ? (
              <div className="mt-4 flex justify-end">
                <AccountMenu align="full" onNavigate={() => setMenuOpen(false)} />
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-center font-display text-sm font-semibold text-white"
                >
                  Đăng nhập
                </Link>
                <button
                  type="button"
                  onClick={handleBookClick}
                  disabled={isAuthLoading}
                  className="rounded-lg bg-brand-orange px-4 py-3 font-display text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-70"
                >
                  Đặt phòng
                </button>
              </div>
            )}
          </div>
        )}
      </header>
      <div className="h-20 shrink-0" aria-hidden />
    </>
  )
}
