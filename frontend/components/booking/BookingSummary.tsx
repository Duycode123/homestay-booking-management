import type { TimeSlot } from '@/lib/booking/types'
import type { HomestayRoom } from '@/lib/booking/types'
import { formatPrice } from '@/lib/booking/bookingApi'
import { formatDateLong } from '@/lib/booking/dateUtils'
import { formatSlotRange } from '@/lib/booking/slotSelection'

type BookingSummaryProps = {
  room: HomestayRoom | null
  selectedDate: string
  selectedSlots: TimeSlot[]
  message: string
  isSubmitting: boolean
  onConfirm: () => void
}

export default function BookingSummary({
  room,
  selectedDate,
  selectedSlots,
  message,
  isSubmitting,
  onConfirm,
}: BookingSummaryProps) {
  const selectedHours = selectedSlots.length
  const total =
    room && selectedHours > 0 ? formatPrice(room.pricePerHour * selectedHours) : null

  const isSuccess = message.includes('thành công')

  return (
    <aside className="h-fit overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-[var(--shadow-elevated)] lg:sticky lg:top-6">
      <div className="bg-gradient-to-br from-brand-greenDark to-brand-greenLight px-5 py-5 text-white">
        <p className="font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-orange">
          Tóm tắt đặt phòng
        </p>
        <p className="mt-1 font-display text-lg font-bold">Xác nhận kỳ lưu trú</p>
      </div>

      <div className="space-y-4 p-5">
        <SummaryRow
          label="Phòng"
          value={room?.name ?? '—'}
          highlight={!!room}
        />
        <SummaryRow
          label="Ngày"
          value={selectedDate ? formatDateLong(selectedDate) : '—'}
        />
        <SummaryRow
          label="Khung giờ"
          value={selectedSlots.length > 0 ? formatSlotRange(selectedSlots) : '—'}
        />
        {selectedHours > 0 && room && (
          <p className="-mt-2 text-xs text-on-surface-variant">
            {selectedHours} giờ × {formatPrice(room.pricePerHour)}/giờ
          </p>
        )}

        <div className="rounded-2xl border border-primary-container/50 bg-primary-container/25 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-on-primary-container/80">
            Tổng thanh toán
          </p>
          <p className="mt-1 font-display text-3xl font-bold text-brand-orange">
            {total ?? '—'}
          </p>
        </div>

        {message && (
          <p
            className={[
              'rounded-xl px-3 py-2.5 text-xs leading-relaxed',
              isSuccess
                ? 'border border-secondary-container/50 bg-secondary-container/20 text-secondary'
                : 'border border-error/20 bg-error-container text-error',
            ].join(' ')}
          >
            {message}
          </p>
        )}

        <button
          type="button"
          disabled={!room || selectedHours === 0 || isSubmitting}
          onClick={onConfirm}
          className="flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-brand-orange font-display text-sm font-semibold text-white shadow-lg shadow-brand-orange/25 transition-all hover:bg-brand-orangeHover active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-surface-container-high disabled:text-on-surface-variant disabled:shadow-none"
        >
          {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt phòng'}
        </button>

        <p className="text-center text-[11px] leading-relaxed text-on-surface-variant">
          Lịch phòng và giá đang lấy theo dữ liệu backend hiện có.
        </p>
      </div>
    </aside>
  )
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-outline-variant/50 pb-3 last:border-0">
      <span className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">{label}</span>
      <span
        className={[
          'max-w-[60%] text-right text-sm font-medium',
          highlight ? 'text-brand-orange' : 'text-on-surface',
        ].join(' ')}
      >
        {value}
      </span>
    </div>
  )
}
