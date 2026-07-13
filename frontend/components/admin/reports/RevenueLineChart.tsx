import { formatAdminPrice } from '@/lib/admin/adminBookingApi'
import type { DailyRevenuePoint } from '@/lib/admin/reportsTypes'
import { useMemo, useState } from 'react'

type RevenueLineChartProps = {
  data: DailyRevenuePoint[]
}

type TooltipState = {
  x: number
  y: number
  point: DailyRevenuePoint
} | null

const WIDTH = 800
const HEIGHT = 280
const PAD = { top: 24, right: 20, bottom: 40, left: 56 }

export default function RevenueLineChart({ data }: RevenueLineChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState>(null)

  const chart = useMemo(() => {
    const innerW = WIDTH - PAD.left - PAD.right
    const innerH = HEIGHT - PAD.top - PAD.bottom
    const maxRevenue = Math.max(...data.map((d) => d.revenue), 1)

    const points = data.map((point, index) => {
      const x = PAD.left + (data.length <= 1 ? innerW / 2 : (index / (data.length - 1)) * innerW)
      const y = PAD.top + innerH - (point.revenue / maxRevenue) * innerH
      return { ...point, x, y }
    })

    const linePath = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ')

    const areaPath = `${linePath} L ${points.at(-1)?.x ?? PAD.left} ${PAD.top + innerH} L ${points[0]?.x ?? PAD.left} ${PAD.top + innerH} Z`

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
      y: PAD.top + innerH - ratio * innerH,
      label: formatAdminPrice(maxRevenue * ratio),
    }))

    const xLabelStep = data.length > 14 ? Math.ceil(data.length / 7) : data.length > 7 ? 2 : 1

    return { points, linePath, areaPath, yTicks, xLabelStep, innerH }
  }, [data])

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label="Biểu đồ doanh thu theo ngày"
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id="revenueArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(255 117 24 / 0.28)" />
            <stop offset="100%" stopColor="rgb(255 117 24 / 0.02)" />
          </linearGradient>
        </defs>

        {chart.yTicks.map((tick) => (
          <g key={tick.y}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={tick.y}
              y2={tick.y}
              stroke="currentColor"
              className="text-outline-variant/60"
              strokeDasharray="4 4"
            />
            <text
              x={PAD.left - 8}
              y={tick.y + 4}
              textAnchor="end"
              className="fill-on-surface-variant text-[10px]"
            >
              {tick.label}
            </text>
          </g>
        ))}

        <path d={chart.areaPath} fill="url(#revenueArea)" />
        <path
          d={chart.linePath}
          fill="none"
          stroke="rgb(255 117 24)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {chart.points.map((point, index) => (
          <g key={point.date}>
            <circle
              cx={point.x}
              cy={point.y}
              r="12"
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setTooltip({ x: point.x, y: point.y, point })}
              onFocus={() => setTooltip({ x: point.x, y: point.y, point })}
            />
            <circle
              cx={point.x}
              cy={point.y}
              r={tooltip?.point.date === point.date ? 5 : 3.5}
              className="fill-brand-orange stroke-white"
              strokeWidth="2"
              pointerEvents="none"
            />
            {(data.length <= 14 || index % chart.xLabelStep === 0) && (
              <text
                x={point.x}
                y={HEIGHT - 12}
                textAnchor="middle"
                className="fill-on-surface-variant text-[10px]"
              >
                {point.label}
              </text>
            )}
          </g>
        ))}
      </svg>

      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 min-w-[9rem] rounded-lg border border-outline-variant bg-white px-3 py-2 text-xs shadow-[var(--shadow-elevated)]"
          style={{
            left: `${(tooltip.x / WIDTH) * 100}%`,
            top: `${(tooltip.y / HEIGHT) * 100}%`,
            transform: 'translate(-50%, calc(-100% - 12px))',
          }}
        >
          <p className="font-display font-semibold text-on-surface">{tooltip.point.label}</p>
          <p className="mt-1 text-brand-orange">{formatAdminPrice(tooltip.point.revenue)}</p>
          <p className="text-on-surface-variant">{tooltip.point.orderCount} đơn</p>
        </div>
      )}
    </div>
  )
}
