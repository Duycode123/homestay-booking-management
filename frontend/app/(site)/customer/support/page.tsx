import Link from 'next/link'
import {
  CustomerCard,
  CustomerPageHeader,
  CustomerPageShell,
} from '@/components/customer/CustomerPageShell'
import { SUPPORT_EMAIL, SUPPORT_HOTLINE } from '@/lib/site-nav'

const faqs = [
  {
    question: 'Làm thế nào để đặt phòng?',
    answer: 'Chọn phòng trong Room Catalog, bấm Đặt ngay, chọn ngày giờ và xác nhận thông tin đặt phòng.',
    icon: '01',
  },
  {
    question: 'Tôi có thể hủy lịch không?',
    answer: 'Bạn có thể tự hủy trước giờ nhận phòng ít nhất 24 giờ để được hoàn 100% số tiền đã thanh toán.',
    icon: '02',
  },
  {
    question: 'Tôi thanh toán bằng cách nào?',
    answer: 'Bạn có thể thanh toán chuyển khoản, ví điện tử hoặc thanh toán tại quầy tùy lựa chọn ở bước xác nhận.',
    icon: '03',
  },
  {
    question: 'Tôi cần hỗ trợ kỹ thuật thì liên hệ ai?',
    answer: 'Liên hệ hotline hoặc email hỗ trợ để được đội ngũ homestay phản hồi nhanh nhất.',
    icon: '04',
  },
]

export default function CustomerSupportPage() {
  return (
    <CustomerPageShell>
      <CustomerPageHeader
        eyebrow="Hỗ trợ"
        title="Trợ giúp và hỗ trợ"
        description="Tìm câu trả lời nhanh hoặc liên hệ đội ngũ Homestay Booking khi bạn cần hỗ trợ."
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
          <p className="mt-2 text-sm leading-6 text-white/70">Đội ngũ homestay sẵn sàng hỗ trợ trong giờ lượt lưu trú.</p>
          <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-6 text-white/80">
            <p>
              <span className="font-semibold text-white">Hotline:</span> {SUPPORT_HOTLINE}
            </p>
            <p>
              <span className="font-semibold text-white">Email:</span>{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand-orange hover:underline">
                {SUPPORT_EMAIL}
              </a>
            </p>
          </div>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-brand-orange px-5 font-display text-sm font-semibold text-white shadow-[0_12px_28px_rgba(255,117,24,0.35)] transition hover:bg-brand-orangeHover"
          >
            Liên hệ hỗ trợ
          </a>
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
