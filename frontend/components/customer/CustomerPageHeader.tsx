import type { ReactNode } from 'react'
import Link from 'next/link'
import { IconChevronRight } from './CustomerIcons'

type Breadcrumb = { label: string; href?: string }

type CustomerPageHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  breadcrumbs?: Breadcrumb[]
  actions?: ReactNode
}

export default function CustomerPageHeader({
  eyebrow = 'Homestay Booking',
  title,
  description,
  breadcrumbs,
  actions,
}: CustomerPageHeaderProps) {
  return (
    <header className="border-b border-outline-variant/80 bg-white/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-5 py-6 sm:px-8">
        <div className="min-w-0">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="mb-2 flex flex-wrap items-center gap-1 text-xs text-on-surface-variant">
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.label} className="flex items-center gap-1">
                  {i > 0 && <IconChevronRight className="h-3 w-3 opacity-50" />}
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-brand-orange">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-on-surface">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
          <p className="font-display text-[11px] font-medium uppercase tracking-[0.2em] text-brand-orange">
            {eyebrow}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-surface-variant">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}
