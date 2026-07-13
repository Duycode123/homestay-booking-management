import Link from 'next/link'
import {
  PublicContentHeader,
  PublicContentPage,
  PublicContentSection,
} from '@/components/public/PublicContentPage'

export default function CancellationPolicyPage() {
  return (
    <PublicContentPage>
      <PublicContentHeader
        eyebrow="Hỗ trợ"
        title="Chính sách hủy lịch"
        description="Quy định hủy và hoàn tiền khi bạn không thể sử dụng phòng đã đặt."
        updatedAt="Tháng 7, 2026"
      />

      <PublicContentSection title="1. Hủy trước giờ nhận phòng">
        <p>
          Bạn có thể hủy lịch trực tuyến trong mục{' '}
          <Link href="/customer/bookings" className="font-semibold text-brand-orange hover:underline">
            Lịch đặt của tôi
          </Link>
          .
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Hủy trước <strong className="text-on-surface">2 giờ</strong> so với giờ bắt đầu: được hoàn tiền theo phương thức đã thanh toán (nếu đã thanh toán trước)</li>
          <li>Hủy trong vòng 2 giờ trước giờ nhận phòng: có thể không được hoàn tiền, tùy chính sách từng phòng</li>
          <li>Không đến và không hủy (no-show): không hoàn tiền</li>
        </ul>
      </PublicContentSection>

      <PublicContentSection title="2. Đổi lịch">
        <p>
          Đổi sang khung giờ khác phụ thuộc vào phòng còn trống. Nếu không còn chỗ, bạn có thể hủy theo quy định trên
          hoặc liên hệ hỗ trợ.
        </p>
      </PublicContentSection>

      <PublicContentSection title="3. Hủy do homestay">
        <p>
          Nếu phòng bảo trì hoặc homestay hủy lịch, Homestay Booking sẽ thông báo sớm nhất có thể và hỗ trợ đổi lịch hoặc hoàn
          tiền toàn phần.
        </p>
      </PublicContentSection>

      <PublicContentSection title="4. Liên hệ hỗ trợ">
        <p>
          Trường hợp đặc biệt (sự cố, thiên tai, lỗi hệ thống), vui lòng liên hệ{' '}
          <Link href="/customer/support" className="font-semibold text-brand-orange hover:underline">
            trung tâm hỗ trợ
          </Link>{' '}
          để được xem xét.
        </p>
      </PublicContentSection>
    </PublicContentPage>
  )
}
