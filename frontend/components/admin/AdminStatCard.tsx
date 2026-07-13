import type { ReactNode } from 'react'

type Accent = 'default' | 'primary' | 'secondary' | 'tertiary'

const accentStyles: Record<Accent, { ring: string; icon: string; value: string }> = {
  default: {
    ring: 'from-surface-container-high/80 to-surface-container-low',
    icon: 'bg-surface-container text-on-surface-variant',
    value: 'text-on-surface',
  },
  primary: {
    ring: 'from-primary-container/60 to-primary-container/20',
    icon: 'bg-primary-container text-on-primary-container',
    value: 'text-brand-orange',
  },
  secondary: {
    ring: 'from-secondary-container/40 to-secondary-container/10',
    icon: 'bg-secondary-container/30 text-on-secondary-container',
    value: 'text-secondary',
  },
  tertiary: {
    ring: 'from-tertiary-container/80 to-tertiary-container/30',
    icon: 'bg-tertiary-container text-on-tertiary-container',
    value: 'text-tertiary',
  },
}

type AdminStatCardProps = {
  label: string
  value: string | number
  hint?: string
  icon?: ReactNode
  accent?: Accent
}

export default function AdminStatCard({
  label,
  value,
  hint,
  icon,
  accent = 'default',
}: AdminStatCardProps) {
  const styles = accentStyles[accent]

  return (
    <div
      className={[
        'group relative overflow-hidden rounded-2xl border border-outline-variant/80 bg-white p-5 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]',
      ].join(' ')}
    >
      <div
        className={[
          'pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-60 blur-2xl transition-opacity group-hover:opacity-100',
          styles.ring,
        ].join(' ')}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
            {label}
          </p>
          <p className={['mt-2 font-display text-3xl font-bold tracking-tight', styles.value].join(' ')}>
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-on-surface-variant">{hint}</p>}
        </div>
        {icon && (
          <div
            className={[
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110',
              styles.icon,
            ].join(' ')}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
