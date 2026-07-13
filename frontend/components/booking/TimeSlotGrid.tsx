import type { TimeSlot } from '@/lib/booking/types'

type TimeSlotGridProps = {
  slots: TimeSlot[]
  isLoading: boolean
  onSelect: (slotId: string) => void
  onDeselect: (slotId: string) => void
  hint?: string
  emptyMessage?: string
  selectedCount?: number
  onClearSelection?: () => void
}

const statusStyles: Record<TimeSlot['status'], string> = {
  available:
    'border-outline bg-white text-on-surface hover:border-brand-orange hover:bg-primary-container/25 hover:shadow-sm cursor-pointer active:scale-[0.97]',
  selected:
    'border-brand-orange bg-gradient-to-br from-brand-orange to-[#FF8C3A] text-white cursor-pointer shadow-md shadow-brand-orange/30 ring-2 ring-brand-orange/20 active:scale-[0.97]',
  booked: 'border-outline-variant/80 bg-surface-container text-on-surface-variant/45 cursor-not-allowed',
  past: 'border-transparent bg-surface-container-low text-on-surface-variant/35 cursor-not-allowed',
}

export default function TimeSlotGrid({
  slots,
  isLoading,
  onSelect,
  onDeselect,
  hint,
  emptyMessage = 'Chọn phòng và ngày để xem lịch trống.',
  selectedCount = 0,
  onClearSelection,
}: TimeSlotGridProps) {
  if (isLoading && slots.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-surface-container" />
        ))}
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low px-6 py-10 text-center">
        <p className="text-2xl">📅</p>
        <p className="mt-2 font-display text-sm font-medium text-on-surface">{emptyMessage}</p>
      </div>
    )
  }

  const showSelectionBar = selectedCount > 0 && onClearSelection

  return (
    <div className="space-y-4">
      {(showSelectionBar || hint) && (
        <div className="space-y-2">
          {showSelectionBar && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center justify-between gap-3 rounded-2xl border border-brand-orange/25 bg-primary-container/20 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full bg-brand-orange px-1 font-display text-xs font-bold tabular-nums text-white shadow-sm"
                  aria-hidden
                >
                  {selectedCount}
                </span>
                <p className="truncate font-display text-sm font-semibold text-on-surface">
                  khung giờ đã chọn
                </p>
              </div>

              <button
                type="button"
                onClick={onClearSelection}
                aria-label={`Xóa tất cả ${selectedCount} khung giờ đã chọn`}
                className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-outline bg-white py-1.5 pl-1.5 pr-3.5 font-display text-sm font-semibold text-on-surface shadow-sm transition-all hover:border-error/35 hover:bg-error-container/50 hover:text-error active:scale-[0.97]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors group-hover:bg-error-container group-hover:text-error">
                  <CloseIcon />
                </span>
                Xóa tất cả
              </button>
            </div>
          )}

          {hint && selectedCount === 0 && (
            <p className="rounded-xl border border-outline-variant/60 bg-surface-container-low px-4 py-3 text-xs leading-relaxed text-on-surface-variant">
              💡 {hint}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {slots.map((slot) => {
          const disabled = slot.status === 'booked' || slot.status === 'past'
          return (
            <button
              key={slot.id}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (disabled) return
                if (slot.status === 'selected') {
                  onDeselect(slot.id)
                  return
                }
                onSelect(slot.id)
              }}
              aria-pressed={slot.status === 'selected'}
              className={[
                'flex flex-col items-center justify-center rounded-xl border px-2 py-3 transition-all duration-200 select-none',
                statusStyles[slot.status],
              ].join(' ')}
            >
              <p className="font-display text-sm font-bold">{slot.start}</p>
              <p
                className={[
                  'mt-0.5 font-display text-[10px]',
                  slot.status === 'selected' ? 'text-white/80' : 'text-on-surface-variant/70',
                ].join(' ')}
              >
                {slot.end}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function CloseIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
