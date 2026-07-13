import type { EquipmentType } from './types'

export const EQUIPMENT_TYPE_META: Record<
  EquipmentType,
  { gradient: string; iconLetter: string; emoji: string }
> = {
  WIFI: {
    gradient: 'from-cyan-500/20 via-sky-400/10 to-secondary-container/30',
    iconLetter: 'W',
    emoji: 'WiFi',
  },
  AIR_CONDITIONER: {
    gradient: 'from-sky-500/20 via-blue-400/10 to-secondary-container/30',
    iconLetter: 'A',
    emoji: 'AC',
  },
  TV: {
    gradient: 'from-amber-500/20 via-orange-400/10 to-primary-container',
    iconLetter: 'T',
    emoji: 'TV',
  },
  WATER_HEATER: {
    gradient: 'from-violet-500/20 via-purple-400/10 to-tertiary-container',
    iconLetter: 'H',
    emoji: 'Hot',
  },
  OTHER: {
    gradient: 'from-emerald-500/20 via-green-400/10 to-secondary-container/20',
    iconLetter: 'O',
    emoji: 'O',
  },
}
