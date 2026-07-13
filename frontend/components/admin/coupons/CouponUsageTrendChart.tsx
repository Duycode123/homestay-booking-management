import { formatAdminPrice } from '@/lib/admin/adminBookingApi'
import type { CouponUsageTrendPoint } from '@/lib/admin/coupons/types'
import { useMemo, useState } from 'react'

type CouponUsageTrendChartProps = {
  data: CouponUsageTrendPoint[]
}

type TooltipState = {
  x: number
  y: number
  point: CouponUsageTrendPoint
} | null

const WIDTH = 800
const HEIGHT = 280
const PAD = { top: 24, right: 20, bottom: 40, left: 56 }

export default function CouponUsageTrendChart({ data }: CouponUsageTrendChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState>(null)

  const chart = useMemo(() => {
    const innerW = WIDTH - PAD.left - PAD.right
    const innerH = HEIGHT - PAD.top - PAD.bottom
    const maxUsage = Math.max(...data.map((point) => point.usageCount), 1)

    const points = data.map((point, index) => {
      const x = PAD.left + (data.length <= 1 ? innerW / 2 : (index / (data.length - 1)) * innerW)
      const y = PAD.top + innerH - (point.usageCount / maxUsage) * innerH
      return { ...point, x, y }
    })

    const linePath = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ')

    const areaPath = `${linePath} L ${points.at(-1)?.x ?? PAD.left} ${PAD.top + innerH} L ${points[0]?.x ?? PAD.left} ${PAD.top + innerH} Z`

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
      y: PAD.top + innerH - ratio * innerH,
      label: Math.round(maxUsage * ratio).toString(),
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
        aria-label="Biểu đồ xu hướng sử dụng mã giảm giá"
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id="couponUsageArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(34 120 84 / 0.28)" />
            <stop offset="100%" stopColor="rgb(34 120 84 / 0.02)" />
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

        <path d={chart.areaPath} fill="url(#couponUsageArea)" />
        <path
          d={chart.linePath}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-brand-greenDark"
        />

        {chart.points.map((point) => (
          <g key={point.date}>
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              className="cursor-pointer fill-brand-greenDark stroke-white stroke-2"
              onMouseEnter={() =>
                setTooltip({
                  x: point.x,
                  y: point.y,
                  point,
                })
              }
            />
            {(chart.points.indexOf(point) % chart.xLabelStep === 0 ||
              chart.points.indexOf(point) === chart.points.length - 1) && (
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
          className="pointer-events-none absolute z-10 min-w-[10rem] rounded-lg border border-outline-variant bg-white px-3 py-2 text-xs shadow-[var(--shadow-elevated)]"
          style={{
            left: `${(tooltip.x / WIDTH) * 100}%`,
            top: `${(tooltip.y / HEIGHT) * 100}%`,
            transform: 'translate(-50%, calc(-100% - 12px))',
          }}
        >
          <p className="font-display font-semibold text-on-surface">{tooltip.point.label}</p>
          <p className="mt-1 text-on-surface-variant">{tooltip.point.usageCount} lượt dùng</p>
          <p className="text-brand-orange">{formatAdminPrice(tooltip.point.discountAmount)} giảm</p>
        </div>
      )}
    </div>
  )
}
