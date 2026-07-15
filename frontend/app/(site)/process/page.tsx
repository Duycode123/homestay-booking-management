import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { createPublicPageMetadata } from '@/lib/seo'

export const metadata = createPublicPageMetadata({
  title: 'Quy trình đặt phòng và lưu trú',
  description:
    'Khám phá trọn vẹn quy trình đặt phòng, thanh toán, check-in, lưu trú và checkout tại The Serene Villa.',
  path: '/process',
})

type ProcessIconName = 'search' | 'calendar' | 'payment' | 'prepare' | 'key' | 'checkout'

const processSteps = [
  {
    number: '01',
    icon: 'search' as const,
    phase: 'Khám phá',
    title: 'Tìm không gian phù hợp',
    description:
      'Bắt đầu bằng loại phòng, số khách và ngân sách mỗi đêm. Mỗi trang chi tiết cung cấp hình ảnh, tiện nghi, nội quy và đánh giá để bạn lựa chọn minh bạch.',
    details: ['Lọc theo nhu cầu và ngân sách', 'Xem lịch trống theo thời gian thực', 'So sánh tiện nghi và đánh giá'],
    result: 'Chọn được phòng phù hợp',
  },
  {
    number: '02',
    icon: 'calendar' as const,
    phase: 'Lịch lưu trú',
    title: 'Chọn ngày nhận và trả phòng',
    description:
      'Chọn kỳ lưu trú theo đêm. Hệ thống kiểm tra tình trạng phòng trước khi tiếp tục và hiển thị đầy đủ thời gian, số đêm cùng chi phí dự kiến.',
    details: ['Nhận phòng sau 14:00', 'Trả phòng trước 12:00', 'Không cho phép trùng lịch đã xác nhận'],
    result: 'Khung thời gian được kiểm tra',
  },
  {
    number: '03',
    icon: 'payment' as const,
    phase: 'Xác nhận & thanh toán',
    title: 'Giữ chỗ bằng lựa chọn linh hoạt',
    description:
      'Kiểm tra lại thông tin khách, phòng và tổng tiền. Bạn có thể thanh toán toàn bộ hoặc đặt cọc 50% bằng VietQR; khoản còn lại được kết toán khi checkout.',
    details: ['Áp dụng mã ưu đãi tại bước thanh toán', 'Thanh toán 50% hoặc 100%', 'Đơn được cập nhật sau khi giao dịch hợp lệ'],
    result: 'Đặt phòng được xác nhận',
  },
  {
    number: '04',
    icon: 'prepare' as const,
    phase: 'Trước ngày đến',
    title: 'Homestay chuẩn bị đón bạn',
    description:
      'Đội ngũ vận hành theo dõi lịch đến, kiểm tra vệ sinh và tiện nghi của đúng căn phòng. Mọi thay đổi hoặc yêu cầu hủy được gửi từ lịch sử đặt phòng để xử lý có lưu vết.',
    details: ['Kiểm tra phòng và tiện nghi', 'Theo dõi trạng thái trong tài khoản', 'Gửi yêu cầu hỗ trợ khi cần'],
    result: 'Phòng sẵn sàng trước giờ nhận',
  },
  {
    number: '05',
    icon: 'key' as const,
    phase: 'Check-in & lưu trú',
    title: 'Nhận phòng nhanh, hỗ trợ đúng lúc',
    description:
      'Nhân viên kiểm tra thông tin đặt chỗ và giấy tờ cần thiết trước khi bàn giao phòng. Check-in sớm tối đa 5 phút để đảm bảo phòng đã được chuẩn bị đầy đủ.',
    details: ['Đối chiếu khách và mã đặt phòng', 'Check-in sớm tối đa 5 phút', 'Báo sự cố ngay trên hệ thống'],
    result: 'Bắt đầu kỳ lưu trú',
  },
  {
    number: '06',
    icon: 'checkout' as const,
    phase: 'Checkout',
    title: 'Kết thúc minh bạch và trọn vẹn',
    description:
      'Khi trả phòng, nhân viên kiểm tra tình trạng phòng và đối soát thanh toán. Nếu đã đặt cọc 50%, khách hoàn tất phần còn lại trước khi đơn chuyển sang hoàn thành.',
    details: ['Đối soát số tiền đã thanh toán', 'Kết toán phần còn lại nếu có', 'Đánh giá phòng và đính kèm ảnh'],
    result: 'Đơn hoàn thành và có thể đánh giá',
  },
] as const

const serviceMilestones = [
  {
    value: '14:00',
    label: 'Giờ nhận phòng',
    description: 'Phòng được bàn giao sau khi hoàn tất kiểm tra trước lượt khách mới.',
  },
  {
    value: '05 phút',
    label: 'Check-in sớm tối đa',
    description: 'Giữ đúng quy trình chuẩn bị và tránh ảnh hưởng lượt khách trước.',
  },
  {
    value: '12:00',
    label: 'Giờ trả phòng',
    description: 'Đủ thời gian kiểm tra, vệ sinh và chuẩn bị cho kỳ lưu trú tiếp theo.',
  },
] as const

const bookingStatuses = [
  ['01', 'Chờ thanh toán', 'Phòng đang được giữ trong thời gian thanh toán hiển thị trên hệ thống.'],
  ['02', 'Đã đặt cọc / Đã thanh toán', 'Khoản tiền được ghi nhận và nhân viên có thể theo dõi để chuẩn bị phòng.'],
  ['03', 'Đang sử dụng', 'Khách đã được check-in và kỳ lưu trú đang diễn ra.'],
  ['04', 'Hoàn tất', 'Checkout, đối soát và kết toán đã hoàn thành.'],
] as const

function ProcessIcon({ name }: { name: ProcessIconName }) {
  const paths: Record<ProcessIconName, ReactNode> = {
    search: (
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4.5 4.5M8.5 11h5M11 8.5v5" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2.5" />
        <path d="M8 3v4M16 3v4M3 10h18M8 15h3M14 15h2" />
      </>
    ),
    payment: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path d="M3 10h18M7 15h4" />
      </>
    ),
    prepare: (
      <>
        <path d="M4 20V9l8-5 8 5v11M8 20v-6h8v6" />
        <path d="m9.5 10.5 1.7 1.7 3.5-3.8" />
      </>
    ),
    key: (
      <>
        <circle cx="8" cy="12" r="4" />
        <path d="M12 12h9M17 12v3M20 12v2" />
      </>
    ),
    checkout: (
      <>
        <path d="M4 4h9v16H4zM13 12h8M18 9l3 3-3 3" />
        <circle cx="9" cy="12" r=".8" fill="currentColor" stroke="none" />
      </>
    ),
  }

  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[name]}
    </svg>
  )
}

export default function ProcessPage() {
  return (
    <main id="main-content" className="bg-[#F7F3EC] text-on-surface">
      <section className="relative isolate overflow-hidden bg-secondary text-white">
        <div className="absolute -left-32 top-24 h-80 w-80 rounded-full border border-white/[0.06]" aria-hidden />
        <div className="absolute left-10 top-48 h-52 w-52 rounded-full border border-primary-fixed/10" aria-hidden />
        <div className="mx-auto grid min-h-[680px] max-w-[1400px] lg:grid-cols-[0.92fr_1.08fr]">
          <div className="relative z-10 flex items-center px-5 py-20 sm:px-8 sm:py-28 lg:px-14 xl:px-20">
            <div className="max-w-xl">
              <p className="eyebrow text-primary-fixed">Hành trình lưu trú</p>
              <h1 className="font-editorial mt-5 text-5xl font-semibold leading-[1.01] tracking-[-0.035em] sm:text-6xl lg:text-[4.8rem]">
                Mỗi bước rõ ràng. Mỗi kỳ nghỉ nhẹ nhàng.
              </h1>
              <p className="mt-7 text-base leading-8 text-white/72 sm:text-lg">
                Từ lúc tìm phòng đến khi checkout, bạn luôn biết bước tiếp theo là gì, khoản nào đã thanh toán và đội ngũ homestay đang chuẩn bị điều gì.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/rooms" className="rounded-full border border-white/20 bg-[#0f2f27] px-6 py-3.5 font-display text-sm font-semibold text-white shadow-[0_16px_38px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:bg-secondary-container">
                  Bắt đầu chọn phòng
                </Link>
                <Link href="/booking-policy" className="rounded-full border border-white/25 px-6 py-3.5 font-display text-sm font-semibold text-white transition hover:bg-white/10">
                  Xem chính sách đặt phòng
                </Link>
              </div>
            </div>
          </div>

          <div className="relative aspect-[4/3] min-h-0 overflow-hidden sm:aspect-[16/10] lg:my-10 lg:mr-8 lg:self-center lg:rounded-[28px]">
            <Image
              src="/images/Banner4.png?v=20260715-original"
              alt="Khu homestay nhà gỗ giữa thiên nhiên được chuẩn bị sẵn sàng đón khách"
              fill
              priority
              unoptimized
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="banner-image-native object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/45 via-secondary/5 to-transparent lg:from-secondary/30" />
            <div className="absolute inset-x-5 bottom-6 rounded-[22px] border border-white/18 bg-secondary/72 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:inset-x-auto sm:bottom-8 sm:right-8 sm:w-[360px] sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-fixed">Một hành trình liền mạch</p>
                  <p className="mt-2 font-editorial text-2xl font-semibold">6 giai đoạn được theo dõi</p>
                </div>
                <span className="font-editorial flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-primary-fixed/30 text-2xl text-primary-fixed">06</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-outline-variant bg-white">
        <div className="mx-auto grid max-w-[1400px] grid-cols-2 px-5 sm:px-8 lg:grid-cols-4">
          {['Lịch trống minh bạch', 'Thanh toán có đối soát', 'Check-in có xác nhận', 'Hỗ trợ xuyên suốt'].map((item, index) => (
            <div key={item} className={`py-6 text-center text-xs font-semibold uppercase tracking-[0.13em] text-secondary sm:py-7 ${index > 0 ? 'border-l border-outline-variant' : ''} ${index > 1 ? 'border-t border-outline-variant lg:border-t-0' : ''}`}>
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 sm:px-8 lg:grid-cols-[0.62fr_1.38fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:h-fit">
            <p className="eyebrow text-brand-orange">Quy trình từng bước</p>
            <h2 className="font-editorial mt-4 text-4xl font-semibold leading-[1.1] text-secondary sm:text-5xl">
              Từ lựa chọn đầu tiên đến lời chào tạm biệt.
            </h2>
            <p className="mt-6 max-w-md text-base leading-8 text-on-surface-variant">
              Mỗi trạng thái đều gắn với một hành động cụ thể của khách hàng hoặc đội ngũ vận hành, giúp hạn chế chờ đợi và tránh nhầm lẫn.
            </p>
            <div className="mt-8 hidden items-center gap-3 text-sm font-semibold text-secondary lg:flex">
              <span className="h-px w-12 bg-brand-orange" />
              06 giai đoạn hoàn chỉnh
            </div>
          </div>

          <div className="relative space-y-6 before:absolute before:bottom-12 before:left-[35px] before:top-12 before:w-px before:bg-outline-variant sm:before:left-[43px]">
            {processSteps.map((step) => (
              <article key={step.number} className="group relative grid gap-5 rounded-[24px] border border-outline-variant bg-white p-6 shadow-[0_16px_48px_rgba(23,58,49,0.055)] transition duration-300 hover:-translate-y-1 hover:border-brand-orange/45 hover:shadow-[0_24px_64px_rgba(23,58,49,0.1)] sm:grid-cols-[88px_1fr] sm:p-8">
                <div className="relative z-10 flex h-[72px] w-[72px] items-center justify-center rounded-[22px] border border-brand-orange/25 bg-primary-container text-secondary transition group-hover:bg-secondary group-hover:text-primary-fixed sm:h-[88px] sm:w-[88px]">
                  <ProcessIcon name={step.icon} />
                </div>
                <div className="sm:pl-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.17em] text-brand-orange">{step.phase}</p>
                    <span className="font-editorial text-2xl text-secondary/25">{step.number}</span>
                  </div>
                  <h3 className="font-editorial mt-3 text-3xl font-semibold leading-tight text-secondary sm:text-[2.15rem]">{step.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-on-surface-variant sm:text-base sm:leading-8">{step.description}</p>
                  <ul className="mt-6 grid gap-3 sm:grid-cols-3">
                    {step.details.map((detail) => (
                      <li key={detail} className="flex gap-2.5 text-xs leading-5 text-on-surface-variant">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-orange" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex items-center gap-2 border-t border-outline-variant pt-5 text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand-orange" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="m5 12 4 4L19 6" /></svg>
                    Kết quả: {step.result}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-outline-variant bg-[#EAE4D9] py-20 sm:py-24">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow text-brand-orange">Mốc thời gian cần nhớ</p>
            <h2 className="font-editorial mt-4 text-4xl font-semibold text-secondary sm:text-5xl">Đúng giờ để mọi trải nghiệm đều chỉn chu.</h2>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {serviceMilestones.map((milestone, index) => (
              <article key={milestone.label} className="relative overflow-hidden rounded-[22px] border border-outline-variant bg-white p-7 shadow-[var(--shadow-card)] sm:p-8">
                <span className="absolute right-5 top-1 font-editorial text-7xl text-secondary/[0.045]">0{index + 1}</span>
                <p className="font-editorial text-4xl font-semibold text-brand-orange">{milestone.value}</p>
                <h3 className="mt-5 text-lg font-bold text-secondary">{milestone.label}</h3>
                <p className="mt-3 text-sm leading-7 text-on-surface-variant">{milestone.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-secondary py-20 text-white sm:py-28">
        <div className="absolute -right-24 top-16 h-80 w-80 rounded-full border border-white/[0.05]" aria-hidden />
        <div className="relative mx-auto grid max-w-[1400px] gap-12 px-5 sm:px-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div>
            <p className="eyebrow text-primary-fixed">Hiểu trạng thái đơn</p>
            <h2 className="font-editorial mt-4 text-4xl font-semibold leading-tight sm:text-5xl">Bạn luôn biết đơn đang ở đâu.</h2>
            <p className="mt-6 max-w-lg text-base leading-8 text-white/68">Lịch sử đặt phòng hiển thị tiến trình thanh toán và lưu trú để khách hàng, nhân viên và quản lý cùng theo dõi một nguồn thông tin thống nhất.</p>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2">
            {bookingStatuses.map(([number, title, description]) => (
              <li key={number} className="rounded-[20px] border border-white/12 bg-white/[0.055] p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-editorial text-3xl text-primary-fixed">{number}</span>
                  <span className="h-2 w-2 rounded-full bg-brand-orange shadow-[0_0_0_6px_rgba(178,132,85,0.14)]" />
                </div>
                <h3 className="mt-6 text-lg font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/62">{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-[#F7F3EC] py-20 sm:py-24">
        <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-8 px-5 sm:px-8 lg:flex-row lg:items-center">
          <div className="max-w-3xl">
            <p className="eyebrow text-brand-orange">Sẵn sàng bắt đầu?</p>
            <h2 className="font-editorial mt-4 text-4xl font-semibold leading-tight text-secondary sm:text-5xl">Chọn căn phòng cho kỳ lưu trú tiếp theo.</h2>
            <p className="mt-4 text-base leading-8 text-on-surface-variant">Nếu cần tư vấn trước khi đặt, đội ngũ hỗ trợ sẽ giúp bạn chọn loại phòng và kỳ lưu trú phù hợp.</p>
          </div>
          <div className="flex w-full flex-wrap gap-3 lg:w-auto">
            <Link href="/rooms" className="flex h-12 flex-1 items-center justify-center rounded-full bg-secondary px-6 font-display text-sm font-semibold text-white shadow-[0_14px_32px_rgba(23,58,49,0.16)] transition hover:-translate-y-0.5 hover:bg-secondary-container lg:flex-none">Tìm phòng ngay</Link>
            <Link href="/support" className="flex h-12 flex-1 items-center justify-center rounded-full border border-outline bg-white px-6 font-display text-sm font-semibold text-secondary transition hover:border-brand-orange hover:text-brand-orange lg:flex-none">Liên hệ hỗ trợ</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
