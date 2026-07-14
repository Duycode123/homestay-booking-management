import Link from 'next/link'
import {
  PublicContentHeader,
  PublicContentPage,
  PublicContentSection,
} from '@/components/public/PublicContentPage'
import { createPublicPageMetadata } from '@/lib/seo'

export const metadata = createPublicPageMetadata({
  title: 'Chính sách hủy booking',
  description:
    'Xem điều kiện hủy booking, đổi lịch và hoàn tiền áp dụng cho các phòng đặt qua The Serene Villa.',
  path: '/cancellation-policy',
})

export default function CancellationPolicyPage() {
  return (
    <PublicContentPage>
      <PublicContentHeader
        eyebrow="Hỗ trợ"
        title="Chính sách hủy booking"
        description="Quy định hủy và hoàn tiền khi bạn không thể sử dụng phòng đã đặt."
        updatedAt="Tháng 7, 2026"
      />

      <PublicContentSection title="1. Hủy trước giờ nhận phòng">
        <p>
          Bạn có thể gửi yêu cầu hủy trực tuyến trong mục{' '}
          <Link href="/customer/bookings" className="font-semibold text-brand-orange hover:underline">
            Booking của tôi
          </Link>
          .
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Gửi yêu cầu trước ít nhất <strong className="text-on-surface">24 giờ</strong>: admin kiểm tra và phê duyệt trước khi booking được hủy.</li>
          <li>Khi được duyệt: hoàn 100% số tiền thực tế đã thu, không vượt quá tổng tiền phòng. Booking đặt cọc chỉ hoàn phần cọc đã thanh toán.</li>
          <li>Trong lúc chờ duyệt, phòng vẫn được giữ và booking vẫn còn hiệu lực. Yêu cầu bị từ chối không làm thay đổi booking.</li>
          <li>Trong vòng 24 giờ trước giờ nhận phòng: hệ thống không tiếp nhận yêu cầu tự động; vui lòng liên hệ hỗ trợ nếu có trường hợp đặc biệt.</li>
          <li>Không đến và không hủy (no-show): không hoàn tiền.</li>
        </ul>
      </PublicContentSection>

      <PublicContentSection title="2. Đổi lịch">
        <p>
          Việc đổi sang thời gian khác phụ thuộc vào tình trạng phòng còn trống. Hiện hệ thống chưa hỗ trợ tự đổi lịch; vui lòng liên hệ hỗ trợ.
        </p>
      </PublicContentSection>

      <PublicContentSection title="3. Hủy do homestay">
        <p>
          Nếu phòng bảo trì hoặc homestay phải hủy booking, chúng tôi sẽ thông báo sớm nhất có thể và hỗ trợ đổi lịch hoặc hoàn toàn bộ số tiền đã thu.
        </p>
      </PublicContentSection>

      <PublicContentSection title="4. Liên hệ hỗ trợ">
        <p>
          Với trường hợp đặc biệt như sự cố, thiên tai hoặc lỗi hệ thống, vui lòng liên hệ{' '}
          <Link href="/customer/support" className="font-semibold text-brand-orange hover:underline">
            trung tâm hỗ trợ
          </Link>{' '}
          để được xem xét.
        </p>
      </PublicContentSection>
    </PublicContentPage>
  )
}
