'use client'

import type { ReactNode } from 'react'
import { formatRoomPrice } from '@/lib/admin/rooms/adminRoomApi'
import type { AdminRoom } from '@/lib/admin/rooms/types'
import { RoomCategoryBadge, RoomStatusBadge } from './RoomBadges'

type RoomDetailPanelProps = {
  room: AdminRoom | null
  onClose: () => void
  onEdit: (room: AdminRoom) => void
}

export default function RoomDetailPanel({ room, onClose, onEdit }: RoomDetailPanelProps) {
  if (!room) return null

  return (
    <>
      <button
        type="button"
        aria-label="Đóng chi tiết phòng"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-inverse-surface/50 backdrop-blur-sm"
      />

      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-outline-variant bg-white shadow-[var(--shadow-elevated)]">
        <header className="shrink-0 border-b border-outline-variant bg-white">
          <div className="relative h-56 overflow-hidden bg-surface-container-low">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={room.image} alt={room.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-5 right-5">
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-brand-orange">
                {room.code}
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold leading-tight text-white">
                {room.name}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <RoomCategoryBadge category={room.category} label={room.categoryLabel} size="md" tone="overlay" />
                <RoomStatusBadge status={room.status} size="md" tone="overlay" />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard label="Sức chứa" value={`${room.capacity} người`} />
            <MetricCard label="Giá/giờ" value={formatRoomPrice(room.pricePerHour)} accent="price" />
            <MetricCard label="Tiện nghi" value={`${room.equipmentCount} món`} />
            <MetricCard label="Đánh giá TB" value={room.averageRating ? `${room.averageRating}/5` : 'Chưa có'} />
          </div>

          <Section title="Mô tả">
            <p className="text-sm leading-relaxed text-on-surface-variant">{room.description}</p>
          </Section>

          <Section title="Tiện nghi trong phòng">
            <div className="flex flex-wrap gap-2">
              {room.equipments.map((equipment) => (
                <span
                  key={equipment}
                  className="rounded-full border border-outline-variant bg-surface-container-low px-3 py-1.5 text-xs font-medium text-on-surface-variant"
                >
                  {equipment}
                </span>
              ))}
            </div>
          </Section>

          <Section title="Hiệu suất & bảo trì">
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard
                label="Doanh thu tháng"
                value={formatRoomPrice(room.monthlyRevenue)}
                accent="price"
              />
              <MetricCard label="Bảo trì gần nhất" value={room.latestMaintenance} />
            </div>
          </Section>
        </div>

        <footer className="shrink-0 border-t border-outline-variant bg-surface-container-low/50 px-5 py-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onEdit(room)}
              className="flex-1 rounded-xl bg-brand-orange px-5 py-2.5 font-display text-sm font-medium text-white shadow-md shadow-brand-orange/20 hover:bg-brand-orangeHover"
            >
              Chỉnh sửa
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-outline bg-white px-5 py-2.5 font-display text-sm font-medium text-on-surface-variant hover:text-on-surface"
            >
              Đóng
            </button>
          </div>
        </footer>
      </aside>
    </>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="mb-2 font-display text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
        {title}
      </h3>
      {children}
    </section>
  )
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: 'price'
}) {
  return (
    <div
      className={[
        'rounded-2xl border p-3',
        accent === 'price'
          ? 'border-primary-container/40 bg-primary-container/25'
          : 'border-outline-variant bg-white',
      ].join(' ')}
    >
      <p className="text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p
        className={[
          'mt-1 font-display text-base font-bold leading-snug',
          accent === 'price' ? 'text-brand-orange' : 'text-on-surface',
        ].join(' ')}
      >
        {value}
      </p>
    </div>
  )
}
