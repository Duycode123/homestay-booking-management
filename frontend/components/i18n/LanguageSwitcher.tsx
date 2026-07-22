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
        ? 'inline-flex h-9 items-center rounded-full border border-outline-variant bg-white px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-secondary transition-colors hover:border-brand-orange hover:bg-surface-container-low'
        : 'inline-flex h-10 items-center rounded-full border border-outline-variant bg-white px-3.5 text-xs font-bold uppercase tracking-[0.12em] text-secondary shadow-sm transition-colors hover:border-brand-orange hover:bg-surface-container-low'}
      aria-label={nextLocale === 'vi' ? t('language.switchToVietnamese') : t('language.switchToEnglish')}
      title={t('language.current')}
    >
      {locale === 'vi' ? 'EN' : 'VI'}
    </button>
  )
}
