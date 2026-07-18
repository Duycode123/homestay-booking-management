'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/lib/auth'
import {
  fetchCurrentUser,
  getCustomerDisplayName,
  getInitials,
  type CustomerProfile,
} from '@/lib/customer-profile-service'

type AccountMenuProps = {
  onNavigate?: () => void
  align?: 'right' | 'full'
}

type IconName = 'user' | 'calendar' | 'settings' | 'logout' | 'mail' | 'dashboard'

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Quản trị viên',
  STAFF: 'Nhân viên',
  CUSTOMER: 'Khách hàng',
}

export default function AccountMenu({ onNavigate, align = 'right' }: AccountMenuProps) {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const displayName = profile ? getCustomerDisplayName(profile) : getCustomerDisplayName(user)
  const email = profile?.email || user?.email || ''
  const avatarUrl = profile?.avatarUrl || user?.avatarUrl
  const avatarInitial = getInitials(profile?.fullName || user?.fullName || user?.name, email)
  const role = profile?.role || user?.role || 'CUSTOMER'

  useEffect(() => {
    let mounted = true

    if (!user) {
      setProfile(null)
      return
    }

    // Do not display data from the previous account while the new profile loads.
    setProfile(null)

    void fetchCurrentUser(user)
      .then((currentUser) => {
        if (mounted) setProfile(currentUser)
      })
      .catch(() => {
        if (mounted) setProfile(null)
      })

    return () => {
      mounted = false
    }
  }, [user])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const handleNavigate = () => {
    setOpen(false)
    onNavigate?.()
  }

  const handleLogout = async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    try {
      setOpen(false)
      onNavigate?.()
      await logout('/')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const workspaceLink = role === 'ADMIN'
    ? { href: '/admin/dashboard', label: 'Trang quản trị' }
    : role === 'STAFF'
      ? { href: '/staff/dashboard', label: 'Trang nhân viên' }
      : null

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Mở menu tài khoản của ${displayName}`}
        className="group flex h-11 w-11 items-center justify-center rounded-full border border-[#ddccb4] bg-[#fffdfa] p-1 shadow-[0_7px_20px_rgba(32,57,48,.08)] transition duration-300 hover:-translate-y-0.5 hover:border-[#b98853]/55 hover:shadow-[0_11px_26px_rgba(32,57,48,.13)] focus:outline-none focus:ring-2 focus:ring-[#b98853]/25"
      >
        <span className="relative">
          <AccountAvatar avatarUrl={avatarUrl} initial={avatarInitial} size="trigger" />
          <OnlineDot className="bottom-0 right-0" />
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Tài khoản"
          className={[
            'serene-dropdown-enter absolute z-[100] mt-3 w-[min(304px,calc(100vw-24px))] overflow-hidden rounded-[18px] border border-[#d8c9b5] bg-[#fffdfa] shadow-[0_22px_56px_rgba(20,47,38,.22)]',
            align === 'full' ? 'right-0' : 'right-0',
          ].join(' ')}
        >
          <div className="relative border-b border-white/10 bg-[linear-gradient(145deg,#173f35,#254f43)] px-4 py-4 text-white">
            <div className="pointer-events-none absolute -right-12 -top-16 h-32 w-32 rounded-full border border-white/10" aria-hidden />
            <div className="relative flex items-center gap-3">
              <span className="relative">
                <AccountAvatar avatarUrl={avatarUrl} initial={avatarInitial} size="menu" />
                <OnlineDot className="bottom-0 right-0" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[15px] font-bold text-white">{displayName}</p>
                <p className="mt-0.5 text-xs text-white/65">{roleLabels[role]}</p>
              </div>
            </div>
          </div>

          <div className="border-b border-[#e8ddcf] px-4 py-3">
            {email ? <ContactRow icon="mail" value={email} /> : null}
          </div>

          <div className="space-y-1.5 p-2.5">
            {workspaceLink ? (
              <MenuLink href={workspaceLink.href} label={workspaceLink.label} icon="dashboard" onClick={handleNavigate} />
            ) : null}
            <MenuLink href="/customer/profile" label="Thông tin cá nhân" icon="user" emphasized onClick={handleNavigate} />
            {role === 'CUSTOMER' ? (
              <MenuLink href="/customer/bookings" label="Lịch sử đặt phòng" icon="calendar" onClick={handleNavigate} />
            ) : null}
            <MenuLink href="/customer/account-settings" label="Cài đặt tài khoản" icon="settings" onClick={handleNavigate} />
          </div>

          <div className="border-t border-[#e8ddcf] bg-[#fbf7f1] p-2">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              role="menuitem"
              className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[#bd3535] transition hover:bg-[#fff0f0] focus:outline-none focus:ring-2 focus:ring-[#bd3535]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Icon name="logout" />
              <span className="font-display text-sm font-semibold">{isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function MenuLink({ href, label, icon, emphasized = false, onClick }: { href: string; label: string; icon: IconName; emphasized?: boolean; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      role="menuitem"
      className={[
        'group flex items-center justify-between rounded-xl border px-3 py-2.5 transition focus:outline-none focus:ring-2 focus:ring-[#b98853]/25',
        emphasized
          ? 'border-transparent bg-[#f7efe4] text-[#173f35] hover:bg-[#f1e3d1]'
          : 'border-transparent text-[#303833] hover:border-[#e2d5c3] hover:bg-[#f8f3ec]',
      ].join(' ')}
    >
      <span className="flex items-center gap-3">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${emphasized ? 'bg-[#173f35] text-white' : 'bg-[#efe5d7] text-[#74593b]'}`}>
          <Icon name={icon} />
        </span>
        <span className="font-display text-sm font-semibold">{label}</span>
      </span>
      <svg className="h-4 w-4 text-[#a38e72] transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="m9 6 6 6-6 6" /></svg>
    </Link>
  )
}

function ContactRow({ icon, value }: { icon: 'mail'; value: string }) {
  return (
    <p className="flex min-w-0 items-center gap-2.5 text-xs text-[#6e716b]">
      <span className="text-[#8a7356]"><Icon name={icon} /></span>
      <span className="truncate">{value}</span>
    </p>
  )
}

function AccountAvatar({ avatarUrl, initial, size }: { avatarUrl?: string; initial: string; size: 'trigger' | 'menu' }) {
  const classes = size === 'menu' ? 'h-11 w-11 border border-[#d8b98e] text-base' : 'h-9 w-9 text-sm'
  return (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#173f35] font-display font-bold text-white ${classes}`}>
      {avatarUrl ? <img src={avatarUrl} alt="Ảnh đại diện" width={size === 'menu' ? 44 : 36} height={size === 'menu' ? 44 : 36} decoding="async" className="h-full w-full object-cover" /> : initial}
    </span>
  )
}

function OnlineDot({ className }: { className: string }) {
  return <span className={`absolute h-2.5 w-2.5 rounded-full border-2 border-white bg-[#36a26f] ${className}`} aria-hidden />
}

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /><path d="M8 14h2M14 14h2M8 17h2" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
    logout: <><path d="M10 17 15 12l-5-5" /><path d="M15 12H3" /><path d="M21 5v14" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  }
  return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{paths[name]}</svg>
}
