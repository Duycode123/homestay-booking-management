import type { ReportDateRange } from '@/lib/admin/reportsTypes'

type ReportsDateRangePickerProps = {
  value: ReportDateRange
  onChange: (range: ReportDateRange) => void
  disabled?: boolean
}

const PRESETS = [
  { label: '7 ngày', days: 7 },
  { label: '30 ngày', days: 30 },
  { label: '90 ngày', days: 90 },
] as const

function toDateKey(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function applyPreset(days: number): ReportDateRange {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - (days - 1))
  return { startDate: toDateKey(start), endDate: toDateKey(end) }
}

export default function ReportsDateRangePicker({
  value,
  onChange,
  disabled = false,
}: ReportsDateRangePickerProps) {
  const set = (patch: Partial<ReportDateRange>) => onChange({ ...value, ...patch })

  return (
    <div className="rounded-xl border border-outline-variant bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block min-w-[10rem] flex-1">
          <span className="mb-1 block font-display text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
            Từ ngày
          </span>
          <input
            type="date"
            value={value.startDate}
            max={value.endDate}
            disabled={disabled}
            onChange={(e) => set({ startDate: e.target.value })}
            className="h-10 w-full rounded-lg border border-outline bg-white px-3 text-sm text-on-surface outline-none transition-colors focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 disabled:opacity-60"
          />
        </label>

        <label className="block min-w-[10rem] flex-1">
          <span className="mb-1 block font-display text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
            Đến ngày
          </span>
          <input
            type="date"
            value={value.endDate}
            min={value.startDate}
            disabled={disabled}
            onChange={(e) => set({ endDate: e.target.value })}
            className="h-10 w-full rounded-lg border border-outline bg-white px-3 text-sm text-on-surface outline-none transition-colors focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 disabled:opacity-60"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.days}
              type="button"
              disabled={disabled}
              onClick={() => onChange(applyPreset(preset.days))}
              className="h-10 rounded-lg border border-outline px-3 font-display text-xs font-medium text-on-surface-variant transition-colors hover:border-brand-orange hover:text-brand-orange disabled:opacity-60"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
