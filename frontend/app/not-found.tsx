import type { Metadata } from 'next'
import Link from 'next/link'
import SereneVillaWordmark from '@/components/layout/SereneVillaWordmark'
import { getRequestLocale } from '@/i18n/server'

export const metadata: Metadata = {
  title: 'Không tìm thấy trang',
  description: 'Trang bạn đang tìm không tồn tại hoặc đã được chuyển sang địa chỉ khác.',
  alternates: { canonical: null },
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
      noimageindex: true,
    },
  },
}

const copy = {
  vi: {
    eyebrow: 'Lạc đường một chút',
    title: 'Trang này không còn ở đây.',
    description:
      'Đường dẫn có thể đã thay đổi hoặc nội dung không còn khả dụng. Bạn có thể quay về trang chủ, xem các căn lưu trú hoặc liên hệ đội ngũ hỗ trợ.',
    home: 'Về trang chủ',
    rooms: 'Xem phòng homestay',
    support: 'Liên hệ hỗ trợ',
    terms: 'Điều khoản sử dụng',
    privacy: 'Chính sách bảo mật',
  },
  en: {
    eyebrow: 'A small detour',
    title: 'This page is no longer here.',
    description:
      'The address may have changed or the content is no longer available. Return home, browse available stays or contact our support team.',
    home: 'Return home',
    rooms: 'Browse homestays',
    support: 'Contact support',
    terms: 'Terms of use',
    privacy: 'Privacy policy',
  },
} as const

export default async function NotFound() {
  const locale = await getRequestLocale()
  const content = copy[locale]

  return (
    <div className="public-site-shell flex min-h-dvh flex-col overflow-hidden bg-[#F4EFE6] text-on-surface">
      <header className="relative z-10 border-b border-secondary/10 bg-[#FFFDFC]/92 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between px-5 py-4 sm:px-8">
          <Link
            href="/"
            className="inline-flex text-secondary transition-opacity hover:opacity-75"
            aria-label={content.home}
          >
            <SereneVillaWordmark compact />
          </Link>
          <span className="font-editorial text-sm text-secondary/60">404</span>
        </div>
      </header>

      <main
        id="main-content"
        className="relative isolate flex flex-1 items-center px-5 py-16 sm:px-8 sm:py-24"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_18%_18%,rgba(111,143,132,.18),transparent_28rem),radial-gradient(circle_at_82%_80%,rgba(178,132,85,.14),transparent_30rem)]"
        />
        <div
          aria-hidden="true"
          className="absolute right-[-7rem] top-1/2 -z-10 h-[26rem] w-[26rem] -translate-y-1/2 rounded-full border border-secondary/10 sm:right-[4vw]"
        />
        <div
          aria-hidden="true"
          className="absolute right-[-2rem] top-1/2 -z-10 h-[16rem] w-[16rem] -translate-y-1/2 rounded-full border border-brand-orange/20 sm:right-[10vw]"
        />

        <section className="mx-auto w-full max-w-[1180px]">
          <div className="max-w-3xl">
            <p className="eyebrow text-brand-orange">{content.eyebrow}</p>
            <p
              aria-hidden="true"
              className="font-editorial mt-5 text-[clamp(5.5rem,20vw,12rem)] font-semibold leading-[0.7] tracking-[-0.06em] text-secondary/10"
            >
              404
            </p>
            <h1 className="font-editorial -mt-2 max-w-2xl text-5xl font-semibold leading-[0.98] tracking-[-0.035em] text-secondary sm:text-7xl">
              {content.title}
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-on-surface-variant sm:text-lg">
              {content.description}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-secondary px-6 font-display text-sm font-semibold text-white shadow-[0_14px_32px_rgba(35,77,66,.2)] transition hover:-translate-y-0.5 hover:bg-secondary-container"
              >
                {content.home}
              </Link>
              <Link
                href="/rooms"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-secondary/20 bg-white/75 px-6 font-display text-sm font-semibold text-secondary transition hover:border-secondary/40 hover:bg-white"
              >
                {content.rooms}
              </Link>
              <Link
                href="/support"
                className="inline-flex min-h-12 items-center justify-center px-4 font-display text-sm font-semibold text-secondary underline decoration-brand-orange/45 underline-offset-4 transition hover:decoration-brand-orange"
              >
                {content.support}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-secondary/10 bg-[#FFFDFC]/75">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4 px-5 py-6 text-xs text-on-surface-variant sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} The Serene Villa</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-3" aria-label="Legal">
            <Link href="/terms" className="min-h-8 content-center hover:text-secondary">
              {content.terms}
            </Link>
            <Link href="/privacy" className="min-h-8 content-center hover:text-secondary">
              {content.privacy}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
