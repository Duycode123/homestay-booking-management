'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  dismissNewCustomerOffer,
  fetchNewCustomerOffer,
  hasDismissedNewCustomerOffer,
  rememberSelectedCoupon,
  type NewCustomerOffer,
} from '@/lib/new-customer-offer'

export default function NewCustomerOfferModal() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [offer, setOffer] = useState<NewCustomerOffer | null>(null)

  useEffect(() => {
    if (isLoading || hasDismissedNewCustomerOffer()) return
    if (user && user.role !== 'CUSTOMER') return

    let active = true
    void fetchNewCustomerOffer()
      .then((result) => {
        if (active && result.eligible) setOffer(result)
      })
      .catch(() => {
        // The promotion remains hidden when eligibility cannot be verified.
      })

    return () => {
      active = false
    }
  }, [isLoading, user])

  useEffect(() => {
    if (!offer) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeOffer()
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [offer])

  const closeOffer = () => {
    dismissNewCustomerOffer()
    setOffer(null)
  }

  const exploreRooms = () => {
    if (!offer) return
    rememberSelectedCoupon(offer.code)
    dismissNewCustomerOffer()
    setOffer(null)
    router.push(`/rooms?promotion=${encodeURIComponent(offer.code)}`)
  }

  if (!offer) return null

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#234D42]/70 px-4 py-6 backdrop-blur-[5px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeOffer()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-customer-offer-title"
        aria-describedby="new-customer-offer-description"
        className="relative grid max-h-[calc(100dvh-1rem)] w-full max-w-[860px] overflow-y-auto overscroll-contain rounded-t-[24px] border border-white/50 bg-[#FBF8F2] shadow-[0_34px_100px_rgba(8,30,24,.35)] sm:max-h-[calc(100dvh-3rem)] sm:rounded-[30px] md:grid-cols-[.9fr_1.1fr]"
      >
        <button
          type="button"
          onClick={closeOffer}
          aria-label="Đóng ưu đãi"
          className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/55 bg-white/85 text-[#234D42] shadow-sm backdrop-blur transition hover:rotate-90 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C18B52]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
          </svg>
        </button>

        <div className="relative min-h-[235px] overflow-hidden md:min-h-[500px]">
          <Image
            src="/images/Bannercoupon.png"
            alt="Không gian nghỉ dưỡng xanh tại The Serene Villa"
            fill
            priority
            sizes="(max-width: 767px) 100vw, 390px"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#234D42]/70 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#234D42]/15" />
          <div className="absolute bottom-5 left-5 rounded-full border border-white/35 bg-[#234D42]/72 px-4 py-2 text-[11px] font-bold uppercase tracking-[.2em] text-white backdrop-blur">
            Ưu đãi chào đón
          </div>
        </div>

        <div className="relative flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-10 md:px-12">
          <div className="absolute right-8 top-9 hidden h-24 w-24 rounded-full border border-[#C18B52]/15 md:block" />
          <p className="text-[11px] font-bold uppercase tracking-[.24em] text-[#B47D46]">Dành riêng cho kỳ nghỉ đầu tiên</p>
          <div className="mt-5 flex items-end gap-3">
            <span className="font-editorial text-[5.2rem] font-semibold leading-[.8] tracking-[-.06em] text-[#234D42] sm:text-[6rem]">
              {offer.discountPercent}%
            </span>
            <span className="pb-1.5 text-sm font-bold uppercase tracking-[.18em] text-[#B47D46]">giảm ngay</span>
          </div>

          <h2 id="new-customer-offer-title" className="mt-7 font-editorial text-3xl font-semibold leading-tight text-[#234D42] sm:text-[2.15rem]">
            Lần đầu ghé Serene,<br />nhẹ nhàng hơn một chút.
          </h2>
          <p id="new-customer-offer-description" className="mt-4 text-sm leading-6 text-[#6C706B]">
            Chọn căn phòng bạn yêu thích và dùng mã dưới đây cho booking đầu tiên tại The Serene Villa.
          </p>

          <div className="mt-6 flex items-center justify-between rounded-2xl border border-dashed border-[#B47D46]/45 bg-white px-4 py-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8B8B83]">Mã ưu đãi</p>
              <p className="mt-0.5 text-lg font-extrabold tracking-[.12em] text-[#234D42]">{offer.code}</p>
            </div>
            <span className="rounded-full bg-[#E9F3EE] px-3 py-1.5 text-xs font-bold text-[#52766B]">Booking đầu tiên</span>
          </div>

          <button
            type="button"
            onClick={exploreRooms}
            className="mt-6 inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-[#234D42] px-6 font-display text-sm font-bold text-white shadow-[0_16px_34px_rgba(23,58,49,.23)] transition hover:-translate-y-0.5 hover:bg-[#52766B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C18B52] focus-visible:ring-offset-2"
          >
            Chọn phòng ngay
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14m-5-5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <p className="mt-3 text-center text-[11px] leading-5 text-[#8B8B83]">
            Mỗi khách hàng chỉ được áp dụng một lần cho booking đầu tiên.
          </p>
        </div>
      </section>
    </div>
  )
}
