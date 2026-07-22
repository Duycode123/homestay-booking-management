import { SupportFaqSection } from '@/components/public/SupportFaqSection'
import { getRequestLocale } from '@/i18n/server'
import { createPublicPageMetadata } from '@/lib/seo'

const supportContent = {
  vi: {
    metadata: {
      title: 'Trung tâm hỗ trợ',
      description: 'Giải đáp về đặt phòng, thanh toán, thay đổi lịch và hỗ trợ trong thời gian lưu trú tại The Serene Villa.',
    },
    eyebrow: 'Trung tâm hỗ trợ',
    title: 'Mọi thông tin cần thiết cho một kỳ nghỉ trọn vẹn.',
    description: 'Tìm câu trả lời nhanh về đặt phòng, thanh toán, thay đổi lịch và hỗ trợ vận hành trong thời gian lưu trú.',
    faqs: [
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
    ],
  },
  en: {
    metadata: {
      title: 'Help centre',
      description: 'Answers about reservations, payments, schedule changes, and stay support at The Serene Villa.',
    },
    eyebrow: 'Help centre',
    title: 'Everything you need for a seamless stay.',
    description: 'Find quick answers about reservations, payments, schedule changes, and on-site support throughout your stay.',
    faqs: [
      {
        question: 'How do I make a reservation?',
        answer: 'Choose an available room, select your check-in and check-out dates, then confirm your stay details. Once a QR code is created, the room is held for up to five minutes while you complete payment.',
      },
      {
        question: 'Which payment methods are available?',
        answer: 'You can pay online through VietQR/SePay for the full amount or the deposit chosen for your booking. Any remaining balance is settled with the staff at checkout.',
      },
      {
        question: 'How do I know that payment was successful?',
        answer: 'The system reconciles the transaction after bank confirmation. You will see a payment-success page, receive a notification, and can review the booking in your reservation history.',
      },
      {
        question: 'Can I change or cancel my stay?',
        answer: 'You can submit a cancellation request from your reservation history. Approval and refund eligibility depend on the cancellation time and The Serene Villa stay policy.',
      },
      {
        question: 'What should I do if I need help during my stay?',
        answer: 'Sign in and submit an incident report with the room, time, and a clear description. The request is sent to the operations team for faster support.',
      },
      {
        question: 'What if I forgot my password or cannot verify my email?',
        answer: 'Use Forgot password to receive a reset link by email. If the link has expired or the email has not arrived, request another link and check your Spam folder as well.',
      },
    ],
  },
} as const

export async function generateMetadata() {
  const locale = await getRequestLocale()
  const content = supportContent[locale]

  return createPublicPageMetadata({
    ...content.metadata,
    path: locale === 'en' ? '/en/support' : '/vi/support',
  })
}

export default async function SupportPage() {
  const locale = await getRequestLocale()
  const content = supportContent[locale]
  const faqs = content.faqs

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
          <p className="eyebrow text-primary-fixed">{content.eyebrow}</p>
          <h1 className="font-editorial mt-4 max-w-3xl text-5xl font-semibold leading-[1.03] sm:text-6xl">
            {content.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/70">
            {content.description}
          </p>
        </div>
      </section>

      <SupportFaqSection faqs={faqs} />
    </main>
  )
}
