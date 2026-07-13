'use client'

import { IconSearch } from '@/components/admin/AdminIcons'
import type { AdminRoomTypeOption, RoomFilters } from '@/lib/admin/rooms/types'
import { roomStatusLabels, roomStatusOptions } from '@/lib/admin/rooms/types'

type RoomFiltersBarProps = {
  filters: RoomFilters
  roomTypes: AdminRoomTypeOption[]
  onChange: (filters: RoomFilters) => void
  resultCount: number
}

const inputClass =
  'h-11 w-full rounded-xl border border-outline bg-surface-container-lowest px-3 text-sm text-on-surface outline-none transition-all focus:border-brand-orange focus:bg-white focus:ring-2 focus:ring-brand-orange/15'

const labelClass =
  'mb-1.5 block font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant'

export default function RoomFiltersBar({ filters, roomTypes, onChange, resultCount }: RoomFiltersBarProps) {
  const set = (patch: Partial<RoomFilters>) => onChange({ ...filters, ...patch })

  const hasActiveFilters =
    filters.query ||
    filters.roomTypeId !== 'ALL' ||
    filters.category !== 'ALL' ||
    filters.status !== 'ALL' ||
    filters.sortBy !== 'updated'

  const quickRoomTypes: Array<AdminRoomTypeOption | 'ALL'> = ['ALL', ...roomTypes.slice(0, 4)]

  return (
    <section className="overflow-hidden rounded-2xl border border-outline-variant/80 bg-white shadow-[var(--shadow-card)]">
      <div className="border-b border-outline-variant/60 bg-gradient-to-r from-surface-container-low to-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-sm font-bold text-on-surface">Bộ lọc phòng homestay</h2>
            <p className="text-xs text-on-surface-variant">
              <span className="font-semibold text-brand-orange">{resultCount}</span> phòng phù hợp
            </p>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() =>
                onChange({
                  query: '',
                  roomTypeId: 'ALL',
                  category: 'ALL',
                  status: 'ALL',
                  sortBy: 'updated',
                })
              }
              className="rounded-full border border-outline px-3 py-1.5 font-display text-xs font-medium text-brand-orange transition-colors hover:bg-primary-container/30"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4 p-5">
        <label className="block">
          <span className={labelClass}>Tìm kiếm</span>
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="search"
              value={filters.query}
              onChange={(event) => set({ query: event.target.value })}
              placeholder="Tên phòng, mã phòng..."
              className={[inputClass, 'pl-10'].join(' ')}
            />
          </div>
        </label>

        <div>
          <span className={labelClass}>Hạng phòng</span>
          {roomTypes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {quickRoomTypes.map((roomType) => {
                const value = roomType === 'ALL' ? 'ALL' : roomType.id
                const active = filters.roomTypeId === value

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set({ roomTypeId: value, category: 'ALL' })}
                    className={[
                      'rounded-full px-3 py-1.5 font-display text-xs font-medium transition-all',
                      active
                        ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/25'
                        : 'border border-outline-variant bg-surface-container-low text-on-surface-variant hover:border-brand-orange/30 hover:text-on-surface',
                    ].join(' ')}
                  >
                    {roomType === 'ALL' ? 'Tất cả' : roomType.label}
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">Chưa có hạng phòng trong hệ thống.</p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,0.8fr)_minmax(260px,1.2fr)]">
          <label className="block">
            <span className={labelClass}>Trạng thái</span>
            <select
              value={filters.status}
              onChange={(event) => set({ status: event.target.value as RoomFilters['status'] })}
              className={inputClass}
            >
              <option value="ALL">Tất cả</option>
              {roomStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {roomStatusLabels[status]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Sắp xếp</span>
            <select
              value={filters.sortBy}
              onChange={(event) => set({ sortBy: event.target.value as RoomFilters['sortBy'] })}
              className={inputClass}
            >
              <option value="updated">Cập nhật mới nhất</option>
              <option value="price-asc">Giá thấp đến cao</option>
              <option value="price-desc">Giá cao đến thấp</option>
              <option value="capacity">Sức chứa lớn nhất</option>
            </select>
          </label>
        </div>
      </div>
    </section>
  )
}
