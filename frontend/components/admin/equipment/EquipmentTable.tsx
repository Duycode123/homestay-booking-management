import { EQUIPMENT_TYPE_LABELS } from '@/lib/admin/equipment/equipmentLabels'
import { EQUIPMENT_TYPE_META } from '@/lib/admin/equipment/equipmentTypeMeta'
import type { AdminEquipment } from '@/lib/admin/equipment/types'
import { EquipmentStatusBadge } from './EquipmentBadges'

type EquipmentTableProps = {
  equipment: AdminEquipment[]
  isLoading: boolean
  selectedId: number | null
  onSelect: (item: AdminEquipment) => void
}

export default function EquipmentTable({
  equipment,
  isLoading,
  selectedId,
  onSelect,
}: EquipmentTableProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-44 animate-pulse rounded-2xl border border-outline-variant bg-white shadow-[var(--shadow-card)]"
          />
        ))}
      </div>
    )
  }

  if (equipment.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-outline-variant bg-white px-8 py-16 text-center shadow-[var(--shadow-card)]">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container text-lg font-bold text-brand-orange">
          EQ
        </div>
        <p className="font-display text-lg font-bold text-on-surface">Không tìm thấy tiện nghi</p>
        <p className="mt-2 text-sm text-on-surface-variant">
          Thử đổi bộ lọc hoặc thêm tiện nghi mới vào hệ thống.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {equipment.map((item) => {
        const active = selectedId === item.equipmentId
        const meta = EQUIPMENT_TYPE_META[item.equipmentType]

        return (
          <button
            key={item.equipmentId}
            type="button"
            onClick={() => onSelect(item)}
            className={[
              'group relative overflow-hidden rounded-2xl border bg-white text-left shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]',
              active
                ? 'border-brand-orange ring-2 ring-brand-orange/25'
                : 'border-outline-variant/80 hover:border-brand-orange/30',
            ].join(' ')}
          >
            <div className={['relative h-24 bg-gradient-to-br', meta.gradient].join(' ')}>
              <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/20 to-transparent" />

              <div className="relative flex h-full items-end justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/60 bg-white/90 text-sm font-bold text-brand-orange shadow-sm backdrop-blur-sm">
                    {meta.emoji}
                  </div>
                  <div>
                    <p className="font-display text-[10px] font-bold uppercase tracking-wider text-brand-orange">
                      EQ-{String(item.equipmentId).padStart(4, '0')}
                    </p>
                    <p className="text-[11px] text-on-surface-variant">
                      {EQUIPMENT_TYPE_LABELS[item.equipmentType]}
                    </p>
                  </div>
                </div>
                <EquipmentStatusBadge status={item.status} />
              </div>
            </div>

            <div className="space-y-3 p-4 pt-3">
              <div>
                <h3 className="line-clamp-2 font-display text-base font-bold leading-snug text-on-surface transition-colors group-hover:text-brand-orange">
                  {item.equipmentName}
                </h3>
                <p className="mt-1 text-xs text-on-surface-variant">{item.roomName}</p>
              </div>

              {item.notes ? (
                <p className="line-clamp-3 text-xs leading-relaxed text-on-surface-variant">
                  {item.notes}
                </p>
              ) : (
                <p className="text-xs italic text-on-surface-variant">Chưa có ghi chú cho tiện nghi này.</p>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
