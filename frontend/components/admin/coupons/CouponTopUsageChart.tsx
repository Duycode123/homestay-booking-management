import { formatAdminPrice } from '@/lib/admin/adminBookingApi'
import type { CouponTopUsagePoint } from '@/lib/admin/coupons/types'
import { useMemo, useState } from 'react'

type CouponTopUsageChartProps = {
  data: CouponTopUsagePoint[]
}

type TooltipState = {
  x: number
  y: number
  coupon: CouponTopUsagePoint
} | null

const WIDTH = 800
const HEIGHT = 300
const PAD = { top: 20, right: 20, bottom: 48, left: 20 }

export default function CouponTopUsageChart({ data }: CouponTopUsageChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState>(null)

  const chart = useMemo(() => {
    const innerW = WIDTH - PAD.left - PAD.right
    const innerH = HEIGHT - PAD.top - PAD.bottom
    const maxUsage = Math.max(...data.map((coupon) => coupon.usageCount), 1)
    const gap = 12
    const barWidth = data.length > 0 ? (innerW - gap * (data.length - 1)) / data.length : 0

    const bars = data.map((coupon, index) => {
      const height = (coupon.usageCount / maxUsage) * innerH
      const x = PAD.left + index * (barWidth + gap)
      const y = PAD.top + innerH - height
      return { coupon, x, y, width: barWidth, height }
    })

    return { bars, innerH }
  }, [data])

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low/40 px-6 py-10 text-center text-sm text-on-surface-variant">
        Chưa có dữ liệu sử dụng mã giảm giá trong khoảng thời gian này.
      </div>
    )
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label="Biểu đồ mã giảm giá dùng nhiều nhất"
        onMouseLeave={() => setTooltip(null)}
      >
        <line
          x1={PAD.left}
          x2={WIDTH - PAD.right}
          y1={PAD.top + chart.innerH}
          y2={PAD.top + chart.innerH}
          stroke="currentColor"
          className="text-outline-variant"
        />

        {chart.bars.map((bar) => (
          <g key={`${bar.coupon.couponId}-${bar.coupon.code}`}>
            <rect
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              rx="8"
              className="cursor-pointer fill-brand-orange/85 transition-opacity hover:fill-brand-greenDark"
              onMouseEnter={() =>
                setTooltip({
                  x: bar.x + bar.width / 2,
                  y: bar.y,
                  coupon: bar.coupon,
                })
              }
            />
            <text
              x={bar.x + bar.width / 2}
              y={HEIGHT - 28}
              textAnchor="middle"
              className="fill-on-surface-variant text-[10px]"
            >
              {truncateLabel(bar.coupon.code, 12)}
            </text>
            <text
              x={bar.x + bar.width / 2}
              y={HEIGHT - 12}
              textAnchor="middle"
              className="fill-on-surface text-[10px] font-medium"
            >
              {bar.coupon.usageCount} lượt
            </text>
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
          <p className="font-display font-semibold text-on-surface">{tooltip.coupon.code}</p>
          <p className="mt-1 text-on-surface-variant">{tooltip.coupon.usageCount} lượt sử dụng</p>
          <p className="text-brand-orange">{formatAdminPrice(tooltip.coupon.discountAmount)} đã giảm</p>
        </div>
      )}
    </div>
  )
}

function truncateLabel(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}...` : value
}
