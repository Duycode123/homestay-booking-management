import Image from 'next/image'
import SereneVillaWordmark from '@/components/layout/SereneVillaWordmark'

type AuthBannerProps = {
  description?: string
  bullets?: { title: string; desc: string }[]
}

export default function AuthBanner({
  description = 'Một không gian riêng tư, chỉn chu cho những ngày bạn muốn sống chậm hơn.',
}: AuthBannerProps) {
  return (
    <aside className="relative hidden min-h-screen overflow-hidden bg-[#514C44] text-white lg:flex lg:w-[46%] lg:flex-col">
      <Image
        src="/images/homestay-luxury-hero.webp"
        alt=""
        fill
        priority
        sizes="46vw"
        className="object-cover object-center"
      />

      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(50,46,41,.66)_0%,rgba(50,46,41,.34)_42%,rgba(50,46,41,.88)_100%)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(221,202,177,.18),transparent_32%)]"
        aria-hidden="true"
      />

      <BotanicalDecoration className="-left-20 top-[15%] h-72 w-72 -rotate-12 opacity-[0.16]" />
      <BotanicalDecoration className="-bottom-20 -right-16 h-80 w-80 rotate-[165deg] opacity-[0.13]" />

      <div className="relative z-10 flex min-h-screen flex-col px-10 py-9 xl:px-14 xl:py-11">
        <SereneVillaWordmark compact className="text-[#F4EFE6]" />

        <div className="my-auto max-w-[34rem] py-12">
          <span className="mb-7 block h-px w-14 bg-[#D9C2A8]" aria-hidden="true" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#E2CBAF]">
            A quiet place to belong
          </p>
          <h2 className="font-editorial mt-5 max-w-[11ch] text-5xl font-medium leading-[1.02] text-[#FFFDF9] xl:text-[3.75rem]">
            Một kỳ nghỉ dịu dàng, bắt đầu từ đây.
          </h2>
          <p className="mt-6 max-w-md text-sm leading-7 text-white/68 line-clamp-2">
            {description}
          </p>
        </div>

        <div className="flex items-end justify-between border-t border-white/18 pt-5">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.26em] text-[#E2CBAF]">
              The Serene Villa
            </p>
            <p className="mt-1.5 text-xs tracking-[0.08em] text-white/52">Hanoi · Private stays</p>
          </div>
          <span className="font-editorial text-3xl font-medium text-white/42">01</span>
        </div>
      </div>
    </aside>
  )
}

function BotanicalDecoration({ className }: { className: string }) {
  return (
    <svg
      className={`pointer-events-none absolute text-[#E8D9C6] ${className}`}
      viewBox="0 0 220 220"
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="110" cy="110" rx="67" ry="82" stroke="currentColor" strokeWidth="1.1" />
      <path
        d="M71 92C47 73 33 49 29 20M149 143c25 17 41 39 46 66M54 76l-22-4m29 11-3-21M44 61 26 51m26 17 4-18m108 108 21 1m-29-9 3 20m8-7 18 8m-25-16-5 18"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
      <g fill="currentColor" opacity="0.78">
        <ellipse cx="29" cy="21" rx="6" ry="12" transform="rotate(-28 29 21)" />
        <ellipse cx="26" cy="51" rx="6" ry="12" transform="rotate(-62 26 51)" />
        <ellipse cx="32" cy="72" rx="6" ry="12" transform="rotate(-76 32 72)" />
        <ellipse cx="55" cy="50" rx="6" ry="12" transform="rotate(31 55 50)" />
        <ellipse cx="59" cy="72" rx="6" ry="12" transform="rotate(18 59 72)" />
        <ellipse cx="195" cy="208" rx="6" ry="12" transform="rotate(-25 195 208)" />
        <ellipse cx="185" cy="171" rx="6" ry="12" transform="rotate(-70 185 171)" />
        <ellipse cx="158" cy="173" rx="6" ry="12" transform="rotate(25 158 173)" />
        <ellipse cx="162" cy="153" rx="6" ry="12" transform="rotate(12 162 153)" />
      </g>
    </svg>
  )
}
