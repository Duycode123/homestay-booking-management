'use client'

import { useEffect, useState } from 'react'
import type { AdminShiftRegistration } from '@/lib/admin/staff-schedule/adminShiftRegistrationApi'
import { formatDate } from '@/lib/admin/staff-schedule/staffScheduleUtils'

const QUICK_REASONS = [
  'Ca đã đủ nhân sự',
  'Trùng lịch phân công khác',
  'Không phù hợp nhu cầu vận hành',
] as const

type StaffScheduleRejectDialogProps = {
  registration: AdminShiftRegistration | null
  isSaving: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
}

export default function StaffScheduleRejectDialog({
  registration,
  isSaving,
  onClose,
  onConfirm,
}: StaffScheduleRejectDialogProps) {
  const [reason, setReason] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!registration) return
    queueMicrotask(() => {
      setReason('')
      setErrorMessage('')
    })
  }, [registration])

  if (!registration) return null

  const submit = () => {
    const normalized = reason.trim()
    if (normalized.length < 5) {
      setErrorMessage('Vui lòng nhập lý do rõ ràng, tối thiểu 5 ký tự.')
      return
    }
    onConfirm(normalized)
  }

  return (
    <div className="fixed inset-0 z-[220] flex items-end justify-center bg-[#10251e]/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Từ chối đăng ký ca">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Đóng" />
      <section className="relative w-full max-w-lg overflow-hidden rounded-t-[28px] border border-[#dfd3c5] bg-white shadow-[0_30px_90px_rgba(12,35,28,0.3)] sm:rounded-[28px]">
        <div className="bg-[linear-gradient(140deg,#173a31,#285347)] px-6 py-5 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e5c29a]">Quyết định ca làm</p>
          <h2 className="mt-1 font-editorial text-2xl">Từ chối đăng ký ca</h2>
          <p className="mt-2 text-sm text-white/75">
            {registration.staffName} · {formatDate(registration.workDate)} · {registration.startTime}–{registration.endTime}
          </p>
        </div>

        <div className="p-6">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">Lý do gợi ý</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_REASONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setReason(item)
                  setErrorMessage('')
                }}
                className={[
                  'rounded-full border px-3 py-2 text-xs font-semibold transition',
                  reason === item
                    ? 'border-secondary bg-secondary text-white'
                    : 'border-[#ddd2c4] bg-[#fbf8f3] text-on-surface-variant hover:border-secondary/40 hover:text-secondary',
                ].join(' ')}
              >
                {item}
              </button>
            ))}
          </div>

          <label className="mt-5 block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
              Lý do từ chối <span className="text-error">*</span>
            </span>
            <textarea
              value={reason}
              onChange={(event) => {
                setReason(event.target.value)
                setErrorMessage('')
              }}
              rows={4}
              maxLength={500}
              placeholder="Giải thích ngắn gọn để nhân viên biết và đăng ký ca phù hợp hơn…"
              className="w-full resize-none rounded-2xl border border-[#dcd1c3] bg-[#fffdf9] px-4 py-3 text-sm leading-6 text-on-surface outline-none transition focus:border-secondary focus:ring-4 focus:ring-secondary/10"
            />
          </label>
          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="text-xs text-error">{errorMessage}</p>
            <span className="text-[10px] text-on-surface-variant">{reason.length}/500</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-[#e8dfd4] bg-[#fbf8f3] px-6 py-4">
          <button type="button" onClick={onClose} disabled={isSaving} className="h-11 rounded-xl border border-[#d8ccbd] bg-white text-sm font-bold text-on-surface-variant transition hover:text-on-surface disabled:opacity-50">
            Quay lại
          </button>
          <button type="button" onClick={submit} disabled={isSaving} className="h-11 rounded-xl bg-error text-sm font-bold text-white shadow-[0_8px_20px_rgba(186,61,52,0.18)] transition hover:brightness-95 disabled:opacity-50">
            {isSaving ? 'Đang lưu…' : 'Xác nhận từ chối'}
          </button>
        </div>
      </section>
    </div>
  )
}
