import type { Metadata } from 'next'

const siteName = 'The Serene Villa'
const socialImage = '/images/homestay-social.webp'

type PublicPageMetadataInput = {
  title: string
  description: string
  path: `/${string}`
}

export function createPublicPageMetadata({
  title,
  description,
  path,
}: PublicPageMetadataInput): Metadata {
  const socialTitle = `${title} | ${siteName}`

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: 'website',
      locale: 'vi_VN',
      url: path,
      siteName,
      title: socialTitle,
      description,
      images: [
        {
          url: socialImage,
          width: 1200,
          height: 630,
          alt: 'Không gian homestay sang trọng tại The Serene Villa',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [socialImage],
    },
  }
}
