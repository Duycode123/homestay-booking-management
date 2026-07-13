import type { TopRoomPoint } from '@/lib/admin/reportsTypes'
import { useMemo, useState } from 'react'

type TopRoomsBarChartProps = {
  data: TopRoomPoint[]
}

type TooltipState = {
  x: number
  y: number
  room: TopRoomPoint
} | null

const WIDTH = 800
const HEIGHT = 300
const PAD = { top: 20, right: 20, bottom: 48, left: 20 }

export default function TopRoomsBarChart({ data }: TopRoomsBarChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState>(null)

  const chart = useMemo(() => {
    const innerW = WIDTH - PAD.left - PAD.right
    const innerH = HEIGHT - PAD.top - PAD.bottom
    const maxOrders = Math.max(...data.map((room) => room.orderCount), 1)
    const gap = 12
    const barWidth = data.length > 0 ? (innerW - gap * (data.length - 1)) / data.length : 0

    const bars = data.map((room, index) => {
      const height = (room.orderCount / maxOrders) * innerH
      const x = PAD.left + index * (barWidth + gap)
      const y = PAD.top + innerH - height
      return { room, x, y, width: barWidth, height }
    })

    return { bars, innerH }
  }, [data])

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label="Biểu đồ tần suất sử dụng phòng"
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
          <g key={`${bar.room.roomId}-${bar.room.roomName}`}>
            <rect
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              rx="8"
              className="cursor-pointer fill-brand-greenDark/85 transition-opacity hover:fill-brand-orange"
              onMouseEnter={() =>
                setTooltip({
                  x: bar.x + bar.width / 2,
                  y: bar.y,
                  room: bar.room,
                })
              }
            />
            <text
              x={bar.x + bar.width / 2}
              y={HEIGHT - 28}
              textAnchor="middle"
              className="fill-on-surface-variant text-[10px]"
            >
              {truncateLabel(bar.room.roomName, 12)}
            </text>
            <text
              x={bar.x + bar.width / 2}
              y={HEIGHT - 12}
              textAnchor="middle"
              className="fill-on-surface text-[10px] font-medium"
            >
              {bar.room.orderCount} lượt
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
          <p className="font-display font-semibold text-on-surface">{tooltip.room.roomName}</p>
          {tooltip.room.roomTypeName && (
            <p className="mt-1 text-on-surface-variant">{tooltip.room.roomTypeName}</p>
          )}
          <p className="text-brand-orange">{tooltip.room.orderCount} lượt đặt thành công</p>
        </div>
      )}
    </div>
  )
}

function truncateLabel(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}...` : value
}
