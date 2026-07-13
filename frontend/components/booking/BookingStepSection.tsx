import type { ReactNode } from 'react'

type BookingStepSectionProps = {
  step: number
  title: string
  description: string
  children: ReactNode
  action?: ReactNode
}

export default function BookingStepSection({
  step,
  title,
  description,
  children,
  action,
}: BookingStepSectionProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-outline-variant/80 bg-white shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-outline-variant/60 bg-gradient-to-r from-surface-container-low to-white px-5 py-4 sm:px-6">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-orange font-display text-sm font-bold text-white shadow-md shadow-brand-orange/25">
            {step}
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-on-surface">{title}</h2>
            <p className="mt-0.5 text-sm text-on-surface-variant">{description}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  )
}
