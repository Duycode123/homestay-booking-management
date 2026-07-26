'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useI18n } from '@/components/i18n/LocaleProvider'
import {
  fetchCommonAmenities,
  type CommonAmenity,
} from '@/lib/common-amenity-service'

const copy = {
  vi: {
    eyebrow: 'Theo từng homestay',
    title: 'Tiện ích đi kèm, phù hợp với từng địa điểm lưu trú.',
    description:
      'Mỗi homestay có không gian và tiện ích khác nhau. Hãy xem trang chi tiết của căn bạn chọn để biết chính xác những gì đã được bao gồm trong kỳ nghỉ.',
    loading: 'Đang tải tiện ích...',
    empty: 'Hiện chưa có tiện ích đi kèm để hiển thị.',
    errorTitle: 'Không thể hiển thị tiện ích đi kèm',
    errorDescription:
      'Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử tải lại trang.',
    availableAt: 'Có tại',
    homestay: 'homestay',
  },
  en: {
    eyebrow: 'Unique to each homestay',
    title: 'Included amenities, matched to each location.',
    description:
      'Each homestay has its own spaces and included amenities. Check the detail page of your chosen stay for the exact list included with your booking.',
    loading: 'Loading amenities...',
    empty: 'There are currently no included amenities to display.',
    errorTitle: 'Unable to display included amenities',
    errorDescription:
      'An error occurred while loading the data. Please refresh the page.',
    availableAt: 'Available at',
    homestay: 'homestay',
  },
} as const

export default function CommonAmenitiesShowcase() {
  const [items, setItems] = useState<CommonAmenity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const { locale } = useI18n()
  const content = copy[locale]

  useEffect(() => {
    let cancelled = false

    const loadAmenities = async () => {
      try {
        setLoading(true)
        setError(false)

        const data = await fetchCommonAmenities()

        if (!cancelled) {
          setItems(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        console.error('Failed to load common amenities:', err)

        if (!cancelled) {
          setItems([])
          setError(true)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadAmenities()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="relative overflow-hidden bg-[#F7F3EC] py-20 sm:py-24 lg:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-28 top-16 h-72 w-72 rounded-full border border-secondary/[0.05]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-10 h-80 w-80 rounded-full border border-secondary/[0.05]"
      />

      <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="eyebrow text-brand-orange">
              {content.eyebrow}
            </p>

            <h2 className="font-editorial mt-4 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.025em] text-secondary sm:text-5xl lg:text-[3.4rem]">
              {content.title}
            </h2>
          </div>

          <div className="lg:border-l lg:border-secondary/10 lg:pl-8">
            <p className="max-w-md text-sm leading-7 text-on-surface-variant sm:text-base">
              {content.description}
            </p>
          </div>
        </div>

        {loading && <AmenitiesLoading label={content.loading} />}

        {!loading && error && (
          <div className="mt-12 rounded-[24px] border border-red-200/70 bg-white/80 px-6 py-10 text-center shadow-[0_12px_35px_rgba(40,63,55,0.05)]">
            <p className="font-display text-lg font-semibold text-secondary">
              {content.errorTitle}
            </p>

            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              {content.errorDescription}
            </p>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="mt-12 rounded-[24px] border border-secondary/10 bg-white/70 px-6 py-10 text-center">
            <p className="text-sm text-on-surface-variant">
              {content.empty}
            </p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {items.map((item) => (
              <article
                key={item.id}
                className="group flex min-h-[156px] items-center gap-4 rounded-[24px] border border-secondary/10 bg-white/80 p-3 shadow-[0_10px_30px_rgba(40,63,55,0.04)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-secondary/20 hover:bg-white hover:shadow-[0_18px_45px_rgba(40,63,55,0.10)] sm:gap-5 sm:p-4"
              >
                <div className="relative h-28 w-32 shrink-0 overflow-hidden rounded-[18px] bg-[#EEE3D3] sm:h-32 sm:w-40">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 128px, 160px"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-editorial text-3xl text-secondary">
                      {icon(item.iconName)}
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/20 via-transparent to-transparent opacity-30 transition-opacity duration-300 group-hover:opacity-50" />
                </div>

                <div className="min-w-0 flex-1 py-2">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-lg font-semibold leading-snug text-secondary sm:text-xl">
                      {item.name}
                    </h3>

                    <span
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-lg text-secondary/25 transition-all duration-300 group-hover:translate-x-1 group-hover:text-secondary"
                    >
                      →
                    </span>
                  </div>

                  {item.description && (
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-on-surface-variant sm:line-clamp-2 sm:leading-7">
                      {item.description}
                    </p>
                  )}
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary/60">
                    {content.availableAt} {item.roomIds?.length ?? 0}{' '}
                    {locale === 'en' && (item.roomIds?.length ?? 0) !== 1 ? 'homestays' : content.homestay}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function AmenitiesLoading({ label }: { label: string }) {
  return (
    <div className="mt-12">
      <p className="sr-only">{label}</p>

      <div className="grid gap-5 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex min-h-[156px] animate-pulse items-center gap-5 rounded-[24px] border border-secondary/5 bg-white/60 p-4"
          >
            <div className="h-32 w-40 shrink-0 rounded-[18px] bg-secondary/10" />

            <div className="flex-1">
              <div className="h-5 w-1/2 rounded-full bg-secondary/10" />
              <div className="mt-4 h-3 w-full rounded-full bg-secondary/[0.07]" />
              <div className="mt-2 h-3 w-4/5 rounded-full bg-secondary/[0.07]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function icon(name: string) {
  const icons: Record<string, string> = {
    'indoor-pool': '♨',
    'outdoor-pool': '♒',
    projector: '▣',
    kitchen: '♨',
    bbq: '♨',
    garden: '♧',
    parking: 'P',
    cleaning: '✦',
  }

  return icons[name] ?? '✓'
}
