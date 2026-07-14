'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { IconCheckCircle, IconClock, IconClose, IconRefund, IconRefresh, IconSearch } from '@/components/admin/AdminIcons'
import ProjectSelect from '@/components/ui/ProjectSelect'
import {
  completeRefund,
  failRefund,
  fetchRefunds,
  startRefund,
  uploadRefundProof,
  type RefundRecord,
  type RefundStatus,
} from '@/lib/admin/refundApi'

type StatusFilter = RefundStatus | 'ALL'

const STATUS_META: Record<RefundStatus, { label: string; className: string; dot: string }> = {
  PENDING: { label: 'Chờ xử lý', className: 'bg-[#fff7e9] text-[#8a642e] ring-[#ead4aa]', dot: 'bg-[#c18b43]' },
  PROCESSING: { label: 'Đang xử lý', className: 'bg-[#edf5f1] text-[#23624e] ring-[#b9d6ca]', dot: 'bg-[#2f8064]' },
  COMPLETED: { label: 'Đã hoàn tiền', className: 'bg-[#eaf6ef] text-[#1f6a48] ring-[#abd5bc]', dot: 'bg-[#2d8b5b]' },
  FAILED: { label: 'Thất bại', className: 'bg-[#fff0ef] text-[#a13f3f] ring-[#efc0bd]', dot: 'bg-[#c75151]' },
  RETRY_REQUIRED: { label: 'Cần xử lý lại', className: 'bg-[#fff1ed] text-[#a34f35] ring-[#edc0b1]', dot: 'bg-[#d16c48]' },
}

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<RefundRecord[]>([])
  const [status, setStatus] = useState<StatusFilter>('ALL')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<RefundRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchRefunds(status, query)
      setRefunds(data)
      setSelected((current) => current ? data.find((item) => item.refundId === current.refundId) ?? null : null)
      setError('')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải dữ liệu hoàn tiền.')
    } finally {
      setIsLoading(false)
    }
  }, [query, status])

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250)
    return () => window.clearTimeout(timer)
  }, [load])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const stats = useMemo(() => ({
    pending: refunds.filter((item) => item.status === 'PENDING').length,
    processing: refunds.filter((item) => item.status === 'PROCESSING').length,
    retry: refunds.filter((item) => item.status === 'RETRY_REQUIRED' || item.status === 'FAILED').length,
    completedAmount: refunds.filter((item) => item.status === 'COMPLETED').reduce((sum, item) => sum + item.amount, 0),
  }), [refunds])

  const handleUpdated = (updated: RefundRecord, message: string) => {
    setRefunds((current) => current.map((item) => item.refundId === updated.refundId ? updated : item))
    setSelected(updated)
    setToast(message)
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Tài chính & đối soát"
        title="Trung tâm hoàn tiền"
        description="Theo dõi từng khoản hoàn từ lúc admin duyệt hủy đến khi tiền được đối soát thành công."
        breadcrumbs={[{ label: 'Tổng quan', href: '/admin/dashboard' }, { label: 'Hoàn tiền' }]}
        actions={
          <button type="button" onClick={() => void load()} disabled={isLoading} className="group flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant bg-white text-on-surface-variant shadow-sm transition hover:border-brand-orange/40 hover:text-brand-orange disabled:opacity-50" aria-label="Làm mới">
            <IconRefresh className={['h-4 w-4 transition-transform', isLoading ? 'animate-spin' : 'group-hover:rotate-180'].join(' ')} />
          </button>
        }
      />

      <main className="mx-auto max-w-[1440px] space-y-5 px-5 py-6 sm:px-8">
        {toast && <div className="fixed right-5 top-5 z-[180] rounded-2xl bg-secondary px-5 py-3 text-sm font-bold text-white shadow-2xl">{toast}</div>}
        {error && <div className="rounded-2xl border border-error/25 bg-error-container/40 px-4 py-3 text-sm font-semibold text-error">{error}</div>}

        <section className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#173f35_0%,#215446_62%,#9a7147_150%)] p-6 text-white shadow-[0_22px_55px_rgba(23,63,53,0.20)] sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-white/10" />
          <div className="relative grid gap-6 xl:grid-cols-[1fr_auto] xl:items-end">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-[#f0d5b3]"><IconRefund className="h-4 w-4" /> Kiểm soát tiền hoàn</span>
              <h2 className="mt-4 font-editorial text-3xl sm:text-4xl">Tách rõ duyệt hủy và hoàn tiền</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/72">Booking được giải phóng sau khi duyệt; khoản hoàn chỉ được xác nhận sau khi admin kiểm tra giao dịch ngân hàng thành công.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[610px]">
              <Metric label="Chờ xử lý" value={stats.pending} />
              <Metric label="Đang xử lý" value={stats.processing} />
              <Metric label="Cần xử lý lại" value={stats.retry} alert={stats.retry > 0} />
              <Metric label="Đã hoàn" value={formatCurrency(stats.completedAmount)} compact />
            </div>
          </div>
        </section>

        <section className="rounded-[22px] border border-[#e2d7ca] bg-white p-4 shadow-[0_14px_38px_rgba(31,54,44,0.06)] sm:p-5">
          <div className="grid gap-3 md:grid-cols-[minmax(260px,1fr)_240px_auto] md:items-end">
            <label>
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">Tìm hồ sơ</span>
              <span className="relative block">
                <IconSearch className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Mã booking, khách hàng, phòng..." className="h-12 w-full rounded-2xl border border-[#ded3c5] bg-[#fcfaf7] pl-11 pr-4 text-sm outline-none transition focus:border-brand-orange focus:bg-white focus:shadow-[0_0_0_3px_rgba(184,136,87,0.10)]" />
              </span>
            </label>
            <label>
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">Trạng thái</span>
              <ProjectSelect value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)} className="h-12 rounded-2xl bg-[#fcfaf7]">
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PENDING">Chờ xử lý</option>
                <option value="PROCESSING">Đang xử lý</option>
                <option value="RETRY_REQUIRED">Cần xử lý lại</option>
                <option value="COMPLETED">Đã hoàn tiền</option>
                <option value="FAILED">Thất bại</option>
              </ProjectSelect>
            </label>
            <button type="button" onClick={() => { setQuery(''); setStatus('ALL') }} className="h-12 rounded-2xl border border-[#ded3c5] bg-white px-5 text-sm font-bold text-on-surface transition hover:border-brand-orange/40 hover:text-brand-orange">Xóa bộ lọc</button>
          </div>
        </section>

        <section className="overflow-hidden rounded-[24px] border border-[#e2d7ca] bg-white shadow-[0_18px_48px_rgba(31,54,44,0.07)]">
          <div className="flex items-center justify-between border-b border-[#ebe3d9] px-5 py-4 sm:px-6">
            <div><h2 className="font-display text-lg font-bold">Danh sách đối soát</h2><p className="mt-1 text-xs text-on-surface-variant">{refunds.length} hồ sơ phù hợp</p></div>
            <div className="hidden items-center gap-4 text-xs text-on-surface-variant sm:flex"><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#c18b43]" /> Chờ xử lý</span><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#2f8064]" /> Đã tiếp nhận</span></div>
          </div>

          {isLoading ? (
            <div className="grid gap-3 p-5">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-2xl bg-surface-container-low" />)}</div>
          ) : refunds.length === 0 ? (
            <div className="px-5 py-16 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#edf4f0] text-secondary"><IconCheckCircle className="h-7 w-7" /></div><h3 className="mt-4 font-display text-lg font-bold">Không có hồ sơ cần hiển thị</h3><p className="mt-2 text-sm text-on-surface-variant">Các khoản hoàn mới sẽ xuất hiện sau khi admin duyệt yêu cầu hủy phòng.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left">
                <thead className="bg-[#f8f5f0] text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant"><tr><th className="px-6 py-3">Booking / khách</th><th className="px-4 py-3">Phòng</th><th className="px-4 py-3">Khoản hoàn</th><th className="px-4 py-3">Hạn dự kiến</th><th className="px-4 py-3">Trạng thái</th><th className="px-6 py-3 text-right">Thao tác</th></tr></thead>
                <tbody className="divide-y divide-[#eee7de]">
                  {refunds.map((refund) => <RefundRow key={refund.refundId} refund={refund} onOpen={() => setSelected(refund)} />)}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {selected && <RefundDrawer refund={selected} onClose={() => setSelected(null)} onUpdated={handleUpdated} />}
    </>
  )
}

function Metric({ label, value, alert = false, compact = false }: { label: string; value: string | number; alert?: boolean; compact?: boolean }) {
  return <div className={['rounded-2xl border px-4 py-3 backdrop-blur-sm', alert ? 'border-[#f2b99f]/45 bg-[#8e3f2e]/35' : 'border-white/12 bg-white/8'].join(' ')}><p className="text-[9px] font-bold uppercase tracking-[0.13em] text-white/55">{label}</p><p className={['mt-1 font-display font-bold', compact ? 'text-base' : 'text-2xl'].join(' ')}>{value}</p></div>
}

function RefundRow({ refund, onOpen }: { refund: RefundRecord; onOpen: () => void }) {
  return <tr className="transition hover:bg-[#fdfaf6]"><td className="px-6 py-4"><p className="font-display text-sm font-bold text-secondary">{refund.bookingCode}</p><p className="mt-1 text-sm font-semibold">{refund.customerName || 'Khách hàng'}</p><p className="text-xs text-on-surface-variant">{refund.customerEmail}</p></td><td className="px-4 py-4"><p className="text-sm font-semibold">{refund.roomName}</p><p className="mt-1 text-xs text-on-surface-variant">{methodLabel(refund.method)}</p></td><td className="px-4 py-4"><p className="font-display text-base font-bold text-brand-orange">{formatCurrency(refund.amount)}</p><p className="mt-1 text-xs text-on-surface-variant">100% tiền đã thu</p></td><td className="px-4 py-4 text-sm"><p className="font-semibold">{formatDate(refund.expectedAt)}</p><p className="mt-1 text-xs text-on-surface-variant">Tạo {formatDate(refund.createdAt)}</p></td><td className="px-4 py-4"><StatusBadge status={refund.status} /></td><td className="px-6 py-4 text-right"><button type="button" onClick={onOpen} className="rounded-xl border border-[#d9cbb9] bg-white px-4 py-2 text-xs font-bold transition hover:border-brand-orange hover:text-brand-orange">Xem & xử lý</button></td></tr>
}

function RefundDrawer({ refund, onClose, onUpdated }: { refund: RefundRecord; onClose: () => void; onUpdated: (refund: RefundRecord, message: string) => void }) {
  const [reference, setReference] = useState(refund.transactionReference || '')
  const [proofUrl, setProofUrl] = useState(refund.proofImageUrl || '')
  const [note, setNote] = useState(refund.adminNote || '')
  const [failureReason, setFailureReason] = useState('')
  const [showFailure, setShowFailure] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')

  const execute = async (action: () => Promise<RefundRecord>, message: string) => {
    setIsSaving(true); setError('')
    try { onUpdated(await action(), message) } catch (actionError) { setError(actionError instanceof Error ? actionError.message : 'Không thể xử lý hồ sơ.') } finally { setIsSaving(false) }
  }

  const uploadProof = async (file?: File) => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { setError('Biên lai phải là ảnh JPG, PNG hoặc WebP và không quá 5MB.'); return }
    setIsUploading(true); setError('')
    try { const uploaded = await uploadRefundProof(file); setProofUrl(uploaded.secureUrl) } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : 'Không thể tải biên lai.') } finally { setIsUploading(false) }
  }

  return <div className="fixed inset-0 z-[170] flex justify-end bg-black/35 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label="Chi tiết hoàn tiền"><button type="button" className="absolute inset-0" onClick={onClose} aria-label="Đóng" /><aside className="relative h-full w-full max-w-xl overflow-y-auto bg-[#f8f5f0] shadow-[-24px_0_70px_rgba(19,42,34,0.22)]"><div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#e3d8ca] bg-white/95 px-5 py-5 backdrop-blur"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-orange">Hồ sơ hoàn tiền</p><h2 className="mt-1 font-editorial text-2xl">{refund.bookingCode}</h2><div className="mt-2"><StatusBadge status={refund.status} /></div></div><button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant bg-white"><IconClose className="h-4 w-4" /></button></div><div className="space-y-4 p-5"><section className="rounded-[20px] border border-[#e3d8ca] bg-white p-5"><h3 className="font-display text-sm font-bold">Thông tin đối soát</h3><div className="mt-4 grid grid-cols-2 gap-3"><Detail label="Khách hàng" value={refund.customerName || 'Khách hàng'} /><Detail label="Phòng" value={refund.roomName} /><Detail label="Số tiền hoàn" value={formatCurrency(refund.amount)} highlight /><Detail label="Phương thức" value={methodLabel(refund.method)} /><Detail label="Ngày tạo" value={formatDateTime(refund.createdAt)} /><Detail label="Dự kiến" value={formatDateTime(refund.expectedAt)} /></div>{refund.failureReason && <div className="mt-4 rounded-2xl border border-error/25 bg-error-container/35 px-4 py-3 text-sm text-error"><strong>Lần xử lý trước:</strong> {refund.failureReason}</div>}</section>

        <RefundTransferCard refund={refund} />

        {refund.status === 'COMPLETED' && <section className="rounded-[20px] border border-[#b9d6ca] bg-[#f1f8f4] p-5"><div className="flex items-center gap-3 text-secondary"><IconCheckCircle className="h-6 w-6" /><div><h3 className="font-display font-bold">Đã hoàn tiền thành công</h3><p className="mt-0.5 text-sm">{formatDateTime(refund.completedAt)}</p></div></div><div className="mt-4 rounded-2xl bg-white px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Mã đối soát</p><p className="mt-1 break-all font-mono text-sm font-bold">{refund.transactionReference}</p><p className="mt-1 text-xs text-on-surface-variant">Hệ thống tự tạo mã này nếu admin không nhập mã ngân hàng.</p></div>{refund.proofImageUrl && <a href={refund.proofImageUrl} target="_blank" rel="noreferrer" className="relative mt-4 block aspect-video overflow-hidden rounded-2xl bg-white"><Image src={refund.proofImageUrl} alt="Biên lai hoàn tiền" fill unoptimized sizes="520px" className="object-cover" /></a>}</section>}

        {(refund.status === 'PENDING' || refund.status === 'RETRY_REQUIRED' || refund.status === 'FAILED') && <section className="rounded-[20px] border border-[#e3d8ca] bg-white p-5"><div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff4df] text-brand-orange"><IconClock className="h-5 w-5" /></span><div><h3 className="font-display font-bold">Tiếp nhận xử lý</h3><p className="mt-1 text-sm leading-6 text-on-surface-variant">Sau khi tiếp nhận, hồ sơ chuyển sang “Đang xử lý”. Booking vẫn giữ trạng thái đã hủy.</p></div></div><button type="button" disabled={isSaving} onClick={() => void execute(() => startRefund(refund.refundId), 'Đã tiếp nhận hồ sơ hoàn tiền.')} className="mt-5 h-12 w-full rounded-2xl bg-secondary font-display text-sm font-bold text-white shadow-lg transition hover:bg-[#103b30] disabled:opacity-50">{isSaving ? 'Đang xử lý...' : 'Bắt đầu xử lý khoản hoàn'}</button></section>}

        {refund.status === 'PROCESSING' && <RefundProcessingPanel refund={refund} reference={reference} setReference={setReference} proofUrl={proofUrl} setProofUrl={setProofUrl} note={note} setNote={setNote} failureReason={failureReason} setFailureReason={setFailureReason} showFailure={showFailure} setShowFailure={setShowFailure} isSaving={isSaving} isUploading={isUploading} uploadProof={uploadProof} execute={execute} />}
        {error && <p className="rounded-2xl border border-error/25 bg-error-container/35 px-4 py-3 text-sm font-semibold text-error">{error}</p>}
      </div></aside></div>
}

type RefundProcessingPanelProps = {
  refund: RefundRecord
  reference: string
  setReference: (value: string) => void
  proofUrl: string
  setProofUrl: (value: string) => void
  note: string
  setNote: (value: string) => void
  failureReason: string
  setFailureReason: (value: string) => void
  showFailure: boolean
  setShowFailure: (value: boolean | ((current: boolean) => boolean)) => void
  isSaving: boolean
  isUploading: boolean
  uploadProof: (file?: File) => Promise<void>
  execute: (action: () => Promise<RefundRecord>, message: string) => Promise<void>
}

function RefundProcessingPanel({ refund, reference, setReference, proofUrl, setProofUrl, note, setNote, failureReason, setFailureReason, showFailure, setShowFailure, isSaving, isUploading, uploadProof, execute }: RefundProcessingPanelProps) {
  return (
    <section className="overflow-hidden rounded-[20px] border border-[#d8c5a8] bg-white shadow-[0_14px_38px_rgba(39,61,51,0.07)]">
      <div className="bg-[#fffaf2] px-5 py-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-orange">Bước cuối cùng</p>
        <h3 className="mt-1 font-display text-xl font-bold text-secondary">Xác nhận sau khi ngân hàng báo thành công</h3>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">Bạn không cần nhập mã hoặc chụp biên lai. Hệ thống sẽ tự tạo mã đối soát và lưu người xử lý, thời gian cùng số tiền hoàn.</p>
      </div>

      <div className="p-5">
        <div className="rounded-2xl border border-[#c8ddd4] bg-[#f0f7f4] px-4 py-3 text-sm leading-6 text-secondary">
          <strong>Trước khi xác nhận:</strong> kiểm tra ứng dụng ngân hàng hiển thị giao dịch thành công, đúng <strong>{refund.recipientAccountHolder}</strong> và đúng <strong>{formatCurrency(refund.amount)}</strong>.
        </div>

        <button
          type="button"
          disabled={isSaving || isUploading}
          onClick={() => void execute(
            () => completeRefund(refund.refundId, {
              transactionReference: reference.trim() || undefined,
              proofImageUrl: proofUrl || undefined,
              adminNote: note.trim() || undefined,
            }),
            'Đã xác nhận hoàn tiền thành công.',
          )}
          className="mt-5 h-14 w-full rounded-2xl bg-brand-orange font-display text-base font-bold text-white shadow-[0_12px_30px_rgba(184,130,74,.28)] transition hover:bg-brand-orangeHover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? 'Đang ghi nhận...' : 'Tôi đã chuyển tiền thành công'}
        </button>
        <p className="mt-2 text-center text-xs leading-5 text-on-surface-variant">Thao tác sẽ được ghi nhận theo tài khoản admin đang đăng nhập.</p>

        <details className="mt-5 rounded-2xl border border-[#e5dbce] bg-[#fcfaf6] open:bg-white">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-secondary">Thêm bằng chứng đối soát <span className="font-normal text-on-surface-variant">(không bắt buộc)</span></summary>
          <div className="border-t border-[#e8dfd4] p-4">
            <label className="block text-sm font-bold">Mã giao dịch ngân hàng
              <input value={reference} onChange={(event) => setReference(event.target.value.slice(0, 100))} placeholder="Có thể bỏ trống" className="input-field mt-2" />
            </label>
            <div className="mt-4">
              <p className="text-sm font-bold">Ảnh biên lai</p>
              {proofUrl ? (
                <div className="relative mt-2 aspect-video overflow-hidden rounded-2xl bg-surface-container">
                  <Image src={proofUrl} alt="Biên lai hoàn tiền" fill unoptimized sizes="520px" className="object-cover" />
                  <button type="button" onClick={() => setProofUrl('')} className="absolute right-2 top-2 rounded-full bg-black/65 px-3 py-1.5 text-xs font-bold text-white">Thay ảnh</button>
                </div>
              ) : (
                <label className="mt-2 flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-[#cdbb9f] bg-[#fcfaf6] px-4 py-5 text-center">
                  <span><strong className="block text-sm text-brand-orange">{isUploading ? 'Đang tải biên lai...' : 'Tải ảnh nếu cần'}</strong><small className="mt-1 block text-on-surface-variant">JPG, PNG, WebP · tối đa 5MB</small></span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" disabled={isUploading || isSaving} onChange={(event) => { void uploadProof(event.currentTarget.files?.[0]); event.currentTarget.value = '' }} className="sr-only" />
                </label>
              )}
            </div>
            <label className="mt-4 block text-sm font-bold">Ghi chú đối soát
              <textarea value={note} onChange={(event) => setNote(event.target.value.slice(0, 500))} rows={3} className="input-field mt-2 h-auto py-3" placeholder="Chỉ nhập khi cần ghi chú thêm..." />
            </label>
          </div>
        </details>

        <button type="button" onClick={() => setShowFailure((value) => !value)} className="mt-4 h-11 w-full rounded-xl border border-error/20 bg-white text-sm font-bold text-error">{showFailure ? 'Đóng phần báo lỗi' : 'Ngân hàng báo giao dịch thất bại'}</button>
        {showFailure && (
          <div className="mt-3 rounded-2xl border border-error/20 bg-error-container/20 p-4">
            <label className="block text-sm font-bold text-error">Lý do cần xử lý lại
              <textarea value={failureReason} onChange={(event) => setFailureReason(event.target.value.slice(0, 500))} rows={3} className="mt-2 w-full rounded-2xl border border-error/30 bg-white px-4 py-3 text-sm text-on-surface outline-none focus:border-error" placeholder="Nhập ít nhất 10 ký tự..." />
            </label>
            <button type="button" disabled={isSaving || failureReason.trim().length < 10} onClick={() => void execute(() => failRefund(refund.refundId, failureReason.trim()), 'Đã chuyển hồ sơ sang trạng thái cần xử lý lại.')} className="mt-3 h-11 w-full rounded-xl bg-error text-sm font-bold text-white disabled:opacity-50">Ghi nhận để xử lý lại</button>
          </div>
        )}
      </div>
    </section>
  )
}

function RefundTransferCard({ refund }: { refund: RefundRecord }) {
  const [copied, setCopied] = useState('')
  const hasDestination = Boolean(refund.recipientBankCode && refund.recipientAccountNumber && refund.recipientAccountHolder)

  const copy = async (label: string, value?: string | null) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(label)
      window.setTimeout(() => setCopied(''), 1600)
    } catch {
      setCopied('Không thể sao chép')
    }
  }

  if (!hasDestination) {
    return <section className="rounded-[20px] border border-[#e3b49d] bg-[#fff7f2] p-5"><h3 className="font-display font-bold text-[#8d4934]">Thiếu tài khoản nhận hoàn</h3><p className="mt-2 text-sm leading-6 text-[#795f55]">Hồ sơ cũ chưa có thông tin ngân hàng của khách. Hãy liên hệ khách và xác minh trước khi chuyển tiền.</p></section>
  }

  const allDetails = [
    refund.recipientBankName,
    refund.recipientAccountNumber,
    refund.recipientAccountHolder,
    formatCurrency(refund.amount),
    refund.transferContent,
  ].filter(Boolean).join('\n')

  return (
    <section className="overflow-hidden rounded-[22px] border border-[#d9c6a9] bg-white shadow-[0_12px_32px_rgba(39,61,51,0.06)]">
      <div className="bg-[linear-gradient(135deg,#153f34,#245d4b)] px-5 py-4 text-white">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#e8c89f]">Lệnh chuyển khoản hoàn tiền</p>
        <h3 className="mt-1 font-display text-lg font-bold">Quét QR và kiểm tra tên người nhận</h3>
      </div>
      <div className="grid gap-5 p-5 sm:grid-cols-[170px_1fr]">
        <div className="rounded-2xl border border-[#e7ded2] bg-[#fbfaf7] p-3">
          {refund.transferQrUrl ? <img src={refund.transferQrUrl} alt={`VietQR hoàn tiền ${refund.bookingCode}`} className="aspect-square w-full object-contain" /> : <div className="flex aspect-square items-center justify-center text-center text-xs text-on-surface-variant">Chưa tạo được mã QR</div>}
          <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">VietQR · {formatCurrency(refund.amount)}</p>
        </div>
        <div className="space-y-2.5">
          <TransferLine label="Ngân hàng" value={refund.recipientBankName || refund.recipientBankCode || ''} onCopy={() => void copy('Ngân hàng', refund.recipientBankName)} copied={copied === 'Ngân hàng'} />
          <TransferLine label="Số tài khoản" value={refund.recipientAccountNumber || ''} onCopy={() => void copy('Số tài khoản', refund.recipientAccountNumber)} copied={copied === 'Số tài khoản'} mono />
          <TransferLine label="Chủ tài khoản" value={refund.recipientAccountHolder || ''} onCopy={() => void copy('Chủ tài khoản', refund.recipientAccountHolder)} copied={copied === 'Chủ tài khoản'} />
          <TransferLine label="Nội dung" value={refund.transferContent || `REFUND ${refund.bookingCode}`} onCopy={() => void copy('Nội dung', refund.transferContent || `REFUND ${refund.bookingCode}`)} copied={copied === 'Nội dung'} mono />
          <button type="button" onClick={() => void copy('Tất cả', allDetails)} className="mt-2 h-10 w-full rounded-xl border border-[#d8c7b1] bg-[#fbf8f3] text-xs font-bold text-[#8a6236] transition hover:bg-[#f4e9da]">{copied === 'Tất cả' ? 'Đã sao chép thông tin' : copied === 'Không thể sao chép' ? copied : 'Sao chép toàn bộ'}</button>
        </div>
      </div>
      <p className="border-t border-[#ece3d8] bg-[#fffcf7] px-5 py-3 text-xs leading-5 text-[#6e655b]">Không xác nhận “Đã hoàn tiền” trước khi ứng dụng ngân hàng báo giao dịch thành công và tên người nhận trùng khớp.</p>
    </section>
  )
}

function TransferLine({ label, value, onCopy, copied, mono = false }: { label: string; value: string; onCopy: () => void; copied: boolean; mono?: boolean }) {
  return <div className="rounded-xl bg-[#faf8f4] px-3 py-2.5"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p><p className={['mt-1 break-words text-sm font-bold', mono ? 'font-mono' : ''].join(' ')}>{value}</p></div><button type="button" onClick={onCopy} className="shrink-0 rounded-lg border border-[#ded3c5] bg-white px-2 py-1 text-[10px] font-bold text-brand-orange">{copied ? 'Đã chép' : 'Sao chép'}</button></div></div>
}

function StatusBadge({ status }: { status: RefundStatus }) { const meta = STATUS_META[status]; return <span className={['inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset', meta.className].join(' ')}><span className={['h-2 w-2 rounded-full', meta.dot].join(' ')} />{meta.label}</span> }
function Detail({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) { return <div className="rounded-2xl bg-[#faf8f4] px-3 py-3"><p className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p><p className={['mt-1 text-sm font-bold', highlight ? 'text-brand-orange' : 'text-on-surface'].join(' ')}>{value}</p></div> }
function methodLabel(method: RefundRecord['method']) { return ({ ORIGINAL_PAYMENT_METHOD: 'Phương thức online ban đầu', MANUAL_BANK_TRANSFER: 'Chuyển khoản thủ công', CASH_COUNTER: 'Tiền mặt tại quầy' })[method] }
function formatCurrency(value: number) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value) }
function formatDate(value?: string | null) { if (!value) return 'Chưa xác định'; return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value)) }
function formatDateTime(value?: string | null) { if (!value) return 'Chưa xác định'; return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) }
