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
        className="flex items-center gap-2 rounded-full border border-[#C9C2B6] bg-white/85 px-3 py-2 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF7518]/30"
      >
        <AccountAvatar avatarUrl={avatarUrl} initial={avatarInitial} size="small" />
        <span className="hidden max-w-[170px] truncate font-display text-sm font-semibold text-[#1A1C1E] sm:block">
          {displayName}
        </span>
        <span className="font-display text-xs text-[#5C5348]">v</span>
      </button>

      {open && (
        <div
          role="menu"
          className={[
            'absolute z-[90] mt-3 w-[min(380px,calc(100vw-32px))] overflow-hidden rounded-[24px] border border-[#E8E4DC] bg-white shadow-[0_24px_70px_rgba(26,28,30,0.20)]',
            align === 'full' ? 'right-0' : 'right-0',
          ].join(' ')}
        >
          <div className="bg-[#F5F2EC] p-5">
            <div className="flex items-center gap-3">
              <AccountAvatar avatarUrl={avatarUrl} initial={avatarInitial} size="large" />
              <div className="min-w-0">
                <p className="truncate font-display text-base font-bold text-[#1A1C1E]">{displayName}</p>
                <p className="mt-1 truncate text-sm text-[#5C5348]">{userEmail}</p>
                <span className="mt-2 inline-flex rounded-full bg-[#FFE8D6] px-3 py-1 font-display text-xs font-bold text-[#6B3200]">
                  {roleLabels[role]}
                </span>
              </div>
            </div>

            <Link
              href="/customer/profile"
              onClick={handleNavigate}
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#FF7518] font-display text-sm font-semibold text-white transition hover:bg-[#E6640F] focus:outline-none focus:ring-2 focus:ring-[#FF7518]/30"
              role="menuitem"
            >
              <Icon name="user" />
              Xem hồ sơ cá nhân
            </Link>
          </div>

          <div className="border-t border-[#E8E4DC] p-2">
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

          <div className="border-t border-[#E8E4DC] p-2">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-[#FFF4F2] focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 disabled:cursor-not-allowed disabled:opacity-60"
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
      className="flex items-center justify-between rounded-2xl px-3 py-3 transition hover:bg-[#FAF8F4] focus:outline-none focus:ring-2 focus:ring-[#FF7518]/20"
      role="menuitem"
    >
      <span className="flex items-center gap-3">
        <MenuIcon name={icon} />
        <span className="font-display text-sm font-semibold text-[#1A1C1E]">{label}</span>
      </span>
      <span className="text-xs text-[#5C5348]">›</span>
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
  const classes = size === 'large' ? 'h-14 w-14 text-xl' : 'h-9 w-9 text-sm'

  return (
    <span
      className={[
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FF7518] font-display font-bold text-white',
        classes,
      ].join(' ')}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="Ảnh đại diện" className="h-full w-full object-cover" />
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
        danger ? 'bg-[#FFEBEE] text-[#C62828]' : 'bg-[#FFE8D6] text-[#6B3200]',
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
