import Link from 'next/link'
import type { ReactNode } from 'react'
import { IconChevronRight } from './AdminIcons'

type AdminModuleCardProps = {
  href?: string
  label: string
  title: string
  description: string
  icon: ReactNode
  accent?: 'orange' | 'green' | 'amber' | 'slate'
  disabled?: boolean
  badge?: string
}

const accentMap = {
  orange: {
    icon: 'bg-primary-container text-on-primary-container',
    glow: 'group-hover:shadow-brand-orange/10',
    border: 'group-hover:border-brand-orange/40',
    title: 'group-hover:text-brand-orange',
  },
  green: {
    icon: 'bg-secondary-container/25 text-on-secondary-container',
    glow: 'group-hover:shadow-secondary/10',
    border: 'group-hover:border-secondary-container/50',
    title: 'group-hover:text-secondary',
  },
  amber: {
    icon: 'bg-tertiary-container text-on-tertiary-container',
    glow: 'group-hover:shadow-tertiary/10',
    border: 'group-hover:border-tertiary/30',
    title: 'group-hover:text-tertiary',
  },
  slate: {
    icon: 'bg-surface-container text-on-surface-variant',
    glow: '',
    border: '',
    title: '',
  },
}

export default function AdminModuleCard({
  href,
  label,
  title,
  description,
  icon,
  accent = 'orange',
  disabled = false,
  badge,
}: AdminModuleCardProps) {
  const a = accentMap[accent]

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div
          className={[
            'flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105',
            a.icon,
            disabled ? 'opacity-50' : '',
          ].join(' ')}
        >
          {icon}
        </div>
        {!disabled && (
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant bg-surface-container-low text-on-surface-variant transition-all group-hover:border-brand-orange/30 group-hover:bg-primary-container/30 group-hover:text-brand-orange">
            <IconChevronRight />
          </span>
        )}
      </div>

      <div className="mt-5">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-on-surface-variant">{label}</p>
          {badge && (
            <span className="rounded-full bg-brand-orange/15 px-2 py-0.5 font-display text-[9px] font-semibold uppercase tracking-wider text-brand-orange">
              {badge}
            </span>
          )}
          {disabled && (
            <span className="rounded-full bg-surface-container px-2 py-0.5 font-display text-[9px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Soon
            </span>
          )}
        </div>
        <h3
          className={[
            'mt-1 font-display text-xl font-bold text-on-surface transition-colors',
            a.title,
          ].join(' ')}
        >
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{description}</p>
      </div>
    </>
  )

  const className = [
    'group relative overflow-hidden rounded-2xl border border-outline-variant bg-white p-6 shadow-[var(--shadow-card)] transition-all duration-300',
    disabled ? 'cursor-not-allowed opacity-55' : `cursor-pointer hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)] ${a.border} ${a.glow}`,
  ].join(' ')

  if (disabled || !href) {
    return <div className={className}>{inner}</div>
  }

  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  )
}
