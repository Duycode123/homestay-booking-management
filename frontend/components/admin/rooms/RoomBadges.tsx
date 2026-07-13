import type { RoomCategory, RoomStatus } from '@/lib/admin/rooms/types'
import { roomCategoryLabels, roomStatusLabels } from '@/lib/admin/rooms/types'

const statusStyles: Record<RoomStatus, string> = {
  active: 'border-secondary-container/50 bg-secondary-container/25 text-secondary',
  occupied: 'border-primary-container bg-primary-container/35 text-on-primary-container',
  maintenance: 'border-tertiary-container bg-tertiary-container/40 text-on-tertiary-container',
  inactive: 'border-outline-variant bg-surface-container text-on-surface-variant',
}

const categoryStyles: Record<RoomCategory, string> = {
  standard: 'border-outline-variant bg-surface-container-low text-on-surface-variant',
  band: 'border-primary-container bg-primary-container/25 text-on-primary-container',
  recording: 'border-secondary-container/50 bg-secondary-container/20 text-secondary',
  premium: 'border-tertiary-container bg-tertiary-container/35 text-on-tertiary-container',
}

type BadgeSize = 'sm' | 'md'
type BadgeTone = 'default' | 'overlay'

const sizeClass: Record<BadgeSize, string> = {
  sm: 'px-2 py-1 text-[10px]',
  md: 'px-3 py-1.5 text-xs',
}

const overlayToneClass = 'border-white/35 bg-black/45 text-white backdrop-blur-sm'

export function RoomStatusBadge({
  status,
  size = 'sm',
  tone = 'default',
}: {
  status: RoomStatus
  size?: BadgeSize
  tone?: BadgeTone
}) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border font-display font-semibold',
        sizeClass[size],
        tone === 'overlay' ? overlayToneClass : statusStyles[status],
      ].join(' ')}
    >
      {roomStatusLabels[status]}
    </span>
  )
}

export function RoomCategoryBadge({
  category,
  label,
  size = 'sm',
  tone = 'default',
}: {
  category: RoomCategory
  label?: string
  size?: BadgeSize
  tone?: BadgeTone
}) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border font-display font-semibold',
        sizeClass[size],
        tone === 'overlay' ? overlayToneClass : categoryStyles[category],
      ].join(' ')}
    >
      {label || roomCategoryLabels[category]}
    </span>
  )
}
