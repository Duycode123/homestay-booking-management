'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { CustomerCard, CustomerPageHeader, CustomerPageShell } from '@/components/customer/CustomerPageShell'

export type CustomerActionVariant = 'account-security' | 'support-report'

export type CustomerActionStat = {
  label: string
  value: string
  tone: 'green' | 'orange' | 'amber' | 'neutral'
  icon: ReactNode
}

export type CustomerActionBreadcrumb = {
  label: string
  href?: string
}

export type CustomerActionStep = {
  id: string
  label: string
  complete: boolean
  current: boolean
}

const variantStyles: Record<
  CustomerActionVariant,
  {
    pageAccent: string
    formHeader: string
    formIcon: string
    sidebarGradient: string
    stepActive: string
    stepComplete: string
  }
> = {
  'account-security': {
    pageAccent: 'border-l-brand-greenDark bg-[#F1F8F2]/60',
    formHeader: 'border-b border-brand-greenLight/20 bg-gradient-to-r from-[#F1F8F2] via-white to-white',
    formIcon: 'bg-brand-greenDark text-white shadow-[0_10px_24px_rgba(10,77,39,0.28)]',
    sidebarGradient: 'bg-gradient-to-br from-secondary to-brand-greenDark text-white',
    stepActive: 'border-brand-greenDark bg-[#F1F8F2] text-brand-greenDark',
    stepComplete: 'border-brand-greenLight bg-brand-greenLight text-white',
  },
  'support-report': {
    pageAccent: 'border-l-brand-orange bg-primary-container/50',
    formHeader: 'border-b border-brand-orange/15 bg-gradient-to-r from-primary-container via-[#FFF7EF] to-white',
    formIcon: 'bg-brand-orange text-white shadow-[0_10px_24px_rgba(255,117,24,0.35)]',
    sidebarGradient: 'bg-gradient-to-br from-[#7C2D12] via-brand-orange to-[#E6640F] text-white',
    stepActive: 'border-brand-orange bg-primary-container text-[#6B3200]',
    stepComplete: 'border-brand-orange bg-brand-orange text-white',
  },
}

const statToneClasses = {
  green: 'border-brand-greenLight/25 bg-[#F1F8F2] text-brand-greenDark',
  orange: 'border-brand-orange/20 bg-primary-container text-[#6B3200]',
  amber: 'border-[#F59E0B]/25 bg-[#FFFBEB] text-[#92400E]',
  neutral: 'border-outline-variant bg-white text-on-surface',
} as const

type CustomerActionPageLayoutProps = {
  variant: CustomerActionVariant
  eyebrow: string
  title: string
  description: string
  breadcrumb: CustomerActionBreadcrumb[]
  stats: CustomerActionStat[]
  steps?: CustomerActionStep[]
  formTitle: string
  formDescription: string
  formIcon: ReactNode
  banner?: ReactNode
  sidebar: ReactNode
  children: ReactNode
}

export function CustomerActionPageLayout({
  variant,
  eyebrow,
  title,
  description,
  breadcrumb,
  stats,
  steps,
  formTitle,
  formDescription,
  formIcon,
  banner,
  sidebar,
  children,
}: CustomerActionPageLayoutProps) {
  const styles = variantStyles[variant]

  return (
    <CustomerPageShell>
      <nav aria-label="Đường dẫn trang" className="mb-4 flex flex-wrap items-center gap-2 text-sm text-on-surface-variant">
        {breadcrumb.map((item, index) => {
          const isLast = index === breadcrumb.length - 1

          return (
            <span key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden className="text-outline">/</span> : null}
              {item.href && !isLast ? (
                <Link href={item.href} className="font-medium transition hover:text-brand-orange">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'font-semibold text-on-surface' : 'font-medium'}>{item.label}</span>
              )}
            </span>
          )
        })}
      </nav>

      <div className={`mb-6 rounded-2xl border-l-4 px-1 ${styles.pageAccent}`}>
        <CustomerPageHeader eyebrow={eyebrow} title={title} description={description} className="mb-0 border-0 shadow-none" />
      </div>

      {banner}

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border px-4 py-4 shadow-[var(--shadow-card)] ${statToneClasses[stat.tone]}`}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80 text-brand-orange">
                {stat.icon}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{stat.label}</p>
                <p className="font-display text-sm font-bold">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <CustomerCard className="overflow-hidden p-0">
          <div className={`px-6 py-5 md:px-8 ${styles.formHeader}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${styles.formIcon}`}>
                  {formIcon}
                </span>
                <div>
                  <h2 className="font-display text-xl font-bold text-on-surface">{formTitle}</h2>
                  <p className="mt-1 text-sm leading-6 text-on-surface-variant">{formDescription}</p>
                </div>
              </div>
            </div>

            {steps && steps.length > 0 ? (
              <ol className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3" aria-label="Tiến trình">
                {steps.map((step, index) => (
                  <li key={step.id} className="flex items-center gap-2 sm:flex-1">
                    <span
                      className={[
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
                        step.complete
                          ? styles.stepComplete
                          : step.current
                            ? styles.stepActive
                            : 'border-outline-variant bg-white text-on-surface-variant',
                      ].join(' ')}
                      aria-current={step.current ? 'step' : undefined}
                    >
                      {step.complete ? '✓' : index + 1}
                    </span>
                    <span
                      className={[
                        'text-xs font-semibold sm:text-sm',
                        step.current || step.complete ? 'text-on-surface' : 'text-on-surface-variant',
                      ].join(' ')}
                    >
                      {step.label}
                    </span>
                    {index < steps.length - 1 ? (
                      <span aria-hidden className="hidden h-px flex-1 bg-outline-variant sm:block" />
                    ) : null}
                  </li>
                ))}
              </ol>
            ) : null}
          </div>

          <div className="px-6 py-6 md:px-8 md:py-7">{children}</div>
        </CustomerCard>

        <aside className="space-y-4">{sidebar}</aside>
      </div>
    </CustomerPageShell>
  )
}

export function CustomerActionSidebarCard({
  variant,
  title,
  description,
  icon,
  children,
}: {
  variant: CustomerActionVariant
  title: string
  description: string
  icon: ReactNode
  children: ReactNode
}) {
  const styles = variantStyles[variant]

  return (
    <CustomerCard className={styles.sidebarGradient}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">{icon}</span>
        <div>
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <p className="text-sm text-white/75">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </CustomerCard>
  )
}

export function CustomerActionMessage({ message }: { message: { type: 'success' | 'error'; text: string } }) {
  const isSuccess = message.type === 'success'

  return (
    <p
      role="status"
      className={[
        'rounded-2xl border px-4 py-3 text-sm',
        isSuccess
          ? 'border-brand-greenLight/30 bg-[#F1F8F2] text-brand-greenDark'
          : 'border-error/20 bg-error-container text-error',
      ].join(' ')}
    >
      {message.text}
    </p>
  )
}

export function CustomerActionQuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low/50 px-4 py-3 text-sm font-semibold text-on-surface transition hover:border-brand-orange/30 hover:bg-white hover:text-brand-orange"
    >
      {label}
      <span aria-hidden>→</span>
    </Link>
  )
}

export function CustomerFormField({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-display text-xs font-bold uppercase tracking-[0.08em] text-on-surface-variant">
        {label}
      </span>
      {children}
      {hint ? <p className="mt-2 text-xs leading-5 text-on-surface-variant">{hint}</p> : null}
    </label>
  )
}

export function CustomerActionSpinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export function CustomerActionSubmitButton({
  isSubmitting,
  submittingLabel,
  label,
  icon,
  variant = 'primary',
}: {
  isSubmitting: boolean
  submittingLabel: string
  label: string
  icon: ReactNode
  variant?: 'primary' | 'support'
}) {
  const buttonClass =
    variant === 'support'
      ? 'bg-brand-orange shadow-[0_12px_28px_rgba(255,117,24,0.35)] hover:bg-brand-orangeHover focus:ring-brand-orange/30'
      : 'bg-brand-greenDark shadow-[0_12px_28px_rgba(10,77,39,0.28)] hover:bg-secondary focus:ring-brand-greenDark/30'

  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 font-display text-sm font-semibold text-white transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${buttonClass}`}
    >
      {isSubmitting ? (
        <>
          <CustomerActionSpinner />
          {submittingLabel}
        </>
      ) : (
        <>
          {icon}
          {label}
        </>
      )}
    </button>
  )
}
