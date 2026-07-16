'use client'

import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/checkout-data'
import type { AppliedDiscount } from '@/lib/discount-service'
import { validateDiscountCode } from '@/lib/discount-service'
import { clearSelectedCoupon, readSelectedCoupon } from '@/lib/new-customer-offer'

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
  const [code, setCode] = useState(() => appliedDiscount?.code ?? readSelectedCoupon())
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
      clearSelectedCoupon()
      setStatus('success')
      setFeedback(result.message)
    } finally {
      setIsApplying(false)
    }
  }

  const handleRemove = () => {
    if (disabled || isApplying) return

    setCode('')
    clearSelectedCoupon()
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
    <div className="rounded-2xl border border-[#E4DED3] bg-[#FBF9F5] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-sm font-bold text-[#242A27]">Mã giảm giá</p>
        {appliedDiscount && (
          <span className="rounded-full bg-[#E8F5EC] px-2.5 py-1 font-display text-[11px] font-bold text-[#245545]">
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
            'h-11 min-w-0 flex-1 rounded-xl border bg-white px-3 font-sans text-sm text-[#242A27] outline-none transition',
            status === 'error'
              ? 'border-[#C62828] focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20'
              : 'border-[#E4DED3] focus:border-[#B28455] focus:ring-2 focus:ring-[#B28455]/20',
            disabled || appliedDiscount ? 'cursor-not-allowed opacity-70' : '',
          ].join(' ')}
        />

        {appliedDiscount ? (
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled || isApplying}
            className="h-11 shrink-0 rounded-xl border border-[#E4DED3] bg-white px-4 font-display text-sm font-semibold text-[#C62828] transition hover:bg-[#FFEBEE] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Gỡ mã
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleApply()}
            disabled={disabled || isApplying || !code.trim()}
            className="h-11 shrink-0 rounded-full bg-secondary px-5 font-display text-sm font-semibold text-white shadow-[0_10px_24px_rgba(23,58,49,.18)] transition hover:-translate-y-0.5 hover:bg-secondary-container disabled:cursor-not-allowed disabled:opacity-60"
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
            status === 'error' ? 'text-[#C62828]' : status === 'success' ? 'text-[#245545]' : 'text-[#6A6C66]',
          ].join(' ')}
        >
          {feedback}
        </p>
      )}
    </div>
  )
}
