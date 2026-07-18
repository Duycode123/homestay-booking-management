'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import CheckoutBookingInfo from '@/components/checkout/CheckoutBookingInfo'
import CheckoutSummary from '@/components/checkout/CheckoutSummary'
import { formatCurrency, getCheckoutBookingFromParams, type CheckoutBooking } from '@/lib/checkout-data'
import { clearCheckoutSession, getCheckoutSession } from '@/lib/checkout-session'
import type { AppliedDiscount } from '@/lib/discount-service'
import { getCsrfRequestHeaders } from '@/lib/api'
import { clearPendingBooking } from '@/lib/pending-booking'
import {
  getPaymentTransactionDetail,
  releasePaymentHold,
  releasePaymentHoldKeepalive,
  type PaymentStatus,
  type PaymentTransactionDetail,
} from '@/lib/payment-service'

const PAYMENT_POLL_INTERVAL_MS = 3000

export default function PaymentSessionPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.toString()
  const paymentId = searchParams.get('paymentId')?.trim() ?? ''
  const paymentUrl = searchParams.get('paymentUrl')?.trim() ?? ''
  const initialExpiry = searchParams.get('paymentExpiresAt')?.trim() || null
  const roomId = searchParams.get('roomId')?.trim() ?? ''

  const [booking, setBooking] = useState<CheckoutBooking | null>(null)
  const [discount, setDiscount] = useState<AppliedDiscount | null>(null)
  const [transaction, setTransaction] = useState<PaymentTransactionDetail | null>(null)
  const [status, setStatus] = useState<PaymentStatus>('pending')
  const [expiresAt, setExpiresAt] = useState<string | null>(initialExpiry)
  const [now, setNow] = useState(() => Date.now())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const statusRef = useRef<PaymentStatus>('pending')
  const releaseStartedRef = useRef(false)
  const csrfHeadersRef = useRef<Record<string, string>>({})
  const releaseEffectGenerationRef = useRef(0)

  const secondsRemaining = useMemo(
    () => getSecondsUntilExpiry(expiresAt, now),
    [expiresAt, now],
  )
  const paymentAmount = transaction?.amount ?? readNumber(searchParams.get('paymentAmount'))
  const paymentOption = transaction?.paymentOption ?? searchParams.get('paymentOption') ?? 'deposit'
  const isTerminal = status !== 'pending'

  const markStatus = useCallback((nextStatus: PaymentStatus) => {
    statusRef.current = nextStatus
    setStatus(nextStatus)
  }, [])

  const goToPaymentResult = useCallback((detail: PaymentTransactionDetail) => {
    statusRef.current = 'success'
    releaseStartedRef.current = true
    clearPendingBooking()
    clearCheckoutSession()

    const resultParams = new URLSearchParams({
      paymentId: detail.paymentId,
      bookingId: detail.bookingCode,
      backendBookingId: String(detail.bookingId),
      method: detail.method,
      paymentOption: detail.paymentOption,
      amount: String(detail.amount),
      status: 'success',
    })
    router.replace(`/payment/return?${resultParams.toString()}`)
  }, [router])

  const releaseWithKeepalive = useCallback(() => {
    if (!paymentId || statusRef.current !== 'pending' || releaseStartedRef.current) return
    releaseStartedRef.current = true
    clearPendingBooking()
    clearCheckoutSession()
    void releasePaymentHoldKeepalive(paymentId, csrfHeadersRef.current).catch(() => undefined)
  }, [paymentId])

  useEffect(() => {
    let active = true

    async function loadPage() {
      if (!paymentId || !paymentUrl) {
        setError('Phiên thanh toán không đầy đủ. Vui lòng quay lại và tạo mã QR mới.')
        setIsLoading(false)
        return
      }

      try {
        const [loadedBooking, detail, csrfHeaders] = await Promise.all([
          getCheckoutBookingFromParams(new URLSearchParams(query)),
          getPaymentTransactionDetail(paymentId),
          getCsrfRequestHeaders().catch(() => ({})),
        ])
        if (!active) return

        setBooking(loadedBooking)
        setTransaction(detail)
        setExpiresAt(detail.expiresAt ?? initialExpiry)
        csrfHeadersRef.current = csrfHeaders
        if (loadedBooking) {
          setDiscount(getCheckoutSession(loadedBooking.bookingId)?.appliedCoupon ?? null)
        }

        if (detail.status === 'success') {
          goToPaymentResult(detail)
          return
        }
        markStatus(detail.status)
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Không thể tải phiên thanh toán.')
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void loadPage()
    return () => {
      active = false
    }
  }, [goToPaymentResult, initialExpiry, markStatus, paymentId, paymentUrl, query])

  useEffect(() => {
    if (!paymentId || status !== 'pending') return
    let active = true

    async function pollPayment() {
      try {
        const detail = await getPaymentTransactionDetail(paymentId)
        if (!active) return
        setTransaction(detail)
        setExpiresAt(detail.expiresAt ?? initialExpiry)

        if (detail.status === 'success') {
          goToPaymentResult(detail)
          return
        }
        if (detail.status !== 'pending') markStatus(detail.status)
      } catch {
        // A temporary polling error must not interrupt a valid five-minute payment window.
      }
    }

    const intervalId = window.setInterval(() => void pollPayment(), PAYMENT_POLL_INTERVAL_MS)
    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [goToPaymentResult, initialExpiry, markStatus, paymentId, status])

  useEffect(() => {
    if (status !== 'pending') return
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(intervalId)
  }, [status])

  useEffect(() => {
    if (status !== 'pending' || secondsRemaining === null || secondsRemaining > 0 || releaseStartedRef.current) return
    releaseStartedRef.current = true
    void releasePaymentHold(paymentId)
      .then(() => markStatus('expired'))
      .catch(() => markStatus('expired'))
  }, [markStatus, paymentId, secondsRemaining, status])

  useEffect(() => {
    const generation = ++releaseEffectGenerationRef.current
    const handlePageHide = () => releaseWithKeepalive()
    const handlePopState = () => releaseWithKeepalive()
    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const target = event.target instanceof Element ? event.target.closest('a[href]') : null
      if (!(target instanceof HTMLAnchorElement)) return
      if (target.target && target.target !== '_self') return

      const nextUrl = new URL(target.href, window.location.href)
      const currentUrl = new URL(window.location.href)
      const staysOnSamePaymentSession = nextUrl.origin === currentUrl.origin
        && nextUrl.pathname === currentUrl.pathname
        && nextUrl.search === currentUrl.search

      if (!staysOnSamePaymentSession && paymentId && statusRef.current === 'pending' && !releaseStartedRef.current) {
        event.preventDefault()
        releaseStartedRef.current = true
        clearPendingBooking()
        clearCheckoutSession()
        void releasePaymentHold(paymentId)
          .catch(() => undefined)
          .finally(() => {
            window.location.assign(nextUrl.toString())
          })
      }
    }

    document.addEventListener('click', handleDocumentClick, { capture: true })
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('popstate', handlePopState)

    return () => {
      document.removeEventListener('click', handleDocumentClick, { capture: true })
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('popstate', handlePopState)
      window.setTimeout(() => {
        // React Strict Mode immediately starts the next effect generation; real navigation does not.
        if (releaseEffectGenerationRef.current === generation) releaseWithKeepalive()
      }, 0)
    }
  }, [releaseWithKeepalive])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#F6F3ED] px-4 py-8">
        <div className="mx-auto h-[620px] max-w-6xl animate-pulse rounded-[30px] border border-[#E4DED3] bg-white/75" />
      </main>
    )
  }

  if (!booking || error && !paymentId) {
    return (
      <main className="min-h-screen bg-[#F6F3ED] px-4 py-10 text-[#242A27]">
        <section className="mx-auto max-w-2xl rounded-[28px] border border-[#E8C7CB] bg-white p-7 shadow-[0_20px_55px_rgba(45,42,36,.1)] sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#B28455]">Thanh toán The Serene Villa</p>
          <h1 className="mt-3 font-display text-3xl font-bold">Không thể mở phiên thanh toán</h1>
          <p className="mt-3 leading-7 text-[#6A6C66]">{error || 'Không tìm thấy thông tin booking.'}</p>
          <Link href={roomId ? `/rooms/${roomId}` : '/rooms'} className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-[#173F35] px-6 font-bold text-white">Chọn lại phòng</Link>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(197,154,104,.12),transparent_32%),#F6F3ED] px-4 py-6 text-[#242A27] sm:px-6 sm:py-9">
      <section className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#B28455]">Cổng thanh toán an toàn</p>
            <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Hoàn tất booking trong 5 phút</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6A6C66]">Giữ nguyên số tiền và nội dung chuyển khoản. Rời trang sẽ nhả phòng ngay.</p>
          </div>
          <div className="inline-flex w-fit items-center gap-3 rounded-full border border-[#DCC9B4] bg-white px-4 py-2 shadow-sm">
            <ClockIcon />
            <span className="text-xs font-semibold uppercase tracking-[.12em] text-[#756A5E]">Thời gian còn lại</span>
            <strong className={status === 'pending' ? 'text-[#173F35]' : 'text-[#A3293A]'}>
              {status === 'pending' ? formatCountdown(secondsRemaining ?? 0) : 'Đã kết thúc'}
            </strong>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[.82fr_1.18fr] lg:items-start">
          <div className="min-w-0 lg:sticky lg:top-24">
            <CheckoutBookingInfo booking={booking} />
          </div>

          <section className="overflow-hidden rounded-[30px] border border-[#DED7CB] bg-white shadow-[0_24px_65px_rgba(45,42,36,.1)]">
            <div className="border-b border-[#E8E1D7] bg-[#173F35] px-5 py-5 text-white sm:px-7 sm:py-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#E3C39D]">Booking {booking.bookingId}</p>
                  <h2 className="mt-2 font-display text-2xl font-bold">Quét mã để thanh toán</h2>
                  <p className="mt-1 text-sm text-white/70">Hệ thống tự xác nhận sau khi ngân hàng ghi nhận giao dịch.</p>
                </div>
                <StatusBadge status={status} />
              </div>
            </div>

            <div className="p-5 sm:p-7">
              <div className="grid gap-5 md:grid-cols-[260px_1fr] md:items-start">
                <div className="relative overflow-hidden rounded-[24px] border border-[#E4DED3] bg-[#FCFAF6] p-4 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={paymentUrl}
                    alt={`Mã QR thanh toán ${paymentId}`}
                    className={`aspect-square w-full object-contain ${isTerminal ? 'opacity-25 grayscale' : ''}`}
                  />
                  {isTerminal && (
                    <div className="absolute inset-0 flex items-center justify-center p-5 text-center">
                      <span className="rounded-full bg-white/95 px-4 py-2 text-sm font-bold text-[#A3293A] shadow-sm">Phiên đã kết thúc</span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="grid gap-2 text-sm">
                    <PaymentRow label="Số tiền cần trả" value={formatCurrency(paymentAmount)} emphasis />
                    <PaymentRow label="Nội dung chuyển khoản" value={paymentId} mono />
                    <PaymentRow label="Hình thức" value={paymentOption === 'deposit' ? 'Đặt cọc 50%' : 'Thanh toán toàn bộ'} />
                    {expiresAt && <PaymentRow label="Hiệu lực đến" value={formatPaymentDate(expiresAt)} />}
                  </div>

                  <div className="mt-4 rounded-2xl border border-[#D8E7E0] bg-[#F1F7F4] p-4 text-sm leading-6 text-[#52665E]">
                    <p className="font-bold text-[#173F35]">Lưu ý khi chuyển khoản</p>
                    <ul className="mt-2 space-y-1.5">
                      <li>• Chuyển đúng số tiền và nội dung hiển thị.</li>
                      <li>• Không đóng trang cho đến khi giao dịch được xác nhận.</li>
                      <li>• Không tạo thêm mã QR cho cùng booking.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[22px] border border-[#E8E1D7] bg-[#FCFAF6] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.15em] text-[#A97643]">Đối soát đơn hàng</p>
                    <h3 className="mt-1 font-display text-lg font-bold">Chi tiết giá trị booking</h3>
                  </div>
                  <ShieldIcon />
                </div>
                <div className="mt-4"><CheckoutSummary booking={booking} appliedDiscount={discount} /></div>
              </div>

              {error && (
                <div role="alert" className="mt-5 rounded-2xl border border-[#E8C7CB] bg-[#FCEEEF] px-4 py-3 text-sm leading-6 text-[#A3293A]">{error}</div>
              )}

              {status === 'pending' ? (
                <div className="mt-6">
                  <div className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#173F35] px-6 font-bold text-white">
                    <span className="h-2 w-2 rounded-full bg-[#8CE0BE]" />
                    Đang chờ ngân hàng xác nhận · {formatCountdown(secondsRemaining ?? 0)}
                  </div>
                </div>
              ) : (
                <Link href={roomId ? `/rooms/${roomId}` : '/rooms'} className="mt-6 flex min-h-14 items-center justify-center rounded-full bg-[#173F35] px-6 font-bold text-white">Chọn lại kỳ lưu trú</Link>
              )}

            </div>
          </section>
        </div>
      </section>
    </main>
  )
}

function PaymentRow({ label, value, emphasis = false, mono = false }: { label: string; value: string; emphasis?: boolean; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-[#ECE6DD] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-[#74776F]">{label}</span>
      <strong className={`${emphasis ? 'font-display text-xl text-[#B07A43]' : 'text-[#242A27]'} ${mono ? 'break-all font-mono text-xs' : ''}`}>{value}</strong>
    </div>
  )
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const content = status === 'pending'
    ? ['Đang giữ phòng', 'bg-white/10 text-white']
    : status === 'success'
      ? ['Đã thanh toán', 'bg-[#DDF0E7] text-[#17483B]']
      : ['Đã nhả phòng', 'bg-[#F8E2E5] text-[#9C2C3B]']
  return <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${content[1]}`}>{content[0]}</span>
}

function getSecondsUntilExpiry(expiresAt: string | null, now: number) {
  if (!expiresAt) return null
  const expiry = new Date(expiresAt).getTime()
  return Number.isNaN(expiry) ? null : Math.max(0, Math.ceil((expiry - now) / 1000))
}

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function formatPaymentDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(date)
}

function readNumber(value: string | null) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function ClockIcon() { return <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" strokeLinecap="round" /></svg> }
function ShieldIcon() { return <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3 5.5 5.8v5.3c0 4.2 2.7 7.7 6.5 9.3 3.8-1.6 6.5-5.1 6.5-9.3V5.8L12 3Z" /><path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg> }
