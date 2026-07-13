import Link from 'next/link'
import {
  PublicContentHeader,
  PublicContentPage,
  PublicContentSection,
} from '@/components/public/PublicContentPage'

export default function TermsPage() {
  return (
    <PublicContentPage>
      <PublicContentHeader
        eyebrow="Pháp lý"
        title="Điều khoản sử dụng"
        description="Điều khoản này quy định cách bạn sử dụng website và dịch vụ đặt phòng homestay của Homestay Booking."
        updatedAt="Tháng 7, 2026"
      />

      <PublicContentSection title="1. Chấp nhận điều khoản">
        <p>
          Khi truy cập Homestay Booking hoặc tạo tài khoản, bạn đồng ý tuân thủ các điều khoản này. Nếu không đồng ý, vui
          lòng ngừng sử dụng dịch vụ.
        </p>
      </PublicContentSection>

      <PublicContentSection title="2. Tài khoản người dùng">
        <p>Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động phát sinh từ tài khoản của mình.</p>
        <p>Thông tin đăng ký phải chính xác. Homestay Booking có quyền tạm khóa tài khoản khi phát hiện hành vi gian lận.</p>
      </PublicContentSection>

      <PublicContentSection title="3. Đặt phòng và thanh toán">
        <p>
          Giá phòng, khung giờ và điều kiện thanh toán được hiển thị tại thời điểm đặt. Việc xác nhận đặt phòng phụ
          thuộc vào tình trạng phòng trống và quy trình thanh toán.
        </p>
        <p>
          Chi tiết về đặt phòng và hủy lịch xem thêm tại{' '}
          <Link href="/booking-policy" className="font-semibold text-brand-orange hover:underline">
            Chính sách đặt phòng
          </Link>{' '}
          và{' '}
          <Link href="/cancellation-policy" className="font-semibold text-brand-orange hover:underline">
            Chính sách hủy lịch
          </Link>
          .
        </p>
      </PublicContentSection>

      <PublicContentSection title="4. Quy tắc sử dụng phòng">
        <ul className="list-disc space-y-2 pl-5">
          <li>Tuân thủ giờ đã đặt; rời phòng đúng thời gian để nhường ca tiếp theo</li>
          <li>Không làm hư hỏng tiện nghi; báo ngay cho nhân viên khi phát hiện sự cố</li>
          <li>Không sử dụng phòng cho mục đích trái pháp luật hoặc gây ảnh hưởng đến người khác</li>
        </ul>
      </PublicContentSection>

      <PublicContentSection title="5. Giới hạn trách nhiệm">
        <p>
          Homestay Booking nỗ lực duy trì hệ thống ổn định nhưng không chịu trách nhiệm cho gián đoạn do sự cố kỹ thuật ngoài
          tầm kiểm soát hợp lý. Trách nhiệm bồi thường (nếu có) được xử lý theo quy định pháp luật hiện hành.
        </p>
      </PublicContentSection>
    </PublicContentPage>
  )
}
