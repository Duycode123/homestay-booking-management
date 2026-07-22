import { redirect } from 'next/navigation'
import { isLocale, stripLocalePrefix } from '@/i18n/config'

type LocaleFallbackPageProps = {
  params: Promise<{
    locale: string
    slug?: string[]
  }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function LocaleFallbackPage({ params, searchParams }: LocaleFallbackPageProps) {
  const { locale, slug = [] } = await params

  if (!isLocale(locale)) {
    redirect('/')
  }

  const resolvedSearchParams = await searchParams
  const query = new URLSearchParams()

  Object.entries(resolvedSearchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item))
      return
    }

    if (typeof value === 'string') {
      query.set(key, value)
    }
  })

  const path = slug.length > 0 ? `/${slug.join('/')}` : '/'
  const normalizedPath = stripLocalePrefix(path)
  const search = query.toString()

  redirect(`${normalizedPath}${search ? `?${search}` : ''}`)
}
