import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'

const siteName = 'The Serene Villa'
const socialImage = '/images/homestay-social.webp'

type PublicPageMetadataInput = {
  title: string
  description: string
  path: `/${string}`
  locale?: Locale
  image?: string
  imageAlt?: string
}

function stripLocalePrefix(path: string) {
  const unprefixed = path.replace(/^\/(?:vi|en)(?=\/|$)/, '')
  return unprefixed || '/'
}

export function createPublicPageMetadata({
  title,
  description,
  path,
  locale = path.startsWith('/en') ? 'en' : 'vi',
  image = socialImage,
  imageAlt,
}: PublicPageMetadataInput): Metadata {
  const socialTitle = `${title} | ${siteName}`
  const canonicalPath = stripLocalePrefix(path)
  const socialImageAlt = imageAlt ?? (locale === 'en'
    ? 'A refined homestay stay at The Serene Villa'
    : 'Không gian homestay sang trọng tại The Serene Villa')

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
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
          url: image,
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
      images: [image],
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
