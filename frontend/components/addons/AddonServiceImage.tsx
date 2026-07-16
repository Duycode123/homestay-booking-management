'use client'

import { useEffect, useState } from 'react'

type AddonServiceImageProps = {
  imageUrl?: string | null
  name: string
  className?: string
  eager?: boolean
}

export default function AddonServiceImage({
  imageUrl,
  name,
  className = 'aspect-[16/10] w-full',
  eager = false,
}: AddonServiceImageProps) {
  const [failed, setFailed] = useState(false)
  const trimmedUrl = imageUrl?.trim()
  const resolvedUrl = trimmedUrl?.startsWith('images/') ? `/${trimmedUrl}` : trimmedUrl

  useEffect(() => {
    setFailed(false)
  }, [resolvedUrl])

  return (
    <div className={`relative shrink-0 overflow-hidden bg-[#eee4d6] ${className}`}>
      {resolvedUrl && !failed ? (
        // Native img supports admin-provided HTTPS hosts without requiring a Next.js host allowlist.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolvedUrl}
          alt={`Dịch vụ ${name}`}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_top,#f8efe3,#e9ddcc)] px-4 text-center text-[#174638]">
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
