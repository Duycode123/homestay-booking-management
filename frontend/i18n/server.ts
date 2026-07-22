import { headers } from 'next/headers'

import { defaultLocale, isLocale, localeHeaderName, type Locale } from '@/i18n/config'

/**
 * Reads the locale resolved by the proxy without tying public pages to a
 * particular URL shape. Legacy Vietnamese routes and /vi routes both remain
 * supported while /en routes render the same page with English copy.
 */
export async function getRequestLocale(): Promise<Locale> {
  const requestHeaders = await headers()
  const locale = requestHeaders.get(localeHeaderName)

  return isLocale(locale) ? locale : defaultLocale
}
