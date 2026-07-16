'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AccountMenu from '@/components/layout/AccountMenu'
import FavoriteRoomsMenu from '@/components/layout/FavoriteRoomsMenu'
import { useAuth } from '@/contexts/AuthContext'
import { useHomepageActiveSection } from '@/hooks/useHomepageActiveSection'
import {
  clearForceHomepageTop,
  markForceHomepageTop,
} from '@/lib/navigation/scroll-restoration'
import { isPublicNavItemActive, publicNavItems, scrollToHomeSection, scrollToPageTop, shouldScrollToTop, getHomeSectionIdFromHref, isHomepageAnchorHref, goToHomepageTop } from '@/lib/site-nav'

function BrandMark({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="m3.5 11 8.5-7 8.5 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 9.6V20h13V9.6M9 20v-6.5h6V20" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.2 6.6c.8-1.6 2-2.4 3.6-2.5-.1 1.8-1.1 3-3 3.6" strokeLinecap="round" />
    </svg>
  )
}

export default function HomestayHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const activeHomeSection = useHomepageActiveSection()
  const hotlineNumber = process.env.NEXT_PUBLIC_HOTLINE_NUMBER?.trim() ?? ''
  const hotlineHref = hotlineNumber ? `tel:${hotlineNumber.replace(/[^+\d]/g, '')}` : '/support'

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const navLinkClassName = (isActive: boolean) =>
    [
      'relative inline-flex items-center gap-1.5 px-0.5 py-2 font-display text-[13px] font-semibold whitespace-nowrap transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-brand-orange after:transition-transform 2xl:text-sm',
      isActive
        ? 'text-secondary after:scale-x-100'
        : 'text-on-surface-variant after:scale-x-0 hover:text-secondary hover:after:scale-x-100',
    ].join(' ')

  const mobileNavLinkClassName = (isActive: boolean) =>
    [
      'flex items-center justify-between border-b border-outline-variant py-4 font-display text-sm font-semibold',
      isActive ? 'text-secondary' : 'text-on-surface-variant',
    ].join(' ')

  const handleBookClick = () => {
    setMenuOpen(false)
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
      <header className="fixed inset-x-0 top-0 z-50 border-b border-outline-variant/80 bg-[#FBF9F5]/92 shadow-[0_8px_32px_rgba(23,58,49,0.06)] backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-orange/70 to-transparent" aria-hidden />
        <div className="mx-auto flex h-20 max-w-[1400px] items-center gap-4 px-5 sm:px-8 xl:px-6 2xl:gap-5 2xl:px-8">
          <Link
            href="/"
            onClick={handleLogoClick}
            className="group flex shrink-0 items-center gap-3"
            aria-label="Trang chủ The Serene Villa"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-orange/45 bg-secondary text-primary-fixed shadow-[0_10px_28px_rgba(23,58,49,0.16)] transition-transform group-hover:-translate-y-0.5">
              <BrandMark />
            </span>
            <span>
              <span className="font-editorial block text-[1.28rem] font-semibold leading-none tracking-[-0.02em] text-secondary">
                The Serene Villa
              </span>
              <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                Stay in serenity
              </span>
            </span>
          </Link>

          <nav className="mx-auto hidden items-center gap-5 xl:flex 2xl:gap-7" aria-label="Điều hướng chính">
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
                  {item.href === '/' && (
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                      <path d="m4 10.5 8-6.5 8 6.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M6.5 9.5V20h11V9.5M10 20v-6h4v6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="hidden min-h-[44px] shrink-0 items-center justify-end gap-3 xl:flex">
            <Link
              href={hotlineHref}
              className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-brand-orange/40 bg-white text-secondary shadow-[0_10px_26px_rgba(23,58,49,0.09)] transition hover:-translate-y-0.5 hover:border-brand-orange hover:bg-[#f7efe4]"
              aria-label={hotlineNumber ? `Gọi hotline ${hotlineNumber}` : 'Mở trung tâm hotline và hỗ trợ'}
              title={hotlineNumber ? `Hotline ${hotlineNumber}` : 'Hotline & hỗ trợ'}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M8.1 3.8 5.8 5.2c-1 .6-1.4 1.8-1 2.9 2 5.2 5.9 9.1 11.1 11.1 1.1.4 2.3 0 2.9-1l1.4-2.3-4.5-2-1.2 1.5c-2.7-1.3-4.6-3.2-5.9-5.9l1.5-1.2-2-4.5Z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14.5 5.2a5 5 0 0 1 4.3 4.3M14.8 2a8 8 0 0 1 7.2 7.2" strokeLinecap="round" />
              </svg>
              <span className="pointer-events-none absolute right-0 top-full mt-2 hidden whitespace-nowrap rounded-lg bg-secondary px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg group-hover:block">
                {hotlineNumber || 'Hotline & hỗ trợ'}
              </span>
            </Link>
            {isAuthenticated && user ? (
              <>
                <FavoriteRoomsMenu />
                <AccountMenu />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-2 font-display text-sm font-semibold text-on-surface-variant transition-colors hover:text-secondary"
                >
                  Đăng nhập
                </Link>
                <button
                  type="button"
                  onClick={handleBookClick}
                  className="rounded-full bg-secondary px-5 py-2.5 font-display text-sm font-semibold text-white shadow-[0_12px_30px_rgba(23,58,49,0.17)] transition-all hover:-translate-y-0.5 hover:bg-secondary-container active:translate-y-0"
                >
                  Tìm phòng
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="ml-auto flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant bg-white text-secondary shadow-sm xl:hidden"
            aria-expanded={menuOpen}
            aria-controls="homestay-mobile-menu"
            aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
          >
            <span className="sr-only">{menuOpen ? 'Đóng menu' : 'Mở menu'}</span>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              {menuOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div
            id="homestay-mobile-menu"
            className="border-t border-outline-variant bg-[#FBF9F5]/98 px-5 pb-6 shadow-[0_24px_44px_rgba(23,58,49,0.12)] backdrop-blur-xl xl:hidden"
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
                    <span className="inline-flex items-center gap-2.5">
                      {item.href === '/' && (
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                          <path d="m4 10.5 8-6.5 8 6.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M6.5 9.5V20h11V9.5M10 20v-6h4v6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      {item.label}
                    </span>
                    <span aria-hidden>↗</span>
                  </Link>
                )
              })}
            </nav>
            <Link
              href={hotlineHref}
              onClick={() => setMenuOpen(false)}
              className="mt-2 flex items-center justify-between rounded-2xl border border-brand-orange/35 bg-white px-4 py-3 text-sm font-semibold text-secondary shadow-sm"
            >
              <span className="inline-flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f3e6d5] text-secondary">
                  <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M8.1 3.8 5.8 5.2c-1 .6-1.4 1.8-1 2.9 2 5.2 5.9 9.1 11.1 11.1 1.1.4 2.3 0 2.9-1l1.4-2.3-4.5-2-1.2 1.5c-2.7-1.3-4.6-3.2-5.9-5.9l1.5-1.2-2-4.5Z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
                <span><span className="block">Hotline hỗ trợ</span><span className="block text-xs font-normal text-on-surface-variant">{hotlineNumber || 'Trung tâm hỗ trợ khách hàng'}</span></span>
              </span>
              <span aria-hidden>→</span>
            </Link>
            {isAuthenticated && user ? (
              <div className="mt-4 flex items-center justify-end gap-3">
                <FavoriteRoomsMenu onNavigate={() => setMenuOpen(false)} />
                <AccountMenu align="full" onNavigate={() => setMenuOpen(false)} />
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-full border border-outline px-4 py-3 text-center font-display text-sm font-semibold text-secondary"
                >
                  Đăng nhập
                </Link>
                <button
                  type="button"
                  onClick={handleBookClick}
                  className="rounded-full bg-secondary px-4 py-3 font-display text-sm font-semibold text-white"
                >
                  Tìm phòng
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
