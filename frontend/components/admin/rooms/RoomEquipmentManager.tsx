'use client'

import ProjectSelect from '@/components/ui/ProjectSelect'

import { useMemo, useState } from 'react'
import { EQUIPMENT_TYPE_LABELS } from '@/lib/admin/equipment/equipmentLabels'
import type { AdminEquipment } from '@/lib/admin/equipment/types'
import type { AdminRoom } from '@/lib/admin/rooms/types'
import { EquipmentStatusBadge } from '@/components/admin/equipment/EquipmentBadges'

type RoomEquipmentManagerProps = {
  rooms: AdminRoom[]
  equipment: AdminEquipment[]
  isLoading: boolean
  onCreate: (roomId: number | null) => void
  onEdit: (item: AdminEquipment) => void
  onDelete: (id: number) => Promise<void>
}

export default function RoomEquipmentManager({
  rooms,
  equipment,
  isLoading,
  onCreate,
  onEdit,
  onDelete,
}: RoomEquipmentManagerProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>('ALL')
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const visibleEquipment = useMemo(() => {
    if (selectedRoomId === 'ALL') return equipment
    return equipment.filter((item) => String(item.roomId) === selectedRoomId)
  }, [equipment, selectedRoomId])

  const selectedRoomNumericId = selectedRoomId === 'ALL' ? null : Number(selectedRoomId)
  const canCreateEquipment = rooms.length > 0

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    setErrorMessage('')
    try {
      await onDelete(id)
      setPendingDeleteId(null)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể xóa tiện nghi.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="rounded-2xl border border-outline-variant/80 bg-white shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-low/50 px-5 py-4">
        <div>
          <h2 className="font-display text-lg font-bold text-on-surface">Tiện nghi trong phòng</h2>
          <p className="text-xs text-on-surface-variant">
            Thêm, sửa, xóa tiện nghi gắn với từng phòng homestay.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ProjectSelect
            value={selectedRoomId}
            onChange={(event) => {
              setSelectedRoomId(event.target.value)
              setPendingDeleteId(null)
            }}
            className="h-10 rounded-xl border border-outline bg-white px-3 text-sm text-on-surface outline-none transition-all focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15"
          >
            <option value="ALL">Tất cả phòng</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </ProjectSelect>
          <button
            type="button"
            onClick={() => onCreate(selectedRoomNumericId)}
            disabled={!canCreateEquipment}
            title={canCreateEquipment ? 'Thêm tiện nghi' : 'Cần tạo phòng trước khi thêm tiện nghi'}
            className="rounded-xl bg-brand-orange px-4 py-2.5 font-display text-sm font-medium text-white shadow-md shadow-brand-orange/20 transition-colors hover:bg-brand-orangeHover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Thêm tiện nghi
          </button>
        </div>
      </div>

      {errorMessage && (
        <p className="mx-5 mt-4 rounded-xl border border-error/30 bg-error-container/30 px-3 py-2.5 text-xs text-error">
          {errorMessage}
        </p>
      )}

      {isLoading ? (
        <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-xl bg-surface-container-low" />
          ))}
        </div>
      ) : visibleEquipment.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="font-display text-base font-bold text-on-surface">Chưa có tiện nghi</p>
          <p className="mt-1 text-sm text-on-surface-variant">
            {canCreateEquipment
              ? 'Thêm tiện nghi để danh sách phòng phản ánh đúng dữ liệu vận hành.'
              : 'Cần tạo phòng trước khi thêm tiện nghi.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleEquipment.map((item) => (
            <article
              key={item.equipmentId}
              className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold text-on-surface">{item.equipmentName}</p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {item.roomName} · {EQUIPMENT_TYPE_LABELS[item.equipmentType]}
                  </p>
                </div>
                <EquipmentStatusBadge status={item.status} />
              </div>

              {item.notes && (
                <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-on-surface-variant">{item.notes}</p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {pendingDeleteId === item.equipmentId ? (
                  <>
                    <button
                      type="button"
                      onClick={() => void handleDelete(item.equipmentId)}
                      disabled={deletingId === item.equipmentId}
                      className="rounded-lg bg-error px-2.5 py-1.5 font-display text-xs font-medium text-white transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === item.equipmentId ? 'Đang xóa' : 'Xác nhận xóa'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(null)}
                      disabled={deletingId === item.equipmentId}
                      className="rounded-lg border border-outline-variant px-2.5 py-1.5 font-display text-xs font-medium text-on-surface-variant transition-colors hover:border-brand-orange/40 hover:text-brand-orange disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Hủy
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="rounded-lg border border-outline-variant px-2.5 py-1.5 font-display text-xs font-medium text-on-surface-variant transition-colors hover:border-brand-orange/40 hover:text-brand-orange"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(item.equipmentId)}
                      className="rounded-lg border border-error/25 px-2.5 py-1.5 font-display text-xs font-medium text-error transition-colors hover:bg-error-container/30"
                    >
                      Xóa
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
