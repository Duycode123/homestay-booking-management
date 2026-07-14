import Link from 'next/link'
import { createPublicPageMetadata } from '@/lib/seo'

export const metadata = createPublicPageMetadata({
  title: 'Trung tâm hỗ trợ',
  description: 'Giải đáp về đặt phòng, thanh toán, thay đổi lịch và hỗ trợ trong thời gian lưu trú tại The Serene Villa.',
  path: '/support',
})

const faqs = [
  {
    question: 'Làm thế nào để đặt phòng?',
    answer: 'Chọn một phòng còn trống, chọn ngày và khung giờ phù hợp, sau đó xác nhận thông tin trước khi thanh toán.',
  },
  {
    question: 'Tôi có thể thay đổi hoặc hủy lịch không?',
    answer: 'Điều kiện thay đổi và hoàn tiền phụ thuộc thời điểm hủy. Vui lòng xem chính sách hủy trước khi gửi yêu cầu.',
  },
  {
    question: 'Làm sao biết thanh toán đã thành công?',
    answer: 'Trạng thái thanh toán được cập nhật trong lịch sử đặt phòng sau khi hệ thống xác nhận giao dịch.',
  },
  {
    question: 'Tôi cần hỗ trợ trong thời gian lưu trú thì làm gì?',
    answer: 'Đăng nhập và gửi báo cáo sự cố kèm thông tin phòng để đội ngũ vận hành có thể xử lý nhanh hơn.',
  },
]

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
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
          <p className="eyebrow text-primary-fixed">Trung tâm hỗ trợ</p>
          <h1 className="font-editorial mt-5 max-w-3xl text-5xl font-semibold leading-[1.03] sm:text-6xl">
            Chúng tôi đồng hành trong từng bước lưu trú.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/70">
            Tìm câu trả lời nhanh về đặt phòng, thanh toán, thay đổi lịch và hỗ trợ vận hành.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_320px] lg:py-20">
        <div>
          <p className="eyebrow text-brand-orange">Câu hỏi thường gặp</p>
          <div className="mt-6 divide-y divide-outline-variant border-y border-outline-variant">
            {faqs.map((faq, index) => (
              <article key={faq.question} className="grid gap-3 py-6 sm:grid-cols-[40px_1fr] sm:gap-5">
                <span className="font-editorial text-2xl text-brand-orange">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h2 className="text-lg font-bold text-on-surface">{faq.question}</h2>
                  <p className="mt-2 text-sm leading-7 text-on-surface-variant">{faq.answer}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="h-fit border border-outline-variant bg-white p-7 shadow-[var(--shadow-card)] lg:sticky lg:top-28">
          <p className="eyebrow text-brand-orange">Cần thêm trợ giúp?</p>
          <h2 className="font-editorial mt-4 text-3xl font-semibold text-secondary">Gửi đúng thông tin, nhận hỗ trợ nhanh hơn.</h2>
          <p className="mt-4 text-sm leading-7 text-on-surface-variant">
            Đăng nhập để gửi yêu cầu gắn với tài khoản và đơn đặt phòng của bạn.
          </p>
          <Link href="/customer/report-issue" className="btn-warm mt-6 w-full">Gửi yêu cầu hỗ trợ</Link>
          <Link href="/cancellation-policy" className="mt-3 flex min-h-11 items-center justify-center text-sm font-semibold text-secondary hover:text-brand-orange">
            Xem chính sách hủy
          </Link>
        </aside>
      </section>
    </main>
  )
}
