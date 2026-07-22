import type { ReactNode } from 'react'
import Link from 'next/link'
import { IconChevronRight } from './AdminIcons'

type Breadcrumb = { label: string; href?: string }

type AdminPageHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  breadcrumbs?: Breadcrumb[]
  actions?: ReactNode
}

export default function AdminPageHeader({
  eyebrow = 'Admin',
  title,
  breadcrumbs,
  actions,
}: AdminPageHeaderProps) {
  return (
    <header className="sticky top-[7.25rem] z-20 border-b border-outline-variant bg-brand-bgGray/95 backdrop-blur-md lg:top-0">
      <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-5 px-5 py-5 sm:px-8 sm:py-7">
        <div className="min-w-0">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav aria-label="Đường dẫn trang" className="mb-3 flex flex-wrap items-center gap-1 text-xs text-on-surface-variant">
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.label} className="flex items-center gap-1">
                  {i > 0 && <IconChevronRight className="h-3 w-3 opacity-50" />}
                  {crumb.href ? (
                    <Link href={crumb.href} className="transition-colors hover:text-brand-orange">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-on-surface">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
          <p className="font-display text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-orange">
            {eyebrow}
          </p>
          <h1 className="mt-1.5 font-editorial text-3xl font-normal leading-tight text-on-surface sm:text-4xl">
            {title}
          </h1>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}
