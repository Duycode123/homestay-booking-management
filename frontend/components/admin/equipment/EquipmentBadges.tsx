import { EQUIPMENT_STATUS_LABELS, EQUIPMENT_STATUS_STYLES } from '@/lib/admin/equipment/equipmentLabels'
import type { EquipmentStatus } from '@/lib/admin/equipment/types'

type EquipmentStatusBadgeProps = {
  status: EquipmentStatus
  size?: 'sm' | 'md'
}

export function EquipmentStatusBadge({ status, size = 'sm' }: EquipmentStatusBadgeProps) {
  const sizeClass =
    size === 'md'
      ? 'px-2.5 py-1 text-[11px]'
      : 'px-2 py-0.5 text-[10px]'

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full border font-display font-semibold uppercase tracking-wide',
        sizeClass,
        EQUIPMENT_STATUS_STYLES[status],
      ].join(' ')}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {EQUIPMENT_STATUS_LABELS[status]}
    </span>
  )
}
