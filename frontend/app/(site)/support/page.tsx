import { SupportFaqSection } from '@/components/public/SupportFaqSection'
import { createPublicPageMetadata } from '@/lib/seo'

export const metadata = createPublicPageMetadata({
  title: 'Trung tâm hỗ trợ',
  description: 'Giải đáp về đặt phòng, thanh toán, thay đổi lịch và hỗ trợ trong thời gian lưu trú tại The Serene Villa.',
  path: '/support',
})

const faqs = [
  {
    question: 'Làm thế nào để đặt phòng?',
    answer: 'Chọn phòng còn trống, nhập ngày nhận và trả phòng, sau đó xác nhận thông tin lưu trú. Khi tạo mã QR, phòng được giữ trong tối đa 5 phút để bạn hoàn tất thanh toán.',
  },
  {
    question: 'Tôi có thể thanh toán bằng những hình thức nào?',
    answer: 'Bạn có thể thanh toán trực tuyến bằng VietQR/SePay cho toàn bộ hoặc tiền cọc theo tùy chọn của booking. Phần còn lại, nếu có, được nhân viên kết toán khi checkout.',
  },
  {
    question: 'Làm sao biết thanh toán đã thành công?',
    answer: 'Hệ thống tự đối soát giao dịch sau khi ngân hàng xác nhận. Bạn sẽ thấy trang thanh toán thành công, nhận thông báo và có thể kiểm tra lại trong Lịch sử đặt phòng.',
  },
  {
    question: 'Tôi có thể thay đổi hoặc hủy lịch không?',
    answer: 'Bạn có thể gửi yêu cầu hủy từ lịch sử đặt phòng. Điều kiện duyệt và hoàn tiền được áp dụng theo thời điểm hủy cùng chính sách lưu trú của The Serene Villa.',
  },
  {
    question: 'Tôi cần hỗ trợ trong thời gian lưu trú thì làm gì?',
    answer: 'Đăng nhập và gửi báo cáo sự cố kèm phòng, thời điểm và mô tả. Yêu cầu sẽ được chuyển tới đội ngũ vận hành để xử lý nhanh hơn.',
  },
  {
    question: 'Tôi quên mật khẩu hoặc không xác thực được email?',
    answer: 'Bạn có thể dùng chức năng Quên mật khẩu để nhận liên kết đặt lại qua email. Nếu liên kết hết hạn hoặc email chưa đến, hãy yêu cầu gửi lại và kiểm tra cả mục Spam.',
  },
] as const

export default function SupportPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }

  return (
    <main className="bg-brand-bgGray text-on-surface">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <section className="border-b border-outline-variant bg-secondary text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <p className="eyebrow text-primary-fixed">Trung tâm hỗ trợ</p>
          <h1 className="font-editorial mt-4 max-w-3xl text-5xl font-semibold leading-[1.03] sm:text-6xl">
            Mọi thông tin cần thiết cho một kỳ nghỉ trọn vẹn.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/70">
            Tìm câu trả lời nhanh về đặt phòng, thanh toán, thay đổi lịch và hỗ trợ vận hành trong thời gian lưu trú.
          </p>
        </div>
      </section>

      <SupportFaqSection faqs={faqs} />
    </main>
  )
}
