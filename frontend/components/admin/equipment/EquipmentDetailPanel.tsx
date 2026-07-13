'use client'

import { useState } from 'react'
import { EQUIPMENT_TYPE_LABELS } from '@/lib/admin/equipment/equipmentLabels'
import { EQUIPMENT_TYPE_META } from '@/lib/admin/equipment/equipmentTypeMeta'
import type { AdminEquipment } from '@/lib/admin/equipment/types'
import { EquipmentStatusBadge } from './EquipmentBadges'

type EquipmentDetailPanelProps = {
  equipment: AdminEquipment | null
  onClose: () => void
  onEdit: (item: AdminEquipment) => void
  onDelete: (id: number) => Promise<void>
}

export default function EquipmentDetailPanel({
  equipment,
  onClose,
  onEdit,
  onDelete,
}: EquipmentDetailPanelProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [message, setMessage] = useState('')

  if (!equipment) return null

  const meta = EQUIPMENT_TYPE_META[equipment.equipmentType]

  const handleDelete = async () => {
    setIsDeleting(true)
    setMessage('')
    try {
      await onDelete(equipment.equipmentId)
      onClose()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể xóa tiện nghi.')
      setConfirmDelete(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Đóng chi tiết"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-inverse-surface/50 backdrop-blur-sm"
      />

      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-outline-variant bg-white shadow-[var(--shadow-elevated)] sm:max-w-lg">
        <div className={['relative shrink-0 bg-gradient-to-br px-5 pb-5 pt-5', meta.gradient].join(' ')}>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/95" />
          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/70 bg-white/90 text-xl font-bold text-brand-orange shadow-sm">
                  {meta.emoji}
                </div>
                <div>
                  <p className="font-display text-[10px] font-bold uppercase tracking-[0.15em] text-brand-orange">
                    EQ-{String(equipment.equipmentId).padStart(4, '0')}
                  </p>
                  <h2 className="font-display text-xl font-bold leading-tight text-on-surface">
                    {equipment.equipmentName}
                  </h2>
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <EquipmentStatusBadge status={equipment.status} size="md" />
              <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-on-surface-variant backdrop-blur-sm">
                {EQUIPMENT_TYPE_LABELS[equipment.equipmentType]}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard label="Mã tiện nghi" value={`EQ-${String(equipment.equipmentId).padStart(4, '0')}`} />
            <MetricCard label="Phòng" value={equipment.roomName} />
            <MetricCard label="Loại" value={EQUIPMENT_TYPE_LABELS[equipment.equipmentType]} />
            <MetricCard label="Trạng thái" value={equipment.status} />
          </div>

          <Section title="Ghi chú">
            {equipment.notes ? (
              <p className="text-sm leading-relaxed text-on-surface-variant">{equipment.notes}</p>
            ) : (
              <p className="text-sm italic text-on-surface-variant">Chưa có ghi chú cho tiện nghi này.</p>
            )}
          </Section>

          {message && (
            <p className="mt-4 rounded-2xl border border-error/30 bg-error-container/30 px-4 py-3 text-xs text-error">
              {message}
            </p>
          )}
        </div>

        <footer className="shrink-0 space-y-2 border-t border-outline-variant bg-surface-container-low/50 px-5 py-4">
          {confirmDelete ? (
            <div className="space-y-3">
              <p className="text-sm text-on-surface-variant">
                Xác nhận xóa <strong className="text-on-surface">{equipment.equipmentName}</strong>?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={isDeleting}
                  className="flex-1 rounded-xl border border-outline py-2.5 font-display text-sm font-medium text-on-surface-variant hover:bg-white disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={isDeleting}
                  className="flex-1 rounded-xl bg-error py-2.5 font-display text-sm font-medium text-white hover:bg-error/90 disabled:opacity-50"
                >
                  {isDeleting ? 'Đang xóa...' : 'Xóa tiện nghi'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-outline bg-white px-4 py-2.5 font-display text-sm font-medium text-on-surface-variant hover:text-on-surface"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => onEdit(equipment)}
                className="flex-1 rounded-xl bg-brand-orange py-2.5 font-display text-sm font-medium text-white shadow-md shadow-brand-orange/20 hover:bg-brand-orangeHover"
              >
                Chỉnh sửa
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex-1 rounded-xl border border-error/30 py-2.5 font-display text-sm font-medium text-error hover:bg-error-container/30"
              >
                Xóa
              </button>
            </div>
          )}
        </footer>
      </aside>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="mb-2 font-display text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
        {title}
      </h3>
      {children}
    </section>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-outline-variant bg-white p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-1 font-display text-base font-bold text-on-surface">{value}</p>
    </div>
  )
}
