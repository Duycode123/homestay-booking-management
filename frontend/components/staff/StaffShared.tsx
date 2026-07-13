'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getDisplayName, getInitials, getRoleLabel } from '@/lib/staff-profile'

export function StaffSidebar() {
  const pathname = usePathname()
  const { user, logout, isLoggingOut } = useAuth()
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)
  const displayName = getDisplayName(user)
  const roleLabel = getRoleLabel(user?.role)
  const avatarInitial = getInitials(displayName || user?.email)
  const menuItems = [
    { label: 'Lịch làm việc', href: '/staff/dashboard' },
    { label: 'Phòng & Tiện nghi', href: '/staff/rooms' },
    { label: 'Booking', href: '/staff/bookings' },
    { label: 'Cài đặt', href: '/staff/settings' },
  ]

  const handleConfirmLogout = async () => {
    setIsLogoutConfirmOpen(false)
    await logout('/login')
  }

  return (
    <>
      <aside className="hidden w-72 shrink-0 border-r border-secondary-container/60 bg-secondary px-4 py-6 text-inverse-on-surface lg:flex lg:flex-col">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-orange text-white shadow-[0_12px_28px_rgba(255,117,24,0.24)]">
            <IconLogo />
          </div>
          <div>
            <p className="font-display text-lg font-bold leading-none text-inverse-on-surface">Homestay Booking</p>
            <p className="mt-1 font-display text-xs font-bold uppercase tracking-wide text-brand-orange">Staff</p>
          </div>
        </div>

        <div className="mt-8 border-t border-secondary-container/60 pt-6">
          <div className="rounded-xl border border-secondary-container/70 bg-secondary-container/45 px-3 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-primary-container font-display font-bold text-on-primary-container">
                {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : avatarInitial}
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold text-inverse-on-surface">{displayName}</p>
                <p className="text-xs text-on-secondary-container">{roleLabel}</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="mt-6 space-y-1">
          {menuItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.label}
                href={item.href}
                className={[
                  'relative flex h-12 items-center gap-3 rounded-lg px-3 font-display text-sm font-medium transition',
                  active
                    ? 'bg-[rgba(255,117,24,0.12)] text-brand-orange before:absolute before:left-0 before:top-2 before:h-8 before:w-[3px] before:rounded-full before:bg-brand-orange'
                    : 'text-inverse-on-surface/75 hover:bg-brand-orange/10 hover:text-inverse-on-surface',
                ].join(' ')}
              >
                <span className="flex h-5 w-5 items-center justify-center">
                  <IconMenuDot active={active} />
                </span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto">
          <button
            type="button"
            onClick={() => setIsLogoutConfirmOpen(true)}
            className="flex h-12 w-full items-center gap-3 rounded-lg px-3 font-display text-sm font-medium text-inverse-on-surface/75 transition hover:bg-brand-orange/10 hover:text-inverse-on-surface"
          >
            <IconLogout />
            Đăng xuất
          </button>
        </div>
      </aside>

      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1A1C1E]/45 p-4" onClick={() => setIsLogoutConfirmOpen(false)}>
          <section className="w-full max-w-md rounded-xl border border-outline-variant bg-white p-6 shadow-[var(--homestay-shadow-elevated)]" onClick={(event) => event.stopPropagation()}>
            <h2 className="font-display text-xl font-bold text-on-surface">Đăng xuất tài khoản?</h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng trang nhân viên.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setIsLogoutConfirmOpen(false)} className="btn-secondary" disabled={isLoggingOut}>
                Hủy
              </button>
              <button type="button" onClick={handleConfirmLogout} className="btn-warm" disabled={isLoggingOut}>
                {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}

export function StaffPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-bgGray text-on-surface lg:flex">
      <StaffSidebar />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1480px] space-y-6">{children}</div>
      </main>
    </div>
  )
}

export function StatusBadge({ label, className, dotClassName }: { label: string; className: string; dotClassName?: string }) {
  return (
    <span className={['inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-display text-xs font-bold', className].join(' ')}>
      {dotClassName && <span className={['h-1.5 w-1.5 rounded-full', dotClassName].join(' ')} />}
      {label}
    </span>
  )
}

export function StatCard({ label, value, helper, icon, className }: { label: string; value: string | number; helper: string; icon: ReactNode; className: string }) {
  return (
    <article className="rounded-3xl border border-outline-variant bg-white p-5 shadow-[var(--homestay-shadow-card)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-sm font-bold text-on-surface-variant">{label}</p>
          <p className="mt-3 font-display text-4xl font-bold leading-none text-on-surface">{value}</p>
        </div>
        <span className={['flex h-12 w-12 items-center justify-center rounded-2xl', className].join(' ')}>{icon}</span>
      </div>
      <p className="mt-4 text-sm text-on-surface-variant">{helper}</p>
    </article>
  )
}

export function EmptyState({ title, description, actionLabel, onAction }: { title: string; description: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-outline bg-white px-5 py-14 text-center shadow-[var(--homestay-shadow-card)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-container text-brand-orange">
        <IconEmpty />
      </div>
      <h2 className="mt-5 font-display text-xl font-bold text-on-surface">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">{description}</p>
      {actionLabel && onAction && <button type="button" onClick={onAction} className="btn-warm mx-auto mt-6">{actionLabel}</button>}
    </div>
  )
}

export function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-5 left-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-secondary-container bg-secondary px-4 py-3 text-sm font-semibold text-on-secondary shadow-[var(--homestay-shadow-elevated)]">
      {message}
    </div>
  )
}

export function IconLogo() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M4 9v6M8 5v14M12 3v18M16 6v12M20 10v4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
}

function IconMenuDot({ active }: { active: boolean }) {
  return <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true"><rect x="4" y="4" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" opacity={active ? 1 : 0.68} /><path d="M7 10h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity={active ? 1 : 0.68} /></svg>
}

function IconLogout() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M10 6H6.5A2.5 2.5 0 0 0 4 8.5v7A2.5 2.5 0 0 0 6.5 18H10M14 8l4 4-4 4M18 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function IconEmpty() {
  return <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true"><path d="M5 7.5A2.5 2.5 0 0 1 7.5 5h9A2.5 2.5 0 0 1 19 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 16.5v-9Z" stroke="currentColor" strokeWidth="2" /><path d="M9 10h6M9 14h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}
