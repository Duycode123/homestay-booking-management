'use client'

import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { useCallback, useMemo, useState } from 'react'

// Ảnh địa điểm được quản lý trực tiếp trong frontend/public/images.
// Khi bổ sung ảnh, giữ đúng tên tệp bên dưới để ảnh hiển thị tự động.
// Ảnh được quản lý trực tiếp trong `frontend/public/images`.
// Mỗi ảnh có điểm cắt riêng để vẫn rõ nét, đồng đều trong cùng khung dọc 4:5.
const nearbyHighlights = [
  {
    id: 'moganshan',
    name: 'Mạc Can Sơn',
    note: 'Một khoảng rừng tuyết tĩnh lặng, dành cho hành trình tìm về nhịp đi chậm và riêng tư.',
    image: '/images/Maccanson.jpg',
    position: 'center 58%',
  },
  {
    id: 'dali',
    name: 'Đại Lý',
    note: 'Nét an yên của phố cổ và hồ nước, nơi một buổi sáng cũng đủ để lưu lại thật lâu.',
    image: '/images/Daily-sharp.png',
    position: 'center 48%',
  },
  {
    id: 'lijiang',
    name: 'Lệ Giang',
    note: 'Những mái nhà cổ, dòng nước nhỏ và nhịp sống vừa đủ chậm để thưởng ngoạn.',
    image: '/images/Legiang-sharp.png',
    position: 'center 50%',
  },
  {
    id: 'jiangnan-village',
    name: 'Thôn cổ Giang Nam',
    note: 'Một góc làng cổ mộc mạc, gợi cảm giác bình yên cho những ngày muốn tạm rời phố thị.',
    image: '/images/Thonco-sharp.png',
    position: 'center 46%',
  },
  {
    id: 'fenghuang',
    name: 'Phượng Hoàng Cổ Trấn',
    note: 'Đèn ven sông, mái ngói cổ và không khí lãng đãng cho một buổi tối đầy cảm hứng.',
    image: '/images/Phuonghoangcotran-sharp.png',
    position: 'center 52%',
  },
] as const

const stackOffsets = [
  { x: 0, y: 0, rotate: -4, scale: 1 },
  { x: 64, y: -12, rotate: 5, scale: 0.94 },
  { x: 112, y: 18, rotate: -3, scale: 0.89 },
  { x: 158, y: -20, rotate: 6, scale: 0.84 },
  { x: 196, y: 26, rotate: -5, scale: 0.79 },
] as const

export function AboutNearbyPlacesCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const prefersReducedMotion = useReducedMotion()

  const orderedHighlights = useMemo(
    () => nearbyHighlights.map((_, index) => nearbyHighlights[(activeIndex + index) % nearbyHighlights.length]),
    [activeIndex],
  )

  const showNext = useCallback(() => {
    setActiveIndex((current) => (current + 1) % nearbyHighlights.length)
  }, [])

  return (
    <section className="overflow-hidden border-y border-outline-variant bg-white py-20 sm:py-28">
      <div className="mx-auto grid max-w-[1400px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-[0.86fr_1.14fr] lg:gap-16">
        <div className="max-w-xl">
          <p className="eyebrow text-brand-orange">Gợi ý cho hành trình của bạn</p>
          <h2 className="font-editorial mt-5 text-4xl font-semibold leading-[1.08] text-secondary sm:text-5xl">
            Mỗi chuyến đi đều đẹp hơn khi có thêm vài nơi để ghé qua.
          </h2>
          <div className="mt-7 space-y-5 text-base leading-8 text-on-surface-variant">
            <p>
              The Serene Villa được hình dung là điểm dừng chân cho những hành trình muốn đi chậm: một góc cà phê buổi sáng,
              một cung đường xanh, hoặc bữa tối ấm cúng để mọi câu chuyện được tiếp nối.
            </p>
            <p>
              Những lát cắt bên cạnh là các gợi ý được The Serene Villa tuyển chọn: từ điểm hẹn quen thuộc đến những trải nghiệm
              đáng nhớ quanh hành trình. Mỗi địa điểm đều được ghi chú ngắn gọn để bạn dễ chọn thêm một điểm dừng phù hợp.
            </p>
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={showNext}
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-secondary px-5 font-display text-sm font-semibold text-white shadow-[0_14px_30px_rgba(23,58,49,0.18)] transition duration-300 hover:-translate-y-0.5 hover:bg-secondary-container focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-orange/25"
            >
              Xem điểm tiếp theo
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
            <span className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-secondary/55">
              {activeIndex + 1} / {nearbyHighlights.length} điểm gợi ý
            </span>
          </div>

          <p className="mt-8 border-l-2 border-brand-orange pl-5 text-sm leading-7 text-secondary/80">
            <span className="font-semibold text-secondary">Lưu ý:</span> Đây là khu vực trình bày nội dung mô phỏng. Hãy thay bằng ảnh
            và ghi chú do bạn sở hữu hoặc được phép sử dụng trước khi công bố.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-[650px] pb-7 pt-3 sm:pb-10 lg:mx-0 lg:justify-self-end">
          <div className="relative mx-auto h-[420px] w-[min(100%-126px,370px)] sm:h-[500px] sm:w-[min(100%-168px,430px)]">
            {orderedHighlights.map((place, stackIndex) => {
              const offset = stackOffsets[stackIndex]
              const isFront = stackIndex === 0

              return (
                <motion.button
                  key={place.id}
                  type="button"
                  onClick={() => {
                    if (isFront) {
                      showNext()
                      return
                    }
                    setActiveIndex((activeIndex + stackIndex) % nearbyHighlights.length)
                  }}
                  aria-label={isFront ? `Chuyển từ ${place.name} sang địa điểm tiếp theo` : `Xem ${place.name}`}
                  className="group absolute left-0 top-0 block w-full origin-bottom-left rounded-[4px] bg-white p-2.5 text-left shadow-[0_22px_56px_rgba(23,58,49,0.18)] outline-none sm:p-3"
                  initial={false}
                  animate={{
                    x: offset.x,
                    y: offset.y,
                    rotate: offset.rotate,
                    scale: offset.scale,
                    opacity: isFront ? 1 : 0.94 - stackIndex * 0.06,
                  }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 230, damping: 25, mass: 0.8 }
                  }
                  style={{ zIndex: nearbyHighlights.length - stackIndex }}
                  whileHover={
                    prefersReducedMotion
                      ? undefined
                      : isFront
                        ? { y: -8, rotate: -1, transition: { duration: 0.25 } }
                        : { scale: offset.scale + 0.025, transition: { duration: 0.2 } }
                  }
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[2px] bg-[#EDE5D8]">
                    <Image
                      src={place.image}
                      alt={place.name}
                      fill
                      sizes="(max-width: 640px) 72vw, (max-width: 1024px) 440px, 520px"
                      quality={100}
                      className="object-cover transition duration-700 ease-out group-hover:scale-[1.035]"
                      style={{ objectPosition: place.position }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-secondary/35 via-transparent to-transparent" />
                  </div>
                  <div className="px-2 pb-1 pt-3 sm:px-3 sm:pb-2">
                    <p className="font-editorial text-xl font-semibold leading-tight text-secondary sm:text-2xl">{place.name}</p>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-on-surface-variant sm:text-sm">{place.note}</p>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
