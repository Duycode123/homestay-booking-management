import { useMemo, useState } from 'react'
import type { DailyRevenuePoint } from '@/lib/admin/reportsTypes'

type BookingVolumeChartProps = {
  data: DailyRevenuePoint[]
}

type ActivePoint = DailyRevenuePoint & {
  x: number
  y: number
  width: number
  height: number
}

const WIDTH = 560
const HEIGHT = 280
const PAD = { top: 24, right: 16, bottom: 42, left: 34 }

export default function BookingVolumeChart({ data }: BookingVolumeChartProps) {
  const [activePoint, setActivePoint] = useState<ActivePoint | null>(null)

  const chart = useMemo(() => {
    const innerWidth = WIDTH - PAD.left - PAD.right
    const innerHeight = HEIGHT - PAD.top - PAD.bottom
    const maxBookings = Math.max(...data.map((point) => point.orderCount), 1)
    const slotWidth = data.length > 0 ? innerWidth / data.length : innerWidth
    const barWidth = Math.max(3, Math.min(24, slotWidth * 0.58))
    const labelStep = data.length > 14 ? Math.ceil(data.length / 6) : data.length > 7 ? 2 : 1

    const bars = data.map((point, index): ActivePoint => {
      const height = point.orderCount === 0
        ? 2
        : Math.max(6, (point.orderCount / maxBookings) * innerHeight)
      const x = PAD.left + index * slotWidth + (slotWidth - barWidth) / 2
      const y = PAD.top + innerHeight - height

      return { ...point, x, y, width: barWidth, height }
    })

    const ticks = Array.from({ length: 4 }, (_, index) => {
      const ratio = index / 3
      return {
        value: Math.round(maxBookings * ratio),
        y: PAD.top + innerHeight - ratio * innerHeight,
      }
    })

    return { bars, ticks, innerHeight, labelStep }
  }, [data])

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label="Biểu đồ số booking theo ngày"
        onMouseLeave={() => setActivePoint(null)}
      >
        {chart.ticks.map((tick) => (
          <g key={`${tick.value}-${tick.y}`}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={tick.y}
              y2={tick.y}
              stroke="currentColor"
              className="text-outline-variant/50"
              strokeDasharray="4 5"
            />
            <text x={PAD.left - 8} y={tick.y + 4} textAnchor="end" className="fill-on-surface-variant text-[10px]">
              {tick.value}
            </text>
          </g>
        ))}

        {chart.bars.map((bar, index) => {
          const isActive = activePoint?.date === bar.date
          const hasBookings = bar.orderCount > 0

          return (
            <g key={bar.date}>
              <rect
                x={bar.x}
                y={bar.y}
                width={bar.width}
                height={bar.height}
                rx={Math.min(7, bar.width / 2)}
                className={[
                  'cursor-pointer transition-colors',
                  hasBookings ? (isActive ? 'fill-brand-orange' : 'fill-secondary/80') : 'fill-outline-variant',
                ].join(' ')}
                tabIndex={0}
                role="button"
                aria-label={`${bar.label}: ${bar.orderCount} booking`}
                onMouseEnter={() => setActivePoint(bar)}
                onFocus={() => setActivePoint(bar)}
                onBlur={() => setActivePoint(null)}
              />
              {(data.length <= 14 || index % chart.labelStep === 0) && (
                <text
                  x={bar.x + bar.width / 2}
                  y={HEIGHT - 14}
                  textAnchor="middle"
                  className="fill-on-surface-variant text-[10px]"
                >
                  {bar.label}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {activePoint && (
        <div
          className="pointer-events-none absolute z-10 min-w-[9rem] rounded-xl border border-outline-variant bg-white px-3 py-2 text-xs shadow-[var(--shadow-elevated)]"
          style={{
            left: `${((activePoint.x + activePoint.width / 2) / WIDTH) * 100}%`,
            top: `${(activePoint.y / HEIGHT) * 100}%`,
            transform: 'translate(-50%, calc(-100% - 10px))',
          }}
        >
          <p className="font-display font-semibold text-on-surface">Ngày {activePoint.label}</p>
          <p className="mt-1 text-secondary">{activePoint.orderCount} booking thành công</p>
        </div>
      )}
    </div>
  )
}
