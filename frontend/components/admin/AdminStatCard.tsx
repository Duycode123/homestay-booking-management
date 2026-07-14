import type { ReactNode } from 'react'

type Accent = 'default' | 'primary' | 'secondary' | 'tertiary'

const accentStyles: Record<Accent, { line: string; icon: string; value: string }> = {
  default: {
    line: 'bg-outline',
    icon: 'bg-surface-container text-on-surface-variant',
    value: 'text-on-surface',
  },
  primary: {
    line: 'bg-brand-orange',
    icon: 'bg-primary-container text-on-primary-container',
    value: 'text-brand-orange',
  },
  secondary: {
    line: 'bg-secondary',
    icon: 'bg-secondary text-on-secondary',
    value: 'text-secondary',
  },
  tertiary: {
    line: 'bg-tertiary',
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
      className="group relative overflow-hidden rounded-xl border border-outline-variant bg-white/90 p-5 shadow-[var(--shadow-card)] transition-colors duration-200 hover:border-outline"
    >
      <span aria-hidden className={['absolute inset-x-0 top-0 h-0.5', styles.line].join(' ')} />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
            {label}
          </p>
          <p className={['mt-3 font-editorial text-4xl font-normal leading-none', styles.value].join(' ')}>
            {value}
          </p>
          {hint && <p className="mt-2 text-xs leading-5 text-on-surface-variant">{hint}</p>}
        </div>
        {icon && (
          <div
            className={[
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
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
