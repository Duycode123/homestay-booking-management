import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'

const siteName = 'The Serene Villa'
const socialImage = '/images/homestay-social.webp'

type PublicPageMetadataInput = {
  title: string
  description: string
  path: `/${string}`
  locale?: Locale
}

function stripLocalePrefix(path: string) {
  const unprefixed = path.replace(/^\/(?:vi|en)(?=\/|$)/, '')
  return unprefixed || '/'
}

function localizedPath(path: string, locale: Locale) {
  const basePath = stripLocalePrefix(path)
  return `/${locale}${basePath === '/' ? '' : basePath}`
}

export function createPublicPageMetadata({
  title,
  description,
  path,
  locale = path.startsWith('/en') ? 'en' : 'vi',
}: PublicPageMetadataInput): Metadata {
  const socialTitle = `${title} | ${siteName}`
  const canonicalPath = localizedPath(path, locale)
  const socialImageAlt = locale === 'en'
    ? 'A refined homestay stay at The Serene Villa'
    : 'Không gian homestay sang trọng tại The Serene Villa'

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        'vi-VN': localizedPath(path, 'vi'),
        'en-US': localizedPath(path, 'en'),
      },
    },
    openGraph: {
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'vi_VN',
      url: canonicalPath,
      siteName,
      title: socialTitle,
      description,
      images: [
        {
          url: socialImage,
          width: 1200,
          height: 630,
          alt: socialImageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [socialImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
  }
}
