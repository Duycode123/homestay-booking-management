'use client'

import RegistrationStatusBadge from '@/components/admin/staff-schedule/RegistrationStatusBadge'
import type { AdminShiftRegistration } from '@/lib/admin/staff-schedule/adminShiftRegistrationApi'
import {
  formatDate,
  staffInitials,
  type ShiftFrame,
} from '@/lib/admin/staff-schedule/staffScheduleUtils'

type StaffScheduleSlotDialogProps = {
  open: boolean
  date: string
  frame: ShiftFrame
  registrations: AdminShiftRegistration[]
  selectedIds?: Set<number>
  isSaving: boolean
  onClose: () => void
  onToggle?: (registration: AdminShiftRegistration) => void
  onApprove: (registration: AdminShiftRegistration) => void
  onApproveMany: (registrations: AdminShiftRegistration[]) => void
  onReject: (registration: AdminShiftRegistration) => void
}

export default function StaffScheduleSlotDialog({
  open,
  date,
  frame,
  registrations,
  selectedIds = new Set<number>(),
  isSaving,
  onClose,
  onToggle,
  onApprove,
  onApproveMany,
  onReject,
}: StaffScheduleSlotDialogProps) {
  if (!open) return null

  const sorted = [...registrations].sort((first, second) => {
    const statusOrder = statusPriority(first.status) - statusPriority(second.status)
    if (statusOrder !== 0) return statusOrder
    return first.staffName.localeCompare(second.staffName, 'vi')
  })
  const pending = sorted.filter((item) => item.status === 'PENDING')
  const approved = sorted.filter((item) => item.status === 'APPROVED').length
  const rejected = sorted.filter((item) => item.status === 'REJECTED').length

  return (
    <div className="fixed inset-0 z-[210] flex items-end justify-center bg-[#10251e]/55 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label={`Nhân viên trong ${frame.name}`}>
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Đóng danh sách ca" />
      <section className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] border border-[#dfd3c5] bg-[#fbf8f3] shadow-[0_32px_100px_rgba(12,35,28,0.34)] sm:rounded-[28px]">
        <header className="bg-[linear-gradient(140deg,#173a31,#285347)] px-5 py-5 text-white sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e5c29a]">Chi tiết ca làm</p>
              <h2 className="mt-1 font-editorial text-2xl sm:text-3xl">{frame.name}</h2>
              <p className="mt-1.5 text-sm capitalize text-white/75">
                {formatDate(date)} · {displayTime(frame, registrations)}
              </p>
            </div>
            <button type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20" aria-label="Đóng">
              <CloseIcon />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <Metric label="Tổng người" value={sorted.length} />
            <Metric label="Đã duyệt" value={approved} />
            <Metric label="Chờ duyệt" value={pending.length} accent />
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {sorted.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-[#dacdbc] bg-white px-6 text-center">
              <p className="font-display text-base font-bold text-on-surface">Chưa có nhân viên trong ca</p>
              <p className="mt-1 text-sm text-on-surface-variant">Các đăng ký mới sẽ tự động xuất hiện tại đây.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {sorted.map((registration) => {
                const isPending = registration.status === 'PENDING'
                const checked = selectedIds.has(registration.id)

                return (
                  <article
                    key={registration.id}
                    className={[
                      'rounded-2xl border bg-white p-4 transition',
                      checked ? 'border-brand-orange/50 ring-2 ring-brand-orange/10' : 'border-[#e4dacd]',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-3">
                      {isPending && onToggle ? (
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggle(registration)}
                          className="mt-3 h-4 w-4 shrink-0 rounded border-outline text-brand-orange focus:ring-brand-orange"
                          aria-label={`Chọn đăng ký của ${registration.staffName}`}
                        />
                      ) : null}
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-white">
                        {staffInitials(registration.staffName)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-display text-sm font-bold text-on-surface">{registration.staffName}</p>
                            <p className="mt-0.5 truncate text-xs text-on-surface-variant">
                              Mã #{registration.staffId}{registration.staffEmail ? ` · ${registration.staffEmail}` : ''}
                            </p>
                            <p className="mt-1 text-[11px] font-semibold tabular-nums text-secondary/75">
                              {registration.startTime}–{registration.endTime}
                            </p>
                          </div>
                          <RegistrationStatusBadge status={registration.status} frameId={frame.id} />
                        </div>

                        {registration.rejectionReason && (
                          <p className="mt-2 rounded-xl border border-error/15 bg-error-container/30 px-3 py-2 text-xs leading-5 text-error">
                            Lý do: {registration.rejectionReason}
                          </p>
                        )}

                        {isPending && (
                          <div className="mt-3 flex justify-end gap-2">
                            <button type="button" onClick={() => onReject(registration)} disabled={isSaving} className="h-8 rounded-lg border border-error/25 px-3 text-[11px] font-bold text-error transition hover:bg-error-container/35 disabled:opacity-50">
                              Từ chối
                            </button>
                            <button type="button" onClick={() => onApprove(registration)} disabled={isSaving} className="h-8 rounded-lg bg-secondary px-3 text-[11px] font-bold text-white transition hover:bg-[#103b30] disabled:opacity-50">
                              Duyệt nhân viên
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>

        <footer className="flex flex-col gap-3 border-t border-[#e5dacd] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-on-surface-variant">
            {rejected > 0 ? `${rejected} đăng ký đã từ chối · ` : ''}{approved} nhân viên đã được xếp vào ca.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="h-10 rounded-xl border border-[#d8ccbd] bg-white px-4 text-xs font-bold text-on-surface-variant transition hover:text-on-surface">
              Đóng
            </button>
            {pending.length > 0 && (
              <button type="button" onClick={() => onApproveMany(pending)} disabled={isSaving} className="h-10 rounded-xl bg-secondary px-4 text-xs font-bold text-white shadow-[0_7px_18px_rgba(23,58,49,0.18)] transition hover:bg-[#103b30] disabled:opacity-50">
                {isSaving ? 'Đang duyệt…' : `Duyệt tất cả (${pending.length})`}
              </button>
            )}
          </div>
        </footer>
      </section>
    </div>
  )
}

function Metric({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 backdrop-blur-sm">
      <p className="text-[9px] font-bold uppercase tracking-wide text-white/55">{label}</p>
      <p className={['mt-1 font-editorial text-xl', accent ? 'text-[#f0cfa8]' : 'text-white'].join(' ')}>{value}</p>
    </div>
  )
}

function displayTime(frame: ShiftFrame, registrations: AdminShiftRegistration[]) {
  if (frame.startTime && frame.endTime) return `${frame.startTime}–${frame.endTime}`
  const first = registrations[0]
  return first ? `${first.startTime}–${first.endTime}` : 'Khung giờ khác'
}

function statusPriority(status: AdminShiftRegistration['status']) {
  if (status === 'PENDING') return 0
  if (status === 'APPROVED') return 1
  return 2
}

function CloseIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  )
}
