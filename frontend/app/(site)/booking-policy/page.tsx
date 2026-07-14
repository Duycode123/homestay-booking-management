import Link from 'next/link'
import {
  PublicContentHeader,
  PublicContentPage,
  PublicContentSection,
} from '@/components/public/PublicContentPage'
import { createPublicPageMetadata } from '@/lib/seo'

export const metadata = createPublicPageMetadata({
  title: 'Chính sách đặt phòng',
  description:
    'Hướng dẫn chọn phòng, xác nhận lịch, thanh toán và sử dụng phòng khi đặt homestay qua The Serene Villa.',
  path: '/booking-policy',
})

export default function BookingPolicyPage() {
  return (
    <PublicContentPage>
      <PublicContentHeader
        eyebrow="Hỗ trợ"
        title="Chính sách đặt phòng"
        description="Hướng dẫn cách đặt phòng homestay tại The Serene Villa — từ chọn phòng đến xác nhận lịch."
        updatedAt="Tháng 7, 2026"
      />

      <PublicContentSection title="1. Cách đặt phòng">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Chọn phòng trong mục Phòng homestay hoặc từ trang chủ</li>
          <li>Chọn ngày, khung giờ và số giờ sử dụng</li>
          <li>Xác nhận thông tin và hoàn tất thanh toán (nếu áp dụng)</li>
          <li>Nhận xác nhận đặt phòng trong lịch sử đặt của bạn</li>
        </ol>
      </PublicContentSection>

      <PublicContentSection title="2. Xác nhận đặt phòng">
        <p>
          Đặt phòng được coi là thành công khi hệ thống ghi nhận trạng thái đã xác nhận hoặc đã thanh toán (tùy phương
          thức). Vui lòng kiểm tra mục{' '}
          <Link href="/customer/bookings" className="font-semibold text-brand-orange hover:underline">
            Lịch đặt của tôi
          </Link>{' '}
          trước khi đến homestay.
        </p>
      </PublicContentSection>

      <PublicContentSection title="3. Thanh toán">
        <p>
          Phương thức thanh toán khả dụng được hiển thị tại bước checkout. Một số phòng có thể yêu cầu đặt cọc hoặc
          thanh toán trước để giữ chỗ.
        </p>
      </PublicContentSection>

      <PublicContentSection title="4. Đến phòng đúng giờ">
        <p>
          Vui lòng có mặt đúng khung giờ đã đặt. Thời gian sử dụng được tính từ giờ bắt đầu đã đặt, không gia hạn tự
          động nếu bạn đến muộn.
        </p>
      </PublicContentSection>

      <PublicContentSection title="5. Hủy hoặc đổi lịch">
        <p>
          Quy định hủy và hoàn tiền xem tại{' '}
          <Link href="/cancellation-policy" className="font-semibold text-brand-orange hover:underline">
            Chính sách hủy lịch
          </Link>
          . Một số phòng có thể có điều kiện riêng được ghi rõ khi đặt.
        </p>
      </PublicContentSection>
    </PublicContentPage>
  )
}
