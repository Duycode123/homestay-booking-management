'use client'

import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/checkout-data'
import type { AppliedDiscount } from '@/lib/discount-service'
import { validateDiscountCode } from '@/lib/discount-service'

type CheckoutCouponInputProps = {
  subtotal: number
  appliedDiscount: AppliedDiscount | null
  onApplied: (discount: AppliedDiscount) => void
  onRemoved: () => void
  disabled?: boolean
  bookingId?: string
}

export default function CheckoutCouponInput({
  subtotal,
  appliedDiscount,
  onApplied,
  onRemoved,
  disabled = false,
  bookingId,
}: CheckoutCouponInputProps) {
  const [code, setCode] = useState(appliedDiscount?.code ?? '')
  const [isApplying, setIsApplying] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (appliedDiscount) {
      setCode(appliedDiscount.code)
      setStatus('success')
      setFeedback(`Đã áp dụng mã ${appliedDiscount.code}. Giảm ${formatCurrency(appliedDiscount.discountAmount)}.`)
      return
    }

    setStatus('idle')
    setFeedback('')
  }, [appliedDiscount])

  const handleApply = async () => {
    if (disabled || isApplying || appliedDiscount) return

    setIsApplying(true)
    setStatus('idle')
    setFeedback('')

    try {
      const result = await validateDiscountCode({
        code,
        subtotal,
        bookingId,
      })

      if (!result.valid || !result.code || result.discountAmount === undefined) {
        setStatus('error')
        setFeedback(result.message)
        return
      }

      onApplied({
        code: result.code,
        discountAmount: result.discountAmount,
      })
      setStatus('success')
      setFeedback(result.message)
    } finally {
      setIsApplying(false)
    }
  }

  const handleRemove = () => {
    if (disabled || isApplying) return

    setCode('')
    setStatus('idle')
    setFeedback('')
    onRemoved()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !appliedDiscount) {
      event.preventDefault()
      void handleApply()
    }
  }

  return (
    <div className="rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-sm font-bold text-[#1A1C1E]">Mã giảm giá</p>
        {appliedDiscount && (
          <span className="rounded-full bg-[#E8F5EC] px-2.5 py-1 font-display text-[11px] font-bold text-[#0A4D27]">
            Đã áp dụng
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={code}
          onChange={(event) => {
            setCode(event.target.value.toUpperCase())
            if (status !== 'idle') {
              setStatus('idle')
              setFeedback('')
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Nhập mã giảm giá"
          disabled={disabled || isApplying || Boolean(appliedDiscount)}
          aria-label="Mã giảm giá"
          className={[
            'h-11 min-w-0 flex-1 rounded-xl border bg-white px-3 font-sans text-sm text-[#1A1C1E] outline-none transition',
            status === 'error'
              ? 'border-[#C62828] focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20'
              : 'border-[#E8E4DC] focus:border-[#FF7518] focus:ring-2 focus:ring-[#FF7518]/20',
            disabled || appliedDiscount ? 'cursor-not-allowed opacity-70' : '',
          ].join(' ')}
        />

        {appliedDiscount ? (
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled || isApplying}
            className="h-11 shrink-0 rounded-xl border border-[#E8E4DC] bg-white px-4 font-display text-sm font-semibold text-[#C62828] transition hover:bg-[#FFEBEE] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Gỡ mã
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleApply()}
            disabled={disabled || isApplying || !code.trim()}
            className="h-11 shrink-0 rounded-xl bg-[#FF7518] px-4 font-display text-sm font-semibold text-white transition hover:bg-[#E6640F] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isApplying ? 'Đang kiểm tra...' : 'Áp dụng'}
          </button>
        )}
      </div>

      {feedback && (
        <p
          role={status === 'error' ? 'alert' : 'status'}
          className={[
            'mt-2 text-xs leading-5',
            status === 'error' ? 'text-[#C62828]' : status === 'success' ? 'text-[#0A4D27]' : 'text-[#5C5348]',
          ].join(' ')}
        >
          {feedback}
        </p>
      )}
    </div>
  )
}
