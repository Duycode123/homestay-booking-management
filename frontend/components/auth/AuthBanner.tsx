const DEFAULT_BULLETS = [
  { title: 'Đặt phòng liền mạch', desc: 'Chọn không gian và hoàn tất đặt phòng chỉ trong vài bước.' },
  { title: 'Không gian được tuyển chọn', desc: 'Mỗi phòng đều được chuẩn bị kỹ lưỡng trước khi đón khách.' },
  { title: 'Đồng hành suốt kỳ nghỉ', desc: 'Đội ngũ vận hành luôn sẵn sàng khi bạn cần hỗ trợ.' },
]

const STATS = [
  { value: 'Rõ ràng', label: 'Thông tin phòng' },
  { value: 'Linh hoạt', label: 'Khung giờ đặt' },
  { value: 'Chu đáo', label: 'Hỗ trợ lưu trú' },
]

type AuthBannerProps = {
  description?: string
  bullets?: { title: string; desc: string }[]
}

function HomestayMark() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.75 11.25 12 4.5l8.25 6.75v7.5a.75.75 0 0 1-.75.75h-15a.75.75 0 0 1-.75-.75v-7.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M9.25 19.5v-5.25h5.5v5.25" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path
        d="M15.8 5.7c.25-1.65 1.35-2.7 3.2-2.95-.12 1.7-1.2 2.73-3.2 2.95Z"
        fill="currentColor"
      />
    </svg>
  )
}

export default function AuthBanner({
  description = 'Một nơi ở chỉn chu, ấm áp và đủ riêng tư để bạn thực sự tận hưởng từng khoảnh khắc của chuyến đi.',
  bullets = DEFAULT_BULLETS,
}: AuthBannerProps) {
  return (
    <aside className="relative hidden min-h-screen overflow-hidden bg-brand-greenDark text-white lg:flex lg:w-[48%] lg:flex-col">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            'radial-gradient(circle at 82% 15%, rgba(196,158,106,0.22), transparent 30%), radial-gradient(circle at 2% 90%, rgba(255,255,255,0.08), transparent 28%)',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" aria-hidden="true" />

      <div className="relative z-10 flex min-h-screen flex-col px-10 py-9 xl:px-16 xl:py-12">
        <div className="flex items-center justify-between gap-5">
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-brand-orange backdrop-blur-sm">
              <HomestayMark />
            </span>
            <div>
              <p className="font-display text-lg font-semibold tracking-[0.01em] text-white">The Serene Villa</p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.24em] text-white/55">
                Curated stays · Thoughtful service
              </p>
            </div>
          </div>
          <span className="hidden rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70 xl:inline-flex">
            Kỳ nghỉ riêng tư
          </span>
        </div>

        <div className="my-auto max-w-xl py-12">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-orange">
            A quiet place to belong
          </p>
          <h2 className="font-editorial max-w-[12ch] text-5xl font-semibold leading-[1.04] tracking-[-0.035em] text-white xl:text-6xl">
            Một kỳ nghỉ dịu dàng, bắt đầu từ đây.
          </h2>
          <p className="mt-6 max-w-lg text-[15px] leading-7 text-white/66">{description}</p>

          <ul className="mt-10 grid gap-3" aria-label="Lợi ích khi đặt phòng">
            {bullets.map((item) => (
              <li
                key={item.title}
                className="group flex items-start gap-4 border-t border-white/12 py-4 transition-colors first:border-t-0"
              >
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand-orange/45 text-brand-orange">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="m5.5 10.25 2.7 2.7 6.3-6.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div>
                  <p className="font-display text-[15px] font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-white/55">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-3 border-y border-white/12">
          {STATS.map((stat) => (
            <div key={stat.label} className="border-r border-white/12 px-3 py-4 first:pl-0 last:border-r-0 last:pr-0">
              <p className="font-editorial text-lg font-semibold text-primary-fixed">{stat.value}</p>
              <p className="mt-1 text-[10px] uppercase leading-4 tracking-[0.12em] text-white/45">{stat.label}</p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-[10px] tracking-[0.08em] text-white/35">© 2026 The Serene Villa</p>
      </div>
    </aside>
  )
}
