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
      id="main-content"
      tabIndex={-1}
      className={
        contained
          ? 'flex h-[calc(100dvh-5rem)] flex-col overflow-hidden bg-brand-bgGray text-on-surface'
          : 'min-h-screen bg-brand-bgGray text-on-surface'
      }
    >
      <div className={contained ? 'relative flex min-h-0 flex-1 flex-col overflow-hidden' : 'relative overflow-x-hidden'}>
        <section
          className={
            contained
              ? 'mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col overflow-hidden px-5 py-6 sm:px-8 sm:py-8'
              : 'mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10'
          }
        >
          {children}
        </section>
      </div>
    </main>
  )
}

export function CustomerPageHeader({
  eyebrow = 'The Serene Villa',
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
        'mb-8 border-b border-outline-variant pb-6 pt-1 md:pb-8',
        className,
      ].join(' ')}
    >
      <div>
        <div className="flex items-center gap-3">
          <span aria-hidden className="h-px w-8 bg-brand-orange" />
          <p className="font-display text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-orange">{eyebrow}</p>
        </div>
        <h1 className="mt-3 font-editorial text-4xl font-normal leading-tight text-on-surface sm:text-5xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant">{description}</p>
      </div>
    </div>
  )
}

export function CustomerCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={[
        'rounded-xl border border-outline-variant bg-white/95 p-6 shadow-[var(--shadow-card)] transition-colors hover:border-outline',
        className,
      ].join(' ')}
    >
      {children}
    </section>
  )
}
