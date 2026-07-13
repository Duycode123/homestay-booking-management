'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { clearForceHomepageTop, markForceHomepageTop } from '@/lib/navigation/scroll-restoration'
import {
  SUPPORT_EMAIL,
  SUPPORT_HOTLINE,
  footerExploreLinks,
  footerLegalLinks,
  footerSupportLinks,
  getHomeSectionIdFromHref,
  isHomepageAnchorHref,
  goToHomepageTop,
  scrollToHomeSection,
  scrollToPageTop,
  shouldScrollToTop,
} from '@/lib/site-nav'

export default function HomestayFooter() {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  const handleLogoClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()

    if (pathname === '/') {
      clearForceHomepageTop()
      goToHomepageTop()
      return
    }

    markForceHomepageTop()
    router.push('/')
  }

  const handleNavLinkClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
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
    <footer className="relative overflow-hidden text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(165deg,#042A16_0%,#02180c_48%,#010a06_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-orange/70 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-20 h-64 w-64 rounded-full bg-brand-orange/8 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 bottom-32 h-72 w-72 rounded-full bg-brand-greenLight/15 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.25fr_0.8fr_0.9fr_1.05fr]">
          <div>
            <Link
              href="/"
              onClick={handleLogoClick}
              className="inline-flex items-center gap-3"
              aria-label="Homestay Booking homepage"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-orange text-white shadow-[0_12px_30px_rgba(255,117,24,0.35)]">
                <LogoIcon />
              </span>
              <span className="font-display text-xl font-bold text-white">Homestay Booking</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/62">
              Đặt phòng homestay trực tuyến dành cho khách lưu trú, nghệ sĩ và người sáng tạo.
            </p>
            <div className="mt-6 flex gap-3" aria-label="Homestay Booking social links">
              {['IG', 'FB', 'YT'].map((item) => (
                <span
                  key={item}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 font-display text-xs font-bold text-white/70 transition-colors hover:border-brand-orange/40 hover:text-brand-orange"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 backdrop-blur-sm">
            <h3 className="font-display text-sm font-bold uppercase tracking-[0.08em] text-brand-orange">Khám phá</h3>
            <nav className="mt-5 grid gap-3 text-sm text-white/62" aria-label="Footer khám phá">
              {footerExploreLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={(event) => handleNavLinkClick(event, item.href)}
                  className="transition-colors hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 backdrop-blur-sm">
            <h3 className="font-display text-sm font-bold uppercase tracking-[0.08em] text-brand-orange">Hỗ trợ</h3>
            <nav className="mt-5 grid gap-3 text-sm text-white/62" aria-label="Footer hỗ trợ">
              {footerSupportLinks.map((item) => (
                <Link key={item.label} href={item.href} className="transition-colors hover:text-white">
                  {item.label}
                </Link>
              ))}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="transition-colors hover:text-white">
                Liên hệ
              </a>
            </nav>
          </div>

          <div className="rounded-2xl border border-brand-orange/20 bg-gradient-to-br from-brand-orange/15 to-white/[0.04] p-5 backdrop-blur-sm">
            <h3 className="font-display text-sm font-bold uppercase tracking-[0.08em] text-white">Liên hệ</h3>
            <div className="mt-5 space-y-3 text-sm leading-6 text-white/75">
              <p>
                <span className="text-white/90">Hotline:</span> {SUPPORT_HOTLINE}
              </p>
              <p>
                <span className="text-white/90">Email:</span>{' '}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand-orange hover:underline">
                  {SUPPORT_EMAIL}
                </a>
              </p>
              <p>
                <span className="text-white/90">Địa chỉ:</span> Hà Nội, Việt Nam
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {!isAuthenticated && (
                <Link
                  href="/login"
                  className="rounded-lg border border-white/20 px-4 py-2.5 font-display text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Đăng nhập
                </Link>
              )}
              <Link
                href="/rooms"
                onClick={(event) => handleNavLinkClick(event, '/rooms')}
                className="rounded-lg bg-brand-orange px-4 py-2.5 font-display text-sm font-semibold text-white shadow-[0_10px_24px_rgba(255,117,24,0.35)] transition-colors hover:bg-brand-orangeHover"
              >
                Khám phá phòng
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-white/8 bg-black/20 px-5 py-5 sm:flex sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-white/50">© 2026 Homestay Booking. All rights reserved.</p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 sm:mt-0">
            {footerLegalLinks.map((item) => (
              <Link key={item.label} href={item.href} className="text-sm text-white/50 transition-colors hover:text-brand-orange">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

function LogoIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M9 18V5l10-2v13" />
      <path d="M9 9l10-2" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="16" cy="16" r="3" />
    </svg>
  )
}
