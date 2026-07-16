'use client'

import Link from 'next/link'
import { useEffect, useState, type ReactNode } from 'react'
import { CustomerCard, CustomerPageHeader, CustomerPageShell } from '@/components/customer/CustomerPageShell'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/lib/auth'
import {
  fetchCurrentUser,
  getCustomerDisplayName,
  getInitials,
  type CustomerProfile,
} from '@/lib/customer-profile-service'

type SettingIcon = 'profile' | 'security' | 'accessibility' | 'privacy' | 'support'

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Quản trị viên',
  STAFF: 'Nhân viên',
  CUSTOMER: 'Khách hàng',
}

const settingsGroups: Array<{
  icon: SettingIcon
  title: string
  description: string
  href: string
  action: string
}> = [
  {
    icon: 'profile',
    title: 'Thông tin cá nhân',
    description: 'Quản lý ảnh đại diện, họ tên và số điện thoại dùng cho các kỳ lưu trú.',
    href: '/customer/profile',
    action: 'Chỉnh sửa hồ sơ',
  },
  {
    icon: 'security',
    title: 'Bảo mật và đăng nhập',
    description: 'Đổi mật khẩu và kiểm tra các thiết lập giúp bảo vệ tài khoản.',
    href: '/customer/security',
    action: 'Quản lý bảo mật',
  },
  {
    icon: 'accessibility',
    title: 'Hiển thị và trợ năng',
    description: 'Điều chỉnh cỡ chữ, độ tương phản, chuyển động và cách hiển thị.',
    href: '/customer/accessibility',
    action: 'Tùy chỉnh trải nghiệm',
  },
  {
    icon: 'privacy',
    title: 'Quyền riêng tư và dữ liệu',
    description: 'Xem cách The Serene Villa thu thập, sử dụng và bảo vệ thông tin của bạn.',
    href: '/privacy',
    action: 'Xem chính sách',
  },
  {
    icon: 'support',
    title: 'Hỗ trợ tài khoản',
    description: 'Liên hệ đội ngũ hỗ trợ khi bạn gặp vấn đề với tài khoản hoặc đăng nhập.',
    href: '/customer/support',
    action: 'Đến trung tâm hỗ trợ',
  },
]

export default function CustomerAccountSettingsClient() {
  const { user, isLoading } = useAuth()
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [profileUnavailable, setProfileUnavailable] = useState(false)

  useEffect(() => {
    let mounted = true

    if (isLoading || !user) return

    setProfileUnavailable(false)
    void fetchCurrentUser(user)
      .then((currentProfile) => {
        if (mounted) setProfile(currentProfile)
      })
      .catch(() => {
        if (mounted) setProfileUnavailable(true)
      })

    return () => {
      mounted = false
    }
  }, [isLoading, user])

  const displayName = getCustomerDisplayName(profile ?? user)
  const email = profile?.email || user?.email || ''
  const phone = profile?.phone || user?.phone || ''
  const avatarUrl = profile?.avatarUrl || user?.avatarUrl
  const role = profile?.role || user?.role || 'CUSTOMER'
  const initial = getInitials(profile?.fullName || user?.fullName || user?.name, email)

  return (
    <CustomerPageShell>
      <CustomerPageHeader
        eyebrow="Tài khoản The Serene Villa"
        title="Cài đặt tài khoản"
        description="Một nơi để quản lý bảo mật, quyền riêng tư và trải nghiệm sử dụng. Thông tin cá nhân được tách riêng để bạn thao tác rõ ràng hơn."
      />

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <section className="relative overflow-hidden rounded-[24px] bg-[linear-gradient(145deg,#153f34,#285748)] p-6 text-white shadow-[0_20px_48px_rgba(24,63,52,.2)]">
            <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full border border-white/10" aria-hidden />
            <div className="relative flex items-center gap-4">
              <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#d5ae7c] bg-[#b98752] font-display text-xl font-bold text-white">
                {avatarUrl ? <img src={avatarUrl} alt="Ảnh đại diện" width={64} height={64} className="h-full w-full object-cover" /> : initial}
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#214b3f] bg-[#55bd88]" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="truncate font-display text-lg font-bold">{isLoading ? 'Đang tải tài khoản...' : displayName}</h2>
                <p className="mt-1 text-xs text-white/65">{roleLabels[role]}</p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#b5e6cb]"><span className="h-1.5 w-1.5 rounded-full bg-[#66d39a]" /> Đang hoạt động</p>
              </div>
            </div>

            <dl className="relative mt-6 space-y-3 border-t border-white/12 pt-5 text-xs">
              <AccountDetail label="Email" value={email || 'Chưa có email'} />
              <AccountDetail label="Điện thoại" value={phone || 'Chưa cập nhật'} />
            </dl>

            <Link href="/customer/profile" className="relative mt-6 flex h-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 font-display text-sm font-semibold text-white transition hover:border-[#e2bf90]/55 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-[#e2bf90]/35">
              Cập nhật thông tin cá nhân
            </Link>
          </section>

          <div className="rounded-[20px] border border-[#dfd3c2] bg-[#f5eee3] p-5">
            <p className="font-display text-xs font-bold uppercase tracking-[0.14em] text-[#805d38]">Phạm vi cài đặt</p>
            <p className="mt-2 text-xs leading-5 text-[#6f685e]">Trang này không chứa lịch đặt phòng, phòng yêu thích hay báo cáo sự cố vì các nghiệp vụ đó đã có khu vực quản lý riêng.</p>
          </div>
        </aside>

        <div>
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow text-brand-orange">Thiết lập</p>
              <h2 className="mt-2 font-editorial text-3xl font-semibold text-secondary">Quản lý theo từng nhóm</h2>
            </div>
            <p className="max-w-xs text-xs leading-5 text-on-surface-variant">Mỗi mục dẫn tới đúng trang chuyên trách, không lặp lại biểu mẫu hoặc dữ liệu.</p>
          </div>

          {profileUnavailable ? (
            <p role="status" className="mb-4 rounded-2xl border border-[#d7ad6e]/35 bg-[#fff7ea] px-4 py-3 text-sm text-[#77552e]">
              Chưa đồng bộ được hồ sơ mới nhất. Bạn vẫn có thể sử dụng các mục cài đặt bên dưới.
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            {settingsGroups.map((item, index) => (
              <SettingCard key={item.href} {...item} featured={index < 2} />
            ))}
          </div>
        </div>
      </div>
    </CustomerPageShell>
  )
}

function AccountDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-2">
      <dt className="text-white/50">{label}</dt>
      <dd className="truncate text-right font-semibold text-white/85" title={value}>{value}</dd>
    </div>
  )
}

function SettingCard({ icon, title, description, href, action, featured }: { icon: SettingIcon; title: string; description: string; href: string; action: string; featured: boolean }) {
  return (
    <CustomerCard className={`group flex min-h-[220px] flex-col p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(32,57,48,.10)] ${featured ? 'border-[#d9c3a4] bg-[linear-gradient(145deg,#fffdfa,#fbf4ea)]' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e9ded0] text-[#704f2e] transition group-hover:bg-[#173f35] group-hover:text-white">
          <SettingIconSvg name={icon} />
        </span>
        <span className="rounded-full border border-[#e2d6c6] bg-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#8a7356]">Cài đặt</span>
      </div>
      <h3 className="mt-5 font-display text-lg font-bold text-[#25332d]">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-on-surface-variant">{description}</p>
      <Link href={href} className="mt-5 inline-flex items-center justify-between border-t border-[#e8dfd2] pt-4 font-display text-sm font-semibold text-secondary transition hover:text-[#a66f38] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b98853]/30">
        {action}
        <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
      </Link>
    </CustomerCard>
  )
}

function SettingIconSvg({ name }: { name: SettingIcon }) {
  const paths: Record<SettingIcon, ReactNode> = {
    profile: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
    security: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    accessibility: <><circle cx="12" cy="4" r="2" /><path d="M5 8h14M12 10v10M8 20l4-10 4 10" /></>,
    privacy: <><path d="M12 3 5 6v5c0 4.7 2.9 8.4 7 10 4.1-1.6 7-5.3 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    support: <><circle cx="12" cy="12" r="9" /><path d="M8 15v-4a4 4 0 0 1 8 0v4M8 15H6a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h2v4Zm8 0h2a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-2v4Z" /></>,
  }
  return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{paths[name]}</svg>
}
