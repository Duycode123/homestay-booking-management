'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useI18n } from '@/components/i18n/LocaleProvider'
import { fetchCommonAmenities, type CommonAmenity } from '@/lib/common-amenity-service'

const copy = {
  vi: {
    eyebrow: 'Dành cho toàn khu homestay',
    title: 'Tiện ích chung quy mô lớn, miễn phí cho khách lưu trú.',
    description: 'Các tiện ích nhỏ trong phòng vẫn được giữ nguyên. Đây là những không gian chung khách có thể sử dụng trong thời gian lưu trú.',
  },
  en: {
    eyebrow: 'Shared across the villa grounds',
    title: 'Thoughtful shared spaces, included with every stay.',
    description: 'Your in-room amenities remain exactly as listed. These are the shared spaces guests can enjoy throughout their stay.',
  },
} as const

export default function CommonAmenitiesShowcase() {
  const [items, setItems] = useState<CommonAmenity[]>([])
  const { locale } = useI18n()
  const content = copy[locale]

  useEffect(() => {
    void fetchCommonAmenities().then(setItems).catch(() => setItems([]))
  }, [])

  if (!items.length) return null

  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <p className="eyebrow text-brand-orange">{content.eyebrow}</p>
        <div className="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <h2 className="font-editorial max-w-3xl text-4xl font-semibold text-secondary sm:text-5xl">{content.title}</h2>
          <p className="max-w-md leading-7 text-on-surface-variant">{content.description}</p>
        </div>
        <div className="mt-10 grid gap-x-10 gap-y-7 md:grid-cols-2">
          {items.map((item) => (
            <article key={item.id} className="flex gap-5 border-b border-outline-variant pb-7">
              <div className="relative flex h-28 w-36 shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-[#eee3d3] font-editorial text-3xl text-secondary">
                {item.imageUrl ? <Image src={item.imageUrl} alt={item.name} fill sizes="144px" className="object-cover" /> : icon(item.iconName)}
              </div>
              <div className="pt-2"><h3 className="font-display text-xl font-bold text-secondary">{item.name}</h3><p className="mt-2 text-sm leading-7 text-on-surface-variant">{item.description}</p></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function icon(name: string) {
  return ({ 'indoor-pool': '♨', 'outdoor-pool': '♒', projector: '▣', kitchen: '♨', bbq: '♨', garden: '♧', parking: 'P', cleaning: '✦' } as Record<string, string>)[name] ?? '✓'
}
