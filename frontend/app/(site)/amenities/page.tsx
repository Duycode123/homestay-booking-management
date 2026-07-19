import Image from 'next/image'
import Link from 'next/link'
import CommonAmenitiesShowcase from '@/components/public/CommonAmenitiesShowcase'
import { createPublicPageMetadata } from '@/lib/seo'
import AmenitiesExplorer from './AmenitiesExplorer'

export const metadata = createPublicPageMetadata({
  title: "Tiện nghi homestay",
  description:
    "Khám phá tiện nghi trong phòng, tiện ích chung, tiêu chuẩn chuẩn bị phòng và dịch vụ hỗ trợ tại The Serene Villa.",
  path: "/amenities",
});

const preparationSteps = [
  {
    number: "01",
    title: "Trước khi bạn đến",
    description:
      "Không gian, vệ sinh, thiết bị và ghi chú trong đơn đặt phòng được kiểm tra trước giờ nhận phòng.",
  },
  {
    number: "02",
    title: "Khi nhận phòng",
    description:
      "Thông tin đặt chỗ được đối chiếu để quá trình check-in rõ ràng và thuận tiện hơn.",
  },
  {
    number: "03",
    title: "Trong kỳ lưu trú",
    description:
      "Yêu cầu hỗ trợ hoặc báo cáo sự cố được tiếp nhận trực tiếp trên hệ thống.",
  },
] as const;

export default function AmenitiesPage() {
  return (
    <main
      id="main-content"
      className="overflow-x-hidden bg-[#F7F3EC] text-on-surface"
    >
      <section className="relative isolate overflow-hidden bg-secondary text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_15%,rgba(216,181,136,0.18),transparent_34%),linear-gradient(120deg,rgba(5,35,28,0.98),rgba(18,73,57,0.82))]" />
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
              Tiện nghi The Serene Villa
            </p>

            <h1 className="font-editorial mt-5 text-5xl font-semibold leading-[1.01] tracking-[-0.035em] sm:text-6xl lg:text-[4.25rem]">
              Mọi thứ cần thiết,
              <span className="mt-2 block text-primary-fixed">
                được chuẩn bị vừa đủ.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-white/72 sm:text-lg">
              Từ tiện nghi trong phòng đến hồ bơi, sân vườn và những không gian
              sinh hoạt chung, mỗi chi tiết đều hướng đến một kỳ nghỉ nhẹ nhàng,
              chủ động và không cần bận tâm quá nhiều.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#amenity-list"
                className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 font-display text-sm font-semibold text-secondary shadow-[0_14px_32px_rgba(0,0,0,0.2)] transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-primary-fixed"
              >
                Khám phá tiện nghi
              </a>

              <a
                href="#common-amenities"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/25 bg-white/[0.03] px-6 font-display text-sm font-semibold text-white transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-white/45 hover:bg-white/10"
              >
                Xem tiện ích chung
              </a>
            </div>

            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              {[
                "Kiểm tra trước check-in",
                "Thông tin rõ theo từng phòng",
                "Hỗ trợ khi có phát sinh",
              ].map((item) => (
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
              alt="Khu homestay giữa thiên nhiên với hồ bơi và không gian sinh hoạt chung"
              fill
              priority
              unoptimized
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="banner-image-native object-cover object-center"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-secondary/88 via-secondary/5 to-black/5" />

            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-fixed">
                Trong phòng &amp; khu vực chung
              </p>
              <p className="font-editorial mt-2 max-w-lg text-2xl font-semibold leading-snug sm:text-3xl">
                Tiện nghi không chỉ để sử dụng, mà để kỳ nghỉ diễn ra tự nhiên
                và dễ chịu hơn.
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
              <p className="eyebrow text-brand-orange">Tiêu chuẩn chuẩn bị</p>

              <h2 className="font-editorial mt-4 text-4xl font-semibold leading-[1.08] text-secondary sm:text-5xl">
                Chỉn chu trước khi bạn mở cửa phòng.
              </h2>

              <p className="mt-4 text-sm leading-7 text-on-surface-variant sm:text-base">
                Một quy trình ngắn gọn nhưng rõ ràng giúp không gian và các tiện
                nghi thiết yếu luôn sẵn sàng đúng thời điểm.
              </p>
            </div>

            <ol className="overflow-hidden rounded-[22px] border border-outline-variant bg-white/75 shadow-[0_14px_34px_rgba(63,51,35,0.06)]">
              {preparationSteps.map((step, index) => (
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
          <p className="eyebrow text-primary-fixed">Sẵn sàng cho kỳ nghỉ</p>

          <h2 className="font-editorial mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
            Chọn không gian phù hợp với nhịp nghỉ của bạn.
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-7 text-white/65 sm:text-base">
            Xem tiện nghi chính xác của từng hạng phòng, so sánh lựa chọn và
            kiểm tra lịch trống trước khi đặt.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/rooms"
              className="inline-flex h-12 items-center justify-center rounded-full bg-white px-7 font-display text-sm font-semibold text-secondary shadow-[0_14px_30px_rgba(0,0,0,.2)] transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-primary-fixed"
            >
              Khám phá phòng homestay
            </Link>

            <Link
              href="/support"
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/22 px-7 font-display text-sm font-semibold text-white transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/10"
            >
              Cần tư vấn
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}