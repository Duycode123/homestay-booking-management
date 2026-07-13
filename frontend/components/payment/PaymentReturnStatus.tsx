'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  formatCurrency,
  getPaymentMethodLabel,
  getReturnStatusContent,
  normalizePaymentStatus,
} from '@/lib/checkout-data'
import { clearPendingBooking } from '@/lib/pending-booking'
import { getPaymentTransactionDetail, type PaymentStatus } from '@/lib/payment-service'

export default function PaymentReturnStatus() {
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('paymentId')
  const bookingId = searchParams.get('bookingId')
  const backendBookingId = searchParams.get('backendBookingId')
  const returnStatus = normalizePaymentStatus(searchParams.get('status'))
  const method = searchParams.get('method')
  const returnAmount = Number(searchParams.get('amount') || 0)
  const paymentOption = searchParams.get('paymentOption')
  const [verifiedStatus, setVerifiedStatus] = useState<PaymentStatus | null>(null)
  const [verifiedAmount, setVerifiedAmount] = useState<number | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState('')

  const displayStatus = verifiedStatus ?? (returnStatus === 'unknown' ? 'unknown' : returnStatus)
  const displayAmount = verifiedAmount ?? returnAmount
  const content = useMemo(() => getReturnStatusContent(displayStatus), [displayStatus])
  const retryHref = buildRetryHref({
    bookingId,
    backendBookingId,
    method,
    paymentOption,
  })
  const primaryHref = content.tone === 'failed' || content.tone === 'cancelled' ? retryHref : content.primaryHref
  const missingBooking = !bookingId

  useEffect(() => {
    if (!paymentId || returnStatus !== 'success') {
      setVerifiedStatus(null)
      setVerifiedAmount(null)
      setVerificationMessage('')
      return
    }

    let cancelled = false
    const verifiedPaymentId = paymentId

    async function verifyPayment() {
      setIsVerifying(true)
      setVerificationMessage('')

      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          const transaction = await getPaymentTransactionDetail(verifiedPaymentId)
          if (cancelled) return

          setVerifiedStatus(transaction.status)
          setVerifiedAmount(transaction.amount)

          if (transaction.status !== 'pending') {
            setVerificationMessage('')
            return
          }
        } catch {
          if (cancelled) return
          setVerificationMessage('Chua the doc trang thai giao dich tu backend.')
          return
        }

        await new Promise((resolve) => window.setTimeout(resolve, 1500))
      }

      if (!cancelled) {
        setVerifiedStatus('pending')
        setVerificationMessage(
          'SePay da redirect ve thanh cong, nhung backend chua nhan webhook xac nhan. Vui long kiem tra cau hinh IPN/webhook SePay hoac cho he thong doi soat.',
        )
      }
    }

    void verifyPayment().finally(() => {
      if (!cancelled) {
        setIsVerifying(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [paymentId, returnStatus])

  useEffect(() => {
    if (displayStatus === 'success') {
      clearPendingBooking()
    }
  }, [displayStatus])

  return (
    <main className="min-h-screen bg-[#F5F2EC] px-6 py-10 text-[#1A1C1E]">
      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-[720px] items-center">
        <div className="w-full rounded-[24px] border border-[#E8E4DC] bg-white p-6 text-center shadow-[0_12px_48px_rgba(26,28,30,0.12)] md:p-8">
          <div
            className={[
              'mx-auto flex h-20 w-20 items-center justify-center rounded-full font-display text-4xl font-bold',
              getToneClasses(content.tone),
            ].join(' ')}
          >
            {content.icon}
          </div>

          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">
            {missingBooking ? 'Khong tim thay ma dat phong' : content.title}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[#5C5348]">
            {missingBooking
              ? 'Vui long kiem tra lai duong dan thanh toan hoac quay ve trang chu.'
              : content.message}
          </p>

          <div className="mt-6 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-4 text-left">
            <TransactionRow label="Ma dat phong" value={bookingId || 'Chua co'} />
            <TransactionRow
              label="Trang thai"
              value={displayStatus === 'unknown' ? 'Khong xac dinh' : content.title}
            />
            <TransactionRow label="So tien" value={displayAmount > 0 ? formatCurrency(displayAmount) : 'Chua xac dinh'} />
            <TransactionRow label="Phuong thuc" value={getPaymentMethodLabel(method)} />
            <TransactionRow
              label="Lua chon"
              value={paymentOption === 'full' ? 'Thanh toan toan bo' : 'Dat coc 50.000 VND'}
            />
            {paymentId && <TransactionRow label="Ma giao dich" value={paymentId} />}
          </div>

          {(isVerifying || verificationMessage) && (
            <p className="mt-4 rounded-2xl border border-[#FEF3C7] bg-[#FFFBEB] px-4 py-3 text-sm font-medium text-[#92400E]">
              {isVerifying ? 'Dang doi soat voi backend...' : verificationMessage}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {!missingBooking && (
              <Link
                href={primaryHref}
                className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-[#FF7518] font-display font-semibold text-white transition hover:bg-[#E6640F]"
              >
                {content.primaryLabel}
              </Link>
            )}
            <Link
              href="/"
              className="flex h-12 flex-1 items-center justify-center rounded-2xl border border-[#C9C2B6] bg-white font-display font-semibold text-[#1A1C1E] transition hover:bg-[#FAF8F4]"
            >
              Quay ve trang chu
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

function buildRetryHref({
  bookingId,
  backendBookingId,
  method,
  paymentOption,
}: {
  bookingId: string | null
  backendBookingId: string | null
  method: string | null
  paymentOption: string | null
}) {
  if (!bookingId) {
    return '/rooms'
  }

  const params = new URLSearchParams({ bookingId })

  if (backendBookingId) {
    params.set('backendBookingId', backendBookingId)
  }

  if (method) {
    params.set('method', method)
  }

  if (paymentOption) {
    params.set('paymentOption', paymentOption)
  }

  return `/customer/checkout?${params.toString()}`
}

function TransactionRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#E8E4DC] py-3 last:border-b-0">
      <span className="text-sm text-[#5C5348]">{label}</span>
      <span className="text-right font-display text-sm font-bold text-[#1A1C1E]">{value}</span>
    </div>
  )
}

function getToneClasses(tone: string) {
  if (tone === 'success') return 'bg-[#E8F5EC] text-[#0A4D27]'
  if (tone === 'failed') return 'bg-[#FFEBEE] text-[#C62828]'
  if (tone === 'pending') return 'bg-[#FEF3C7] text-[#B45309]'
  if (tone === 'cancelled') return 'bg-[#FFE8D6] text-[#6B3200]'

  return 'bg-[#F0EDE6] text-[#5C5348]'
}
