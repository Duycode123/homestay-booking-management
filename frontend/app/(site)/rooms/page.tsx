import RoomsPublicPage from '@/components/public/RoomsPublicPage'
import { getRequestLocale } from '@/i18n/server'
import { createPublicPageMetadata } from '@/lib/seo'

export async function generateMetadata() {
  const locale = await getRequestLocale()
  const isEnglish = locale === 'en'

  return createPublicPageMetadata({
    title: isEnglish ? 'Homestay rooms' : 'Phòng homestay',
    description: isEnglish
      ? 'Explore homestay rooms, compare amenities, capacity and prices, then choose the right stay for your trip.'
      : 'Khám phá phòng homestay, so sánh tiện nghi, sức chứa, mức giá và chọn không gian phù hợp cho chuyến đi của bạn.',
    path: `/${locale}/rooms`,
    locale,
  })
}

export default function RoomsPage() {
  return <RoomsPublicPage />
}
