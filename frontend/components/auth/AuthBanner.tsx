import Image from 'next/image'
import SereneVillaWordmark from '@/components/layout/SereneVillaWordmark'

type AuthBannerProps = {
  description?: string
  bullets?: { title: string; desc: string }[]
}

export default function AuthBanner(_props: AuthBannerProps) {
  return (
    <aside className="relative hidden min-h-screen overflow-hidden bg-[#F4EFE6] lg:flex lg:w-[46%] lg:flex-col">
      <div className="relative z-10 flex min-h-[9.5rem] shrink-0 items-center justify-center border-t-[5px] border-[#234D42] bg-[#F7F3EB] px-8 shadow-[0_12px_30px_rgba(35,77,66,.08)] xl:min-h-[10.5rem]">
        <SereneVillaWordmark className="text-[#52766B]" />
      </div>

      <div className="relative min-h-0 flex-1">
        <Image
          src="/images/homestay-luxury-hero.webp"
          alt=""
          fill
          priority
          sizes="46vw"
          className="object-cover object-center"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(35,77,66,.04),rgba(23,59,50,.18))]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-x-0 top-0 h-px bg-white/65"
          aria-hidden="true"
        />
      </div>
    </aside>
  )
}
