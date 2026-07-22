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
      className={compact
        ? 'group inline-grid h-9 grid-cols-2 items-center gap-0.5 rounded-full border border-outline-variant bg-surface-container-low p-1 text-[10px] font-bold uppercase tracking-[0.08em] text-on-surface-variant shadow-sm transition-all hover:border-brand-orange/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/35 focus-visible:ring-offset-2'
        : 'group inline-grid h-11 grid-cols-2 items-center gap-0.5 rounded-full border border-outline-variant bg-surface-container-low p-1 text-[11px] font-bold uppercase tracking-[0.08em] text-on-surface-variant shadow-[0_7px_20px_rgba(23,58,49,0.08)] transition-all hover:border-brand-orange/70 hover:shadow-[0_9px_24px_rgba(23,58,49,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/35 focus-visible:ring-offset-2'}
      aria-label={nextLocale === 'vi' ? t('language.switchToVietnamese') : t('language.switchToEnglish')}
      title={t('language.current')}
    >
      <span
        className={`${compact ? 'h-7 min-w-8' : 'h-9 min-w-9'} inline-flex items-center justify-center rounded-full transition-all ${
          locale === 'vi'
            ? 'bg-secondary text-white shadow-[0_3px_10px_rgba(23,58,49,0.22)]'
            : 'group-hover:text-secondary'
        }`}
        aria-hidden="true"
      >
        VI
      </span>
      <span
        className={`${compact ? 'h-7 min-w-8' : 'h-9 min-w-9'} inline-flex items-center justify-center rounded-full transition-all ${
          locale === 'en'
            ? 'bg-secondary text-white shadow-[0_3px_10px_rgba(23,58,49,0.22)]'
            : 'group-hover:text-secondary'
        }`}
        aria-hidden="true"
      >
        EN
      </span>
    </button>
  )
}
