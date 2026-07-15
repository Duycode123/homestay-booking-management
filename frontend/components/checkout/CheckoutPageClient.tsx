'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import CheckoutBookingInfo from '@/components/checkout/CheckoutBookingInfo'
import CheckoutCouponInput from '@/components/checkout/CheckoutCouponInput'
import CheckoutPaymentMethods from '@/components/checkout/CheckoutPaymentMethods'
import CheckoutSummary from '@/components/checkout/CheckoutSummary'
import {
  calculateCheckoutSummary,
  formatCurrency,
  getCheckoutBookingFromParams,
  type CheckoutBooking,
} from '@/lib/checkout-data'
import {
  clearCheckoutSession,
  getCheckoutSession,
  saveCheckoutSession,
} from '@/lib/checkout-session'
import type { AppliedDiscount } from '@/lib/discount-service'
import {
  clearPendingBooking,
  getPendingBooking,
  pendingBookingToSearchParams,
  savePendingBooking,
} from '@/lib/pending-booking'
import {
  getQuickBookingRestoreHref,
  readQuickBookingDraft,
} from '@/components/booking/quick-booking-draft'
import {
  createPaymentSession,
  getPaymentTransactionDetail,
  type CreatePaymentSessionResponse,
  type PaymentOption,
} from '@/lib/payment-service'
import { createBooking, mapPaymentMethodToBackend } from '@/lib/booking/bookingApi'

const DEPOSIT_RATE = 0.5

export default function CheckoutPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const confirmationHref = `/rooms/confirmation?${searchParams.toString()}`
  const [booking, setBooking] = useState<CheckoutBooking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [paymentOption, setPaymentOption] = useState<PaymentOption>(getInitialPaymentOption(searchParams.get('paymentOption')))
  const [isPaying, setIsPaying] = useState(false)
  const [paymentSession, setPaymentSession] = useState<CreatePaymentSessionResponse | null>(null)
  const [isCheckingPayment, setIsCheckingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [now, setNow] = useState(() => Date.now())
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null)
  const [missingCheckoutReturnHref, setMissingCheckoutReturnHref] = useState('/')

  useEffect(() => {
    const draft = readQuickBookingDraft()

    setMissingCheckoutReturnHref(draft ? getQuickBookingRestoreHref(draft.sourceRoute) : '/')
  }, [])

  useEffect(() => {
    let mounted = true

    async function loadBooking() {
      setIsLoading(true)
      setError('')

      try {
        const checkoutParams = new URLSearchParams(searchParams.toString())

        if (!checkoutParams.get('bookingId')) {
          const pendingBooking = getPendingBooking()
          if (pendingBooking) {
            const pendingParams = pendingBookingToSearchParams(pendingBooking)
            pendingParams.forEach((value, key) => {
              checkoutParams.set(key, value)
            })
          }
        }

        const loadedBooking = await getCheckoutBookingFromParams(checkoutParams)
        if (!mounted) return

        if (!checkoutParams.get('bookingId')) {
          setError('Thiếu mã đặt phòng. Vui lòng quay lại bước xác nhận đặt phòng.')
          setBooking(null)
          return
        }

        if (!loadedBooking) {
          setError('Không tìm thấy thông tin checkout từ hệ thống.')
          setBooking(null)
          return
        }

        setBooking(loadedBooking)

        const savedSession = getCheckoutSession(loadedBooking.bookingId)
        if (savedSession?.appliedCoupon) {
          setAppliedDiscount(savedSession.appliedCoupon)
        } else {
          const discountFromParams = readDiscountFromParams(checkoutParams)
          const pendingBooking = getPendingBooking()
          const discountFromPending =
            pendingBooking?.bookingId === loadedBooking.bookingId &&
            pendingBooking.discountCode &&
            pendingBooking.discountAmount !== undefined
              ? {
                  code: pendingBooking.discountCode,
                  discountAmount: pendingBooking.discountAmount,
                }
              : null

          const restoredDiscount = discountFromParams ?? discountFromPending
          setAppliedDiscount(restoredDiscount)
          if (restoredDiscount) {
            saveCheckoutSession({
              bookingId: loadedBooking.bookingId,
              appliedCoupon: restoredDiscount,
            })
          }
        }

        setPaymentOption(getInitialPaymentOption(checkoutParams.get('paymentOption')))
      } catch {
        if (mounted) {
          setError('Không thể tải thông tin thanh toán. Vui lòng thử lại.')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void loadBooking()

    return () => {
      mounted = false
    }
  }, [searchParams])

  useEffect(() => {
    if (!paymentSession || paymentSession.status !== 'pending') {
      return
    }

    const activePaymentSession = paymentSession
    let cancelled = false

    async function checkPayment() {
      setIsCheckingPayment(true)
      try {
        const transaction = await getPaymentTransactionDetail(activePaymentSession.paymentId)
        if (cancelled) return

        if (transaction.status === 'success') {
          clearPendingBooking()
          clearCheckoutSession()
          const params = new URLSearchParams({
            paymentId: transaction.paymentId,
            bookingId: transaction.bookingCode,
            backendBookingId: String(transaction.bookingId),
            method: transaction.method,
            paymentOption: transaction.paymentOption,
            amount: String(transaction.amount),
            status: 'success',
          })
          router.push(`/payment/return?${params.toString()}`)
          return
        }

        if (transaction.status === 'failed' || transaction.status === 'cancelled') {
          setPaymentSession((current) =>
            current?.paymentId === transaction.paymentId
              ? { ...current, status: transaction.status }
              : current,
          )
          if (transaction.status === 'cancelled') {
            setPaymentError(
              'Phiên thanh toán đã hết hạn hoặc bị hủy. Nếu bạn đã chuyển khoản sau thời hạn, vui lòng liên hệ hỗ trợ để đối soát và hoàn tiền; không chuyển thêm lần nữa.',
            )
            return
          }
          setPaymentError(
            String(transaction.status) === 'cancelled'
              ? 'Phiên thanh toán đã hết hạn hoặc đã bị hủy. Vui lòng tạo lại giao dịch.'
              : 'Giao dịch thanh toán thất bại. Vui lòng tạo lại giao dịch.',
          )
        }
      } catch (pollError) {
        if (!cancelled) {
          setPaymentError(
            pollError instanceof Error
              ? pollError.message
              : 'Không thể kiểm tra trạng thái thanh toán. Hệ thống sẽ thử lại sau.',
          )
        }
      } finally {
        if (!cancelled) {
          setIsCheckingPayment(false)
        }
      }
    }

    void checkPayment()
    const intervalId = window.setInterval(() => {
      void checkPayment()
    }, 10000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [paymentSession, router])

  useEffect(() => {
    if (!paymentSession?.expiresAt || paymentSession.status !== 'pending') {
      return
    }

    setNow(Date.now())
    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [paymentSession?.expiresAt, paymentSession?.status])

  const summary = useMemo(
    () => (booking ? calculateCheckoutSummary(booking, appliedDiscount) : null),
    [appliedDiscount, booking],
  )
  const amountToPayNow = useMemo(() => {
    if (!summary) return 0
    return paymentOption === 'deposit' ? Math.round(summary.total * DEPOSIT_RATE) : summary.total
  }, [paymentOption, summary])
  const remainingAmount = summary ? Math.max(0, summary.total - amountToPayNow) : 0
  const secondsUntilExpiry = useMemo(
    () => getSecondsUntilExpiry(paymentSession?.expiresAt, now),
    [now, paymentSession?.expiresAt],
  )

  const handleApplyCoupon = (discount: AppliedDiscount) => {
    if (!booking) return

    setAppliedDiscount(discount)
    saveCheckoutSession({
      bookingId: booking.bookingId,
      appliedCoupon: discount,
    })

    const pendingBooking = getPendingBooking()
    if (pendingBooking?.bookingId === booking.bookingId) {
      savePendingBooking({
        ...pendingBooking,
        discountCode: discount.code,
        discountAmount: discount.discountAmount,
      })
    }
  }

  const handleRemoveCoupon = () => {
    if (!booking) return

    setAppliedDiscount(null)
    clearCheckoutSession()

    const pendingBooking = getPendingBooking()
    if (pendingBooking?.bookingId === booking.bookingId) {
      savePendingBooking({
        ...pendingBooking,
        discountCode: undefined,
        discountAmount: undefined,
      })
    }
  }

  const handlePay = async () => {
    if (!booking || !summary) {
      setPaymentError('Không tìm thấy thông tin đặt phòng để thanh toán.')
      return
    }

    setIsPaying(true)
    setPaymentError('')
    setPaymentSession(null)

    try {
      let payableBooking = booking

      if (!payableBooking.backendBookingId) {
        const draft = getPendingBooking()
        if (!draft || draft.bookingId !== payableBooking.bookingId) {
          throw new Error('Không tìm thấy thông tin đơn tạm thời. Vui lòng quay lại chọn phòng.')
        }

        const createdBooking = await createBooking({
          roomId: payableBooking.roomId,
          date: payableBooking.date,
          endDate: payableBooking.endDate,
          startTime: payableBooking.startTime,
          endTime: payableBooking.endTime,
          paymentMethod: mapPaymentMethodToBackend('bank_transfer'),
          couponCode: appliedDiscount?.code,
          note: payableBooking.note,
        })

        payableBooking = {
          ...payableBooking,
          bookingId: createdBooking.bookingCode || String(createdBooking.bookingId),
          backendBookingId: createdBooking.bookingId,
          status: createdBooking.status,
        }
        setBooking(payableBooking)
        savePendingBooking({
          ...draft,
          bookingId: payableBooking.bookingId,
          discountCode: appliedDiscount?.code,
          discountAmount: appliedDiscount?.discountAmount,
        })
        replaceCheckoutBookingParams(payableBooking, searchParams)
      }

      const backendBookingId = payableBooking.backendBookingId
      if (!backendBookingId) {
        throw new Error('Không thể xác định booking vừa tạo. Vui lòng thử lại.')
      }

      const session = await createPaymentSession({
        bookingId: backendBookingId,
        method: 'bank_transfer',
        paymentOption,
        couponCode: appliedDiscount?.code,
      })

      if (session.status === 'success') {
        clearPendingBooking()
        const params = new URLSearchParams({
          paymentId: session.paymentId,
          bookingId: session.bookingCode,
          backendBookingId: String(session.bookingId),
          method: session.method,
          paymentOption: session.paymentOption,
          amount: String(session.amount),
          status: 'success',
        })
        router.push(`/payment/return?${params.toString()}`)
        return
      }

      setPaymentSession(session)
    } catch (paymentSessionError) {
      setPaymentError(
        paymentSessionError instanceof Error
          ? paymentSessionError.message
          : 'Không thể tạo giao dịch. Vui lòng thử lại.',
      )
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(197,154,104,0.12),transparent_34%),#F6F3ED] text-[#242A27]">
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-9 lg:px-8">
        <div className="mb-7">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-[#74776F]">
            <Link href="/" className="transition hover:text-[#173F35]">Trang chủ</Link>
            <span aria-hidden>/</span>
            <Link href={confirmationHref} className="transition hover:text-[#173F35]">Xác nhận đặt phòng</Link>
            <span aria-hidden>/</span>
            <span className="font-semibold text-[#173F35]">Thanh toán</span>
          </div>

          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B28455]">Bước cuối cùng</p>
              <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">Hoàn tất thanh toán</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#686D68] sm:text-base">
                Chọn trả toàn bộ hoặc đặt cọc 50%. Phòng chỉ bắt đầu được giữ trong 5 phút khi bạn bấm tạo mã QR.
              </p>
            </div>
            <CheckoutProgress />
          </div>
        </div>

        {isLoading && (
          <div className="grid animate-pulse gap-6 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="h-[420px] rounded-[28px] border border-[#E4DED3] bg-white/70" />
            <div className="h-[520px] rounded-[28px] border border-[#E4DED3] bg-white/70" />
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-[28px] border border-[#E8C7CB] bg-white p-7 shadow-[0_18px_48px_rgba(55,45,40,0.08)] sm:p-9">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FCEAEC] text-[#B52D40]"><AlertIcon /></div>
            <h2 className="mt-5 font-display text-2xl font-bold text-[#8F2433]">Chưa thể mở trang thanh toán</h2>
            <p className="mt-2 max-w-2xl leading-6 text-[#6A6C66]">{error}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href={missingCheckoutReturnHref} className="inline-flex min-h-[50px] items-center justify-center rounded-2xl bg-[#173F35] px-6 font-display font-bold text-white transition hover:bg-[#0F322A]">Quay lại đặt phòng</Link>
              <Link href="/customer/bookings" className="inline-flex min-h-[50px] items-center justify-center rounded-2xl border border-[#D9D1C5] bg-white px-6 font-display font-bold transition hover:bg-[#FBF9F5]">Xem lịch sử booking</Link>
            </div>
          </div>
        )}

        {!isLoading && booking && summary && (
          <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div className="min-w-0 lg:sticky lg:top-24">
              <CheckoutBookingInfo booking={booking} />
            </div>

            <aside className="overflow-hidden rounded-[28px] border border-[#DED7CB] bg-white shadow-[0_22px_60px_rgba(45,42,36,0.09)]">
              <div className="border-b border-[#E9E3D9] bg-gradient-to-r from-[#F9F5EE] to-white px-5 py-5 sm:px-7 sm:py-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B28455]">Thanh toán bảo mật</p>
                    <h2 className="mt-2 font-display text-2xl font-bold">Chọn khoản thanh toán</h2>
                    <p className="mt-1 text-sm text-[#6A6C66]">
                      {booking.backendBookingId ? `Booking ${booking.bookingId}` : 'Đơn tạm thời · chưa khóa phòng'}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#EAF4EF] px-3 py-2 text-xs font-bold text-[#205746]">
                    <ShieldCheckIcon /> {getHoldStatusLabel(booking, paymentSession, secondsUntilExpiry)}
                  </span>
                </div>
              </div>

              <div className="p-5 sm:p-7">
                <CheckoutPaymentMethods
                  bookingId={booking.bookingId}
                  paymentOption={paymentOption}
                  total={summary.total}
                  onChange={(option) => {
                    setPaymentOption(option)
                    setPaymentSession(null)
                    setPaymentError('')
                  }}
                />

                <details className="group mt-5 rounded-2xl border border-[#E7E0D5] bg-[#FCFAF6]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold text-[#4F554F]">
                    <span className="inline-flex items-center gap-2"><TicketIcon /> Bạn có mã giảm giá?</span>
                    <ChevronDownIcon />
                  </summary>
                  <div className="border-t border-[#E7E0D5] p-3">
                    <CheckoutCouponInput
                      bookingId={booking.bookingId}
                      subtotal={summary.subtotal}
                      appliedDiscount={appliedDiscount}
                      onApplied={handleApplyCoupon}
                      onRemoved={handleRemoveCoupon}
                      disabled={isPaying}
                    />
                  </div>
                </details>

                <section className="mt-5 rounded-[22px] border border-[#E4DED3] bg-[#FCFAF6] p-4 sm:p-5" aria-labelledby="checkout-summary-title">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A97643]">Chi tiết thanh toán</p>
                      <h3 id="checkout-summary-title" className="mt-1 font-display text-lg font-bold">Tóm tắt booking</h3>
                    </div>
                    <span className="text-xs font-semibold text-[#74776F]">{booking.bookingId}</span>
                  </div>

                  <div className="mt-4">
                    <CheckoutSummary booking={booking} appliedDiscount={appliedDiscount} />
                  </div>

                  <div className="mt-4 rounded-[18px] border border-[#DCE8E2] bg-[#F1F7F4] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#587068]">Thanh toán hôm nay</p>
                      <span className="mt-1 block font-display text-3xl font-bold text-[#173F35]">
                        {formatCurrency(amountToPayNow)}
                      </span>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#587068] shadow-sm">
                      {paymentOption === 'deposit' ? 'Cọc 50%' : 'Thanh toán đủ'}
                    </span>
                  </div>
                  {paymentOption === 'deposit' && (
                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#D7E5DE] pt-3 text-sm text-[#587068]">
                      <span>Còn lại khi checkout</span>
                      <span className="font-display font-bold text-[#173F35]">{formatCurrency(remainingAmount)}</span>
                    </div>
                  )}
                  </div>
                </section>

              {paymentSession && paymentSession.paymentUrl && (
                <div className="mt-5 rounded-[24px] border border-[#DCC9B4] bg-[#FBF7F1] p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-bold text-[#242A27]">Quét mã để thanh toán</p>
                      <p className="mt-1 text-sm leading-6 text-[#6A6C66]">Mở ứng dụng ngân hàng và quét mã QR bên dưới.</p>
                    </div>
                    <span className="rounded-full bg-[#FFF3DD] px-3 py-1.5 text-xs font-bold text-[#98611C]">
                      {secondsUntilExpiry !== null && secondsUntilExpiry > 0 ? formatCountdown(secondsUntilExpiry) : 'Đang chờ'}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-[220px_1fr] sm:items-center">
                    <div className="overflow-hidden rounded-[20px] border border-[#E4DED3] bg-white p-3 shadow-sm">
                      <img src={paymentSession.paymentUrl} alt={`Mã QR thanh toán ${paymentSession.paymentId}`} className="mx-auto aspect-square w-full object-contain" />
                    </div>
                    <div className="grid gap-2 text-sm">
                      <PaymentSessionRow label="Số tiền" value={formatCurrency(paymentSession.amount)} />
                      <PaymentSessionRow label="Nội dung" value={paymentSession.paymentId} />
                      {paymentSession.expiresAt && <PaymentSessionRow label="Hiệu lực đến" value={formatPaymentDate(paymentSession.expiresAt)} />}
                      <p className="mt-1 rounded-xl bg-white px-3 py-2.5 text-xs leading-5 text-[#6A6C66]">
                        Vui lòng giữ nguyên số tiền và nội dung. Trang sẽ tự chuyển khi giao dịch được xác nhận.
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#587068]">
                    {isCheckingPayment && <span className="h-2 w-2 animate-pulse rounded-full bg-[#2D7B60]" />}
                    {isCheckingPayment ? 'Đang chờ xác nhận giao dịch...' : 'Hệ thống tự động kiểm tra trạng thái thanh toán.'}
                  </p>
                </div>
              )}

              {paymentError && (
                <div role="alert" className="mt-5 flex items-start gap-3 rounded-2xl border border-[#E8C7CB] bg-[#FCEEEF] px-4 py-3.5 text-sm leading-6 text-[#A3293A]">
                  <AlertIcon />
                  <span>{paymentError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handlePay}
                disabled={isPaying}
                className="mt-5 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full border border-[#173A31] bg-[#173A31] px-6 font-display text-base font-bold text-white shadow-[0_14px_30px_rgba(23,58,49,.24)] transition hover:-translate-y-0.5 hover:border-[#245545] hover:bg-[#245545] hover:shadow-[0_18px_36px_rgba(23,58,49,.3)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPaying
                  ? 'Đang xử lý...'
                  : paymentSession?.status === 'pending'
                    ? 'Tạo lại mã QR'
                    : <>Tạo mã QR · {formatCurrency(amountToPayNow)} <ArrowRightIcon /></>}
              </button>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[#74776F]">
                  <span className="inline-flex items-center gap-1.5"><ShieldCheckIcon /> Thanh toán an toàn</span>
                  <span className="inline-flex items-center gap-1.5"><ClockSmallIcon /> Tự động xác nhận</span>
                </div>
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  )
}

function CheckoutProgress() {
  const steps = [
    { number: '1', label: 'Thông tin', complete: true },
    { number: '2', label: 'Thanh toán', active: true },
    { number: '3', label: 'Hoàn tất' },
  ]

  return (
    <ol className="flex w-full max-w-md items-center rounded-2xl border border-[#E1DACF] bg-white/75 px-3 py-3 shadow-sm backdrop-blur-sm lg:w-auto lg:min-w-[380px]">
      {steps.map((step, index) => (
        <li key={step.number} className="flex min-w-0 flex-1 items-center">
          <span className={[
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
            step.complete ? 'bg-[#DDECE5] text-[#17483B]' : step.active ? 'bg-[#B88752] text-white' : 'bg-[#EEEAE3] text-[#888A84]',
          ].join(' ')}>
            {step.complete ? '✓' : step.number}
          </span>
          <span className={['ml-2 hidden text-xs font-bold sm:inline', step.active ? 'text-[#202723]' : 'text-[#74776F]'].join(' ')}>{step.label}</span>
          {index < steps.length - 1 && <span aria-hidden className="mx-2 h-px min-w-3 flex-1 bg-[#DED7CB]" />}
        </li>
      ))}
    </ol>
  )
}

function getHoldStatusLabel(
  booking: CheckoutBooking,
  paymentSession: CreatePaymentSessionResponse | null,
  secondsUntilExpiry: number | null,
) {
  if (paymentSession?.status === 'cancelled' || paymentSession?.status === 'failed') {
    return 'Đã giải phóng phòng'
  }
  if (paymentSession?.status === 'pending' && secondsUntilExpiry !== null) {
    return secondsUntilExpiry > 0 ? `Giữ chỗ còn ${formatCountdown(secondsUntilExpiry)}` : 'Đang giải phóng phòng'
  }
  if (booking.backendBookingId) {
    return 'Đang tạo phiên giữ chỗ'
  }
  return 'Chưa giữ chỗ'
}

function AlertIcon() {
  return <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5M12 16.5h.01" strokeLinecap="round" /></svg>
}

function ShieldCheckIcon() {
  return <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M12 3 5.5 5.8v5.3c0 4.2 2.7 7.7 6.5 9.3 3.8-1.6 6.5-5.1 6.5-9.3V5.8L12 3Z" /><path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function TicketIcon() {
  return <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5v2a2.5 2.5 0 0 0 0 5v2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5v-2a2.5 2.5 0 0 0 0-5v-2Z" /><path d="M12 8.5v7" strokeDasharray="2 2" /></svg>
}

function ChevronDownIcon() {
  return <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 transition group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2"><path d="m7 9.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function ClockSmallIcon() {
  return <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" strokeLinecap="round" /></svg>
}

function ArrowRightIcon() {
  return <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-5-5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function PaymentSessionRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl bg-white px-3 py-2">
      <span className="text-[#6A6C66]">{label}</span>
      <span className="text-right font-display font-bold text-[#242A27]">{value}</span>
    </div>
  )
}

function formatPaymentDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function getSecondsUntilExpiry(expiresAt: string | null | undefined, now: number) {
  if (!expiresAt) {
    return null
  }

  const expiryTime = new Date(expiresAt).getTime()
  if (Number.isNaN(expiryTime)) {
    return null
  }

  return Math.max(0, Math.ceil((expiryTime - now) / 1000))
}

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function getInitialPaymentOption(value: string | null): PaymentOption {
  return value === 'full' ? 'full' : 'deposit'
}

function readDiscountFromParams(searchParams: URLSearchParams): AppliedDiscount | null {
  const code = searchParams.get('discountCode')?.trim().toUpperCase()
  const rawAmount = searchParams.get('discountAmount')
  const discountAmount = rawAmount ? Number(rawAmount) : NaN

  if (!code || !Number.isFinite(discountAmount) || discountAmount <= 0) {
    return null
  }

  return { code, discountAmount }
}

function replaceCheckoutBookingParams(
  booking: Pick<CheckoutBooking, 'bookingId' | 'backendBookingId' | 'roomId'>,
  currentSearchParams: { toString(): string },
) {
  if (typeof window === 'undefined' || !booking.backendBookingId) return

  const params = new URLSearchParams(currentSearchParams.toString())
  params.set('bookingId', booking.bookingId)
  params.set('backendBookingId', String(booking.backendBookingId))
  params.set('roomId', booking.roomId)
  window.history.replaceState(window.history.state, '', `/customer/checkout?${params.toString()}`)
}
