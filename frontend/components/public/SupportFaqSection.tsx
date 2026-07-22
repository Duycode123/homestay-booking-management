'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CalendarCheck, ChevronDown, CircleHelp, CreditCard, MessageCircle, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

import { useI18n } from '@/components/i18n/LocaleProvider'

export type SupportFaq = {
  question: string
  answer: string
}

type SupportFaqSectionProps = {
  faqs: readonly SupportFaq[]
}

const supportCopy = {
  vi: {
    imageAlt: 'Không gian lưu trú tại The Serene Villa',
    sideEyebrow: 'Trung tâm hỗ trợ',
    sideTitle: 'Một câu trả lời rõ ràng cho từng bước lưu trú.',
    sideDescription: 'Tìm nhanh thông tin cần thiết trước, trong và sau kỳ nghỉ tại The Serene Villa.',
    quickTopics: [
      { icon: CalendarCheck, label: 'Đặt phòng', detail: 'Chọn phòng, ngày lưu trú và xác nhận lịch.' },
      { icon: CreditCard, label: 'Thanh toán', detail: 'Quét QR, theo dõi giao dịch và hóa đơn.' },
      { icon: ShieldCheck, label: 'Thay đổi lịch', detail: 'Gửi yêu cầu hủy hoặc hoàn tiền theo chính sách.' },
    ],
    faqEyebrow: 'Câu hỏi thường gặp',
    faqTitle: 'Bạn cần giải đáp điều gì?',
    faqDescription: 'Các câu hỏi thường gặp được tổng hợp theo hành trình đặt phòng để bạn tìm được câu trả lời nhanh và đúng ngữ cảnh.',
    helpEyebrow: 'Cần thêm trợ giúp?',
    helpTitle: 'Gửi yêu cầu, đội ngũ vận hành sẽ tiếp nhận đúng thông tin.',
    helpDescription: 'Đăng nhập để gửi sự cố hoặc yêu cầu hỗ trợ gắn với tài khoản và đơn đặt phòng của bạn.',
    cancellation: 'Chính sách hủy',
    submitRequest: 'Gửi yêu cầu hỗ trợ',
  },
  en: {
    imageAlt: 'Stay at The Serene Villa',
    sideEyebrow: 'Help centre',
    sideTitle: 'Clear answers for every step of your stay.',
    sideDescription: 'Find the information you need before, during, and after your stay at The Serene Villa.',
    quickTopics: [
      { icon: CalendarCheck, label: 'Reservations', detail: 'Choose a room, stay dates, and confirm your schedule.' },
      { icon: CreditCard, label: 'Payments', detail: 'Scan the QR code, track the transaction, and view your receipt.' },
      { icon: ShieldCheck, label: 'Schedule changes', detail: 'Request cancellation or a refund under the stay policy.' },
    ],
    faqEyebrow: 'Frequently asked questions',
    faqTitle: 'What can we help you with?',
    faqDescription: 'These answers follow the reservation journey so you can find the right information quickly and in context.',
    helpEyebrow: 'Need more help?',
    helpTitle: 'Send a request and our operations team will receive the right details.',
    helpDescription: 'Sign in to submit an incident or support request connected to your account and reservation.',
    cancellation: 'Cancellation policy',
    submitRequest: 'Send a support request',
  },
} as const

export function SupportFaqSection({ faqs }: SupportFaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const { locale, localizedHref } = useI18n()
  const copy = supportCopy[locale]

  return (
    <>
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1fr)] lg:gap-16">
          <div className="lg:sticky lg:top-28">
            <div className="relative overflow-hidden rounded-[28px] bg-secondary p-6 text-white shadow-[0_22px_60px_rgba(23,58,49,0.18)] sm:p-8">
              <Image
                src="/images/Banner.png"
                alt={copy.imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 440px"
                className="object-cover opacity-20"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary/90 to-secondary-container/80" />
              <div className="relative">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                  <CircleHelp className="h-5 w-5 text-primary-fixed" aria-hidden />
                </span>
                <p className="eyebrow mt-7 text-primary-fixed">{copy.sideEyebrow}</p>
                <h2 className="font-editorial mt-3 max-w-sm text-4xl font-semibold leading-[1.08]">{copy.sideTitle}</h2>
                <p className="mt-5 max-w-sm text-sm leading-7 text-white/75">
                  {copy.sideDescription}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {copy.quickTopics.map(({ icon: Icon, label, detail }) => (
                <div key={label} className="flex gap-3 rounded-2xl border border-outline-variant bg-white p-4 shadow-[var(--shadow-card)]">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-secondary">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-secondary">{label}</p>
                    <p className="mt-1 text-xs leading-5 text-on-surface-variant">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="eyebrow text-brand-orange">{copy.faqEyebrow}</p>
            <h2 className="font-editorial mt-3 text-4xl font-semibold leading-[1.1] text-secondary sm:text-5xl">{copy.faqTitle}</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-on-surface-variant sm:text-base">
              {copy.faqDescription}
            </p>

            <div className="mt-8 border-y border-outline-variant">
              {faqs.map((faq, index) => {
                const isOpen = openIndex === index
                const contentId = `support-faq-${index}`

                return (
                  <article key={faq.question} className="border-b border-outline-variant last:border-b-0">
                    <button
                      type="button"
                      className="flex w-full items-center gap-4 py-5 text-left transition-colors duration-200 hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-4"
                      onClick={() => setOpenIndex((current) => (current === index ? null : index))}
                      aria-expanded={isOpen}
                      aria-controls={contentId}
                    >
                      <span className="font-editorial text-xl text-brand-orange/80">{String(index + 1).padStart(2, '0')}</span>
                      <span className="flex-1 text-base font-bold leading-6 text-secondary sm:text-lg">{faq.question}</span>
                      <ChevronDown className={`h-5 w-5 shrink-0 text-secondary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
                    </button>
                    <div id={contentId} className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr] pb-5 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                      <p className="overflow-hidden pl-10 pr-9 text-sm leading-7 text-on-surface-variant">{faq.answer}</p>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-outline-variant bg-white">
        <div className="mx-auto grid max-w-6xl gap-7 px-5 py-10 sm:px-8 sm:py-14 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-fixed text-secondary">
              <MessageCircle className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="eyebrow text-brand-orange">{copy.helpEyebrow}</p>
              <h2 className="font-editorial mt-2 text-3xl font-semibold text-secondary">{copy.helpTitle}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-on-surface-variant">
                {copy.helpDescription}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link href={localizedHref('/cancellation-policy')} className="inline-flex min-h-11 items-center justify-center rounded-full border border-secondary/25 px-5 text-sm font-bold text-secondary transition-colors hover:border-brand-orange hover:text-brand-orange focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-orange/20">{copy.cancellation}</Link>
            <Link href={localizedHref('/customer/report-issue')} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-secondary px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(23,58,49,0.16)] transition duration-200 hover:-translate-y-0.5 hover:bg-secondary-container focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-orange/25">
              {copy.submitRequest}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
