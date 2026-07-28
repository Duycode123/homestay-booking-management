'use client'

import Image from 'next/image'
import { useState } from 'react'

type AddonServiceImageProps = {
  imageUrl?: string | null
  name: string
  className?: string
  eager?: boolean
}

const defaultAddonImages = [
  { keywords: ['bua sang', 'breakfast'], path: '/images/addons/breakfast-in-room.png' },
  { keywords: ['giuong phu', 'extra bed'], path: '/images/addons/extra-bed.png' },
  { keywords: ['than nuong', 'charcoal'], path: '/images/addons/charcoal-refill.png' },
  { keywords: ['bbq'], path: '/images/addons/outdoor-bbq-set.png' },
  { keywords: ['may chieu', 'projector'], path: '/images/addons/projector-rental.png' },
  { keywords: ['sinh nhat', 'birthday'], path: '/images/addons/birthday-decoration.png' },
] as const

function getDefaultAddonImage(name: string) {
  const normalizedName = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  return defaultAddonImages.find((item) => item.keywords.some((keyword) => normalizedName.includes(keyword)))?.path
}

export default function AddonServiceImage({
  imageUrl,
  name,
  className = 'aspect-[16/10] w-full',
  eager = false,
}: AddonServiceImageProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const trimmedUrl = imageUrl?.trim() || getDefaultAddonImage(name)
  const resolvedUrl = trimmedUrl?.startsWith('images/') ? `/${trimmedUrl}` : trimmedUrl
  const failed = Boolean(resolvedUrl && failedUrl === resolvedUrl)

  return (
    <div className={`relative shrink-0 overflow-hidden bg-[#eee4d6] ${className}`}>
      {resolvedUrl && !failed ? (
        <Image
          src={resolvedUrl}
          alt={`Dịch vụ ${name}`}
          fill
          unoptimized
          loading={eager ? 'eager' : 'lazy'}
          sizes="(max-width: 640px) 100vw, 480px"
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          onError={() => setFailedUrl(resolvedUrl)}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_top,#f8efe3,#e9ddcc)] px-4 text-center text-[#234D42]">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="1.6">
            <path d="M4 19.5h16M6.5 17V8.8c0-.8.4-1.5 1.1-1.9l3.3-1.8c.7-.4 1.5-.4 2.2 0l3.3 1.8c.7.4 1.1 1.1 1.1 1.9V17" />
            <path d="M9 17v-4h6v4M9.5 9.5h.01M14.5 9.5h.01" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em]">Dịch vụ lưu trú</span>
        </div>
      )}
    </div>
  )
}
