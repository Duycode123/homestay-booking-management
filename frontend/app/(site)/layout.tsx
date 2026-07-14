import PublicSiteLayout from '@/components/layout/PublicSiteLayout'

const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'LodgingBusiness',
  name: 'The Serene Villa',
  url: siteUrl.toString(),
  description:
    'Nền tảng khám phá và đặt phòng homestay với thông tin tiện nghi, giá và lịch trống minh bạch.',
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
