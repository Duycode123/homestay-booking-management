import Link from 'next/link'
import {
  PublicContentHeader,
  PublicContentPage,
  PublicContentSection,
} from '@/components/public/PublicContentPage'

export default function AboutPage() {
  return (
    <PublicContentPage>
      <PublicContentHeader
        eyebrow="Về chúng tôi"
        title="Homestay Booking — không gian lưu trú cho mọi khách lưu trú"
        description="Chúng tôi xây dựng hệ thống đặt phòng homestay trực tuyến để khách lưu trú, nghệ sĩ và người sáng tạo có thể tập luyện thuận tiện, minh bạch và chuyên nghiệp."
      />

      <PublicContentSection title="Sứ mệnh">
        <p>
          Homestay Booking kết nối người chơi nhạc với các phòng homestay được trang bị đầy đủ, giúp việc đặt lịch, thanh toán
          và sử dụng phòng diễn ra suôn sẻ trên một nền tảng duy nhất.
        </p>
        <p>
          Mục tiêu của chúng tôi là giảm thời gian chờ đợi, tăng tính minh bạch về lịch trống và nâng cao trải nghiệm
          tập luyện cho cộng đồng âm nhạc tại Việt Nam.
        </p>
      </PublicContentSection>

      <PublicContentSection title="Chúng tôi cung cấp gì">
        <ul className="list-disc space-y-2 pl-5">
          <li>Danh mục phòng homestay với thông tin rõ ràng về sức chứa, tiện nghi và giá</li>
          <li>Đặt phòng trực tuyến theo khung giờ, xác nhận nhanh và lịch sử đặt phòng</li>
          <li>Hỗ trợ khách hàng trong giờ vận hành homestay</li>
          <li>Chính sách đặt phòng, hủy lịch và bảo mật được công bố công khai</li>
        </ul>
      </PublicContentSection>

      <PublicContentSection title="Liên hệ">
        <p>
          Bạn có câu hỏi về dịch vụ hoặc muốn hợp tác? Ghé{' '}
          <Link href="/customer/support" className="font-semibold text-brand-orange hover:underline">
            trung tâm hỗ trợ
          </Link>{' '}
          hoặc khám phá{' '}
          <Link href="/rooms" className="font-semibold text-brand-orange hover:underline">
            danh sách phòng homestay
          </Link>
          .
        </p>
      </PublicContentSection>
    </PublicContentPage>
  )
}
