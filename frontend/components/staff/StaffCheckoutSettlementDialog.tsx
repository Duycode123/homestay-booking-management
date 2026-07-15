'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { AdminBooking } from '@/lib/admin/types'
import { settleAdminBookingAtCheckout } from '@/lib/admin/adminBookingApi'
import {
  createCheckoutBalancePaymentSession,
  getPaymentTransactionDetail,
  type CreatePaymentSessionResponse,
} from '@/lib/payment-service'

type SettlementMethod = 'CASH' | 'BANK_TRANSFER'

type StaffCheckoutSettlementDialogProps = {
  booking: AdminBooking
  onClose: () => void
  onCompleted: (message: string) => Promise<void> | void
}

export default function StaffCheckoutSettlementDialog({
  booking,
  onClose,
  onCompleted,
}: StaffCheckoutSettlementDialogProps) {
  const [method, setMethod] = useState<SettlementMethod>('CASH')
  const [cashConfirmed, setCashConfirmed] = useState(false)
  const [session, setSession] = useState<CreatePaymentSessionResponse | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const completedRef = useRef(false)

  const complete = useCallback(async (message: string) => {
    if (completedRef.current) return
    completedRef.current = true
    await onCompleted(message)
  }, [onCompleted])

  const checkPayment = useCallback(async () => {
    if (!session || completedRef.current) return
    setIsChecking(true)
    try {
      const transaction = await getPaymentTransactionDetail(session.paymentId)
      if (transaction.status === 'success') {
        await complete(`Đã nhận chuyển khoản ${formatCurrency(transaction.amount)} và hoàn tất checkout ${booking.bookingCode}.`)
      } else if (transaction.status === 'failed' || transaction.status === 'cancelled') {
        setError('Phiên chuyển khoản đã hết hạn hoặc không còn hiệu lực. Vui lòng tạo mã QR mới.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể kiểm tra giao dịch.')
    } finally {
      setIsChecking(false)
    }
  }, [booking.bookingCode, complete, session])

  useEffect(() => {
    if (!session || session.status !== 'pending') return
    const timer = window.setInterval(() => void checkPayment(), 3000)
    return () => window.clearInterval(timer)
  }, [checkPayment, session])

  useEffect(() => {
    if (!session?.expiresAt) {
      setSecondsLeft(0)
      return
    }
    const update = () => {
      const remaining = Math.max(0, Math.ceil((new Date(session.expiresAt!).getTime() - Date.now()) / 1000))
      setSecondsLeft(remaining)
    }
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [session])

  const settleCash = async () => {
    if (!cashConfirmed) return
    setIsSubmitting(true)
    setError('')
    try {
      await settleAdminBookingAtCheckout(booking.bookingId)
      await complete(`Đã thu tiền mặt ${formatCurrency(booking.remainingAmount)} và hoàn tất checkout ${booking.bookingCode}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể kết toán tiền mặt.')
      setIsSubmitting(false)
    }
  }

  const createQr = async () => {
    setIsSubmitting(true)
    setError('')
    try {
      const result = await createCheckoutBalancePaymentSession(booking.bookingId)
      setSession(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo mã QR.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-[#10251e]/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="checkout-settlement-title">
      <button type="button" onClick={onClose} className="absolute inset-0" aria-label="Đóng kết toán checkout" />
      <section className="relative max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-[28px] border border-[#dfd3c5] bg-white shadow-[0_30px_90px_rgba(12,35,28,0.3)] sm:rounded-[28px]">
        <header className="flex items-start justify-between gap-4 border-b border-[#e7ddd1] bg-[#fbf8f3] px-5 py-5 sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-orange">Kết toán checkout</p>
            <h2 id="checkout-settlement-title" className="mt-1 font-editorial text-2xl text-on-surface">Thu số tiền còn lại</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{booking.bookingCode} · {booking.customerName}</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant transition hover:bg-white hover:text-on-surface" aria-label="Đóng">
            <CloseIcon />
          </button>
        </header>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[#e5dace] bg-[#fbf8f3] p-3">
            <MoneyMetric label="Tổng tiền" value={booking.totalPrice} />
            <MoneyMetric label="Đã cọc" value={booking.paidAmount} />
            <MoneyMetric label="Cần thu" value={booking.remainingAmount} accent />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">Khách thanh toán bằng</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <MethodCard selected={method === 'CASH'} title="Tiền mặt" description="Nhận đủ tiền rồi xác nhận checkout." icon={<CashIcon />} onClick={() => { setMethod('CASH'); setError('') }} />
              <MethodCard selected={method === 'BANK_TRANSFER'} title="Chuyển khoản" description="Tạo VietQR và tự động xác nhận qua SePay." icon={<QrIcon />} onClick={() => { setMethod('BANK_TRANSFER'); setError('') }} />
            </div>
          </div>

          {method === 'CASH' ? (
            <div className="rounded-2xl border border-[#d9cdbf] bg-[#fffdf9] p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f3ed] text-secondary"><CashIcon /></span>
                <div>
                  <p className="font-display text-sm font-bold text-on-surface">Thu đúng {formatCurrency(booking.remainingAmount)}</p>
                  <p className="mt-1 text-xs leading-5 text-on-surface-variant">Giao dịch sẽ lưu là tiền mặt tại quầy cùng tài khoản nhân viên xác nhận.</p>
                </div>
              </div>
              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl bg-[#f7f3ed] px-3 py-3 text-sm text-on-surface">
                <input type="checkbox" checked={cashConfirmed} onChange={(event) => setCashConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-outline text-secondary focus:ring-secondary" />
                Tôi đã nhận đủ tiền mặt từ khách và kiểm tra số tiền.
              </label>
            </div>
          ) : session ? (
            <div className="grid items-center gap-5 rounded-2xl border border-[#bcd5ca] bg-[#f2f8f5] p-4 sm:grid-cols-[190px_1fr]">
              <div className="mx-auto overflow-hidden rounded-2xl border border-white bg-white p-2 shadow-sm">
                {session.paymentUrl ? <img src={session.paymentUrl} alt={`QR thanh toán ${booking.bookingCode}`} className="h-[174px] w-[174px] object-contain" /> : <div className="flex h-[174px] w-[174px] items-center justify-center text-center text-xs text-error">Không có ảnh QR</div>}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-secondary">Đang chờ chuyển khoản</p>
                <p className="mt-1 font-editorial text-3xl text-secondary">{formatCurrency(session.amount)}</p>
                <p className="mt-2 break-all rounded-xl bg-white px-3 py-2 font-mono text-xs font-bold text-on-surface">{session.paymentId}</p>
                <p className="mt-2 text-xs leading-5 text-on-surface-variant">Khách quét QR và giữ nguyên số tiền, nội dung. Màn hình tự kiểm tra mỗi 3 giây.</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-secondary">{secondsLeft > 0 ? `Còn ${formatCountdown(secondsLeft)}` : 'Đang kiểm tra hiệu lực'}</span>
                  <button type="button" onClick={() => void checkPayment()} disabled={isChecking} className="rounded-xl border border-secondary/25 bg-white px-3 py-2 text-xs font-bold text-secondary disabled:opacity-50">{isChecking ? 'Đang kiểm tra…' : 'Kiểm tra ngay'}</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#bcd5ca] bg-[#f2f8f5] px-5 py-6 text-center">
              <p className="font-display text-sm font-bold text-secondary">Tạo QR đúng số tiền còn lại</p>
              <p className="mt-1 text-xs leading-5 text-on-surface-variant">Booking chỉ hoàn tất sau khi hệ thống nhận được giao dịch thực tế.</p>
            </div>
          )}

          {error && <p className="rounded-2xl border border-error/25 bg-error-container/30 px-4 py-3 text-xs leading-5 text-error">{error}</p>}
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-[#e7ddd1] bg-[#fbf8f3] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="btn-secondary">Đóng</button>
          {method === 'CASH' ? (
            <button type="button" onClick={() => void settleCash()} disabled={!cashConfirmed || isSubmitting} className="btn-primary min-w-48 disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? 'Đang kết toán…' : 'Xác nhận tiền mặt & checkout'}</button>
          ) : (
            <button type="button" onClick={() => void createQr()} disabled={isSubmitting} className="btn-primary min-w-40 disabled:opacity-50">{isSubmitting ? 'Đang tạo QR…' : session ? 'Tạo mã QR mới' : 'Tạo mã VietQR'}</button>
          )}
        </footer>
      </section>
    </div>
  )
}

function MethodCard({ selected, title, description, icon, onClick }: { selected: boolean; title: string; description: string; icon: React.ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={['flex items-start gap-3 rounded-2xl border p-4 text-left transition', selected ? 'border-secondary bg-[#edf6f1] ring-2 ring-secondary/10' : 'border-[#dfd4c7] bg-white hover:border-[#b9a58d]'].join(' ')}><span className={['flex h-10 w-10 shrink-0 items-center justify-center rounded-full', selected ? 'bg-secondary text-white' : 'bg-[#f2e8dc] text-brand-orange'].join(' ')}>{icon}</span><span><strong className="block font-display text-sm text-on-surface">{title}</strong><span className="mt-1 block text-xs leading-5 text-on-surface-variant">{description}</span></span></button>
}

function MoneyMetric({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return <div className="min-w-0 px-1 py-1 text-center"><p className="text-[9px] font-bold uppercase tracking-wide text-on-surface-variant">{label}</p><p className={['mt-1 truncate font-display text-sm font-bold sm:text-base', accent ? 'text-brand-orange' : 'text-on-surface'].join(' ')}>{formatCurrency(value)}</p></div>
}

function formatCurrency(value: number) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value) }
function formatCountdown(seconds: number) { return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}` }
function CloseIcon() { return <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" /></svg> }
function CashIcon() { return <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 9h.01M18 15h.01" strokeLinecap="round" /></svg> }
function QrIcon() { return <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v6h-6v-2M14 18h2" strokeLinejoin="round" /></svg> }
