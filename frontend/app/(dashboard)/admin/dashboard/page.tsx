'use client'

import AdminModuleCard from '@/components/admin/AdminModuleCard'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import {
  IconBookings,
  IconRefresh,
  IconRooms,
  IconSparkle,
} from '@/components/admin/AdminIcons'

export default function AdminDashboardPage() {
  return (
    <>
        <AdminPageHeader
          eyebrow="Kinh doanh"
          title="Bảng điều khiển quản trị"
          description="Truy cập nhanh các màn hình vận hành của Homestay Booking."
          actions={
            <button
              type="button"
              onClick={() => window.location.reload()}
              title="Làm mới"
              aria-label="Làm mới"
              className={[
                'group flex h-10 w-10 items-center justify-center rounded-full',
                'border border-outline-variant bg-white text-on-surface-variant shadow-sm',
                'transition-all hover:border-brand-orange/40 hover:text-brand-orange',
              ].join(' ')}
            >
              <IconRefresh className="h-[15px] w-[15px] transition-transform duration-300 group-hover:rotate-180" />
            </button>
          }
        />

        <div className="mx-auto max-w-7xl space-y-8 px-5 py-6 sm:px-8">
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-greenDark via-brand-greenDark to-brand-greenLight p-8 text-white shadow-[var(--shadow-elevated)] sm:p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 20% 80%, rgba(255,117,24,0.35) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 40%)',
              }}
            />
            <div
              aria-hidden
              className="absolute right-0 top-0 h-full w-1/2 opacity-[0.07]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
                backgroundSize: '12px 12px',
              }}
            />

            <div className="relative flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                  <IconSparkle className="h-3.5 w-3.5 text-brand-orange" />
                  Trung tâm điều khiển Homestay Booking
                </div>
                <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Bảng điều khiển quản trị
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-inverse-on-surface/85 sm:text-base">
                  Quản lý đơn đặt, phòng homestay, tiện nghi và lịch nhân viên từ một nơi.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-inverse-on-surface/70">
                    Vai trò
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold text-brand-orange">ADMIN</p>
                  <p className="text-xs text-inverse-on-surface/70">toàn quyền vận hành</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-inverse-on-surface/70">
                    Tuyến quản trị
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold">Được bảo vệ</p>
                  <p className="text-xs text-inverse-on-surface/70">Chỉ tài khoản ADMIN được xem</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="mb-5">
              <h2 className="font-display text-xl font-bold text-on-surface">Truy cập nhanh</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Đi đến các màn hình vận hành để xử lý công việc hàng ngày.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <AdminModuleCard
                href="/admin/bookings"
                label="Đơn đặt phòng"
                title="Quản lý đơn đặt phòng"
                description="Theo dõi đơn đặt, thanh toán và xử lý các đơn cần can thiệp."
                icon={<IconBookings className="h-6 w-6" />}
                accent="orange"
                badge="Đang hoạt động"
              />
              <AdminModuleCard
                href="/admin/rooms"
                label="Phòng homestay"
                title="Quản lý phòng homestay"
                description="Tinh chỉnh giá, hạng phòng và trạng thái vận hành."
                icon={<IconRooms className="h-6 w-6" />}
                accent="amber"
                badge="Đang dùng"
              />
            </div>
          </section>
        </div>
    </>
  )
}
