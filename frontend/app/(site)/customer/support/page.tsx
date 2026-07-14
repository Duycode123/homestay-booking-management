import Link from 'next/link'
import {
  CustomerCard,
  CustomerPageHeader,
  CustomerPageShell,
} from '@/components/customer/CustomerPageShell'

const faqs = [
  {
    question: 'Làm thế nào để đặt phòng?',
    answer: 'Chọn phòng trong danh mục, bấm Đặt phòng, chọn ngày giờ và xác nhận thông tin trước khi thanh toán.',
    icon: '01',
  },
  {
    question: 'Tôi có thể hủy lịch không?',
    answer: 'Điều kiện hủy và hoàn tiền phụ thuộc thời điểm gửi yêu cầu. Vui lòng xem chính sách hủy trước khi liên hệ hỗ trợ.',
    icon: '02',
  },
  {
    question: 'Tôi thanh toán bằng cách nào?',
    answer: 'Hệ thống hiện hỗ trợ chuyển khoản ngân hàng. Trạng thái sẽ được cập nhật sau khi giao dịch được xác nhận.',
    icon: '03',
  },
  {
    question: 'Tôi cần hỗ trợ kỹ thuật thì liên hệ ai?',
    answer: 'Gửi báo cáo sự cố kèm mã đặt phòng để đội ngũ vận hành có đủ thông tin xử lý.',
    icon: '04',
  },
]

export default function CustomerSupportPage() {
  return (
    <CustomerPageShell>
      <CustomerPageHeader
        eyebrow="Hỗ trợ"
        title="Trợ giúp và hỗ trợ"
        description="Tìm câu trả lời nhanh hoặc liên hệ đội ngũ The Serene Villa khi bạn cần hỗ trợ."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <CustomerCard>
          <h2 className="font-display text-xl font-bold text-on-surface">Câu hỏi thường gặp</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Giải đáp nhanh các thắc mắc phổ biến khi đặt phòng.</p>
          <div className="mt-6 grid gap-4">
            {faqs.map((faq) => (
              <article
                key={faq.question}
                className="group rounded-2xl border border-outline-variant bg-surface-container-low/60 p-5 transition-all hover:border-brand-orange/30 hover:bg-white hover:shadow-[var(--shadow-card)]"
              >
                <div className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-container font-display text-xs font-bold text-brand-orange transition-colors group-hover:bg-brand-orange group-hover:text-white">
                    {faq.icon}
                  </span>
                  <div>
                    <h3 className="font-display text-base font-bold text-on-surface">{faq.question}</h3>
                    <p className="mt-2 text-sm leading-6 text-on-surface-variant">{faq.answer}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </CustomerCard>

        <CustomerCard className="bg-gradient-to-br from-secondary to-brand-greenDark text-white">
          <h2 className="font-display text-xl font-bold">Liên hệ hỗ trợ</h2>
          <p className="mt-2 text-sm leading-6 text-white/70">Gửi yêu cầu ngay trong hệ thống để đội ngũ vận hành theo dõi và phản hồi đúng đơn đặt phòng.</p>
          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5 text-sm leading-7 text-white/80">
            Đính kèm loại sự cố, mô tả cụ thể và thông tin đặt phòng nếu có. Bạn có thể theo dõi trạng thái sau khi gửi.
          </div>
          <Link
            href="/customer/report-issue"
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-white px-5 font-display text-sm font-semibold text-secondary transition hover:-translate-y-0.5"
          >
            Gửi yêu cầu hỗ trợ
          </Link>
          <Link
            href="/rooms"
            className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-white/20 font-display text-sm font-semibold text-white/90 transition hover:border-white/40 hover:bg-white/10"
          >
            Quay lại đặt phòng
          </Link>
        </CustomerCard>
      </div>
    </CustomerPageShell>
  )
}
