import Image from 'next/image'
import Link from 'next/link'
import CommonAmenitiesShowcase from '@/components/public/CommonAmenitiesShowcase'
import { createPublicPageMetadata } from '@/lib/seo'

export const metadata = createPublicPageMetadata({
  title: 'Tiện nghi homestay',
  description:
    'Khám phá hệ tiện nghi, tiêu chuẩn chuẩn bị phòng và dịch vụ hỗ trợ tại The Serene Villa trước khi lựa chọn không gian lưu trú.',
  path: '/amenities',
})

const amenityGroups = [
  {
    number: '01',
    title: 'Kết nối & giải trí',
    description: 'Duy trì nhịp làm việc, kết nối và thư giãn ngay trong không gian riêng.',
    items: ['Wi-Fi tốc độ cao', 'Smart TV', 'Kết nối giải trí trong phòng'],
  },
  {
    number: '02',
    title: 'Không gian nghỉ ngơi',
    description: 'Những tiện nghi thiết yếu được chuẩn bị để kỳ nghỉ luôn dễ chịu.',
    items: ['Điều hòa', 'Giường và chăn gối', 'Không gian riêng tư'],
  },
  {
    number: '03',
    title: 'Phòng tắm',
    description: 'Các vật dụng cơ bản sẵn sàng cho trải nghiệm lưu trú thuận tiện.',
    items: ['Máy nước nóng', 'Khăn tắm', 'Đồ dùng cá nhân cơ bản'],
  },
  {
    number: '04',
    title: 'Tiện nghi trong phòng',
    description: 'Từng chi tiết nhỏ giúp bạn chủ động hơn trong thời gian lưu trú.',
    items: ['Tủ lạnh mini', 'Ấm đun nước', 'Khu vực để hành lý'],
  },
  {
    number: '05',
    title: 'An tâm lưu trú',
    description: 'Phòng được kiểm tra theo quy trình trước thời điểm nhận phòng.',
    items: ['Kiểm tra vệ sinh', 'Kiểm tra thiết bị', 'Hỗ trợ sự cố tại chỗ'],
  },
  {
    number: '06',
    title: 'Dịch vụ hỗ trợ',
    description: 'Yêu cầu của bạn được kết nối với đội ngũ vận hành trên hệ thống.',
    items: ['Hỗ trợ check-in', 'Theo dõi lịch đặt', 'Tiếp nhận yêu cầu hỗ trợ'],
  },
] as const

const preparationSteps = [
  ['Trước khi đến', 'Đội ngũ kiểm tra vệ sinh, thiết bị và ghi chú trong đơn đặt phòng.'],
  ['Khi nhận phòng', 'Thông tin đặt chỗ được đối chiếu để quá trình check-in rõ ràng, nhanh chóng.'],
  ['Trong kỳ lưu trú', 'Bạn có thể gửi yêu cầu hỗ trợ hoặc báo cáo sự cố ngay trong tài khoản.'],
] as const

export default function AmenitiesPage() {
  return (
    <main id="main-content" className="bg-[#F7F3EC] text-on-surface">
      <section className="relative overflow-hidden bg-secondary text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_15%,rgba(216,181,136,0.18),transparent_34%),linear-gradient(120deg,rgba(5,35,28,0.98),rgba(18,73,57,0.82))]" />
        <div className="relative mx-auto grid max-w-[1400px] gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="eyebrow text-primary-fixed">Tiện nghi homestay</p>
            <h1 className="font-editorial mt-5 text-5xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-6xl">
              Tiện nghi vừa đủ.
              <span className="mt-2 block text-primary-fixed">Trải nghiệm trọn vẹn.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-white/74 sm:text-lg">
              Từ kết nối, nghỉ ngơi đến hỗ trợ tại chỗ, mỗi chi tiết được chuẩn bị để bạn cảm thấy thoải mái và chủ động trong suốt kỳ lưu trú.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/rooms" className="rounded-full bg-white px-6 py-3.5 font-display text-sm font-semibold text-secondary transition hover:-translate-y-0.5">
                Tìm phòng phù hợp
              </Link>
              <a href="#amenity-list" className="rounded-full border border-white/25 px-6 py-3.5 font-display text-sm font-semibold text-white transition hover:bg-white/10">
                Xem danh sách tiện nghi
              </a>
            </div>
          </div>

          <div className="relative min-h-[390px] overflow-hidden rounded-[22px] border border-white/15 shadow-[0_32px_80px_rgba(0,0,0,0.28)] sm:min-h-[500px]">
            <Image src="/images/Banner3-sharp.png?v=20260715-enhanced" alt="Khu homestay giữa thiên nhiên với hồ bơi và tiện nghi chung" fill priority unoptimized sizes="(max-width: 1024px) 100vw, 55vw" className="banner-image-native object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary-fixed">Chuẩn bị trước check-in</p>
              <p className="mt-2 max-w-md font-editorial text-2xl leading-snug">Phòng sạch, thiết bị được kiểm tra và nhu cầu lưu trú được ghi nhận.</p>
            </div>
          </div>
        </div>
      </section>

      <CommonAmenitiesShowcase />

      <section id="amenity-list" className="scroll-mt-24 py-20 sm:py-24">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="grid gap-8 border-b border-outline-variant pb-12 lg:grid-cols-[0.8fr_1.2fr]">
            <p className="eyebrow text-brand-orange">Danh mục tiện nghi</p>
            <div>
              <h2 className="font-editorial text-4xl font-semibold leading-tight text-secondary sm:text-5xl">Mọi điều cần thiết cho một khoảng nghỉ dễ chịu.</h2>
              <p className="mt-5 max-w-2xl leading-8 text-on-surface-variant">Tiện nghi thực tế có thể khác nhau theo từng hạng phòng. Trang chi tiết phòng luôn là nguồn thông tin chính xác trước khi bạn xác nhận đặt chỗ.</p>
            </div>
          </div>

          <div className="mt-10 grid gap-px overflow-hidden rounded-[20px] border border-outline-variant bg-outline-variant md:grid-cols-2 lg:grid-cols-3">
            {amenityGroups.map((group) => (
              <article key={group.number} className="group bg-white p-7 transition-colors hover:bg-[#FCFAF6] sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="font-editorial text-3xl text-brand-orange">{group.number}</span>
                  <span aria-hidden className="h-px w-10 bg-outline transition-all group-hover:w-16 group-hover:bg-brand-orange" />
                </div>
                <h3 className="mt-8 font-editorial text-2xl font-semibold text-secondary">{group.title}</h3>
                <p className="mt-3 min-h-14 text-sm leading-7 text-on-surface-variant">{group.description}</p>
                <ul className="mt-6 space-y-3 border-t border-outline-variant pt-5">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-on-surface">
                      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#EAE4D9] py-20 sm:py-24">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="eyebrow text-brand-orange">Tiêu chuẩn phục vụ</p>
              <h2 className="font-editorial mt-4 text-4xl font-semibold leading-tight text-secondary">Chỉn chu trước khi bạn mở cửa phòng.</h2>
            </div>
            <ol className="divide-y divide-outline">
              {preparationSteps.map(([title, description], index) => (
                <li key={title} className="grid gap-3 py-7 first:pt-0 sm:grid-cols-[64px_180px_1fr] sm:items-start">
                  <span className="font-editorial text-2xl text-brand-orange">0{index + 1}</span>
                  <h3 className="font-display font-semibold text-secondary">{title}</h3>
                  <p className="text-sm leading-7 text-on-surface-variant">{description}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="bg-secondary px-5 py-16 text-center text-white sm:px-8 sm:py-20">
        <p className="eyebrow text-primary-fixed">Sẵn sàng cho kỳ nghỉ</p>
        <h2 className="font-editorial mx-auto mt-4 max-w-2xl text-4xl font-semibold">Chọn không gian phù hợp với nhịp nghỉ của bạn.</h2>
        <Link href="/rooms" className="mt-8 inline-flex rounded-full bg-primary-fixed px-7 py-3.5 font-display text-sm font-semibold text-secondary transition hover:bg-white">Khám phá phòng homestay</Link>
      </section>
    </main>
  )
}
