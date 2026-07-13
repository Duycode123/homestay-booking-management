'use client'

import type { AdminShiftRegistrationStatus } from '@/lib/admin/staff-schedule/adminShiftRegistrationApi'
import type { ShiftFrame } from '@/lib/admin/staff-schedule/staffScheduleUtils'

type BadgeTone = ShiftFrame['id']

const statusLabel: Record<AdminShiftRegistrationStatus, string> = {
  PENDING: 'Chờ xếp ca',
  APPROVED: 'Đã lên lịch',
  REJECTED: 'Đã từ chối',
}

/** Badge cùng tông với ca: sáng cam · chiều hổ phách · tối xanh brand */
const approvedByFrame: Record<BadgeTone, string> = {
  morning: 'bg-brand-orange text-white',
  afternoon: 'bg-tertiary text-white',
  evening: 'bg-brand-greenDark text-white',
  other: 'bg-on-surface-variant text-white',
}

const fallbackByStatus: Record<AdminShiftRegistrationStatus, string> = {
  PENDING: 'bg-brand-orange text-white',
  APPROVED: 'bg-brand-greenDark text-white',
  REJECTED: 'bg-error text-white',
}

type RegistrationStatusBadgeProps = {
  status: AdminShiftRegistrationStatus
  /** Khi có: badge “Đã lên lịch” / chờ duyệt theo màu ca */
  frameId?: BadgeTone
}

export default function RegistrationStatusBadge({ status, frameId }: RegistrationStatusBadgeProps) {
  const className =
    status === 'REJECTED'
      ? fallbackByStatus.REJECTED
      : frameId
        ? approvedByFrame[frameId]
        : fallbackByStatus[status]

  return (
    <span className={['inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold', className].join(' ')}>
      {statusLabel[status]}
    </span>
  )
}

export function StaffScheduleLegend() {
  const items: { label: string; dotClass: string }[] = [
    { label: 'Ca sáng', dotClass: 'bg-brand-orange' },
    { label: 'Ca chiều', dotClass: 'bg-tertiary' },
    { label: 'Ca tối', dotClass: 'bg-brand-greenDark' },
  ]

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
      <span className="font-display font-semibold uppercase tracking-wide text-on-surface">Chú thích</span>
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5">
          <span className={['h-2.5 w-2.5 rounded-full', item.dotClass].join(' ')} />
          {item.label}
        </span>
      ))}
    </div>
  )
}
