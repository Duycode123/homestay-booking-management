'use client'

import RegistrationStatusBadge from '@/components/admin/staff-schedule/RegistrationStatusBadge'
import type { AdminShiftRegistration } from '@/lib/admin/staff-schedule/adminShiftRegistrationApi'
import { formatDate } from '@/lib/admin/staff-schedule/staffScheduleUtils'

type StaffScheduleDayModalProps = {
  date: string
  registrations: AdminShiftRegistration[]
  selectedIds: Set<number>
  onToggle: (registration: AdminShiftRegistration) => void
  onSelectAllPending: () => void
  onClose: () => void
}

export default function StaffScheduleDayModal({
  date,
  registrations,
  selectedIds,
  onToggle,
  onSelectAllPending,
  onClose,
}: StaffScheduleDayModalProps) {
  const sortedRegistrations = [...registrations].sort(
    (first, second) =>
      first.startTime.localeCompare(second.startTime) ||
      first.staffName.localeCompare(second.staffName, 'vi') ||
      first.id - second.id,
  )

  const pendingCount = sortedRegistrations.filter((item) => item.status === 'PENDING').length
  const selectedInDay = sortedRegistrations.filter(
    (item) => item.status === 'PENDING' && selectedIds.has(item.id),
  ).length

  return (
    <>
      <button
        type="button"
        aria-label="Đóng"
        onClick={onClose}
        className="fixed inset-0 z-50 bg-inverse-surface/45 backdrop-blur-sm"
      />

      <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
        <section
          role="dialog"
          aria-modal="true"
          className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-outline-variant bg-white shadow-[var(--shadow-elevated)] sm:rounded-3xl"
        >
          <header className="relative overflow-hidden border-b border-outline-variant bg-gradient-to-r from-brand-greenDark to-brand-greenLight px-6 py-5 text-white">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-brand-orange/25 blur-2xl"
            />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="font-display text-[10px] font-medium uppercase tracking-[0.15em] text-brand-orange">
                  Chi tiết ngày
                </p>
                <h2 className="font-display text-xl font-bold">{formatDate(date)}</h2>
                <p className="mt-1 text-sm text-white/85">
                  Chọn ca chờ xếp — ca đã lên lịch được giữ nguyên.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Đóng
              </button>
            </div>
          </header>

          {pendingCount > 0 && (
            <div className="flex items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-low/60 px-5 py-3">
              <p className="text-sm text-on-surface-variant">
                <span className="font-semibold text-on-surface">{pendingCount}</span> ca chờ · đã chọn{' '}
                <span className="font-semibold text-brand-orange">{selectedInDay}</span>
              </p>
              <button
                type="button"
                onClick={onSelectAllPending}
                className="rounded-lg border border-brand-orange/40 bg-primary-container/50 px-3 py-1.5 text-xs font-semibold text-brand-orange transition hover:bg-primary-container"
              >
                Chọn tất cả chờ
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-5 py-5">
            {sortedRegistrations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low px-6 py-14 text-center">
                <p className="font-display text-lg font-bold text-on-surface">Chưa có nhân viên đăng ký</p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Khi nhân viên đăng ký ca, danh sách sẽ hiện tại đây.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedRegistrations.map((registration) => {
                  const checked = registration.status === 'APPROVED' || selectedIds.has(registration.id)
                  const disabled = registration.status !== 'PENDING'

                  return (
                    <label
                      key={registration.id}
                      className={[
                        'flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition',
                        checked
                          ? 'border-brand-orange/50 bg-primary-container/25 shadow-sm'
                          : 'border-outline-variant bg-white hover:border-brand-orange/30 hover:bg-surface-container-low/80',
                        disabled ? 'cursor-default opacity-80' : '',
                      ].join(' ')}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => onToggle(registration)}
                        className="mt-1 h-4 w-4 rounded border-outline text-brand-orange focus:ring-brand-orange"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-display text-base font-bold text-on-surface">{registration.staffName}</p>
                            <p className="mt-0.5 text-xs text-on-surface-variant">
                              #{registration.staffId}
                              {registration.staffEmail ? ` · ${registration.staffEmail}` : ''}
                            </p>
                          </div>
                          <RegistrationStatusBadge status={registration.status} />
                        </div>
                        <p className="mt-3 inline-flex rounded-lg bg-surface-container-high/80 px-2.5 py-1 font-display text-sm font-semibold text-on-surface">
                          {registration.startTime} – {registration.endTime}
                        </p>
                        {registration.rejectionReason && (
                          <p className="mt-2 rounded-xl bg-error-container/50 px-3 py-2 text-xs text-error">
                            {registration.rejectionReason}
                          </p>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
