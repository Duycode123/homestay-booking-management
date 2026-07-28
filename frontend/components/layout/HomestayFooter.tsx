'use client'

import type { MouseEvent, ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useI18n } from '@/components/i18n/LocaleProvider'
import SereneVillaWordmark from '@/components/layout/SereneVillaWordmark'
import { useAuth } from '@/contexts/AuthContext'
import { stripLocalePrefix } from '@/i18n/config'
import {
  clearForceHomepageTop,
  markForceHomepageTop,
} from '@/lib/navigation/scroll-restoration'
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
  const { locale, localizedHref, t } = useI18n()
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    let animationFrameId = 0

    const updateScrollState = () => {
      const documentHeight = document.documentElement.scrollHeight
      const viewportHeight = window.innerHeight
      const scrollableHeight = Math.max(documentHeight - viewportHeight, 1)
      const nextProgress = Math.min(
        100,
        Math.max(0, (window.scrollY / scrollableHeight) * 100),
      )

      setScrollProgress(nextProgress)
      setShowBackToTop(window.scrollY > 520 && scrollableHeight > 720)
    }

    const requestUpdate = () => {
      window.cancelAnimationFrame(animationFrameId)
      animationFrameId = window.requestAnimationFrame(updateScrollState)
    }

    updateScrollState()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      window.cancelAnimationFrame(animationFrameId)
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
    }
  }, [pathname])

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

  const handleNavLinkClick = (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
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

  const handleBackToTop = () => {
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }

  const backToTopLabel =
    locale === 'en' ? 'Back to the top of the page' : 'Quay về đầu trang'

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[2px] bg-transparent"
      >
        <div
          className="h-full origin-left bg-[linear-gradient(90deg,#b28455,#e9d1ad,#52766b)] shadow-[0_0_12px_rgba(178,132,85,.45)] transition-[width] duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <footer className="relative overflow-hidden bg-secondary text-white">
        <div
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-orange/75 to-transparent"
          aria-hidden
        />
        <div
          className="absolute -right-40 -top-40 h-96 w-96 rounded-full border border-white/[0.05]"
          aria-hidden
        />
        <div
          className="absolute -right-24 -top-24 h-64 w-64 rounded-full border border-brand-orange/10"
          aria-hidden
        />

        <div className="relative mx-auto max-w-[1400px] px-5 py-14 sm:px-8 sm:py-18">
          <div className="grid gap-12 border-b border-white/10 pb-12 lg:grid-cols-[1.4fr_0.7fr_0.8fr_1fr]">
            <div className="max-w-md">
              <Link
                href={localizedHref('/')}
                onClick={handleLogoClick}
                className="inline-flex text-primary-fixed transition-opacity hover:opacity-80"
                aria-label={`${t('nav.home')} The Serene Villa`}
              >
                <SereneVillaWordmark />
              </Link>
              <p className="mt-6 text-sm leading-7 text-white/68">
                {t('footer.description')}
              </p>
              <div className="mt-7 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-fixed">
                <span className="rounded-full border border-white/12 px-3 py-2">
                  {t('footer.availability')}
                </span>
                <span className="rounded-full border border-white/12 px-3 py-2">
                  {t('footer.supportOnSite')}
                </span>
              </div>
            </div>

            <FooterColumn title={t('footer.explore')}>
              {footerExploreLinks.map((item) => (
                <Link
                  key={item.href}
                  href={localizedHref(item.href)}
                  onClick={(event) => handleNavLinkClick(event, item.href)}
                  className="footer-link"
                >
                  {t(item.translationKey ?? item.label)}
                </Link>
              ))}
            </FooterColumn>

            <FooterColumn title={t('footer.information')}>
              {footerSupportLinks.map((item) => (
                <Link
                  key={item.href}
                  href={localizedHref(item.href)}
                  onClick={(event) => handleNavLinkClick(event, item.href)}
                  className="footer-link"
                >
                  {t(item.translationKey ?? item.label)}
                </Link>
              ))}
              {footerLegalLinks.map((item) => (
                <Link
                  key={item.href}
                  href={localizedHref(item.href)}
                  onClick={(event) => handleNavLinkClick(event, item.href)}
                  className="footer-link"
                >
                  {t(item.translationKey ?? item.label)}
                </Link>
              ))}
            </FooterColumn>

            <div className="border-l-0 border-white/10 lg:border-l lg:pl-8">
              <p className="eyebrow text-primary-fixed">{t('footer.ready')}</p>
              <h2 className="font-editorial mt-4 text-3xl font-semibold leading-tight">
                {t('footer.readyTitle')}
              </h2>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={localizedHref('/rooms')}
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-secondary transition hover:-translate-y-0.5"
                >
                  {t('footer.viewAvailableRooms')}
                </Link>
                {!isAuthenticated && (
                  <Link
                    href={localizedHref('/login')}
                    className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    {t('auth.login')}
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-7 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between">
            <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
            <p>
              {t('footer.activeBooking')} &middot;{' '}
              {t('footer.qualityExperience')}
            </p>
          </div>
        </div>
      </footer>

      <button
        type="button"
        onClick={handleBackToTop}
        aria-label={backToTopLabel}
        aria-hidden={!showBackToTop}
        tabIndex={showBackToTop ? 0 : -1}
        title={backToTopLabel}
        className={[
          'group fixed right-[6.5rem] z-[65] flex h-14 w-14 items-center justify-center rounded-full border border-white/80 bg-[#fbf8f2]/92 text-secondary shadow-[0_18px_42px_rgba(23,58,49,.2)] backdrop-blur-xl transition-[opacity,transform,box-shadow,background-color] duration-300 sm:right-[7rem]',
          'bottom-[calc(1.25rem+env(safe-area-inset-bottom))] sm:bottom-8',
          'hover:-translate-y-1 hover:bg-white hover:shadow-[0_24px_54px_rgba(23,58,49,.26)]',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-orange/25',
          showBackToTop
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-5 opacity-0',
        ].join(' ')}
      >
        <svg
          viewBox="0 0 48 48"
          className="pointer-events-none absolute inset-1 h-12 w-12 -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="rgba(35,77,66,.12)"
            strokeWidth="1.7"
          />
          <circle
            cx="24"
            cy="24"
            r="20"
            pathLength="100"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="100"
            strokeDashoffset={100 - scrollProgress}
            className="transition-[stroke-dashoffset] duration-150 ease-out"
          />
        </svg>

        <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-white shadow-[0_8px_20px_rgba(23,58,49,.18)] transition-transform duration-300 group-hover:-translate-y-0.5">
          <svg
            viewBox="0 0 24 24"
            className="h-4.5 w-4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 14 6-6 6 6" />
          </svg>
        </span>
      </button>
    </>
  )
}

function FooterColumn({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div>
      <h2 className="eyebrow text-primary-fixed">{title}</h2>
      <nav className="mt-5 grid gap-3.5 text-sm text-white/64">
        {children}
      </nav>
    </div>
  )
}
