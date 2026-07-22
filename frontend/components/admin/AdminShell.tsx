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
  IconEquipment,
  IconIncidentReports,
  IconLogout,
  IconPayroll,
  IconRefund,
  IconReviews,
  IconRooms,
  IconStaff,
  type AdminNavItem,
} from './AdminIcons'

const NAV_ITEMS: AdminNavItem[] = [
  { href: '/admin/dashboard', label: 'Tổng quan', icon: <IconDashboard className="h-5 w-5" /> },
  { href: '/admin/bookings', label: 'Đơn đặt phòng', icon: <IconBookings className="h-5 w-5" /> },
  { href: '/admin/refunds', label: 'Trung tâm hoàn tiền', icon: <IconRefund className="h-5 w-5" /> },
  { href: '/admin/staff', label: 'Nhân viên', icon: <IconStaff className="h-5 w-5" /> },
  { href: '/admin/staff-schedule', label: 'Lịch nhân viên', icon: <IconBookings className="h-5 w-5" /> },
  { href: '/admin/payroll', label: 'Bảng lương', icon: <IconPayroll className="h-5 w-5" /> },
  { href: '/admin/rooms', label: 'Phòng homestay', icon: <IconRooms className="h-5 w-5" /> },
  { href: '/admin/addons', label: 'Dịch vụ thuê thêm', icon: <IconEquipment className="h-5 w-5" /> },
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
      <div className="flex h-screen">
        <aside className="sticky top-0 hidden h-screen w-[17rem] shrink-0 flex-col border-r border-white/10 bg-brand-greenDark lg:flex">
          <div className="shrink-0 border-b border-white/10 px-6 py-6">
            <Link
              href="/admin/dashboard"
              className="block w-full rounded-lg text-left transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/70"
              aria-label="Về tổng quan quản trị"
            >
              <AdminBrandMark />
            </Link>
          </div>

          <nav aria-label="Điều hướng quản trị" className="premium-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-6">
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
              Vận hành homestay
            </p>
            <div className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                const base =
                  'group relative flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 font-display text-sm font-medium transition-colors'

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      base,
                      active
                        ? 'bg-white text-brand-greenDark shadow-[0_8px_24px_rgba(5,24,19,0.16)]'
                        : 'text-white/68 hover:bg-white/[0.07] hover:text-white',
                    ].join(' ')}
                  >
                    <span className={active ? 'text-brand-orange' : 'text-white/55 group-hover:text-white'}>{item.icon}</span>
                    {item.label}
                    {active && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-orange" />
                    )}
                  </Link>
                )
              })}
            </div>
          </nav>

          <div className="shrink-0 border-t border-white/10 p-4">
            <Link
              href="/customer/profile"
              className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-display text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/5 text-[11px]">U</span>
              Hồ sơ cá nhân
            </Link>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-display text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white"
            >
              <IconLogout className="h-5 w-5" />
              Đăng xuất
            </button>
          </div>
        </aside>

        <div className="fixed inset-x-0 top-0 z-40 lg:hidden">
          <div className="flex h-16 items-center justify-between border-b border-white/10 bg-brand-greenDark px-4">
            <Link
              href="/admin/dashboard"
              className="rounded-lg text-left"
              aria-label="Về tổng quan quản trị"
            >
              <AdminBrandMark />
            </Link>
            <div className="flex items-center gap-1.5">
              <Link
                href="/customer/profile"
                aria-label="Mở hồ sơ cá nhân"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-xs font-semibold text-white"
              >
                U
              </Link>
              <button
                type="button"
                onClick={() => void handleLogout()}
                aria-label="Đăng xuất"
                className="flex h-10 w-10 items-center justify-center rounded-full text-white/75 transition-colors hover:bg-white/10 hover:text-white"
              >
                <IconLogout className="h-5 w-5" />
              </button>
            </div>
          </div>
          <nav aria-label="Điều hướng quản trị trên di động" className="flex h-[3.25rem] items-center gap-2 overflow-x-auto border-b border-outline-variant bg-white/95 px-4 backdrop-blur-md">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    'flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 font-display text-xs font-semibold transition-colors',
                    active
                      ? 'bg-primary-container text-on-primary-container'
                      : 'text-on-surface-variant hover:bg-surface-container-low',
                  ].join(' ')}
                >
                  <span className={active ? 'text-brand-orange' : ''}>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <main className="premium-scrollbar min-w-0 flex-1 overflow-y-auto overscroll-contain pt-[7.25rem] lg:pt-0">{children}</main>
      </div>
    </div>
  )
}

export default memo(AdminShell)
