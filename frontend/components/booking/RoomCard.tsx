import type { PracticeRoom } from '@/lib/booking/types'
import { formatPrice } from '@/lib/booking/bookingApi'
import { getRoomMeta } from '@/lib/booking/roomMeta'

type RoomCardProps = {
  room: PracticeRoom
  selected: boolean
  onSelect: () => void
}

export default function RoomCard({ room, selected, onSelect }: RoomCardProps) {
  const meta = getRoomMeta(room)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'group relative w-full overflow-hidden rounded-2xl border text-left transition-all duration-300',
        selected
          ? 'border-brand-orange ring-2 ring-brand-orange/30 shadow-[var(--shadow-elevated)]'
          : 'border-outline-variant bg-white shadow-[var(--shadow-card)] hover:-translate-y-0.5 hover:border-brand-orange/40 hover:shadow-[var(--shadow-elevated)]',
      ].join(' ')}
    >
      {/* Visual header */}
      <div className={['relative h-24 bg-gradient-to-br', meta.gradient].join(' ')}>
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
        <div className="relative flex h-full items-end justify-between p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/60 bg-white/90 text-xl shadow-sm backdrop-blur-sm">
            {meta.emoji}
          </div>
          {room.isVip && (
            <span className="rounded-full border border-tertiary/30 bg-tertiary-container px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-wider text-on-tertiary-container shadow-sm">
              VIP
            </span>
          )}
        </div>
        {selected && (
          <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-brand-orange text-xs font-bold text-white shadow-md">
            ✓
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-on-surface-variant">
          {meta.tagline}
        </p>
        <h3 className="mt-0.5 font-display text-base font-bold text-on-surface transition-colors group-hover:text-brand-orange">
          {room.name}
        </h3>
        <p className="mt-1 text-xs text-on-surface-variant">Tối đa {room.capacity} người</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {room.equipment.slice(0, 3).map((item) => (
            <span
              key={item}
              className="rounded-full border border-outline-variant/80 bg-surface-container-low px-2.5 py-0.5 text-[10px] font-medium text-on-surface-variant"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-outline-variant/60 pt-3">
          <p className="font-display text-lg font-bold text-brand-orange">
            {formatPrice(room.pricePerHour)}
          </p>
          <span className="text-xs text-on-surface-variant">/ giờ</span>
        </div>
      </div>
    </button>
  )
}
