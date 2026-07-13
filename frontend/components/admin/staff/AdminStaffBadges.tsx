import type { StaffAccountResponse } from '@/lib/admin/staff/adminStaffApi'

export function StaffStatusBadge({ staff }: { staff: StaffAccountResponse }) {
  if (staff.enabled) {
    return (
      <span className="inline-flex rounded-full bg-secondary-container px-3 py-1 text-xs font-bold text-on-secondary-container">
        Đang hoạt động
      </span>
    )
  }

  return (
    <span className="inline-flex rounded-full bg-error-container px-3 py-1 text-xs font-bold text-error">
      Đã vô hiệu
    </span>
  )
}

export function StaffVerificationBadge({ verified }: { verified: boolean }) {
  return (
    <span
      className={[
        'inline-flex rounded-full px-3 py-1 text-xs font-bold',
        verified ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container text-on-surface-variant',
      ].join(' ')}
    >
      {verified ? 'Email đã xác minh' : 'Chưa xác minh'}
    </span>
  )
}
