import Image from 'next/image'
import Link from 'next/link'
import CommonAmenitiesShowcase from '@/components/public/CommonAmenitiesShowcase'
import { getRequestLocale } from '@/i18n/server'
import { createPublicPageMetadata } from '@/lib/seo'
import AmenitiesExplorer from './AmenitiesExplorer'

const amenitiesContent = {
  vi: {
    metadata: {
      title: 'Tiện nghi homestay',
      description: 'Khám phá tiện nghi trong phòng, tiện ích chung, tiêu chuẩn chuẩn bị phòng và dịch vụ hỗ trợ tại The Serene Villa.',
    },
    eyebrow: 'Tiện nghi The Serene Villa',
    title: ['Mọi thứ cần thiết,', 'được chuẩn bị vừa đủ.'],
    description: 'Từ tiện nghi trong phòng đến hồ bơi, sân vườn và những không gian sinh hoạt chung, mỗi chi tiết đều hướng đến một kỳ nghỉ nhẹ nhàng, chủ động và không cần bận tâm quá nhiều.',
    discover: 'Khám phá tiện nghi',
    shared: 'Xem tiện ích chung',
    assurances: ['Kiểm tra trước check-in', 'Thông tin rõ theo từng phòng', 'Hỗ trợ khi có phát sinh'],
    visualAlt: 'Khu homestay giữa thiên nhiên với hồ bơi và không gian sinh hoạt chung',
    visualEyebrow: 'Trong phòng & khu vực chung',
    visualTitle: 'Tiện nghi không chỉ để sử dụng, mà để kỳ nghỉ diễn ra tự nhiên và dễ chịu hơn.',
    preparationEyebrow: 'Tiêu chuẩn chuẩn bị',
    preparationTitle: 'Chỉn chu trước khi bạn mở cửa phòng.',
    preparationDescription: 'Một quy trình ngắn gọn nhưng rõ ràng giúp không gian và các tiện nghi thiết yếu luôn sẵn sàng đúng thời điểm.',
    preparationSteps: [
      { number: '01', title: 'Trước khi bạn đến', description: 'Không gian, vệ sinh, thiết bị và ghi chú trong đơn đặt phòng được kiểm tra trước giờ nhận phòng.' },
      { number: '02', title: 'Khi nhận phòng', description: 'Thông tin đặt chỗ được đối chiếu để quá trình check-in rõ ràng và thuận tiện hơn.' },
      { number: '03', title: 'Trong kỳ lưu trú', description: 'Yêu cầu hỗ trợ hoặc báo cáo sự cố được tiếp nhận trực tiếp trên hệ thống.' },
    ],
    readyEyebrow: 'Sẵn sàng cho kỳ nghỉ',
    readyTitle: 'Chọn không gian phù hợp với nhịp nghỉ của bạn.',
    readyDescription: 'Xem tiện nghi chính xác của từng hạng phòng, so sánh lựa chọn và kiểm tra lịch trống trước khi đặt.',
    roomsCta: 'Khám phá phòng homestay',
    supportCta: 'Cần tư vấn',
  },
  en: {
    metadata: {
      title: 'Homestay amenities',
      description: 'Explore in-room amenities, shared facilities, room preparation standards, and support services at The Serene Villa.',
    },
    eyebrow: 'The Serene Villa amenities',
    title: ['Everything you need,', 'prepared with intention.'],
    description: 'From in-room comforts to the pool, garden, and shared living spaces, every detail is designed for a calm, self-directed stay with less to think about.',
    discover: 'Explore amenities',
    shared: 'View shared facilities',
    assurances: ['Checked before check-in', 'Clear details for every room', 'Support when you need it'],
    visualAlt: 'The homestay surrounded by nature, with a pool and shared spaces',
    visualEyebrow: 'In-room & shared spaces',
    visualTitle: 'Amenities are not only for use, but for a stay that feels natural and effortless.',
    preparationEyebrow: 'Preparation standard',
    preparationTitle: 'Thoughtfully prepared before you open the door.',
    preparationDescription: 'A concise, clear process keeps the space and essential amenities ready at the right moment.',
    preparationSteps: [
      { number: '01', title: 'Before you arrive', description: 'The room, cleanliness, equipment, and notes attached to the reservation are reviewed before check-in.' },
      { number: '02', title: 'At check-in', description: 'Reservation details are confirmed so that check-in is clear and convenient.' },
      { number: '03', title: 'During your stay', description: 'Support requests and incident reports can be received directly through the system.' },
    ],
    readyEyebrow: 'Ready for your stay',
    readyTitle: 'Choose a space that matches the way you want to rest.',
    readyDescription: 'Review the exact amenities for each room tier, compare choices, and check availability before reserving.',
    roomsCta: 'Explore homestay rooms',
    supportCta: 'Need advice?',
  },
} as const

export async function generateMetadata() {
  const locale = await getRequestLocale()
  const content = amenitiesContent[locale]

  return createPublicPageMetadata({
    ...content.metadata,
    path: locale === 'en' ? '/en/amenities' : '/vi/amenities',
  })
}

export default async function AmenitiesPage() {
  const locale = await getRequestLocale()
  const content = amenitiesContent[locale]

  return (
    <main
      id="main-content"
      className="overflow-x-hidden bg-[#F7F3EC] text-on-surface"
    >
      <section className="relative isolate overflow-hidden bg-secondary text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_15%,rgba(216,194,168,0.20),transparent_34%),linear-gradient(120deg,rgba(63,58,52,0.98),rgba(116,109,99,0.84))]" />
        <div
          aria-hidden="true"
          className="absolute -left-28 -top-40 h-[30rem] w-[30rem] rounded-full border border-white/[0.06]"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-52 right-[34%] h-[30rem] w-[30rem] rounded-full border border-primary-fixed/10"
        />

        <div className="relative mx-auto grid max-w-[1400px] gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:py-24">
          <div className="max-w-2xl">
            <p className="eyebrow text-primary-fixed">
              {content.eyebrow}
            </p>

            <h1 className="font-editorial mt-5 text-5xl font-semibold leading-[1.01] tracking-[-0.035em] sm:text-6xl lg:text-[4.25rem]">
              {content.title[0]}
              <span className="mt-2 block text-primary-fixed">
                {content.title[1]}
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-white/72 sm:text-lg">
              {content.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#amenity-list"
                className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 font-display text-sm font-semibold text-secondary shadow-[0_14px_32px_rgba(0,0,0,0.2)] transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-primary-fixed"
              >
                {content.discover}
              </a>

              <a
                href="#common-amenities"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/25 bg-white/[0.03] px-6 font-display text-sm font-semibold text-white transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-white/45 hover:bg-white/10"
              >
                {content.shared}
              </a>
            </div>

            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              {content.assurances.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2.5 border-l border-white/16 pl-3 first:border-l-0 first:pl-0"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-fixed/14 text-primary-fixed"
                  >
                    ✓
                  </span>
                  <span className="text-xs leading-5 text-white/62">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[350px] overflow-hidden rounded-[24px] border border-white/15 shadow-[0_32px_80px_rgba(0,0,0,0.28)] sm:min-h-[470px]">
            <Image
              src="/images/Banner3-sharp.png?v=20260715-enhanced"
              alt={content.visualAlt}
              fill
              priority
              unoptimized
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="banner-image-native object-cover object-center"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-secondary/88 via-secondary/5 to-black/5" />

            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-fixed">
                {content.visualEyebrow}
              </p>
              <p className="font-editorial mt-2 max-w-lg text-2xl font-semibold leading-snug sm:text-3xl">
                {content.visualTitle}
              </p>
            </div>
          </div>
        </div>
      </section>

      <AmenitiesExplorer />

      <div
        id="common-amenities"
        className="scroll-mt-24 [&>section]:!py-14 sm:[&>section]:!py-16"
      >
        <CommonAmenitiesShowcase />
      </div>

      <section className="bg-[#EAE4D9] py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
            <div className="max-w-xl">
              <p className="eyebrow text-brand-orange">{content.preparationEyebrow}</p>

              <h2 className="font-editorial mt-4 text-4xl font-semibold leading-[1.08] text-secondary sm:text-5xl">
                {content.preparationTitle}
              </h2>

              <p className="mt-4 text-sm leading-7 text-on-surface-variant sm:text-base">
                {content.preparationDescription}
              </p>
            </div>

            <ol className="overflow-hidden rounded-[22px] border border-outline-variant bg-white/75 shadow-[0_14px_34px_rgba(63,51,35,0.06)]">
              {content.preparationSteps.map((step) => (
                <li
                  key={step.number}
                  className="grid gap-3 border-b border-outline-variant px-5 py-5 last:border-b-0 sm:grid-cols-[58px_180px_1fr] sm:items-start sm:px-6"
                >
                  <span className="font-editorial text-2xl text-brand-orange">
                    {step.number}
                  </span>

                  <h3 className="font-display text-sm font-semibold text-secondary">
                    {step.title}
                  </h3>

                  <p className="text-sm leading-6 text-on-surface-variant">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-secondary px-5 py-14 text-white sm:px-8 sm:py-16">
        <div
          aria-hidden="true"
          className="absolute -right-28 -top-32 h-72 w-72 rounded-full border border-white/[0.06]"
        />

        <div className="relative mx-auto flex max-w-[1100px] flex-col items-center text-center">
          <p className="eyebrow text-primary-fixed">{content.readyEyebrow}</p>

          <h2 className="font-editorial mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
            {content.readyTitle}
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-7 text-white/65 sm:text-base">
            {content.readyDescription}
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href={locale === 'en' ? '/en/rooms' : '/vi/rooms'}
              className="inline-flex h-12 items-center justify-center rounded-full bg-white px-7 font-display text-sm font-semibold text-secondary shadow-[0_14px_30px_rgba(0,0,0,.2)] transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-primary-fixed"
            >
              {content.roomsCta}
            </Link>

            <Link
              href={locale === 'en' ? '/en/support' : '/vi/support'}
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/22 px-7 font-display text-sm font-semibold text-white transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/10"
            >
              {content.supportCta}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
