'use client'

import { calculateCheckoutSummary, formatCurrency, type CheckoutBooking } from '@/lib/checkout-data'
import type { AppliedDiscount } from '@/lib/discount-service'

export default function CheckoutSummary({
  booking,
  appliedDiscount,
  paymentAmount,
  paymentOption,
}: {
  booking: CheckoutBooking
  appliedDiscount: AppliedDiscount | null
  paymentAmount?: number
  paymentOption?: string
}) {
  const summary = calculateCheckoutSummary(booking, appliedDiscount)
  const isDeposit = paymentOption === 'deposit'
  const depositedAmount = isDeposit ? Math.min(Math.max(paymentAmount ?? 0, 0), summary.total) : 0
  const remainingAmount = Math.max(summary.total - depositedAmount, 0)

  return (
    <div className="rounded-2xl border border-[#E9E3D9] bg-white px-4 py-3">
      <div className="space-y-1">
        <PaymentRow label="Tiền phòng" value={formatCurrency(summary.roomPrice)} />
        {summary.addonsTotal > 0 && <PaymentRow label="Tiện nghi thêm" value={formatCurrency(summary.addonsTotal)} />}
        {appliedDiscount && (
          <PaymentRow
            label={`Mã giảm giá (${appliedDiscount.code})`}
            value={`-${formatCurrency(appliedDiscount.discountAmount)}`}
            green
          />
        )}
      </div>

      <div className="my-2 h-px bg-[#E4DED3]" />
      <div className="flex items-end justify-between gap-3 py-1.5">
        <span className="font-display text-sm font-bold">Tổng giá trị booking</span>
        <span className="shrink-0 text-nowrap font-display text-xl font-bold text-[#B28455]">
          {formatCurrency(summary.total)}
        </span>
      </div>

      {isDeposit && (
        <div className="mt-2 space-y-1 border-t border-[#E4DED3] pt-2">
          <PaymentRow label="Đã cọc (50%)" value={formatCurrency(depositedAmount)} green />
          <div className="flex items-center justify-between gap-3 py-1.5">
            <span className="font-display text-sm font-bold text-[#242A27]">Số tiền còn lại</span>
            <span className="shrink-0 text-nowrap font-display text-lg font-bold text-[#A8662E]">
              {formatCurrency(remainingAmount)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function PaymentRow({ label, value, green = false }: { label: string; value: string; green?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="min-w-0 text-[#6A6C66]">{label}</span>
      <span className={['shrink-0 text-nowrap text-right font-semibold', green ? 'text-[#52766B]' : 'text-[#242A27]'].join(' ')}>
        {value}
      </span>
    </div>
  )
}
