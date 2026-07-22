export const locales = ['vi', 'en'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'vi'
export const localeCookieName = 'serene_locale'
export const localeHeaderName = 'x-serene-locale'

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'vi' || value === 'en'
}

export function getLocaleFromPathname(pathname: string): Locale | null {
  const firstSegment = pathname.split('/')[1]
  return isLocale(firstSegment) ? firstSegment : null
}

export function stripLocalePrefix(pathname: string) {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`
  const locale = getLocaleFromPathname(normalizedPath)

  if (!locale) return normalizedPath

  const pathWithoutLocale = normalizedPath.slice(locale.length + 1)
  return pathWithoutLocale || '/'
}

export function withLocale(path: string, locale: Locale) {
  void locale
  if (!path || path.startsWith('#') || /^(?:https?:|mailto:|tel:)/i.test(path)) return path

  const [pathAndQuery, hash] = path.split('#', 2)
  const [pathname, query] = pathAndQuery.split('?', 2)
  const barePath = stripLocalePrefix(pathname || '/')
  const search = query ? `?${query}` : ''

  return `${barePath}${search}${hash ? `#${hash}` : ''}`
}
