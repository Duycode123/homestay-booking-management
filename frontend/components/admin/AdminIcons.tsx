import type { ReactNode } from 'react'

type IconProps = { className?: string }

export function IconDashboard({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  )
}

export function IconBookings({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
    </svg>
  )
}

export function IconStaff({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M16 11a4 4 0 1 0-8 0" />
      <path d="M5 21a7 7 0 0 1 14 0" />
      <path d="M19 8.5a3 3 0 0 1 0 5" />
      <path d="M22 21a5 5 0 0 0-3-4.5" />
    </svg>
  )
}

export function IconEquipment({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
      <circle cx="9" cy="6" r="2" />
      <circle cx="15" cy="12" r="2" />
      <circle cx="7" cy="18" r="2" />
    </svg>
  )
}

export function IconCoupons({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2.2a2.4 2.4 0 0 0 0 4.6V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2.2a2.4 2.4 0 0 0 0-4.6V7z" />
      <path d="M9 9h.01M15 15h.01M15 9l-6 6" />
    </svg>
  )
}

export function IconRefund({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10a8.5 8.5 0 1 0 2.5-6" />
      <path d="M3 4v6h6" />
      <path d="M12 7v10M15 9.2c-.7-.8-1.7-1.2-3-1.2-1.7 0-3 1-3 2.4 0 1.5 1.2 2 3 2.4 1.8.4 3 .9 3 2.4 0 1.5-1.3 2.8-3.2 2.8-1.4 0-2.6-.5-3.4-1.4" />
    </svg>
  )
}

export function IconRooms({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  )
}

export function IconReports({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M3 3v18h18" />
      <path d="M7 16l4-4 4 3 5-6" />
    </svg>
  )
}

export function IconIncidentReports({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M12 3 2.8 19a1.8 1.8 0 0 0 1.6 2.7h15.2a1.8 1.8 0 0 0 1.6-2.7L12 3z" />
      <path d="M12 8v5" strokeLinecap="round" />
      <path d="M12 17h.01" strokeLinecap="round" />
    </svg>
  )
}

export function IconReviews({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M12 17.3 6.2 20l1.2-6.6L2 9.3l6.7-1L12 2l3.3 6.3 6.7 1-5.4 4.1 1.2 6.6z" />
    </svg>
  )
}

export function IconPlus({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function IconSearch({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

export function IconRefresh({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 12a8.5 8.5 0 0 1 14.3-6.2L21 9" />
      <path d="M21 3v6h-6" />
      <path d="M20.5 12a8.5 8.5 0 0 1-14.3 6.2L3 15" />
      <path d="M3 21v-6h6" />
    </svg>
  )
}

export function IconClose({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

export function IconChevronRight({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

export function IconChevronLeft({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m15 6-6 6 6 6" />
    </svg>
  )
}

export function IconClock({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  )
}

export function IconCheckCircle({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconUsers({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M16 19a4 4 0 0 0-8 0" />
      <circle cx="12" cy="11" r="3" />
      <path d="M20 19a3 3 0 0 0-2.2-5.7M4 19a3 3 0 0 1 2.2-5.7" />
    </svg>
  )
}

export function IconLogout({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  )
}

export function IconSparkle({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.4 4.2L18 8l-4.6 1.8L12 14l-1.4-4.2L6 8l4.6-1.8L12 2zm7 9 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3zm-14 2 1 2.5 2.5 1-2.5 1-1 2.5-1-2.5L2.5 16.5 5 15.5l1-2.5z" />
    </svg>
  )
}

export function AdminBrandMark({ className }: { className?: string }) {
  return (
    <div className={['flex items-center gap-2.5', className].filter(Boolean).join(' ')}>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-orange shadow-lg shadow-brand-orange/30">
        <span className="font-display text-sm font-bold text-white">B</span>
      </div>
      <div>
        <p className="font-display text-sm font-bold leading-tight text-white">The Serene Villa</p>
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-inverse-on-surface/70">
          Admin
        </p>
      </div>
    </div>
  )
}

export type AdminNavItem = {
  href: string
  label: string
  icon: ReactNode
  disabled?: boolean
}
