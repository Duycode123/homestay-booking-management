'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { CustomerPageHeader, CustomerPageShell } from '@/components/customer/CustomerPageShell'

type SettingIcon = 'security' | 'accessibility' | 'privacy' | 'support'

const settings: Array<{
  icon: SettingIcon
  category: string
  title: string
  description: string
  href: string
  action: string
}> = [
  {
    icon: 'security',
    category: 'Tài khoản',
    title: 'Bảo mật và đăng nhập',
    description: 'Đổi mật khẩu và kiểm tra các thiết lập giúp bảo vệ tài khoản của bạn.',
    href: '/customer/security',
    action: 'Quản lý bảo mật',
  },
  {
    icon: 'accessibility',
    category: 'Trải nghiệm',
    title: 'Hiển thị và trợ năng',
    description: 'Điều chỉnh cỡ chữ, độ tương phản và chuyển động theo cách bạn dễ sử dụng nhất.',
    href: '/customer/accessibility',
    action: 'Tùy chỉnh hiển thị',
  },
  {
    icon: 'privacy',
    category: 'Dữ liệu',
    title: 'Quyền riêng tư và dữ liệu',
    description: 'Xem cách The Serene Villa thu thập, sử dụng và bảo vệ thông tin của bạn.',
    href: '/privacy',
    action: 'Xem chính sách',
  },
  {
    icon: 'support',
    category: 'Hỗ trợ',
    title: 'Hỗ trợ tài khoản',
    description: 'Nhận trợ giúp khi gặp vấn đề về tài khoản, mật khẩu hoặc đăng nhập.',
    href: '/customer/support',
    action: 'Đến trung tâm hỗ trợ',
  },
]

export default function CustomerAccountSettingsClient() {
  return (
    <CustomerPageShell>
      <div className="mx-auto max-w-[880px]">
        <CustomerPageHeader
          eyebrow="Thiết lập tài khoản"
          title="Cài đặt theo nhu cầu"
          description="Quản lý bảo mật, quyền riêng tư và trải nghiệm sử dụng tại một nơi gọn gàng. Hồ sơ cá nhân được quản lý riêng để tránh trùng lặp."
          className="mb-6 md:mb-7"
        />

        <section className="overflow-hidden rounded-[24px] border border-[#ddd0bd] bg-[#fffdfa] shadow-[0_20px_52px_rgba(31,62,51,.09)]">
          <div className="flex flex-col gap-3 border-b border-[#e8ddcf] bg-[linear-gradient(125deg,#f7efe4,#fffdfa_62%)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-7">
            <div>
              <p className="font-display text-base font-bold text-[#23362f]">Trung tâm cài đặt</p>
              <p className="mt-1 text-sm leading-6 text-[#77756e]">Chọn đúng nội dung bạn muốn thay đổi.</p>
            </div>
            <span className="w-fit rounded-full border border-[#d8c5a9] bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-[#806142]">
              4 nhóm thiết lập
            </span>
          </div>

          <nav aria-label="Nhóm cài đặt tài khoản">
            {settings.map((setting) => (
              <SettingRow key={setting.href} {...setting} />
            ))}
          </nav>
        </section>

        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#dfd3c2] bg-[#f5eee3]/80 px-4 py-3.5 text-sm leading-6 text-[#6f685e]">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[#234D42] shadow-sm">
            <SettingIconSvg name="security" />
          </span>
          <p>Mọi thay đổi quan trọng về mật khẩu hoặc đăng nhập đều được bảo vệ bằng phiên xác thực của bạn.</p>
        </div>
      </div>
    </CustomerPageShell>
  )
}

function SettingRow({
  icon,
  category,
  title,
  description,
  href,
  action,
}: (typeof settings)[number]) {
  return (
    <Link
      href={href}
      className="group grid gap-3 border-b border-[#ece2d5] px-5 py-4 transition last:border-b-0 hover:bg-[#f8f3ec] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#b98853]/35 sm:grid-cols-[44px_minmax(0,1fr)_auto] sm:items-center md:px-7 md:py-5"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#efe4d4] text-[#704f2e] transition duration-300 group-hover:bg-[#234D42] group-hover:text-white">
        <SettingIconSvg name={icon} />
      </span>

      <span className="min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-[0.13em] text-[#a17042]">{category}</span>
        <span className="mt-1 block font-display text-[16px] font-bold text-[#26352f]">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-[#77756e]">{description}</span>
      </span>

      <span className="flex items-center gap-2 pl-14 text-sm font-semibold text-[#234D42] sm:pl-4">
        <span className="hidden lg:inline">{action}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#dfd0bc] bg-white transition group-hover:translate-x-0.5 group-hover:border-[#b98853]" aria-hidden>
          →
        </span>
      </span>
    </Link>
  )
}

function SettingIconSvg({ name }: { name: SettingIcon }) {
  const paths: Record<SettingIcon, ReactNode> = {
    security: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    accessibility: <><circle cx="12" cy="4" r="2" /><path d="M5 8h14M12 10v10M8 20l4-10 4 10" /></>,
    privacy: <><path d="M12 3 5 6v5c0 4.7 2.9 8.4 7 10 4.1-1.6 7-5.3 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    support: <><circle cx="12" cy="12" r="9" /><path d="M8 15v-4a4 4 0 0 1 8 0v4M8 15H6a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h2v4Zm8 0h2a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-2v4Z" /></>,
  }

  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[name]}
    </svg>
  )
}
