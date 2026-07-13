import type { PracticeRoom } from './types'

export const ROOM_META: Record<
  string,
  { gradient: string; emoji: string; tagline: string }
> = {
  'room-a': {
    gradient: 'from-amber-400/30 via-orange-300/20 to-primary-container',
    emoji: '🎸',
    tagline: 'Acoustic & unplugged',
  },
  'room-b': {
    gradient: 'from-rose-500/25 via-red-400/15 to-error-container/40',
    emoji: '🥁',
    tagline: 'Full band setup',
  },
  'room-c': {
    gradient: 'from-violet-500/30 via-purple-400/20 to-tertiary-container',
    emoji: '✨',
    tagline: 'Premium VIP homestay',
  },
  'room-d': {
    gradient: 'from-sky-500/25 via-blue-400/15 to-secondary-container/25',
    emoji: '🎤',
    tagline: 'Lưu trú & vocal',
  },
}

export function getRoomMeta(room: PracticeRoom) {
  return (
    ROOM_META[room.id] ?? {
      gradient: 'from-surface-container-high to-primary-container/30',
      emoji: '🎵',
      tagline: 'Homestay lưu trú',
    }
  )
}
