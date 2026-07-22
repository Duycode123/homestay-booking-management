'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ClientLocaleTextBridge } from '@/components/i18n/ClientLocaleTextBridge'
import { defaultLocale, getLocaleFromPathname, type Locale, withLocale } from '@/i18n/config'
import { messages } from '@/i18n/messages'

type TranslationValues = Record<string, string | number>

type LocaleContextValue = {
  locale: Locale
  t: (key: string, values?: TranslationValues) => string
  localizedHref: (path: string) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

function interpolate(message: string, values?: TranslationValues) {
  if (!values) return message

  return message.replace(/{{(\w+)}}/g, (placeholder, key: string) => {
    const value = values[key]
    return value === undefined ? placeholder : String(value)
  })
}

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const pathname = usePathname()
  const [locale, setLocale] = useState<Locale>(initialLocale)

  useEffect(() => {
    setLocale(getLocaleFromPathname(pathname) ?? initialLocale)
  }, [initialLocale, pathname])

  const t = useCallback(
    (key: string, values?: TranslationValues) => interpolate(messages[locale][key] ?? messages[defaultLocale][key] ?? key, values),
    [locale],
  )

  const localizedHref = useCallback((path: string) => withLocale(path, locale), [locale])
  const value = useMemo(() => ({ locale, t, localizedHref }), [locale, localizedHref, t])

  return (
    <LocaleContext.Provider value={value}>
      <ClientLocaleTextBridge locale={locale} />
      {children}
    </LocaleContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(LocaleContext)
  if (!context) throw new Error('useI18n must be used inside LocaleProvider')
  return context
}
