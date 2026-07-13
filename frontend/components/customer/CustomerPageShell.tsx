'use client'

import type { ReactNode } from 'react'

export function CustomerPageShell({
  children,
  contained = false,
}: {
  children: ReactNode
  contained?: boolean
}) {
  return (
    <main
      className={
        contained
          ? 'relative flex h-[calc(100dvh-5rem)] flex-col overflow-hidden bg-brand-bgGray text-on-surface'
          : 'relative min-h-screen bg-brand-bgGray text-on-surface'
      }
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(26,28,30,0.04) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand-orange/8 blur-3xl" aria-hidden />
      <div className={contained ? 'relative flex min-h-0 flex-1 flex-col overflow-hidden' : 'relative overflow-x-hidden'}>
        <section
          className={
            contained
              ? 'mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col overflow-hidden px-5 py-6 sm:px-8 sm:py-8'
              : 'mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10'
          }
        >
          {children}
        </section>
      </div>
    </main>
  )
}

export function CustomerPageHeader({
  eyebrow = 'Homestay Booking',
  title,
  description,
  className = '',
}: {
  eyebrow?: string
  title: string
  description: string
  className?: string
}) {
  return (
    <div
      className={[
        'mb-6 overflow-hidden rounded-[28px] border border-outline-variant bg-white p-6 shadow-[var(--shadow-card)] md:p-8',
        className,
      ].join(' ')}
    >
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-orange/10 blur-2xl"
        />
        <p className="relative font-display text-sm font-bold uppercase tracking-[0.14em] text-brand-orange">{eyebrow}</p>
        <h1 className="relative mt-3 font-display text-3xl font-bold tracking-tight text-on-surface">{title}</h1>
        <p className="relative mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">{description}</p>
      </div>
    </div>
  )
}

export function CustomerCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={[
        'rounded-[24px] border border-outline-variant bg-white p-6 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]',
        className,
      ].join(' ')}
    >
      {children}
    </section>
  )
}
