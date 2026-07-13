import Link from 'next/link'
import {
  PublicContentHeader,
  PublicContentPage,
  PublicContentSection,
} from '@/components/public/PublicContentPage'

export default function PrivacyPage() {
  return (
    <PublicContentPage>
      <PublicContentHeader
        eyebrow="Pháp lý"
        title="Chính sách bảo mật"
        description="Homestay Booking cam kết bảo vệ thông tin cá nhân của bạn khi sử dụng dịch vụ đặt phòng homestay."
        updatedAt="Tháng 7, 2026"
      />

      <PublicContentSection title="1. Thông tin chúng tôi thu thập">
        <ul className="list-disc space-y-2 pl-5">
          <li>Thông tin tài khoản: họ tên, email, số điện thoại</li>
          <li>Thông tin đặt phòng: phòng, ngày giờ, trạng thái thanh toán</li>
          <li>Dữ liệu kỹ thuật: loại trình duyệt, thời gian truy cập (phục vụ vận hành và bảo mật)</li>
        </ul>
      </PublicContentSection>

      <PublicContentSection title="2. Mục đích sử dụng">
        <p>Thông tin được dùng để xác nhận đặt phòng, hỗ trợ khách hàng, cải thiện dịch vụ và tuân thủ nghĩa vụ pháp lý.</p>
        <p>Chúng tôi không bán thông tin cá nhân cho bên thứ ba.</p>
      </PublicContentSection>

      <PublicContentSection title="3. Lưu trữ và bảo mật">
        <p>
          Dữ liệu được lưu trên hệ thống có kiểm soát truy cập. Mật khẩu được mã hóa; phiên đăng nhập được quản lý
          bằng token bảo mật.
        </p>
      </PublicContentSection>

      <PublicContentSection title="4. Quyền của bạn">
        <p>
          Bạn có thể yêu cầu cập nhật hoặc xóa thông tin tài khoản qua{' '}
          <Link href="/customer/profile" className="font-semibold text-brand-orange hover:underline">
            trang hồ sơ
          </Link>{' '}
          hoặc liên hệ{' '}
          <Link href="/customer/support" className="font-semibold text-brand-orange hover:underline">
            hỗ trợ
          </Link>
          .
        </p>
      </PublicContentSection>

      <PublicContentSection title="5. Cookie và cài đặt trình duyệt">
        <p>
          Homestay Booking có thể lưu token đăng nhập và tùy chọn hiển thị (ví dụ trợ năng) trên trình duyệt của bạn. Bạn có
          thể xóa cookie bất cứ lúc nào trong cài đặt trình duyệt.
        </p>
      </PublicContentSection>
    </PublicContentPage>
  )
}
