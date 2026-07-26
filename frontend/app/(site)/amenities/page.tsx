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
      description:
        'Khám phá tiện nghi trong căn, tiện ích đi kèm theo từng homestay, tiêu chuẩn chuẩn bị và dịch vụ hỗ trợ tại The Serene Villa.',
    },
    eyebrow: 'Tiện nghi The Serene Villa',
    title: ['Mọi thứ cần thiết,', 'được chuẩn bị vừa đủ.'],
    description:
      'Từ tiện nghi trong căn đến hồ bơi, sân vườn và những tiện ích đi kèm theo từng homestay, mỗi chi tiết đều hướng đến một kỳ nghỉ nhẹ nhàng, chủ động và không cần bận tâm quá nhiều.',
    discover: 'Khám phá tiện nghi',
    shared: 'Xem tiện ích đi kèm',
    assurances: [
      'Kiểm tra trước check-in',
      'Thông tin rõ theo từng homestay',
      'Hỗ trợ khi có phát sinh',
    ],
    visualAlt:
      'Một homestay giữa thiên nhiên với hồ bơi và không gian nghỉ ngơi',
    visualEyebrow: 'Trong căn & tiện ích đi kèm',
    visualTitle:
      'Tiện nghi không chỉ để sử dụng, mà để kỳ nghỉ diễn ra tự nhiên và dễ chịu hơn.',
    philosophyEyebrow: 'Triết lý tiện nghi',
    philosophyTitle: 'Không phải nhiều hơn, mà là đúng những gì bạn cần.',
    philosophyDescription:
      'Chúng tôi lựa chọn tiện nghi theo cách một kỳ nghỉ thật sự diễn ra: đủ riêng tư để nghỉ ngơi, đủ thuận tiện để chủ động và đủ tinh tế để mọi thứ trở nên nhẹ nhàng hơn.',
    philosophyLink: 'Tìm hiểu từng nhóm tiện nghi',
    preparationEyebrow: 'Tiêu chuẩn chuẩn bị',
    preparationTitle: 'Chỉn chu trước khi bạn mở cửa phòng.',
    preparationDescription:
      'Một quy trình ngắn gọn nhưng rõ ràng giúp không gian và các tiện nghi thiết yếu luôn sẵn sàng đúng thời điểm.',
    preparationSteps: [
      {
        number: '01',
        title: 'Trước khi bạn đến',
        description:
          'Không gian, vệ sinh, thiết bị và ghi chú trong đơn đặt phòng được kiểm tra trước giờ nhận phòng.',
      },
      {
        number: '02',
        title: 'Khi nhận phòng',
        description:
          'Thông tin đặt chỗ được đối chiếu để quá trình check-in rõ ràng và thuận tiện hơn.',
      },
      {
        number: '03',
        title: 'Trong kỳ lưu trú',
        description:
          'Yêu cầu hỗ trợ hoặc báo cáo sự cố được tiếp nhận trực tiếp trên hệ thống.',
      },
    ],
    stayStylesEyebrow: 'Không gian dành cho bạn',
    stayStylesTitle: 'Tiện nghi phù hợp với từng nhịp nghỉ.',
    stayStylesDescription:
      'Mỗi chuyến đi có một cách tận hưởng khác nhau. Hệ thống tiện nghi được sắp xếp để bạn dễ dàng tìm thấy lựa chọn phù hợp.',
    stayStyles: [
      {
        title: 'Cặp đôi',
        description:
          'Không gian riêng tư, ánh sáng dịu và những góc nghỉ ngơi yên tĩnh.',
        image: '/images/couple.png',
      },
      {
        title: 'Gia đình',
        description:
          'Tiện nghi rõ ràng, thuận tiện và phù hợp cho nhiều thành viên.',
        image: '/images/family.png',
      },
      {
        title: 'Nhóm bạn',
        description:
          'Khu vực sinh hoạt chung và không gian để kết nối cùng nhau.',
        image: '/images/Fen.png',
      },
      {
        title: 'Workation',
        description:
          'Kết nối ổn định và góc làm việc nhẹ nhàng giữa thiên nhiên.',
        image: '/images/Work.png',
      },
    ],
    readyEyebrow: 'Sẵn sàng cho kỳ nghỉ',
    readyTitle: 'Chọn không gian phù hợp với nhịp nghỉ của bạn.',
    readyDescription:
      'Xem tiện nghi chính xác của từng homestay, so sánh lựa chọn và kiểm tra lịch trống trước khi đặt.',
    roomsCta: 'Khám phá phòng homestay',
    supportCta: 'Cần tư vấn',
  },
  en: {
    metadata: {
      title: 'Homestay amenities',
      description:
        'Explore in-home amenities, included amenities for each homestay, preparation standards, and support services at The Serene Villa.',
    },
    eyebrow: 'The Serene Villa amenities',
    title: ['Everything you need,', 'prepared with intention.'],
    description:
      'From in-home comforts to pools, gardens, and amenities unique to each homestay, every detail is designed for a calm, self-directed stay with less to think about.',
    discover: 'Explore amenities',
    shared: 'View included amenities',
    assurances: [
      'Checked before check-in',
      'Clear details for every homestay',
      'Support when you need it',
    ],
    visualAlt:
      'A homestay surrounded by nature, with a pool and restful spaces',
    visualEyebrow: 'In-home & included amenities',
    visualTitle:
      'Amenities are not only for use, but for a stay that feels natural and effortless.',
    philosophyEyebrow: 'Our amenity philosophy',
    philosophyTitle:
      'Not more for the sake of more — simply what you genuinely need.',
    philosophyDescription:
      'We select amenities around the way a restful stay truly unfolds: private enough to unwind, convenient enough to stay in control, and thoughtful enough to make everything feel lighter.',
    philosophyLink: 'Explore each amenity group',
    preparationEyebrow: 'Preparation standard',
    preparationTitle: 'Thoughtfully prepared before you open the door.',
    preparationDescription:
      'A concise, clear process keeps the space and essential amenities ready at the right moment.',
    preparationSteps: [
      {
        number: '01',
        title: 'Before you arrive',
        description:
          'The room, cleanliness, equipment, and notes attached to the reservation are reviewed before check-in.',
      },
      {
        number: '02',
        title: 'At check-in',
        description:
          'Reservation details are confirmed so that check-in is clear and convenient.',
      },
      {
        number: '03',
        title: 'During your stay',
        description:
          'Support requests and incident reports can be received directly through the system.',
      },
    ],
    stayStylesEyebrow: 'A space for you',
    stayStylesTitle: 'Amenities shaped around the way you rest.',
    stayStylesDescription:
      'Every trip has its own rhythm. Amenities are organized so you can quickly find a stay that feels right.',
    stayStyles: [
      {
        title: 'Couples',
        description:
          'Privacy, soft light, and quiet corners to slow down together.',
        image: '/images/couple.png',
      },
      {
        title: 'Families',
        description:
          'Clear, convenient comforts suited to stays with more people.',
        image: '/images/family.png',
      },
      {
        title: 'Friends',
        description:
          'Shared spaces designed for time together and easy connection.',
        image: '/images/Fen.png',
      },
      {
        title: 'Workation',
        description:
          'Reliable connection and a calm place for light work in nature.',
        image: '/images/Work.png',
      },
    ],
    readyEyebrow: 'Ready for your stay',
    readyTitle: 'Choose a space that matches the way you want to rest.',
    readyDescription:
      'Review the exact amenities for each homestay, compare choices, and check availability before reserving.',
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
    <main id="main-content" className="overflow-x-hidden bg-[#F7F3EC] text-on-surface">
      <section className="relative isolate min-h-[calc(100svh-5rem)] overflow-hidden bg-[#112F27] text-white">
        <Image
          src="/images/Banner21.png"
          alt={content.visualAlt}
          fill
          priority
          unoptimized
          sizes="100vw"
          className="serene-hero-image-in object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,31,25,.90)_0%,rgba(9,31,25,.66)_40%,rgba(9,31,25,.18)_72%,rgba(9,31,25,.32)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f3028]/76 via-transparent to-black/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(216,181,136,.15),transparent_34%)]" />

        <div className="relative mx-auto flex min-h-[calc(100svh-5rem)] max-w-[1400px] items-end px-5 pb-14 pt-28 sm:px-8 sm:pb-20 lg:items-center lg:pb-16 lg:pt-24">
          <div className="max-w-3xl">
            <p className="serene-hero-item serene-delay-1 eyebrow text-primary-fixed">{content.eyebrow}</p>

            <h1 className="serene-hero-item serene-delay-2 font-editorial mt-6 text-[3rem] font-semibold leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-[5.35rem]">
              {content.title[0]}
              <span className="mt-2 block text-white/78">{content.title[1]}</span>
            </h1>

            <span aria-hidden className="serene-hero-item serene-delay-3 mt-7 block h-px w-16 bg-primary-fixed" />

            <p className="serene-hero-item serene-delay-4 mt-6 max-w-2xl text-base leading-8 text-white/76 sm:text-lg">
              {content.description}
            </p>

            <div className="serene-hero-item serene-delay-5 mt-8 flex flex-wrap gap-3">
              <a
                href="#amenity-list"
                className="group inline-flex min-h-12 items-center gap-3 rounded-[9px] bg-[#0F513F] px-6 font-display text-sm font-semibold text-white shadow-[0_16px_34px_rgba(0,0,0,.2)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#123F34]"
              >
                {content.discover}
                <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </a>

              <a
                href="#common-amenities"
                className="inline-flex min-h-12 items-center justify-center rounded-[9px] border border-white/32 bg-black/10 px-6 font-display text-sm font-semibold text-white backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:bg-white/12"
              >
                {content.shared}
              </a>
            </div>

            <div className="serene-hero-item serene-delay-6 mt-10 grid max-w-2xl gap-4 border-t border-white/16 pt-6 sm:grid-cols-3">
              {content.assurances.map((item, index) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="font-editorial text-lg text-primary-fixed">0{index + 1}</span>
                  <span className="text-xs leading-5 text-white/66">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-[#FBF8F2] py-20 sm:py-24 lg:py-28">
        <div aria-hidden className="pointer-events-none absolute -left-40 top-16 h-80 w-80 rounded-full border border-secondary/[0.06]" />
        <div className="relative mx-auto grid max-w-[1400px] gap-12 px-5 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-20">
          <div className="serene-view-reveal-left max-w-xl">
            <p className="eyebrow text-brand-orange">{content.philosophyEyebrow}</p>
            <h2 className="font-editorial mt-5 text-4xl font-semibold leading-[1.06] text-secondary sm:text-5xl">
              {content.philosophyTitle}
            </h2>
            <p className="mt-6 text-base leading-8 text-on-surface-variant">
              {content.philosophyDescription}
            </p>
            <a
              href="#amenity-list"
              className="group mt-8 inline-flex items-center gap-3 font-display text-sm font-semibold text-secondary"
            >
              <span className="border-b border-secondary/35 pb-1">{content.philosophyLink}</span>
              <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </a>
          </div>

          <div className="serene-view-reveal-right group relative min-h-[440px] overflow-hidden rounded-[28px] border border-outline-variant bg-[#EAE4D9] shadow-[0_28px_72px_rgba(23,58,49,.12)] sm:min-h-[560px]">
            <Image
              src="/images/Banner22.png"
              alt={content.visualAlt}
              fill
              unoptimized
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover transition duration-[1100ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.045]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-secondary/50 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-fixed">
                {content.visualEyebrow}
              </p>
              <p className="font-editorial mt-3 max-w-2xl text-2xl font-semibold leading-snug text-white sm:text-3xl">
                {content.visualTitle}
              </p>
            </div>
          </div>
        </div>
      </section>

      <AmenitiesExplorer />

      <div id="common-amenities" className="serene-view-reveal scroll-mt-24 [&>section]:!py-16 sm:[&>section]:!py-20">
        <CommonAmenitiesShowcase />
      </div>

      <section className="bg-[#EAE4D9] py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.68fr_1.32fr] lg:items-start">
            <div className="serene-view-reveal-left max-w-xl lg:sticky lg:top-28">
              <p className="eyebrow text-brand-orange">{content.preparationEyebrow}</p>
              <h2 className="font-editorial mt-4 text-4xl font-semibold leading-[1.08] text-secondary sm:text-5xl">
                {content.preparationTitle}
              </h2>
              <p className="mt-5 text-base leading-8 text-on-surface-variant">
                {content.preparationDescription}
              </p>
            </div>

            <ol className="serene-view-reveal-right relative space-y-4">
              <div aria-hidden className="absolute bottom-8 left-[29px] top-8 hidden w-px bg-secondary/12 sm:block" />
              {content.preparationSteps.map((step) => (
                <li
                  key={step.number}
                  className="relative grid gap-4 rounded-[24px] border border-outline-variant bg-white/82 p-6 shadow-[0_16px_42px_rgba(63,51,35,.06)] sm:grid-cols-[64px_180px_1fr] sm:items-start sm:p-7"
                >
                  <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-brand-orange/25 bg-[#F8F1E6] font-editorial text-2xl text-brand-orange">
                    {step.number}
                  </span>
                  <h3 className="pt-2 font-editorial text-2xl font-semibold text-secondary">
                    {step.title}
                  </h3>
                  <p className="pt-2 text-sm leading-7 text-on-surface-variant">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="bg-[#F7F3EC] py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="serene-view-reveal grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="eyebrow text-brand-orange">{content.stayStylesEyebrow}</p>
              <h2 className="font-editorial mt-4 max-w-2xl text-4xl font-semibold leading-[1.08] text-secondary sm:text-5xl">
                {content.stayStylesTitle}
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-8 text-on-surface-variant lg:justify-self-end">
              {content.stayStylesDescription}
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {content.stayStyles.map((item) => (
              <article
                key={item.title}
                className="serene-view-card group overflow-hidden rounded-[24px] border border-outline-variant bg-white shadow-[0_18px_48px_rgba(23,58,49,.07)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_26px_64px_rgba(23,58,49,.13)]"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#EAE4D9]">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    className="object-cover transition duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/34 via-transparent to-transparent" />
                </div>
                <div className="p-6">
                  <h3 className="font-editorial text-2xl font-semibold text-secondary">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-on-surface-variant">{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden px-5 py-20 text-white sm:px-8 sm:py-24 lg:py-28">
        <Image
          src="/images/Banner21.png"
          alt={content.visualAlt}
          fill
          unoptimized
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-secondary/78" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(216,181,136,.14),transparent_48%)]" />

        <div className="serene-view-reveal serene-view-scale relative mx-auto flex max-w-[1100px] flex-col items-center text-center">
          <p className="eyebrow text-primary-fixed">{content.readyEyebrow}</p>
          <h2 className="font-editorial mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
            {content.readyTitle}
          </h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-white/68">
            {content.readyDescription}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={locale === 'en' ? '/en/rooms' : '/vi/rooms'}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 font-display text-sm font-semibold text-secondary shadow-[0_14px_30px_rgba(0,0,0,.2)] transition duration-300 hover:-translate-y-0.5 hover:bg-primary-fixed"
            >
              {content.roomsCta}
            </Link>
            <Link
              href={locale === 'en' ? '/en/support' : '/vi/support'}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 bg-black/10 px-7 font-display text-sm font-semibold text-white backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:bg-white/12"
            >
              {content.supportCta}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
