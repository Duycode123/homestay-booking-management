import { formatRoomPrice } from '@/lib/admin/rooms/adminRoomApi'
import type { AdminRoom } from '@/lib/admin/rooms/types'
import { RoomCategoryBadge, RoomStatusBadge } from './RoomBadges'

type RoomTableProps = {
  rooms: AdminRoom[]
  isLoading: boolean
  selectedId: string | null
  onSelect: (room: AdminRoom) => void
  onEdit: (room: AdminRoom) => void
  onDelete: (room: AdminRoom) => void
  onMaintenance: (room: AdminRoom) => void
}

const actionClass =
  'rounded-lg border border-outline-variant px-2.5 py-1.5 font-display text-xs font-medium text-on-surface-variant transition-colors hover:border-brand-orange/40 hover:text-brand-orange'

export default function RoomTable({
  rooms,
  isLoading,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onMaintenance,
}: RoomTableProps) {
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

  if (rooms.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-outline-variant bg-white px-8 py-16 text-center shadow-[var(--shadow-card)]">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container text-3xl">
          ♫
        </div>
        <p className="font-display text-lg font-bold text-on-surface">Không tìm thấy phòng homestay</p>
        <p className="mt-2 text-sm text-on-surface-variant">
          Thử đổi bộ lọc hoặc thêm phòng mới vào hệ thống.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-outline-variant/80 bg-white shadow-[var(--shadow-card)] lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full border-collapse text-left">
            <thead className="bg-surface-container-low text-[10px] uppercase tracking-[0.12em] text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 font-display font-semibold">Phòng</th>
                <th className="px-4 py-3 font-display font-semibold">Hạng phòng</th>
                <th className="px-4 py-3 font-display font-semibold">Sức chứa</th>
                <th className="px-4 py-3 font-display font-semibold">Giá/giờ</th>
                <th className="px-4 py-3 font-display font-semibold">Trạng thái</th>
                <th className="px-4 py-3 font-display font-semibold">Tiện nghi</th>
                <th className="px-4 py-3 font-display font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/70">
              {rooms.map((room) => {
                const selected = selectedId === room.id
                return (
                  <tr
                    key={room.id}
                    className={[
                      'transition-colors',
                      selected ? 'bg-primary-container/20' : 'hover:bg-surface-container-lowest',
                    ].join(' ')}
                  >
                    <td className="px-4 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="h-12 w-16 shrink-0 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={room.image} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-display text-sm font-bold text-on-surface">{room.name}</p>
                          <p className="mt-0.5 text-xs font-medium text-brand-orange">{room.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <RoomCategoryBadge category={room.category} label={room.categoryLabel} />
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-on-surface">{room.capacity} người</td>
                    <td className="px-4 py-4 text-sm font-bold text-brand-orange">
                      {formatRoomPrice(room.pricePerHour)}
                    </td>
                    <td className="px-4 py-4">
                      <RoomStatusBadge status={room.status} />
                    </td>
                    <td className="px-4 py-4 text-sm text-on-surface-variant">{room.equipmentCount} món</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => onSelect(room)} className={actionClass}>
                          Chi tiết
                        </button>
                        <button type="button" onClick={() => onEdit(room)} className={actionClass}>
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => onMaintenance(room)}
                          disabled={room.status === 'maintenance'}
                          className={[
                            actionClass,
                            room.status === 'maintenance'
                              ? 'cursor-not-allowed opacity-45'
                              : 'hover:border-tertiary-container hover:text-on-tertiary-container',
                          ].join(' ')}
                        >
                          Bảo trì
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(room)}
                          className="rounded-lg border border-error/25 px-2.5 py-1.5 font-display text-xs font-medium text-error transition-colors hover:bg-error-container/30"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 lg:hidden">
        {rooms.map((room) => (
          <article
            key={room.id}
            className={[
              'overflow-hidden rounded-2xl border bg-white shadow-[var(--shadow-card)]',
              selectedId === room.id ? 'border-brand-orange ring-2 ring-brand-orange/20' : 'border-outline-variant/80',
            ].join(' ')}
          >
            <div className="flex gap-3 p-4">
              <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={room.image} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-bold text-on-surface">{room.name}</p>
                <p className="mt-0.5 text-xs font-semibold text-brand-orange">{room.code}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <RoomCategoryBadge category={room.category} label={room.categoryLabel} />
                  <RoomStatusBadge status={room.status} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 border-y border-outline-variant/70 bg-surface-container-low/40 p-4 text-sm">
              <p className="text-on-surface-variant">
                Sức chứa <span className="font-semibold text-on-surface">{room.capacity}</span>
              </p>
              <p className="text-on-surface-variant">
                Tiện nghi <span className="font-semibold text-on-surface">{room.equipmentCount}</span>
              </p>
              <p className="col-span-2 font-display text-base font-bold text-brand-orange">
                {formatRoomPrice(room.pricePerHour)} / giờ
              </p>
            </div>

            <div className="flex flex-wrap gap-2 p-4">
              <button type="button" onClick={() => onSelect(room)} className={actionClass}>
                Chi tiết
              </button>
              <button type="button" onClick={() => onEdit(room)} className={actionClass}>
                Sửa
              </button>
              <button
                type="button"
                onClick={() => onMaintenance(room)}
                disabled={room.status === 'maintenance'}
                className={[
                  actionClass,
                  room.status === 'maintenance' ? 'cursor-not-allowed opacity-45' : '',
                ].join(' ')}
              >
                Bảo trì
              </button>
              <button
                type="button"
                onClick={() => onDelete(room)}
                className="rounded-lg border border-error/25 px-2.5 py-1.5 font-display text-xs font-medium text-error transition-colors hover:bg-error-container/30"
              >
                Xóa
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
