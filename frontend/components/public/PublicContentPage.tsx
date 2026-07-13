import type { ReactNode } from 'react'

export function PublicContentPage({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-full bg-brand-bgGray text-on-surface">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(26,28,30,0.04) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand-orange/8 blur-3xl" aria-hidden />
      <section className="relative mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
        {children}
      </section>
    </main>
  )
}

export function PublicContentHeader({
  eyebrow = 'Homestay Booking',
  title,
  description,
  updatedAt,
}: {
  eyebrow?: string
  title: string
  description: string
  updatedAt?: string
}) {
  return (
    <header className="mb-8 overflow-hidden rounded-[28px] border border-outline-variant bg-white p-6 shadow-[var(--shadow-card)] md:p-8">
      <p className="font-display text-sm font-bold uppercase tracking-[0.14em] text-brand-orange">{eyebrow}</p>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-on-surface">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">{description}</p>
      {updatedAt ? (
        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-on-surface-variant">
          Cập nhật lần cuối: {updatedAt}
        </p>
      ) : null}
    </header>
  )
}

export function PublicContentSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="mb-6 rounded-[24px] border border-outline-variant bg-white p-6 shadow-[var(--shadow-card)]">
      <h2 className="font-display text-xl font-bold text-on-surface">{title}</h2>
      <div className="mt-4 space-y-3 text-sm leading-7 text-on-surface-variant">{children}</div>
    </section>
  )
}
