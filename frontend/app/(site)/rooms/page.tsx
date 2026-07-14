import RoomsPublicPage from '@/components/public/RoomsPublicPage'
import { createPublicPageMetadata } from '@/lib/seo'

export const metadata = createPublicPageMetadata({
  title: 'Phòng homestay',
  description:
    'Khám phá phòng homestay, so sánh tiện nghi, sức chứa, mức giá và chọn không gian phù hợp cho chuyến đi của bạn.',
  path: '/rooms',
})

export default function RoomsPage() {
  return <RoomsPublicPage />
}
