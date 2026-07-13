'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

type HomepageModalShellProps = {
  open: boolean
  onClose: () => void
  title?: string
  eyebrow?: string
  description?: string
  labelledBy?: string
  maxWidthClassName?: string
  headerClassName?: string
  bodyClassName?: string
  footer?: ReactNode
  children: ReactNode
}

const CLOSE_ANIMATION_MS = 180

export default function HomepageModalShell({
  open,
  onClose,
  title,
  eyebrow,
  description,
  labelledBy,
  maxWidthClassName = 'max-w-[1040px]',
  headerClassName = '',
  bodyClassName = '',
  footer,
  children,
}: HomepageModalShellProps) {
  const [isClosing, setIsClosing] = useState(false)
  const isClosingRef = useRef(false)
  const closeTimerRef = useRef<number | null>(null)

  const requestClose = useCallback(() => {
    if (isClosingRef.current) return

    isClosingRef.current = true
    setIsClosing(true)
    closeTimerRef.current = window.setTimeout(() => {
      onClose()
      isClosingRef.current = false
      setIsClosing(false)
    }, CLOSE_ANIMATION_MS)
  }, [onClose])

  useEffect(() => {
    if (!open) {
      isClosingRef.current = false
      setIsClosing(false)
      return
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        requestClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)

      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }

      isClosingRef.current = false
    }
  }, [open, requestClose])

  if (!open) return null

  return (
    <div
      className={[
        'fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(20,24,28,0.45)] p-3 backdrop-blur-[3px] sm:p-5',
        isClosing ? 'animate-[homepageModalOverlayOut_180ms_ease-in_forwards]' : 'animate-[homepageModalOverlayIn_180ms_ease-out_forwards]',
      ].join(' ')}
      onClick={requestClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby={labelledBy}
    >
      <section
        className={[
          'flex max-h-[90vh] w-[min(96vw,1040px)] flex-col overflow-hidden rounded-[28px] border border-[#E8E4DC] bg-white shadow-[0_24px_80px_rgba(26,28,30,0.18)]',
          maxWidthClassName,
          isClosing ? 'animate-[homepageModalOut_180ms_ease-in_forwards]' : 'animate-[homepageModalIn_200ms_cubic-bezier(0.16,1,0.3,1)_forwards]',
        ].join(' ')}
        onClick={(event) => event.stopPropagation()}
      >
        {(title || eyebrow || description) && (
          <header className={['sticky top-0 z-10 border-b border-[#E8E4DC] bg-white px-5 py-5 sm:px-6', headerClassName].join(' ')}>
            {eyebrow && <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-[#FF7518]">{eyebrow}</p>}
            {title && <h2 id={labelledBy} className="mt-1 font-display text-2xl font-bold tracking-tight text-[#1A1C1E]">{title}</h2>}
            {description && <p className="mt-1 max-w-2xl text-sm leading-6 text-[#5C5348]">{description}</p>}
          </header>
        )}

        <div className={['homepage-modal-scroll min-h-0 flex-1 overflow-y-auto bg-white px-5 py-5 sm:px-6', bodyClassName].join(' ')}>
          {children}
        </div>

        {footer && (
          <footer className="sticky bottom-0 z-10 border-t border-[#E8E4DC] bg-white px-5 py-4 sm:px-6">
            {footer}
          </footer>
        )}
      </section>

      <style jsx global>{`
        .homepage-modal-scroll,
        .homepage-modal-scroll * {
          scrollbar-width: thin;
          scrollbar-color: #c9c2b6 #f0ede6;
        }

        .homepage-modal-scroll::-webkit-scrollbar,
        .homepage-modal-scroll *::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .homepage-modal-scroll::-webkit-scrollbar-track,
        .homepage-modal-scroll *::-webkit-scrollbar-track {
          background: #f0ede6;
          border-radius: 999px;
        }

        .homepage-modal-scroll::-webkit-scrollbar-thumb,
        .homepage-modal-scroll *::-webkit-scrollbar-thumb {
          background: #c9c2b6;
          border-radius: 999px;
        }

        .homepage-modal-scroll::-webkit-scrollbar-thumb:hover,
        .homepage-modal-scroll *::-webkit-scrollbar-thumb:hover {
          background: #b7ae9f;
        }

        @keyframes homepageModalOverlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes homepageModalOverlayOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes homepageModalIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes homepageModalOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(8px) scale(0.98); }
        }
      `}</style>
    </div>
  )
}
