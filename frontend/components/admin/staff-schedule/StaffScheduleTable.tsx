'use client'

import RegistrationStatusBadge from '@/components/admin/staff-schedule/RegistrationStatusBadge'
import type { AdminShiftRegistration } from '@/lib/admin/staff-schedule/adminShiftRegistrationApi'
import {
  formatDayNumber,
  formatWeekday,
  isToday,
  staffInitials,
} from '@/lib/admin/staff-schedule/staffScheduleUtils'

type StaffScheduleTableProps = {
  registrations: AdminShiftRegistration[]
  selectedIds: Set<number>
  isLoading: boolean
  isSaving: boolean
  statusFilter: 'PENDING' | 'APPROVED' | 'ALL'
  highlightDate: string | null
  onStatusFilterChange: (filter: 'PENDING' | 'APPROVED' | 'ALL') => void
  onToggle: (registration: AdminShiftRegistration) => void
  onSelectAllPending: () => void
  onClearSelection: () => void
  onApproveOne: (registration: AdminShiftRegistration) => void
  onApproveSelected: () => void
}

export default function StaffScheduleTable({
  registrations,
  selectedIds,
  isLoading,
  isSaving,
  statusFilter,
  highlightDate,
  onStatusFilterChange,
  onToggle,
  onSelectAllPending,
  onClearSelection,
  onApproveOne,
  onApproveSelected,
}: StaffScheduleTableProps) {
  const filtered = sortRegistrations(
    registrations.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false
      if (highlightDate && item.workDate !== highlightDate) return false
      return true
    }),
  )

  const pendingInView = filtered.filter((item) => item.status === 'PENDING')
  const allPendingSelected =
    pendingInView.length > 0 && pendingInView.every((item) => selectedIds.has(item.id))

  const tabs: { id: 'PENDING' | 'APPROVED' | 'ALL'; label: string; count: number }[] = [
    {
      id: 'PENDING',
      label: 'Chờ duyệt',
      count: registrations.filter((item) => item.status === 'PENDING').length,
    },
    {
      id: 'APPROVED',
      label: 'Đã lên lịch',
      count: registrations.filter((item) => item.status === 'APPROVED').length,
    },
    { id: 'ALL', label: 'Tất cả', count: registrations.length },
  ]

  return (
    <section className="flex max-h-[min(70vh,640px)] flex-col overflow-hidden rounded-xl border border-outline-variant bg-white shadow-[var(--shadow-card)]">
      <div className="flex shrink-0 flex-col gap-3 border-b border-outline-variant px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="font-display text-lg font-bold text-on-surface">Bảng lịch làm việc</h2>
          <p className="mt-0.5 text-sm text-on-surface-variant">
            Theo dõi ca theo ngày · tick nhiều dòng rồi duyệt hàng loạt
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 rounded-lg bg-surface-container-low p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onStatusFilterChange(tab.id)}
              className={[
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition',
                statusFilter === tab.id
                  ? 'bg-white text-brand-orange shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface',
              ].join(' ')}
            >
              {tab.label}
              <span
                className={[
                  'rounded px-1.5 py-0.5 text-[11px] font-bold',
                  statusFilter === tab.id ? 'bg-primary-container text-on-primary-container' : 'bg-white/80',
                ].join(' ')}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-lg bg-surface-container-low" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center px-6 py-14 text-center">
          <div>
            <p className="font-display text-base font-bold text-on-surface">
              {statusFilter === 'PENDING' ? 'Không có ca chờ duyệt' : 'Không có dữ liệu trong bộ lọc này'}
            </p>
            <p className="mt-1 text-sm text-on-surface-variant">Đổi tuần, ngày hoặc trạng thái để xem thêm.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="min-w-[760px] w-full border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  <th className="w-12 bg-surface-container-low px-4 py-3">
                    {statusFilter !== 'APPROVED' && pendingInView.length > 0 ? (
                      <input
                        type="checkbox"
                        checked={allPendingSelected}
                        onChange={() => (allPendingSelected ? onClearSelection() : onSelectAllPending())}
                        className="h-4 w-4 rounded border-outline text-brand-orange focus:ring-brand-orange"
                        aria-label="Chọn tất cả ca chờ duyệt"
                      />
                    ) : (
                      <span className="sr-only">Chọn</span>
                    )}
                  </th>
                  {['Ngày', 'Nhân viên', 'Ca làm', 'Trạng thái', 'Thao tác'].map((label) => (
                    <th
                      key={label}
                      className="bg-surface-container-low px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((registration, index) => {
                  const prevDate = index > 0 ? filtered[index - 1].workDate : null
                  const showDateDivider = registration.workDate !== prevDate
                  const checked = selectedIds.has(registration.id)
                  const isPending = registration.status === 'PENDING'
                  const today = isToday(registration.workDate)

                  return (
                    <tr
                      key={registration.id}
                      id={showDateDivider ? `schedule-day-${registration.workDate}` : undefined}
                      className={[
                        'border-b border-outline-variant/60 transition-colors last:border-0',
                        checked ? 'bg-primary-container/20' : 'hover:bg-surface-container-low/70',
                        showDateDivider && index > 0 ? 'border-t-2 border-t-outline-variant' : '',
                      ].join(' ')}
                    >
                      <td className="px-4 py-3.5 align-middle">
                        {isPending ? (
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => onToggle(registration)}
                            className="h-4 w-4 rounded border-outline text-brand-orange focus:ring-brand-orange"
                            aria-label={`Chọn ca của ${registration.staffName}`}
                          />
                        ) : (
                          <span className="block w-4 text-center text-secondary" aria-hidden>
                            ✓
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-2">
                          <div
                            className={[
                              'flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg border text-center',
                              today
                                ? 'border-brand-orange/40 bg-primary-container/50'
                                : 'border-outline-variant bg-surface-container-low',
                            ].join(' ')}
                          >
                            <span className="text-[9px] font-bold uppercase leading-none text-on-surface-variant">
                              {formatWeekday(registration.workDate)}
                            </span>
                            <span className="font-display text-xs font-bold leading-tight text-on-surface">
                              {formatDayNumber(registration.workDate).split('/')[0]}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-on-surface">{formatDayNumber(registration.workDate)}</p>
                            {today && (
                              <p className="text-[11px] font-semibold text-brand-orange">Hôm nay</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-greenDark text-[11px] font-bold text-white">
                            {staffInitials(registration.staffName)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-on-surface">{registration.staffName}</p>
                            <p className="truncate text-xs text-on-surface-variant">
                              #{registration.staffId}
                              {registration.staffEmail ? ` · ${registration.staffEmail}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 align-middle">
                        <span className="inline-flex rounded-lg bg-surface-container-high px-2.5 py-1.5 font-display text-sm font-semibold tabular-nums text-on-surface">
                          {registration.startTime} – {registration.endTime}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 align-middle">
                        <RegistrationStatusBadge status={registration.status} />
                      </td>

                      <td className="px-4 py-3.5 align-middle">
                        {isPending ? (
                          <button
                            type="button"
                            onClick={() => onApproveOne(registration)}
                            disabled={isSaving}
                            className="rounded-lg bg-brand-orange px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-orangeHover disabled:opacity-50"
                          >
                            Duyệt
                          </button>
                        ) : (
                          <span className="text-xs text-on-surface-variant">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-outline-variant bg-surface-container-low/60 px-4 py-2.5 text-xs text-on-surface-variant sm:px-5">
            <span>
              Hiển thị <strong className="text-on-surface">{filtered.length}</strong> ca
              {highlightDate ? ' · đã lọc theo ngày' : ''}
            </span>
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={onClearSelection}
                className="font-semibold text-brand-orange hover:underline"
              >
                Bỏ chọn ({selectedIds.size})
              </button>
            )}
          </div>
        </>
      )}

      {selectedIds.size > 0 && (
        <div className="shrink-0 border-t border-brand-orange/25 bg-brand-greenDark px-4 py-3.5 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-white">
              Đã chọn <span className="font-bold text-brand-orange">{selectedIds.size}</span> ca chờ duyệt
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClearSelection}
                className="rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={onApproveSelected}
                disabled={isSaving}
                className="rounded-lg bg-brand-orange px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-orangeHover disabled:opacity-50"
              >
                {isSaving ? 'Đang duyệt…' : `Duyệt ${selectedIds.size} ca`}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function sortRegistrations(items: AdminShiftRegistration[]) {
  return [...items].sort((a, b) => {
    const byDate = a.workDate.localeCompare(b.workDate)
    if (byDate !== 0) return byDate
    const byStart = a.startTime.localeCompare(b.startTime)
    if (byStart !== 0) return byStart
    return a.staffName.localeCompare(b.staffName, 'vi')
  })
}
