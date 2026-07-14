'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
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
    <footer className="relative overflow-hidden bg-secondary text-white">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-orange/75 to-transparent" aria-hidden />
      <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full border border-white/[0.05]" aria-hidden />
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full border border-brand-orange/10" aria-hidden />

      <div className="relative mx-auto max-w-[1400px] px-5 py-14 sm:px-8 sm:py-18">
        <div className="grid gap-12 border-b border-white/10 pb-12 lg:grid-cols-[1.4fr_0.7fr_0.8fr_1fr]">
          <div className="max-w-md">
            <Link href="/" onClick={handleLogoClick} className="inline-flex items-center gap-3" aria-label="Trang chủ The Serene Villa">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-orange/45 bg-white/[0.06] text-primary-fixed">
                <BrandMark />
              </span>
              <span>
                <span className="font-editorial block text-2xl font-semibold tracking-[-0.02em]">The Serene Villa</span>
                <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.24em] text-white/55">Stay in serenity</span>
              </span>
            </Link>
            <p className="mt-6 text-sm leading-7 text-white/68">
              Nền tảng đặt homestay minh bạch, thuận tiện và chỉn chu — từ lúc chọn phòng đến khi hoàn tất lưu trú.
            </p>
            <div className="mt-7 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-fixed">
              <span className="rounded-full border border-white/12 px-3 py-2">Lịch trống rõ ràng</span>
              <span className="rounded-full border border-white/12 px-3 py-2">Hỗ trợ tại chỗ</span>
            </div>
          </div>

          <FooterColumn title="Khám phá">
            {footerExploreLinks.map((item) => (
              <Link key={item.label} href={item.href} onClick={(event) => handleNavLinkClick(event, item.href)} className="footer-link">
                {item.label}
              </Link>
            ))}
          </FooterColumn>

          <FooterColumn title="Thông tin">
            {footerSupportLinks.map((item) => (
              <Link key={item.label} href={item.href} className="footer-link">
                {item.label}
              </Link>
            ))}
            {footerLegalLinks.map((item) => (
              <Link key={item.label} href={item.href} className="footer-link">
                {item.label}
              </Link>
            ))}
          </FooterColumn>

          <div className="border-l-0 border-white/10 lg:border-l lg:pl-8">
            <p className="eyebrow text-primary-fixed">Sẵn sàng lưu trú?</p>
            <h2 className="font-editorial mt-4 text-3xl font-semibold leading-tight">Tìm một căn phòng phù hợp với nhịp nghỉ của bạn.</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/rooms" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-secondary transition hover:-translate-y-0.5">
                Xem phòng trống
              </Link>
              {!isAuthenticated && (
                <Link href="/login" className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-7 text-xs text-white/48 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} The Serene Villa. All rights reserved.</p>
          <p>Đặt phòng chủ động · Trải nghiệm chỉn chu</p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="eyebrow text-primary-fixed">{title}</h2>
      <nav className="mt-5 grid gap-3.5 text-sm text-white/64">{children}</nav>
    </div>
  )
}

function BrandMark() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="m3.5 11 8.5-7 8.5 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 9.6V20h13V9.6M9 20v-6.5h6V20" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.2 6.6c.8-1.6 2-2.4 3.6-2.5-.1 1.8-1.1 3-3 3.6" strokeLinecap="round" />
    </svg>
  )
}
