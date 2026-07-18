'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  formatCurrency,
  getPaymentMethodLabel,
  normalizePaymentStatus,
} from '@/lib/checkout-data'
import { clearPendingBooking } from '@/lib/pending-booking'
import { getPaymentTransactionDetail, type PaymentStatus } from '@/lib/payment-service'

type DisplayStatus = PaymentStatus | 'unknown'

export default function PaymentReturnStatus() {
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('paymentId')
  const bookingId = searchParams.get('bookingId')
  const backendBookingId = searchParams.get('backendBookingId')
  const returnStatus = normalizePaymentStatus(searchParams.get('status'))
  const method = searchParams.get('method')
  const returnAmount = Number(searchParams.get('amount') || 0)
  const paymentOption = searchParams.get('paymentOption') === 'full' ? 'full' : 'deposit'
  const [verifiedStatus, setVerifiedStatus] = useState<PaymentStatus | null>(null)
  const [verifiedAmount, setVerifiedAmount] = useState<number | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState('')

  const displayStatus: DisplayStatus = verifiedStatus ?? (returnStatus === 'unknown' ? 'unknown' : returnStatus)
  const displayAmount = verifiedAmount ?? returnAmount
  const missingBooking = !bookingId
  const presentation = useMemo(
    () => getStatusPresentation(displayStatus, paymentOption, missingBooking),
    [displayStatus, missingBooking, paymentOption],
  )
  const retryHref = buildRetryHref({
    bookingId,
    backendBookingId,
    method,
    paymentOption,
  })

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
          setVerificationMessage('Chưa thể kiểm tra lại giao dịch. Bạn có thể xem trạng thái mới nhất trong lịch sử đặt phòng.')
          return
        }

        await new Promise((resolve) => window.setTimeout(resolve, 1500))
      }

      if (!cancelled) {
        setVerifiedStatus('pending')
        setVerificationMessage('Giao dịch đang được đối soát. Trạng thái sẽ tự động cập nhật khi ngân hàng xác nhận.')
      }
    }

    void verifyPayment().finally(() => {
      if (!cancelled) setIsVerifying(false)
    })

    return () => {
      cancelled = true
    }
  }, [paymentId, returnStatus])

  useEffect(() => {
    if (displayStatus === 'success') clearPendingBooking()
  }, [displayStatus])

  const primaryHref = displayStatus === 'failed' || displayStatus === 'cancelled' ? retryHref : '/customer/bookings'
  const primaryLabel = displayStatus === 'failed' || displayStatus === 'cancelled'
    ? 'Thử thanh toán lại'
    : 'Xem lịch đặt phòng'

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F4F0E8] px-4 py-5 text-[#202723] sm:px-6 sm:py-8 lg:px-8">
      <div aria-hidden className="pointer-events-none absolute -left-28 top-24 h-80 w-80 rounded-full bg-[#C59A68]/12 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#17483B]/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-4 py-2">
          <Link href="/" className="inline-flex items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B98A55]/40">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#153F34] text-white shadow-[0_10px_24px_rgba(21,63,52,0.18)]">
              <HomeIcon />
            </span>
            <span>
              <span className="block font-display text-lg font-bold leading-tight text-[#153F34]">The Serene Villa</span>
              <span className="block text-[9px] font-semibold uppercase tracking-[0.22em] text-[#7A7B74]">Stay in serenity</span>
            </span>
          </Link>
          <span className="hidden rounded-full border border-[#DED6C8] bg-white/70 px-4 py-2 text-xs font-semibold text-[#656A65] sm:inline-flex">
            Kết quả giao dịch
          </span>
        </header>

        <section className="serene-lightbox-panel my-6 overflow-hidden rounded-[32px] border border-white/80 bg-white shadow-[0_28px_80px_rgba(42,45,39,0.12)] lg:my-10">
          <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
            <div className={["relative flex min-h-[480px] flex-col justify-between overflow-hidden p-7 sm:p-10 lg:p-12", presentation.panelClass].join(' ')}>
              <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full border border-white/20" />
              <div aria-hidden className="absolute -right-5 top-4 h-36 w-36 rounded-full border border-white/15" />

              <div className="relative">
                <div className={["flex h-20 w-20 items-center justify-center rounded-[26px] shadow-sm", presentation.iconClass].join(' ')}>
                  <StatusIcon status={missingBooking ? 'unknown' : displayStatus} />
                </div>

                <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-current/65">
                  {presentation.eyebrow}
                </p>
                <h1 className="mt-3 max-w-xl font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
                  {presentation.title}
                </h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-current/75 sm:text-lg">
                  {presentation.message}
                </p>

                {(isVerifying || verificationMessage) && (
                  <div className="mt-6 flex items-start gap-3 rounded-2xl border border-current/10 bg-white/55 px-4 py-3 text-sm leading-6 backdrop-blur-sm">
                    {isVerifying ? <SpinnerIcon /> : <InfoIcon />}
                    <span>{isVerifying ? 'Đang xác nhận giao dịch với hệ thống...' : verificationMessage}</span>
                  </div>
                )}
              </div>

              <div className="relative mt-10 flex flex-col gap-3 sm:flex-row">
                {!missingBooking && (
                  <Link
                    href={primaryHref}
                    className="inline-flex min-h-13 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#183F35] px-6 py-3.5 font-display font-bold text-white shadow-[0_14px_28px_rgba(24,63,53,0.22)] transition hover:-translate-y-0.5 hover:bg-[#0F322A]"
                  >
                    {primaryLabel}
                    <ArrowRightIcon />
                  </Link>
                )}
                <Link
                  href={missingBooking ? '/rooms' : '/'}
                  className="inline-flex min-h-13 flex-1 items-center justify-center rounded-2xl border border-current/15 bg-white/65 px-6 py-3.5 font-display font-bold text-current transition hover:bg-white"
                >
                  {missingBooking ? 'Chọn phòng khác' : 'Về trang chủ'}
                </Link>
              </div>
            </div>

            <aside className="flex flex-col justify-center bg-white p-7 sm:p-10 lg:p-12" aria-label="Chi tiết giao dịch">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A87947]">Biên nhận thanh toán</p>
                  <h2 className="mt-2 font-display text-2xl font-bold text-[#202723]">Chi tiết giao dịch</h2>
                </div>
                <span className={["rounded-full px-3 py-1.5 text-xs font-bold", presentation.badgeClass].join(' ')}>
                  {presentation.badgeLabel}
                </span>
              </div>

              <div className="mt-8 overflow-hidden rounded-[24px] border border-[#E7E0D5] bg-[#FCFAF6]">
                <ReceiptRow label="Mã đặt phòng" value={bookingId || 'Chưa có'} emphasis />
                <ReceiptRow label="Số tiền ghi nhận" value={displayAmount > 0 ? formatCurrency(displayAmount) : 'Chưa xác định'} emphasis />
                <ReceiptRow label="Hình thức" value={paymentOption === 'full' ? 'Thanh toán toàn bộ' : 'Đặt cọc 50%'} />
                <ReceiptRow label="Phương thức" value={getPaymentMethodLabel(method)} />
                {paymentId && <ReceiptRow label="Mã giao dịch" value={paymentId} copyable />}
              </div>

              <div className="mt-6 rounded-[22px] border border-[#DCE8E2] bg-[#F1F7F4] p-5">
                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#DDECE5] text-[#17483B]">
                    <ShieldIcon />
                  </span>
                  <div>
                    <p className="font-display text-sm font-bold text-[#17483B]">Thông tin của bạn được bảo vệ</p>
                    <p className="mt-1 text-sm leading-6 text-[#587068]">
                      Trạng thái thanh toán được lưu cùng booking. Bạn luôn có thể kiểm tra lại trong lịch sử đặt phòng.
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-6 text-center text-xs leading-5 text-[#7A7B74]">
                Cần hỗ trợ? <Link href="/support" className="font-bold text-[#A87947] hover:underline">Liên hệ The Serene Villa</Link>
              </p>
            </aside>
          </div>
        </section>
      </div>
    </main>
  )
}

function getStatusPresentation(status: DisplayStatus, paymentOption: 'full' | 'deposit', missingBooking: boolean) {
  if (missingBooking) {
    return {
      eyebrow: 'Không thể hiển thị giao dịch',
      title: 'Thiếu mã đặt phòng',
      message: 'Đường dẫn kết quả chưa có đủ thông tin. Vui lòng quay lại danh sách phòng và thực hiện lại thao tác.',
      badgeLabel: 'Thiếu thông tin',
      panelClass: 'bg-[#EEE9DF] text-[#343A36]',
      iconClass: 'bg-white text-[#6C706C]',
      badgeClass: 'bg-[#EEE9DF] text-[#626862]',
    }
  }

  if (status === 'success') {
    const isDeposit = paymentOption === 'deposit'
    return {
      eyebrow: isDeposit ? 'Booking đã được giữ chỗ' : 'Giao dịch hoàn tất',
      title: isDeposit ? 'Đặt cọc thành công' : 'Thanh toán thành công',
      message: isDeposit
        ? 'Chúng tôi đã ghi nhận khoản cọc 50%. Phần còn lại sẽ được nhân viên xác nhận và kết toán khi bạn checkout.'
        : 'Toàn bộ tiền phòng đã được ghi nhận. Bạn chỉ cần mang theo mã đặt phòng khi đến nhận phòng.',
      badgeLabel: isDeposit ? 'Đã đặt cọc' : 'Đã thanh toán',
      panelClass: 'bg-[#EAF3EE] text-[#173D33]',
      iconClass: 'bg-[#173D33] text-white',
      badgeClass: 'bg-[#E3F1E9] text-[#176044]',
    }
  }

  if (status === 'failed') {
    return {
      eyebrow: 'Booking chưa bị mất',
      title: 'Thanh toán chưa thành công',
      message: 'Giao dịch chưa được ghi nhận. Bạn có thể thử lại ngay; hệ thống sẽ tạo một mã thanh toán mới và giữ nguyên thông tin đặt phòng.',
      badgeLabel: 'Chưa thanh toán',
      panelClass: 'bg-[#FBECEE] text-[#7D2934]',
      iconClass: 'bg-[#B83A4B] text-white',
      badgeClass: 'bg-[#FCE9EC] text-[#B2293F]',
    }
  }

  if (status === 'pending') {
    return {
      eyebrow: 'Đang chờ ngân hàng xác nhận',
      title: 'Giao dịch đang xử lý',
      message: 'Bạn chưa cần thanh toán lại. Hệ thống đang đối soát và sẽ cập nhật trạng thái booking ngay khi nhận được xác nhận.',
      badgeLabel: 'Đang xử lý',
      panelClass: 'bg-[#FBF1DD] text-[#704817]',
      iconClass: 'bg-[#B57A2A] text-white',
      badgeClass: 'bg-[#FFF2D8] text-[#9A6218]',
    }
  }

  if (status === 'cancelled') {
    return {
      eyebrow: 'Phiên giao dịch đã đóng',
      title: 'Thanh toán đã được hủy',
      message: 'Không có khoản tiền nào được ghi nhận cho phiên này. Bạn có thể tạo lại giao dịch mới từ booking hiện tại.',
      badgeLabel: 'Đã hủy',
      panelClass: 'bg-[#F1ECE4] text-[#5D4932]',
      iconClass: 'bg-[#7E674C] text-white',
      badgeClass: 'bg-[#F1EBE2] text-[#70583E]',
    }
  }

  return {
    eyebrow: 'Cần kiểm tra lại',
    title: 'Chưa xác định được trạng thái',
    message: 'Thông tin trả về chưa đầy đủ. Vui lòng mở lịch sử đặt phòng hoặc liên hệ hỗ trợ để được kiểm tra giao dịch.',
    badgeLabel: 'Chưa xác định',
    panelClass: 'bg-[#EEE9DF] text-[#343A36]',
    iconClass: 'bg-white text-[#6C706C]',
    badgeClass: 'bg-[#EEE9DF] text-[#626862]',
  }
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
  if (!bookingId) return '/rooms'

  const params = new URLSearchParams({ bookingId })
  if (backendBookingId) params.set('backendBookingId', backendBookingId)
  if (method) params.set('method', method)
  if (paymentOption) params.set('paymentOption', paymentOption)
  return `/customer/checkout?${params.toString()}`
}

function ReceiptRow({ label, value, emphasis = false, copyable = false }: { label: string; value: string; emphasis?: boolean; copyable?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-[#E7E0D5] px-5 py-4 last:border-b-0">
      <span className="text-sm text-[#73766F]">{label}</span>
      <span className={["break-all text-right text-sm font-semibold text-[#262D29]", emphasis ? 'font-display text-base font-bold' : '', copyable ? 'select-all' : ''].join(' ')}>
        {value}
      </span>
    </div>
  )
}

function StatusIcon({ status }: { status: DisplayStatus }) {
  if (status === 'success') return <CheckIcon />
  if (status === 'pending') return <ClockIcon />
  if (status === 'failed' || status === 'cancelled') return <CloseIcon />
  return <InfoIcon />
}

function CheckIcon() {
  return <svg aria-hidden viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m5 12.5 4.2 4.2L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function CloseIcon() {
  return <svg aria-hidden viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M7 7l10 10M17 7 7 17" strokeLinecap="round" /></svg>
}

function ClockIcon() {
  return <svg aria-hidden viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8" /><path d="M12 8v4l2.8 1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function InfoIcon() {
  return <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" strokeLinecap="round" /></svg>
}

function SpinnerIcon() {
  return <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 shrink-0 animate-spin" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12a8 8 0 1 1-2.34-5.66" strokeLinecap="round" /></svg>
}

function ShieldIcon() {
  return <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3 5.5 5.8v5.3c0 4.2 2.7 7.7 6.5 9.3 3.8-1.6 6.5-5.1 6.5-9.3V5.8L12 3Z" /><path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function HomeIcon() {
  return <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m4 10 8-6 8 6v9H4v-9Z" strokeLinejoin="round" /><path d="M9.5 19v-6h5v6" /></svg>
}

function ArrowRightIcon() {
  return <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-5-5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
