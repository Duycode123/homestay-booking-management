import type { Metadata } from 'next'
import PublicSiteLayout from '@/components/layout/PublicSiteLayout'

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
}

const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'LodgingBusiness',
      '@id': new URL('/#lodging-business', siteUrl).toString(),
      name: 'The Serene Villa',
      url: siteUrl.toString(),
      image: new URL('/images/homestay-social.webp', siteUrl).toString(),
      description:
        'Nền tảng khám phá và đặt phòng homestay với thông tin tiện nghi, giá và lịch trống minh bạch.',
      priceRange: '₫₫₫',
    },
    {
      '@type': 'WebSite',
      '@id': new URL('/#website', siteUrl).toString(),
      name: 'The Serene Villa',
      url: siteUrl.toString(),
      inLanguage: 'vi-VN',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: new URL('/rooms?search={search_term_string}', siteUrl).toString(),
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        id="lodging-business-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
      />
      <PublicSiteLayout>{children}</PublicSiteLayout>
    </>
  )
}
