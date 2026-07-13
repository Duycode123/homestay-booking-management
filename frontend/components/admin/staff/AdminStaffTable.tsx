import { formatStaffDate, type StaffAccountResponse } from '@/lib/admin/staff/adminStaffApi'
import { StaffStatusBadge, StaffVerificationBadge } from './AdminStaffBadges'

type AdminStaffTableProps = {
  staff: StaffAccountResponse[]
  isLoading: boolean
  selectedId: number | null
  onSelect: (staff: StaffAccountResponse) => void
  onDisable: (staff: StaffAccountResponse) => void
}

const actionClass =
  'rounded-lg border border-outline-variant px-2.5 py-1.5 font-display text-xs font-medium text-on-surface-variant transition-colors hover:border-brand-orange/40 hover:text-brand-orange'

export default function AdminStaffTable({
  staff,
  isLoading,
  selectedId,
  onSelect,
  onDisable,
}: AdminStaffTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-outline-variant/80 bg-white p-4 shadow-[var(--shadow-card)]">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-xl bg-surface-container-low" />
          ))}
        </div>
      </div>
    )
  }

  if (staff.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-outline-variant bg-white px-8 py-16 text-center shadow-[var(--shadow-card)]">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-container font-display text-2xl font-bold text-brand-orange">
          ST
        </div>
        <p className="font-display text-lg font-bold text-on-surface">Không tìm thấy nhân viên</p>
        <p className="mt-2 text-sm text-on-surface-variant">
          Thử đổi bộ lọc hoặc tạo tài khoản nhân viên mới.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="hidden lg:flex max-h-[min(70vh,680px)] flex-col overflow-hidden rounded-2xl border border-outline-variant/80 bg-white shadow-[var(--shadow-card)]">
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="min-w-[1040px] w-full border-collapse text-left">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-outline-variant bg-surface-container-low text-[10px] uppercase tracking-[0.12em] text-on-surface-variant">
                <th className="bg-surface-container-low px-4 py-3 font-display font-semibold">Nhân viên</th>
                <th className="bg-surface-container-low px-4 py-3 font-display font-semibold">Liên hệ</th>
                <th className="bg-surface-container-low px-4 py-3 font-display font-semibold">Ngày sinh</th>
                <th className="bg-surface-container-low px-4 py-3 font-display font-semibold">Trạng thái</th>
                <th className="bg-surface-container-low px-4 py-3 font-display font-semibold">Email</th>
                <th className="bg-surface-container-low px-4 py-3 font-display font-semibold">Ngày tạo</th>
                <th className="bg-surface-container-low px-4 py-3 font-display font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/70">
              {staff.map((item) => {
                const selected = selectedId === item.staffId
                return (
                  <tr
                    key={item.staffId}
                    className={selected ? 'bg-primary-container/20' : 'transition-colors hover:bg-surface-container-lowest'}
                  >
                    <td className="px-4 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <StaffAvatar staff={item} />
                        <div className="min-w-0">
                          <p className="font-display text-sm font-bold text-on-surface">{item.fullName}</p>
                          <p className="mt-0.5 text-xs font-medium text-brand-orange">ST-{item.staffId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-on-surface">{item.email}</p>
                      <p className="mt-0.5 text-xs text-on-surface-variant">{item.phone || 'Chưa có SĐT'}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-on-surface-variant">{formatStaffDate(item.dateOfBirth)}</td>
                    <td className="px-4 py-4">
                      <StaffStatusBadge staff={item} />
                    </td>
                    <td className="px-4 py-4">
                      <StaffVerificationBadge verified={item.emailVerified} />
                    </td>
                    <td className="px-4 py-4 text-sm text-on-surface-variant">{formatStaffDate(item.createdAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => onSelect(item)} className={actionClass}>
                          Chi tiết
                        </button>
                        <button
                          type="button"
                          onClick={() => onDisable(item)}
                          disabled={!item.enabled}
                          className={[
                            'rounded-lg border px-2.5 py-1.5 font-display text-xs font-medium transition-colors',
                            item.enabled
                              ? 'border-error/25 text-error hover:bg-error-container/30'
                              : 'cursor-not-allowed border-outline-variant text-on-surface-variant opacity-45',
                          ].join(' ')}
                        >
                          Vô hiệu hóa
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="shrink-0 border-t border-outline-variant bg-surface-container-low/60 px-4 py-2.5 text-xs text-on-surface-variant">
          {staff.length} nhân viên
        </div>
      </div>

      <div className="grid max-h-[min(70vh,680px)] gap-4 overflow-auto lg:hidden">
        {staff.map((item) => (
          <article
            key={item.staffId}
            className={[
              'rounded-2xl border bg-white shadow-[var(--shadow-card)]',
              selectedId === item.staffId ? 'border-brand-orange ring-2 ring-brand-orange/20' : 'border-outline-variant/80',
            ].join(' ')}
          >
            <div className="flex items-start gap-3 p-4">
              <StaffAvatar staff={item} />
              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-bold text-on-surface">{item.fullName}</p>
                <p className="mt-0.5 text-xs font-semibold text-brand-orange">ST-{item.staffId}</p>
                <p className="mt-2 break-all text-sm text-on-surface-variant">{item.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-y border-outline-variant/70 bg-surface-container-low/40 p-4">
              <StaffStatusBadge staff={item} />
              <StaffVerificationBadge verified={item.emailVerified} />
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-on-surface-variant">
                {item.phone || 'Chưa có SĐT'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 p-4">
              <button type="button" onClick={() => onSelect(item)} className={actionClass}>
                Chi tiết
              </button>
              <button
                type="button"
                onClick={() => onDisable(item)}
                disabled={!item.enabled}
                className={[
                  'rounded-lg border px-2.5 py-1.5 font-display text-xs font-medium transition-colors',
                  item.enabled
                    ? 'border-error/25 text-error hover:bg-error-container/30'
                    : 'cursor-not-allowed border-outline-variant text-on-surface-variant opacity-45',
                ].join(' ')}
              >
                Vô hiệu hóa
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

function StaffAvatar({ staff }: { staff: StaffAccountResponse }) {
  const initials = staff.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  if (staff.avatarUrl) {
    return (
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-low">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={staff.avatarUrl} alt="" className="h-full w-full object-cover" />
      </div>
    )
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-container font-display text-sm font-bold text-on-primary-container">
      {initials || 'ST'}
    </div>
  )
}
