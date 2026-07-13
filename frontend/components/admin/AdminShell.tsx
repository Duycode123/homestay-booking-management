'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { memo, type ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  AdminBrandMark,
  IconBookings,
  IconCoupons,
  IconDashboard,
  IconIncidentReports,
  IconLogout,
  IconReviews,
  IconRooms,
  IconStaff,
  type AdminNavItem,
} from './AdminIcons'

const NAV_ITEMS: AdminNavItem[] = [
  { href: '/admin/dashboard', label: 'Tổng quan', icon: <IconDashboard className="h-5 w-5" /> },
  { href: '/admin/bookings', label: 'Đơn đặt phòng', icon: <IconBookings className="h-5 w-5" /> },
  { href: '/admin/staff', label: 'Nhân viên', icon: <IconStaff className="h-5 w-5" /> },
  { href: '/admin/staff-schedule', label: 'Lịch nhân viên', icon: <IconBookings className="h-5 w-5" /> },
  { href: '/admin/rooms', label: 'Phòng homestay', icon: <IconRooms className="h-5 w-5" /> },
  { href: '/admin/coupons', label: 'Mã giảm giá', icon: <IconCoupons className="h-5 w-5" /> },
  { href: '/admin/reviews', label: 'Đánh giá', icon: <IconReviews className="h-5 w-5" /> },
  { href: '/admin/incident-reports', label: 'Báo cáo sự cố', icon: <IconIncidentReports className="h-5 w-5" /> },
]

type AdminShellProps = {
  children: ReactNode
}

function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout('/login')
  }

  return (
    <div className="h-screen overflow-hidden bg-brand-bgGray">
      {/* Decorative background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-orange/5 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-secondary-container/20 blur-3xl" />
      </div>

      <div className="relative flex h-screen">
        {/* Sidebar - desktop: full viewport height, footer pinned at bottom */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-gradient-to-b from-brand-greenDark via-brand-greenDark to-brand-greenLight lg:flex">
          <div className="shrink-0 border-b border-white/10 px-5 py-6">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="block w-full rounded-xl text-left transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50"
              aria-label="Tải lại trang"
              title="Tải lại trang"
            >
              <AdminBrandMark />
            </button>
          </div>

          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-5">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href
              const base =
                'flex items-center gap-3 rounded-xl px-3 py-2.5 font-display text-sm font-medium transition-all'

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    base,
                    active
                      ? 'bg-white/15 text-white shadow-inner shadow-black/10'
                      : 'text-inverse-on-surface/75 hover:bg-white/10 hover:text-white',
                  ].join(' ')}
                >
                  <span className={active ? 'text-brand-orange' : ''}>{item.icon}</span>
                  {item.label}
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-orange shadow-[0_0_8px_rgba(255,117,24,0.8)]" />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="shrink-0 border-t border-white/10 bg-brand-greenDark/40 p-4 backdrop-blur-sm">
            <Link
              href="/customer/profile"
              className="mb-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-display text-sm font-medium text-inverse-on-surface/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px]">U</span>
              Hồ sơ cá nhân
            </Link>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-display text-sm font-medium text-inverse-on-surface/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <IconLogout className="h-5 w-5" />
              Đăng xuất
            </button>
          </div>
        </aside>

        {/* Mobile top nav */}
        <div className="fixed inset-x-0 top-0 z-30 border-b border-outline-variant bg-white/90 backdrop-blur-md lg:hidden">
          <div className="flex items-center gap-2 overflow-x-auto px-4 py-3">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-display text-xs font-medium transition-colors',
                    active
                      ? 'bg-brand-orange text-white'
                      : 'bg-surface-container text-on-surface-variant',
                  ].join(' ')}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Main */}
        <main className="flex-1 overflow-y-auto overscroll-contain pt-14 lg:pt-0">{children}</main>
      </div>
    </div>
  )
}

export default memo(AdminShell)
