import Image from 'next/image'
import Link from 'next/link'
import AboutHero from './AboutHero'
import { AboutNearbyPlacesCarousel } from '@/components/public/AboutNearbyPlacesCarousel'
import { createPublicPageMetadata } from '@/lib/seo'

export const metadata = createPublicPageMetadata({
  title: 'Về chúng tôi',
  description:
    'Khám phá ý nghĩa tên gọi The Serene Villa và câu chuyện về một nơi lưu trú được tạo nên để mỗi vị khách tìm lại sự bình yên.',
  path: '/about',
})

// Thay null bằng đường dẫn ảnh trong public/images khi bạn đã chọn được ảnh phù hợp.
// Ví dụ: '/images/the-serene-villa-story.jpg'
///testtest
const brandStoryImage: string | null = '/images/the-serene-villa-story1.jpg'

const values = [
  ['01', 'Minh bạch', 'Thông tin phòng, tiện nghi, sức chứa và mức giá được trình bày rõ trước khi xác nhận.'],
  ['02', 'Chu đáo', 'Mỗi lịch đặt là một kế hoạch đón khách cần được chuẩn bị đúng thời điểm.'],
  ['03', 'Đáng tin cậy', 'Trạng thái đặt chỗ và yêu cầu hỗ trợ được theo dõi xuyên suốt trên hệ thống.'],
] as const

const journey = [
  ['Khám phá', 'Tìm phòng theo nhu cầu và xem đầy đủ thông tin trước khi quyết định.'],
  ['Đặt chỗ', 'Chọn khung giờ còn trống, xác nhận thông tin và theo dõi đơn đặt phòng.'],
  ['Lưu trú', 'Nhận hỗ trợ khi check-in và gửi yêu cầu ngay trong tài khoản khi cần.'],
] as const

const teamStories = [
  {
    number: '01',
    category: 'Nhật ký đội ngũ',
    title: 'Một ngày bên suối, nơi ý tưởng về những kỳ nghỉ đẹp bắt đầu',
    excerpt:
      'Giữa thiên nhiên và những câu chuyện không vội, chúng tôi hiểu rằng một chuyến đi đáng nhớ luôn được tạo nên từ không gian phù hợp và những người đồng hành tuyệt vời.',
    image: '/images/1784048640269_203970977177656101_7980614943386084145_6ff38aa9dfd8c83e11ae939f1470d23d.jpg',
    imageAlt: 'Nhóm The Serene Villa cùng nhau trải nghiệm một chuyến đi bên suối',
    objectPosition: 'center 62%',
  },
  {
    number: '02',
    category: 'Dấu chân bình yên',
    title: 'Giữa núi trời, chúng tôi tìm thấy ý nghĩa của sự an trú',
    excerpt:
      'Một hành trình qua miền núi đã cho chúng tôi khoảng lặng để lắng nghe thiên nhiên và chính mình. Từ khoảnh khắc ấy, The Serene Villa theo đuổi một trải nghiệm lưu trú nơi mỗi khung cửa mở ra cảnh sắc bình yên, còn mỗi vị khách đều có thể chậm lại và tìm thấy sự thư thái theo cách riêng.',
    image: '/images/story-mountain-journey.png',
    imageAlt: 'Khoảnh khắc giữa núi trời truyền cảm hứng cho câu chuyện The Serene Villa',
    objectPosition: 'center 42%',
  },
] as const

export default function AboutPage() {
  return (
    <main id="main-content" className="overflow-hidden bg-[#F7F3EC] text-on-surface">
      <AboutHero />

      <section id="brand-story" className="relative border-b border-outline-variant bg-[#FBF8F2] py-20 sm:py-28 lg:py-32">
        <div aria-hidden className="pointer-events-none absolute -left-40 top-10 h-80 w-80 rounded-full border border-secondary/[0.06]" />
        <div aria-hidden className="pointer-events-none absolute -right-32 bottom-10 h-72 w-72 rounded-full border border-brand-orange/10" />
        <div className="relative mx-auto grid max-w-[1400px] gap-14 px-5 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-20">
          <div className="max-w-3xl lg:py-6">
            <p className="eyebrow text-brand-orange">Tên gọi &amp; tinh thần thương hiệu</p>
            <h2 className="font-editorial mt-5 text-4xl font-semibold leading-[1.08] text-secondary sm:text-5xl">
              The Serene Villa — nơi bình yên có hình hài.
            </h2>
            <div className="mt-8 space-y-5 text-base leading-8 text-on-surface-variant">
              <p>
                <strong className="text-secondary">“Serene”</strong> gợi lên sự tĩnh tại, trong trẻo và nhẹ nhõm — cảm giác chúng tôi muốn mỗi vị khách tìm thấy ngay từ lúc chọn phòng cho đến khi khép lại kỳ nghỉ.
              </p>
              <p>
                <strong className="text-secondary">“Villa”</strong> không chỉ nói về một không gian lưu trú riêng tư. Với chúng tôi, đó còn là một ngôi nhà được chuẩn bị chu đáo, nơi vẻ đẹp, sự tiện nghi và lòng hiếu khách cùng hiện diện.
              </p>
              <p>
                Ghép lại, <strong className="text-secondary">The Serene Villa</strong> là lời cam kết về một hành trình liền mạch và đáng tin cậy: dễ dàng khi đặt phòng, an tâm khi đến nơi và đủ thư thái để bạn thật sự tận hưởng thời gian của mình.
              </p>
            </div>

            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              {[
                ['01', 'Bình yên', 'Không gian để chậm lại.'],
                ['02', 'Tinh tế', 'Chỉn chu trong từng chi tiết.'],
                ['03', 'Chân thành', 'Đón tiếp bằng sự thấu hiểu.'],
              ].map(([number, title, description]) => (
                <div key={number} className="group rounded-[20px] border border-outline-variant bg-white/75 p-5 shadow-[0_12px_32px_rgba(35,77,66,0.045)] transition duration-300 hover:-translate-y-1 hover:border-brand-orange/30 hover:shadow-[0_18px_42px_rgba(35,77,66,0.09)]">
                  <span className="font-display text-xs font-bold text-brand-orange">{number}</span>
                  <h3 className="font-editorial mt-4 text-2xl font-semibold text-secondary">{title}</h3>
                  <p className="mt-2 text-xs leading-5 text-on-surface-variant">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="serene-image-lift group relative min-h-[500px] overflow-hidden rounded-[34px] border border-white/80 bg-[#EEE6D9] shadow-[0_34px_90px_rgba(23,58,49,0.14)] sm:min-h-[620px]">
            {brandStoryImage ? (
              <Image
                src={brandStoryImage}
                alt="Câu chuyện thương hiệu The Serene Villa"
                fill
                unoptimized
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover transition duration-[1100ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.045]"
              />
            ) : (
              <div className="absolute inset-5 flex flex-col items-center justify-center rounded-[24px] border border-dashed border-secondary/30 bg-[radial-gradient(circle_at_top,#f8f3ea,#e8dfd1)] px-8 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full border border-brand-orange/35 bg-white/75 text-brand-orange shadow-sm" aria-hidden>
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 5.5h16v13H4z" />
                    <circle cx="9" cy="10" r="1.5" />
                    <path d="m5.5 17 4.2-4.2 2.8 2.7 2.2-2.2 3.8 3.7" />
                  </svg>
                </span>
                <p className="eyebrow mt-6 text-brand-orange">Vị trí ảnh của bạn</p>
                <h3 className="font-editorial mt-3 text-3xl font-semibold text-secondary">Ảnh kể câu chuyện The Serene Villa</h3>
                <p className="mt-4 max-w-sm text-sm leading-7 text-on-surface-variant">Khu vực này đã được chừa sẵn để bạn thêm một ảnh về không gian villa, đội ngũ hoặc khoảnh khắc truyền cảm hứng cho tên thương hiệu.</p>
                <p className="mt-5 rounded-full border border-secondary/15 bg-white/65 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary/65">Khuyến nghị 1600 × 1200 px · Tỷ lệ 4:3</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="relative py-20 sm:py-28 lg:py-32">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 sm:px-8 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="eyebrow text-brand-orange">Sứ mệnh của chúng tôi</p>
            <span aria-hidden className="mt-6 block h-px w-20 bg-brand-orange" />
          </div>
          <div>
            <h2 className="font-editorial max-w-4xl text-4xl font-semibold leading-[1.15] text-secondary sm:text-5xl">Đưa sự minh bạch của công nghệ vào trải nghiệm lưu trú giàu cảm xúc.</h2>
            <div className="mt-8 grid gap-6 text-base leading-8 text-on-surface-variant md:grid-cols-2">
              <p>The Serene Villa giúp khách chủ động xem phòng, lịch trống, tiện nghi và giá; đồng thời giúp đội ngũ vận hành chuẩn bị đúng căn phòng, đúng thời điểm.</p>
              <p>Mục tiêu của chúng tôi là giảm thời gian chờ, hạn chế đặt trùng và giữ trải nghiệm nhất quán từ lúc khám phá đến khi hoàn tất kỳ lưu trú.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-outline-variant bg-[#FFFDFC]">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="grid lg:grid-cols-3">
            {values.map(([number, title, description], index) => (
              <article key={number} className={`py-10 lg:px-9 lg:py-14 ${index > 0 ? 'border-t border-outline-variant lg:border-l lg:border-t-0' : ''}`}>
                <span className="font-editorial text-3xl text-brand-orange">{number}</span>
                <h3 className="font-editorial mt-8 text-3xl font-semibold text-secondary">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-on-surface-variant">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="team-stories" className="relative overflow-hidden bg-[#F7F3EC] py-20 sm:py-28 lg:py-32">
        <div aria-hidden className="pointer-events-none absolute -left-48 bottom-0 h-96 w-96 rounded-full border border-secondary/[0.06]" />
        <div aria-hidden className="pointer-events-none absolute -right-32 top-16 h-72 w-72 rounded-full border border-brand-orange/10" />
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div>
              <p className="eyebrow text-brand-orange">Câu chuyện của chúng tôi</p>
              <h2 className="font-editorial mt-4 max-w-xl text-4xl font-semibold leading-[1.08] text-secondary sm:text-5xl">
                Những chuyến đi tạo nên cách chúng tôi đón tiếp.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-8 text-on-surface-variant lg:justify-self-end">
              Không chỉ xây dựng một nền tảng đặt phòng, chúng tôi còn cùng nhau trải nghiệm, lắng nghe và lưu giữ những khoảnh khắc thật — để hiểu điều gì làm nên một kỳ nghỉ đáng nhớ.
            </p>
          </div>

          <div className="mt-12 grid gap-7 lg:grid-cols-2">
            {teamStories.map((story, index) => (
              <article
                key={story.number}
                className={`serene-card-enter serene-stagger-${index + 1} serene-story-card group overflow-hidden rounded-[26px] border border-outline-variant bg-white shadow-[0_22px_60px_rgba(23,58,49,0.08)] ${index === 1 ? 'lg:mt-16' : ''}`}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-container">
                  <Image
                    src={story.image}
                    alt={story.imageAlt}
                    fill
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    style={{ objectPosition: story.objectPosition }}
                    className="object-cover transition duration-[1000ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.055]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/55 via-transparent to-transparent" />
                  <span className="absolute bottom-5 left-5 rounded-full border border-white/30 bg-secondary/75 px-4 py-2 font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md sm:bottom-6 sm:left-6">
                    Chuyện số {story.number}
                  </span>
                </div>

                <div className="p-6 sm:p-9">
                  <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-brand-orange">
                    {story.category}
                  </p>
                  <h3 className="font-editorial mt-4 text-3xl font-semibold leading-tight text-secondary sm:text-[2.15rem]">
                    {story.title}
                  </h3>
                  <p className="mt-5 text-sm leading-7 text-on-surface-variant sm:text-base sm:leading-8">
                    {story.excerpt}
                  </p>
                  <div className="mt-8 flex items-center gap-3 border-t border-outline-variant pt-5 text-xs font-semibold uppercase tracking-[0.14em] text-secondary/70">
                    <span className="h-2 w-2 rounded-full bg-brand-orange" />
                    The Serene Villa Journal
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <AboutNearbyPlacesCarousel />

      <section className="relative bg-[#EAE4D9] py-20 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="max-w-3xl lg:py-6">
            <p className="eyebrow text-brand-orange">Một hành trình liền mạch</p>
            <h2 className="font-editorial mt-4 text-4xl font-semibold leading-tight text-secondary sm:text-5xl">Từ lựa chọn đầu tiên đến lúc rời phòng.</h2>
          </div>
          <ol className="mt-12 grid gap-5 lg:grid-cols-3">
            {journey.map(([title, description], index) => (
              <li key={title} className="group relative overflow-hidden rounded-[22px] border border-outline-variant bg-[#F7F3EC] p-7 shadow-[0_12px_34px_rgba(35,77,66,0.05)] transition duration-300 hover:-translate-y-1 hover:border-brand-orange/30 hover:bg-white hover:shadow-[0_20px_48px_rgba(35,77,66,0.10)] sm:p-8">
                <span className="absolute right-5 top-1 font-editorial text-7xl text-secondary/[0.06]">{index + 1}</span>
                <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-brand-orange">Bước 0{index + 1}</p>
                <h3 className="font-editorial mt-8 text-3xl font-semibold text-secondary">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-on-surface-variant">{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="relative border-t border-outline-variant bg-[#F7F3EC] py-20 sm:py-28 lg:py-32">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="max-w-xl lg:sticky lg:top-28">
            <p className="eyebrow text-brand-orange">Trải nghiệm tại The Serene Villa</p>
            <h2 className="font-editorial mt-4 text-4xl font-semibold leading-[1.08] text-secondary sm:text-5xl">
              Một kỳ nghỉ được chuẩn bị để bạn chỉ việc tận hưởng.
            </h2>
            <p className="mt-6 text-base leading-8 text-on-surface-variant">
              Từ không gian chung đến từng căn phòng, mọi trải nghiệm đều hướng đến sự riêng tư, thuận tiện và cảm giác được chăm sóc chu đáo.
            </p>
            <Link
              href="/rooms"
              className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-secondary px-6 font-display text-sm font-semibold text-white shadow-[0_14px_30px_rgba(23,58,49,0.18)] transition hover:-translate-y-0.5 hover:bg-secondary-container"
            >
              Khám phá các không gian lưu trú
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: 'Không gian chung',
                description: 'Sân vườn, góc thư giãn và những khu vực được chuẩn bị để kết nối cùng người thân.',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden className="h-6 w-6">
                    <path d="M4 20h16M7 20v-5a5 5 0 0 1 10 0v5M12 3v6M8.5 6.5 12 3l3.5 3.5" />
                  </svg>
                ),
              },
              {
                title: 'Tiện nghi chỉn chu',
                description: 'Các hạng phòng được trang bị tiện nghi riêng để đáp ứng nhịp nghỉ ngơi của từng nhóm khách.',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden className="h-6 w-6">
                    <path d="M4 19V9h16v10M7 9V5h10v4M3 19h18M7 14h3m4 0h3" />
                  </svg>
                ),
              },
              {
                title: 'Vận hành minh bạch',
                description: 'Lịch phòng, trạng thái đặt chỗ và thông tin thanh toán được hiển thị rõ ràng trong từng bước.',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden className="h-6 w-6">
                    <path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" />
                  </svg>
                ),
              },
              {
                title: 'Hỗ trợ khi cần',
                description: 'Khách có thể chủ động gửi yêu cầu trong hành trình lưu trú để đội ngũ tiếp nhận kịp thời.',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden className="h-6 w-6">
                    <path d="M20 15.5a4.5 4.5 0 0 1-4.5 4.5H12l-4 2v-2.8A4.5 4.5 0 0 1 4 15.5v-7A4.5 4.5 0 0 1 8.5 4h7A4.5 4.5 0 0 1 20 8.5zM8 10h8m-8 3h5" />
                  </svg>
                ),
              },
            ].map((experience) => (
              <article
                key={experience.title}
                className="group rounded-[24px] border border-outline-variant bg-white p-6 shadow-[0_16px_46px_rgba(23,58,49,0.06)] transition duration-300 hover:-translate-y-1.5 hover:border-brand-orange/35 hover:shadow-[0_26px_62px_rgba(23,58,49,0.12)] sm:p-7"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0E5D4] text-secondary transition duration-300 group-hover:bg-secondary group-hover:text-white">
                  {experience.icon}
                </span>
                <h3 className="font-editorial mt-7 text-2xl font-semibold text-secondary">{experience.title}</h3>
                <p className="mt-3 text-sm leading-7 text-on-surface-variant">{experience.description}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-[1400px] px-5 sm:px-8">
          <div className="rounded-[20px] border border-brand-orange/20 bg-[#F4EBDD] px-5 py-4 text-sm leading-6 text-on-surface-variant sm:px-6">
            <span className="font-semibold text-secondary">Lưu ý về mô hình:</span>{' '}
            The Serene Villa là mô hình giả lập phục vụ mục tiêu nghiên cứu và phát triển hệ thống quản lý đặt phòng. Thông tin phòng, giá, tiện nghi và quy trình vận hành được xây dựng theo nghiệp vụ thực tế, không đại diện cho một cơ sở lưu trú đang hoạt động.
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-secondary py-20 text-white sm:py-24 lg:py-28">
        <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full border border-white/[0.07]" />
        <div aria-hidden className="pointer-events-none absolute -left-24 -bottom-32 h-64 w-64 rounded-full border border-primary-fixed/10" />
        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl lg:py-6">
            <p className="eyebrow text-primary-fixed">Trải nghiệm The Serene Villa</p>
            <h2 className="font-editorial mt-4 text-4xl font-semibold leading-tight sm:text-5xl">Không chỉ là một căn phòng. Đó là cảm giác được đón tiếp chu đáo.</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/rooms" className="rounded-full border border-white/20 bg-[#0f2f27] px-6 py-3.5 font-display text-sm font-semibold text-white shadow-[0_14px_30px_rgba(0,0,0,.22)] transition hover:-translate-y-0.5 hover:bg-secondary-container">Khám phá phòng</Link>
            <Link href="/support" className="rounded-full border border-white/25 px-6 py-3.5 font-display text-sm font-semibold transition hover:bg-white/10">Liên hệ hỗ trợ</Link>
          </div>
        </div>
      </section>
    </main>
  )
}