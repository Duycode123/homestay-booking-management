import type { ReactNode } from 'react'

export function PublicContentPage({ children }: { children: ReactNode }) {
  return (
    <main id="main-content" className="relative min-h-full bg-brand-bgGray text-on-surface">
      <section className="relative mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        {children}
      </section>
    </main>
  )
}

export function PublicContentHeader({
  eyebrow = 'The Serene Villa',
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
    <header className="relative mb-8 overflow-hidden rounded-[18px] border border-white/8 bg-secondary p-7 text-white shadow-[var(--shadow-elevated)] md:p-10">
      <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full border border-white/[0.06]" aria-hidden />
      <p className="eyebrow relative text-primary-fixed">{eyebrow}</p>
      <h1 className="font-editorial relative mt-4 max-w-3xl text-4xl font-semibold leading-[1.06] tracking-[-0.025em] sm:text-5xl">{title}</h1>
      <p className="relative mt-4 max-w-2xl text-sm leading-7 text-white/72">{description}</p>
      {updatedAt ? (
        <p className="relative mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-white/50">
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
    <section className="mb-5 rounded-[16px] border border-outline-variant bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
      <h2 className="font-editorial text-2xl font-semibold text-secondary">{title}</h2>
      <div className="mt-4 space-y-3 text-sm leading-7 text-on-surface-variant">{children}</div>
    </section>
  )
}
