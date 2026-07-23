'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useI18n } from '@/components/i18n/LocaleProvider'
import { localeCookieName, stripLocalePrefix, withLocale, type Locale } from '@/i18n/config'

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { locale, t } = useI18n()
  const nextLocale: Locale = locale === 'vi' ? 'en' : 'vi'

  const switchLanguage = () => {
    const query = searchParams.toString()
    const target = `${withLocale(stripLocalePrefix(pathname), nextLocale)}${query ? `?${query}` : ''}`
    document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; samesite=lax`
    // Payment pages release their room hold on a genuine page exit. A locale
    // refresh is only a presentation change, so mark this document before the
    // reload and let the payment page preserve the active QR session.
    document.documentElement.dataset.sereneLocaleNavigation = 'true'
    const current = `${window.location.pathname}${window.location.search}`
    if (target === current) {
      window.location.reload()
      return
    }
    window.location.assign(target)
  }

  return (
    <button
      type="button"
      onClick={switchLanguage}
      className={
        compact
          ? 'group inline-grid h-9 grid-cols-2 items-center rounded-full border border-[#D8D0C4] bg-[#F7F3EB] p-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6F756F] transition-all duration-200 hover:border-[#31584E]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#31584E]/20 focus-visible:ring-offset-2'
          : 'group inline-grid h-10 grid-cols-2 items-center rounded-full border border-[#D8D0C4] bg-[#F7F3EB] p-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6F756F] shadow-[0_4px_14px_rgba(49,88,78,0.06)] transition-all duration-200 hover:border-[#31584E]/50 hover:shadow-[0_6px_18px_rgba(49,88,78,0.09)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#31584E]/20 focus-visible:ring-offset-2'
      }
      aria-label={
        nextLocale === 'vi'
          ? t('language.switchToVietnamese')
          : t('language.switchToEnglish')
      }
      title={t('language.current')}
    >
      <span
        className={`${compact ? 'h-7 min-w-8 px-2' : 'h-8 min-w-10 px-3'
          } inline-flex items-center justify-center rounded-full transition-all duration-200 ${locale === 'vi'
            ? 'bg-[#31584E] text-white shadow-[0_3px_10px_rgba(49,88,78,0.18)]'
            : 'text-[#31584E]/70 group-hover:text-[#31584E]'
          }`}
        aria-hidden="true"
      >
        VI
      </span>

      <span
        className={`${compact ? 'h-7 min-w-8 px-2' : 'h-8 min-w-10 px-3'
          } inline-flex items-center justify-center rounded-full transition-all duration-200 ${locale === 'en'
            ? 'bg-[#31584E] text-white shadow-[0_3px_10px_rgba(49,88,78,0.18)]'
            : 'text-[#31584E]/70 group-hover:text-[#31584E]'
          }`}
        aria-hidden="true"
      >
        EN
      </span>
    </button>
  )
}
