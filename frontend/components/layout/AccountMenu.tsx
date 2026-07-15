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

type MenuIconName = 'user' | 'lock' | 'history' | 'help' | 'alert' | 'accessibility' | 'logout'

const customerMenuItems: Array<{ icon: MenuIconName; label: string; href: string }> = [
  { icon: 'lock', label: 'Bảo mật & mật khẩu', href: '/customer/security' },
  { icon: 'history', label: 'Lịch sử đặt phòng', href: '/customer/bookings' },
  { icon: 'help', label: 'Trợ giúp và hỗ trợ', href: '/customer/support' },
  { icon: 'alert', label: 'Báo cáo sự cố', href: '/customer/report-issue' },
  { icon: 'accessibility', label: 'Màn hình và trợ năng', href: '/customer/accessibility' },
]

const adminMenuItems: Array<{ icon: MenuIconName; label: string; href: string }> = [
  { icon: 'user', label: 'Dashboard quản trị', href: '/admin/dashboard' },
  { icon: 'lock', label: 'Bảo mật & mật khẩu', href: '/customer/security' },
  { icon: 'accessibility', label: 'Màn hình và trợ năng', href: '/customer/accessibility' },
]

const staffMenuItems: Array<{ icon: MenuIconName; label: string; href: string }> = [
  { icon: 'user', label: 'Dashboard nhân viên', href: '/staff/dashboard' },
  { icon: 'lock', label: 'Bảo mật & mật khẩu', href: '/customer/security' },
  { icon: 'accessibility', label: 'Màn hình và trợ năng', href: '/customer/accessibility' },
]

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Admin',
  STAFF: 'Nhân viên',
  CUSTOMER: 'Khách hàng',
}

function getMenuItems(role: UserRole) {
  if (role === 'ADMIN') return adminMenuItems
  if (role === 'STAFF') return staffMenuItems
  return customerMenuItems
}

export default function AccountMenu({ onNavigate, align = 'right' }: AccountMenuProps) {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const displayProfile = profile ?? null
  const displayName = displayProfile ? getCustomerDisplayName(displayProfile) : getCustomerDisplayName(user)
  const userEmail = displayProfile?.email || user?.email || ''
  const avatarUrl = displayProfile?.avatarUrl || user?.avatarUrl
  const avatarInitial = getInitials(displayProfile?.fullName || user?.fullName || user?.name, userEmail)
  const role = displayProfile?.role || user?.role || 'CUSTOMER'
  const menuItems = getMenuItems(role)

  useEffect(() => {
    let mounted = true

    if (!user) {
      setProfile(null)
      return
    }

    setProfile(null)

    void fetchCurrentUser(user).then((currentUser) => {
      if (mounted) {
        setProfile(currentUser)
      }
    })

    return () => {
      mounted = false
    }
  }, [user])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
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

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="group flex min-h-12 items-center gap-2.5 rounded-full border border-[#d9c6aa] bg-[linear-gradient(135deg,rgba(255,255,255,.98),rgba(248,243,235,.96))] py-1.5 pl-1.5 pr-3 shadow-[0_8px_24px_rgba(36,58,49,.10),inset_0_0_0_1px_rgba(255,255,255,.85)] transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-orange/55 hover:shadow-[0_12px_30px_rgba(36,58,49,.15)] focus:outline-none focus:ring-2 focus:ring-brand-orange/25"
      >
        <span className="relative">
          <AccountAvatar avatarUrl={avatarUrl} initial={avatarInitial} size="small" />
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#3f8068]" aria-hidden />
        </span>
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block max-w-[170px] truncate font-display text-sm font-bold text-[#25332d]">{displayName}</span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a7356]">{roleLabels[role]}</span>
        </span>
        <svg className={['h-4 w-4 text-[#806b50] transition-transform duration-300', open ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="m7 10 5 5 5-5" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className={[
            'absolute z-[90] mt-3 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-[26px] border border-[#dfd2bf] bg-[#fffdfa] shadow-[0_24px_70px_rgba(26,47,39,.22)]',
            align === 'full' ? 'right-0' : 'right-0',
          ].join(' ')}
        >
          <div className="relative overflow-hidden bg-[linear-gradient(145deg,#123f34,#255e4e)] p-5 text-white">
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full border border-white/10" aria-hidden />
            <div className="pointer-events-none absolute -right-2 top-5 h-24 w-24 rounded-full border border-[#c89861]/25" aria-hidden />
            <div className="flex items-center gap-3">
              <AccountAvatar avatarUrl={avatarUrl} initial={avatarInitial} size="large" />
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-bold text-white">{displayName}</p>
                <p className="mt-0.5 truncate text-sm text-white/70">{userEmail}</p>
                <span className="mt-2 inline-flex rounded-full border border-[#e1bd8a]/35 bg-[#e1bd8a]/15 px-3 py-1 font-display text-[10px] font-bold uppercase tracking-[0.12em] text-[#f6dfbf]">
                  {roleLabels[role]}
                </span>
              </div>
            </div>

            <Link
              href="/customer/profile"
              onClick={handleNavigate}
              className="relative mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 font-display text-sm font-semibold text-white backdrop-blur-sm transition hover:border-[#e1bd8a]/50 hover:bg-white/16 focus:outline-none focus:ring-2 focus:ring-[#e1bd8a]/35"
              role="menuitem"
            >
              <Icon name="user" />
              Xem hồ sơ cá nhân
            </Link>
          </div>

          <div className="px-2 pb-2 pt-3">
            <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a8569]">Tiện ích tài khoản</p>
            {menuItems.map((item) => (
              <AccountMenuLink
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
                onClick={handleNavigate}
              />
            ))}
          </div>

          <div className="border-t border-[#eadfce] bg-[#fcf8f2] p-2">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-error-container focus:outline-none focus:ring-2 focus:ring-error/20 disabled:cursor-not-allowed disabled:opacity-60"
              role="menuitem"
            >
              <MenuIcon name="logout" danger />
              <span className="font-display text-sm font-semibold text-[#C62828]">
                {isLoggingOut ? 'Đang đăng xuất' : 'Đăng xuất'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function AccountMenuLink({
  icon,
  label,
  href,
  onClick,
}: {
  icon: MenuIconName
  label: string
  href: string
  onClick: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group flex items-center justify-between rounded-2xl px-3 py-2.5 transition hover:bg-[#f5ede2] focus:outline-none focus:ring-2 focus:ring-brand-orange/20"
      role="menuitem"
    >
      <span className="flex items-center gap-3">
        <MenuIcon name={icon} />
        <span className="font-display text-sm font-semibold text-on-surface">{label}</span>
      </span>
      <svg className="h-4 w-4 text-[#a38e72] transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="m9 6 6 6-6 6" /></svg>
    </Link>
  )
}

function AccountAvatar({
  avatarUrl,
  initial,
  size,
}: {
  avatarUrl?: string
  initial: string
  size: 'small' | 'large'
}) {
  const classes = size === 'large' ? 'h-16 w-16 border-2 border-[#d9b27e] text-xl shadow-lg' : 'h-9 w-9 text-sm'

  return (
    <span
      className={[
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary font-display font-bold text-white',
        classes,
      ].join(' ')}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="Ảnh đại diện"
          width={size === 'large' ? 64 : 40}
          height={size === 'large' ? 64 : 40}
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        initial
      )}
    </span>
  )
}

function MenuIcon({ name, danger = false }: { name: MenuIconName; danger?: boolean }) {
  return (
    <span
      className={[
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl',
        danger ? 'bg-error-container text-error' : 'bg-[#efe2cf] text-[#785d3d] transition-colors group-hover:bg-[#e5d2b5]',
      ].join(' ')}
    >
      <Icon name={name} />
    </span>
  )
}

function Icon({ name }: { name: MenuIconName }) {
  const paths: Record<MenuIconName, ReactNode> = {
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    history: (
      <>
        <path d="M4 7v5h5" />
        <path d="M5.5 17A8 8 0 1 0 4 12" />
        <path d="M12 8v5l3 2" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9a2.7 2.7 0 0 1 5 1.4c0 2-2.5 2.1-2.5 4.1" />
        <path d="M12 18h.01" />
      </>
    ),
    alert: (
      <>
        <path d="m12 3 10 18H2L12 3z" />
        <path d="M12 9v5" />
        <path d="M12 17h.01" />
      </>
    ),
    accessibility: (
      <>
        <circle cx="12" cy="4" r="2" />
        <path d="M5 8h14" />
        <path d="M12 10v10" />
        <path d="M8 20l4-10 4 10" />
      </>
    ),
    logout: (
      <>
        <path d="M10 17 15 12l-5-5" />
        <path d="M15 12H3" />
        <path d="M21 5v14" />
      </>
    ),
  }

  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      {paths[name]}
    </svg>
  )
}
