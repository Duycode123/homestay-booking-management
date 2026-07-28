'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/components/i18n/LocaleProvider'
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

type IconName =
  | 'user'
  | 'calendar'
  | 'settings'
  | 'logout'
  | 'mail'
  | 'dashboard'

export default function AccountMenu({
  onNavigate,
  align = 'right',
}: AccountMenuProps) {
  const { user, logout } = useAuth()
  const { locale, localizedHref } = useI18n()
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const displayName = profile
    ? getCustomerDisplayName(profile)
    : getCustomerDisplayName(user)

  const email = profile?.email || user?.email || ''
  const avatarUrl = profile?.avatarUrl || user?.avatarUrl
  const avatarInitial = getInitials(
    profile?.fullName || user?.fullName || user?.name,
    email,
  )
  const role = profile?.role || user?.role || 'CUSTOMER'

  const copy =
    locale === 'en'
      ? {
        roles: {
          ADMIN: 'Administrator',
          STAFF: 'Staff',
          CUSTOMER: 'Guest',
        } as Record<UserRole, string>,
        admin: 'Admin dashboard',
        staff: 'Staff dashboard',
        profile: 'Personal information',
        bookings: 'Booking history',
        process: 'Stay process',
        settings: 'Account settings',
        logout: 'Sign out',
        loggingOut: 'Signing out...',
        account: 'Account',
        openMenu: `Open account menu for ${displayName}`,
        avatar: 'Profile photo',
      }
      : {
        roles: {
          ADMIN: 'Quản trị viên',
          STAFF: 'Nhân viên',
          CUSTOMER: 'Khách hàng',
        } as Record<UserRole, string>,
        admin: 'Trang quản trị',
        staff: 'Trang nhân viên',
        profile: 'Thông tin cá nhân',
        bookings: 'Lịch sử đặt phòng',
        process: 'Quy trình lưu trú',
        settings: 'Cài đặt tài khoản',
        logout: 'Đăng xuất',
        loggingOut: 'Đang đăng xuất...',
        account: 'Tài khoản',
        openMenu: `Mở menu tài khoản của ${displayName}`,
        avatar: 'Ảnh đại diện',
      }

  useEffect(() => {
    let mounted = true
    queueMicrotask(() => {
      if (!mounted) return
      if (!user) {
        setProfile(null)
        return
      }

      setProfile(null)
      void fetchCurrentUser(user)
        .then((currentUser) => {
          if (mounted) setProfile(currentUser)
        })
        .catch(() => {
          if (mounted) setProfile(null)
        })
    })

    return () => {
      mounted = false
    }
  }, [user])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
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

  const workspaceLink =
    role === 'ADMIN'
      ? { href: '/admin/dashboard', label: copy.admin }
      : role === 'STAFF'
        ? { href: '/staff/dashboard', label: copy.staff }
        : null

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={copy.openMenu}
        className="group flex h-11 w-11 items-center justify-center rounded-full border border-[#d9c9b3] bg-[#fffdfa] p-1 shadow-[0_7px_20px_rgba(32,57,48,.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#31584E]/35 hover:shadow-[0_12px_28px_rgba(32,57,48,.14)] focus:outline-none focus:ring-2 focus:ring-[#31584E]/20"
      >
        <span className="relative">
          <AccountAvatar
            avatarUrl={avatarUrl}
            initial={avatarInitial}
            size="trigger"
          />
          <OnlineDot className="bottom-0 right-0" />
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={copy.account}
          className={[
            'serene-dropdown-enter premium-scrollbar absolute z-[100] mt-3 max-h-[calc(100dvh-7rem)] w-[min(340px,calc(100vw-24px))] overflow-y-auto overscroll-contain rounded-[26px] border border-[#ddd0bd] bg-[rgba(255,253,250,.97)] shadow-[0_30px_80px_rgba(27,49,42,.18)] backdrop-blur-xl',
            align === 'full' ? 'right-0' : 'right-0',
          ].join(' ')}
        >
          <div className="relative overflow-hidden rounded-t-[26px] bg-[linear-gradient(160deg,#31584E,#45695D)] px-5 py-5 text-white">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full border border-white/10"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-white/[0.03]"
            />

            <div className="relative flex items-center gap-4">
              <span className="relative shrink-0">
                <AccountAvatar
                  avatarUrl={avatarUrl}
                  initial={avatarInitial}
                  size="menu"
                  alt={copy.avatar}
                />
                <OnlineDot className="bottom-0.5 right-0.5" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base font-bold text-white">
                  {displayName}
                </p>
                <p className="mt-1 text-xs text-white/70">
                  {copy.roles[role]}
                </p>
              </div>
            </div>
          </div>

          {email ? (
            <div className="border-b border-[#eadfce] px-5 py-3.5">
              <ContactRow icon="mail" value={email} />
            </div>
          ) : null}

          <div className="space-y-2 p-3">
            {workspaceLink ? (
              <MenuLink
                href={localizedHref(workspaceLink.href)}
                label={workspaceLink.label}
                icon="dashboard"
                onClick={handleNavigate}
              />
            ) : null}

            <MenuLink
              href={localizedHref('/customer/profile')}
              label={copy.profile}
              icon="user"
              emphasized
              onClick={handleNavigate}
            />

            {role === 'CUSTOMER' ? (
              <MenuLink
                href={localizedHref('/customer/bookings')}
                label={copy.bookings}
                icon="calendar"
                onClick={handleNavigate}
              />
            ) : null}

            <MenuLink
              href={localizedHref('/process')}
              label={copy.process}
              icon="calendar"
              onClick={handleNavigate}
            />

            <MenuLink
              href={localizedHref('/customer/account-settings')}
              label={copy.settings}
              icon="settings"
              onClick={handleNavigate}
            />
          </div>

          <div className="border-t border-[#eadfce] bg-transparent p-3">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              role="menuitem"
              className="group flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-[#b83a3a] transition-all duration-200 hover:bg-[#fff1f1] focus:outline-none focus:ring-2 focus:ring-[#b83a3a]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff0f0] text-[#b83a3a] transition-transform duration-200 group-hover:scale-105">
                <Icon name="logout" />
              </span>

              <span className="font-display text-sm font-semibold">
                {isLoggingOut ? copy.loggingOut : copy.logout}
              </span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function MenuLink({
  href,
  label,
  icon,
  emphasized = false,
  onClick,
}: {
  href: string
  label: string
  icon: IconName
  emphasized?: boolean
  onClick: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      role="menuitem"
      className={[
        'group flex items-center justify-between rounded-2xl border px-3.5 py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#31584E]/20',
        emphasized
          ? 'border-transparent bg-[#f4ede3] text-[#234D42] hover:-translate-y-px hover:bg-[#eee2d3] hover:shadow-[0_10px_24px_rgba(35,77,66,.08)]'
          : 'border-transparent text-[#303833] hover:-translate-y-px hover:border-[#e3d7c6] hover:bg-[#f8f3ec] hover:shadow-[0_10px_24px_rgba(35,77,66,.06)]',
      ].join(' ')}
    >
      <span className="flex min-w-0 items-center gap-3.5">
        <span
          className={[
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200',
            emphasized
              ? 'bg-[#234D42] text-white shadow-[0_6px_16px_rgba(35,77,66,.18)]'
              : 'bg-[#efe6da] text-[#74593b] group-hover:bg-[#eadfce]',
          ].join(' ')}
        >
          <Icon name={icon} />
        </span>

        <span className="truncate font-display text-sm font-semibold">
          {label}
        </span>
      </span>

      <svg
        className="h-4 w-4 shrink-0 text-[#a38e72] transition-transform duration-200 group-hover:translate-x-1"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden
      >
        <path d="m9 6 6 6-6 6" />
      </svg>
    </Link>
  )
}

function ContactRow({
  icon,
  value,
}: {
  icon: 'mail'
  value: string
}) {
  return (
    <p className="flex min-w-0 items-center gap-3 text-xs text-[#6e716b]">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f2eadf] text-[#80684d]">
        <Icon name={icon} />
      </span>
      <span className="truncate">{value}</span>
    </p>
  )
}

function AccountAvatar({
  avatarUrl,
  initial,
  size,
  alt = 'Ảnh đại diện',
}: {
  avatarUrl?: string
  initial: string
  size: 'trigger' | 'menu'
  alt?: string
}) {
  const classes =
    size === 'menu'
      ? 'h-14 w-14 border-2 border-white/80 text-lg shadow-[0_10px_24px_rgba(0,0,0,.16)]'
      : 'h-9 w-9 text-sm'

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#234D42] font-display font-bold text-white ${classes}`}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={alt}
          width={size === 'menu' ? 56 : 36}
          height={size === 'menu' ? 56 : 36}
          unoptimized
          className="h-full w-full object-cover"
        />
      ) : (
        initial
      )}
    </span>
  )
}

function OnlineDot({ className }: { className: string }) {
  return (
    <span
      className={`absolute h-3 w-3 rounded-full border-2 border-white bg-[#36a26f] shadow-sm ${className}`}
      aria-hidden
    />
  )
}

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    user: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
        <path d="M8 14h2M14 14h2M8 17h2" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    logout: (
      <>
        <path d="M10 17 15 12l-5-5" />
        <path d="M15 12H3" />
        <path d="M21 5v14" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
  }

  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {paths[name]}
    </svg>
  )
}
