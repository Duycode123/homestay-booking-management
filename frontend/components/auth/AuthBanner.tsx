const DEFAULT_BULLETS = [
  { title: 'Đặt phòng 30 giây', desc: 'Chọn phòng, khung giờ và xác nhận ngay trên app.' },
  { title: 'Ưu đãi hàng tuần', desc: 'Mã giảm giá và gói tập dành riêng cho thành viên.' },
  { title: 'Hỗ trợ 24/7', desc: 'Kỹ thuật viên luôn sẵn sàng trong ca trực.' },
]

const STATS = [
  { value: '6+', label: 'Phòng homestay' },
  { value: '24/7', label: 'Vận hành' },
  { value: '100%', label: 'Cách âm' },
]

type AuthBannerProps = {
  description?: string
  bullets?: { title: string; desc: string }[]
}

export default function AuthBanner({
  description = 'Không gian homestay sạch sẽ, tiện nghi hiện đại và sẵn sàng cho khách cá nhân, cặp đôi hoặc gia đình.',
  bullets = DEFAULT_BULLETS,
}: AuthBannerProps) {
  return (
    <div className="relative hidden overflow-hidden md:flex md:w-1/2 md:flex-col md:justify-between">
      {/* Background layers */}
      <div className="absolute inset-0 bg-[#021a0e]" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#021a0e] via-brand-greenDark to-brand-greenLight" />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 3px)',
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute -right-20 top-1/4 h-96 w-96 rounded-full bg-brand-orange/20 blur-[100px]" aria-hidden />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-tertiary/15 blur-[80px]" aria-hidden />

      {/* Decorative waveform */}
      <svg
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 w-full text-white/[0.04]"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          fill="currentColor"
          d="M0,60 C150,20 300,100 450,60 C600,20 750,100 900,60 C1050,20 1200,80 1200,80 L1200,120 L0,120 Z"
        />
      </svg>

      {/* Orange accent stripe */}
      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-brand-orange via-brand-orange/60 to-transparent" />

      <div className="relative z-10 flex flex-1 flex-col p-12 lg:p-16">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-orange shadow-lg shadow-brand-orange/30">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 19V6l12-3v13M9 10l12-3M9 14c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm12-4c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z"
                />
              </svg>
            </div>
            <div>
              <p className="font-display text-xl font-bold tracking-tight text-white">Homestay Booking</p>
              <p className="font-display text-[10px] font-medium uppercase tracking-[0.25em] text-on-secondary-container">
                Premium Practice Rooms
              </p>
            </div>
          </div>
          <span className="rounded-full bg-tertiary-container/90 px-3 py-1 font-display text-[10px] font-semibold uppercase tracking-wider text-on-tertiary-container">
            Family Suite
          </span>
        </div>

        {/* Stats row */}
        <div className="mt-10 grid grid-cols-3 gap-3">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm"
            >
              <p className="font-display text-2xl font-bold text-brand-orange">{stat.value}</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-wider text-on-secondary-container/80">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Hero copy */}
        <div className="my-auto max-w-lg space-y-5 py-10">
          <p className="font-display text-xs font-medium uppercase tracking-[0.3em] text-brand-orange">
            Warm Homestay Premium
          </p>
          <h2 className="font-display text-4xl font-bold leading-[1.15] tracking-tight text-white lg:text-[2.75rem]">
            Không gian lưu trú
            <br />
            <span className="bg-gradient-to-r from-brand-orange to-primary-fixed bg-clip-text text-transparent">
              chuẩn homestay
            </span>
          </h2>
          <p className="text-sm leading-relaxed text-on-secondary-container">{description}</p>
        </div>

        {/* Feature cards */}
        <ul className="space-y-3">
          {bullets.map((item, i) => (
            <li
              key={item.title}
              className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm transition-colors hover:bg-white/[0.09]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-orange/20 font-display text-sm font-bold text-brand-orange">
                {i + 1}
              </span>
              <div>
                <p className="font-display text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-on-secondary-container/80">{item.desc}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-[11px] tracking-wide text-white/35">© 2026 Homestay Booking. All rights reserved.</p>
      </div>
    </div>
  )
}
