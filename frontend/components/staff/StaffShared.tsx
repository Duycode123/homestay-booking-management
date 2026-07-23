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
    { label: 'Lịch làm việc', shortLabel: 'Lịch', href: '/staff/dashboard', icon: 'schedule' as const },
    { label: 'Phòng & tiện nghi', shortLabel: 'Phòng', href: '/staff/rooms', icon: 'rooms' as const },
    { label: 'Đặt phòng', shortLabel: 'Đặt phòng', href: '/staff/bookings', icon: 'bookings' as const },
    { label: 'Cài đặt', shortLabel: 'Cài đặt', href: '/staff/settings', icon: 'settings' as const },
  ]

  const handleConfirmLogout = async () => {
    setIsLogoutConfirmOpen(false)
    await logout('/login')
  }

  return (
    <>
      <aside className="hidden w-[17rem] shrink-0 border-r border-white/10 bg-brand-greenDark px-4 py-6 text-inverse-on-surface lg:sticky lg:top-0 lg:flex lg:h-dvh lg:self-start lg:flex-col lg:overflow-hidden">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-brand-orange text-white">
            <IconLogo />
          </div>
          <div>
            <p className="font-editorial text-lg leading-none text-inverse-on-surface">The Serene Villa</p>
            <p className="mt-1.5 font-display text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-orange">Không gian nhân viên</p>
          </div>
        </div>

        <div className="mt-7 border-t border-white/10 pt-5">
          <div className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-primary-container font-display text-sm font-semibold text-on-primary-container">
                {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : avatarInitial}
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-semibold text-inverse-on-surface">{displayName}</p>
                <p className="mt-0.5 text-[11px] text-white/50">{roleLabel}</p>
              </div>
            </div>
          </div>
        </div>

        <nav aria-label="Điều hướng nhân viên" className="mt-6 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.18)_transparent]">
          {menuItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.label}
                href={item.href}
                className={[
                  'group relative flex h-11 items-center gap-3 rounded-lg px-3 font-display text-sm font-medium transition-colors',
                  active
                    ? 'bg-white text-brand-greenDark shadow-[0_8px_24px_rgba(5,24,19,0.16)]'
                    : 'text-white/68 hover:bg-white/[0.07] hover:text-white',
                ].join(' ')}
              >
                <span className={['flex h-5 w-5 items-center justify-center', active ? 'text-brand-orange' : 'text-white/50 group-hover:text-white'].join(' ')}>
                  <StaffNavIcon name={item.icon} />
                </span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-4 shrink-0 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={() => setIsLogoutConfirmOpen(true)}
            className="flex h-11 w-full items-center gap-3 rounded-lg px-3 font-display text-sm font-medium text-white/68 transition-colors hover:bg-white/[0.07] hover:text-white"
          >
            <IconLogout />
            Đăng xuất
          </button>
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-white/10 bg-brand-greenDark px-4 lg:hidden">
        <Link href="/staff/dashboard" className="flex min-w-0 items-center gap-2.5" aria-label="Về trang nhân viên">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-orange text-white">
            <IconLogo />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-editorial text-base leading-none text-white">The Serene Villa</span>
            <span className="mt-1 block text-[8px] font-semibold uppercase tracking-[0.18em] text-brand-orange">Nhân viên</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/[0.06] text-xs font-semibold text-white" aria-label={displayName}>
            {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : avatarInitial}
          </span>
          <button
            type="button"
            onClick={() => setIsLogoutConfirmOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Đăng xuất"
          >
            <IconLogout />
          </button>
        </div>
      </header>

      <nav aria-label="Điều hướng nhân viên trên di động" className="fixed inset-x-0 bottom-0 z-50 grid min-h-16 grid-cols-4 border-t border-outline-variant bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_32px_rgba(31,43,37,0.08)] backdrop-blur-md sm:px-2 lg:hidden">
        {menuItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={[
                'relative flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-0.5 text-[9px] font-semibold transition-colors min-[380px]:px-1 min-[380px]:text-[10px]',
                active ? 'text-brand-greenDark' : 'text-on-surface-variant',
              ].join(' ')}
            >
              {active && <span aria-hidden className="absolute inset-x-4 top-0 h-0.5 bg-brand-orange" />}
              <span className={active ? 'text-brand-orange' : ''}><StaffNavIcon name={item.icon} /></span>
              <span className="w-full truncate text-center">{item.shortLabel}</span>
            </Link>
          )
        })}
      </nav>

      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-brand-greenDark/55 p-4 backdrop-blur-sm" onClick={() => setIsLogoutConfirmOpen(false)}>
          <section role="dialog" aria-modal="true" aria-labelledby="staff-logout-title" className="w-full max-w-md rounded-xl border border-outline-variant bg-white p-6 shadow-[var(--homestay-shadow-elevated)]" onClick={(event) => event.stopPropagation()}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-orange">Phiên làm việc</p>
            <h2 id="staff-logout-title" className="mt-2 font-editorial text-3xl text-on-surface">Đăng xuất tài khoản?</h2>
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
    <div className="min-h-dvh bg-brand-bgGray pb-[calc(5rem+env(safe-area-inset-bottom))] pt-16 text-on-surface lg:flex lg:pb-0 lg:pt-0">
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
    <article className="rounded-xl border border-outline-variant bg-white/95 p-5 shadow-[var(--homestay-shadow-card)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">{label}</p>
          <p className="mt-3 font-editorial text-4xl font-normal leading-none text-on-surface">{value}</p>
        </div>
        <span className={['flex h-11 w-11 items-center justify-center rounded-lg', className].join(' ')}>{icon}</span>
      </div>
      <p className="mt-4 text-sm text-on-surface-variant">{helper}</p>
    </article>
  )
}

export function EmptyState({ title, description, actionLabel, onAction }: { title: string; description: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-outline bg-white/95 px-5 py-14 text-center shadow-[var(--homestay-shadow-card)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary-container text-brand-orange">
        <IconEmpty />
      </div>
      <h2 className="mt-5 font-editorial text-2xl text-on-surface">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">{description}</p>
      {actionLabel && onAction && <button type="button" onClick={onAction} className="btn-warm mx-auto mt-6">{actionLabel}</button>}
    </div>
  )
}

export function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-20 left-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border border-white/10 bg-secondary px-4 py-3 text-sm font-semibold text-on-secondary shadow-[var(--homestay-shadow-elevated)] lg:bottom-5">
      {message}
    </div>
  )
}

export function IconLogo() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="m4 11 8-6 8 6v8H4v-8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M9.5 19v-5h5v5M15.5 8.4c.6-1.7 1.8-2.7 3.6-2.9-.1 1.8-1.1 3-2.8 3.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function StaffNavIcon({ name }: { name: 'schedule' | 'rooms' | 'bookings' | 'settings' }) {
  if (name === 'schedule') {
    return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><rect x="4" y="5.5" width="16" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.8" /><path d="M8 3.5v4M16 3.5v4M4 9.5h16M8 13h3M8 16h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
  }
  if (name === 'rooms') {
    return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M4 18V8a2 2 0 0 1 2-2h7v12M13 10h5a2 2 0 0 1 2 2v6M3 18h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M7.5 10h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
  }
  if (name === 'bookings') {
    return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M7 4.5h10a2 2 0 0 1 2 2v13l-3-2-4 2-4-2-3 2v-13a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M8.5 9h7M8.5 12.5H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
  }
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" stroke="currentColor" strokeWidth="1.8" /><path d="m19 13.2 1.1 1.8-2 3.4h-2.2l-1.1.6-1.1 1.9H9.8L8.7 19l-1.1-.6H5.4L3.5 15l1.1-1.8v-1.3L3.5 10l1.9-3.4h2.2L8.7 6l1.1-1.9h3.9L14.8 6l1.1.6h2.2L20.1 10 19 11.9v1.3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
}

function IconLogout() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M10 6H6.5A2.5 2.5 0 0 0 4 8.5v7A2.5 2.5 0 0 0 6.5 18H10M14 8l4 4-4 4M18 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function IconEmpty() {
  return <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true"><path d="M5 7.5A2.5 2.5 0 0 1 7.5 5h9A2.5 2.5 0 0 1 19 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 16.5v-9Z" stroke="currentColor" strokeWidth="2" /><path d="M9 10h6M9 14h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}
