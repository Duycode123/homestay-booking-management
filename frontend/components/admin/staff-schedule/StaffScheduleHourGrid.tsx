'use client'

import RegistrationStatusBadge from '@/components/admin/staff-schedule/RegistrationStatusBadge'
import type { AdminShiftRegistration } from '@/lib/admin/staff-schedule/adminShiftRegistrationApi'
import {
  formatDayNumber,
  formatWeekday,
  isToday,
  matchShiftFrame,
  SHIFT_FRAMES,
  staffInitials,
  type ShiftFrame,
} from '@/lib/admin/staff-schedule/staffScheduleUtils'

type StaffScheduleHourGridProps = {
  days: string[]
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

export default function StaffScheduleHourGrid({
  days,
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
}: StaffScheduleHourGridProps) {
  const filtered = registrations.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false
    if (highlightDate && item.workDate !== highlightDate) return false
    return true
  })

  const pendingInView = filtered.filter((item) => item.status === 'PENDING')
  const allPendingSelected =
    pendingInView.length > 0 && pendingInView.every((item) => selectedIds.has(item.id))

  const hasOtherSlots = filtered.some((item) => matchShiftFrame(item.startTime, item.endTime).id === 'other')
  const frames: ShiftFrame[] = hasOtherSlots
    ? [...SHIFT_FRAMES, { id: 'other', name: 'Khung khác', startTime: '', endTime: '' }]
    : SHIFT_FRAMES

  const cellMap = buildCellMap(filtered)

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
    <section className="flex max-h-[min(75vh,720px)] flex-col overflow-hidden rounded-xl border border-outline-variant bg-white shadow-[var(--shadow-card)]">
      <div className="flex shrink-0 flex-col gap-3 border-b border-outline-variant px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="font-display text-lg font-bold text-on-surface">Lịch theo khung giờ</h2>
          <p className="mt-0.5 text-sm text-on-surface-variant">
            Hàng = ca sáng / chiều / tối · Cột = ngày trong tuần
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {statusFilter !== 'APPROVED' && pendingInView.length > 0 && (
            <label className="mr-1 flex cursor-pointer items-center gap-2 text-xs font-semibold text-on-surface-variant">
              <input
                type="checkbox"
                checked={allPendingSelected}
                onChange={() => (allPendingSelected ? onClearSelection() : onSelectAllPending())}
                className="h-4 w-4 rounded border-outline text-brand-orange focus:ring-brand-orange"
              />
              Chọn tất cả chờ duyệt
            </label>
          )}

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
      </div>

      {isLoading ? (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-lg bg-surface-container-low" />
          ))}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="sticky left-0 z-20 w-[132px] border-b border-r border-outline-variant bg-surface-container-low px-3 py-3 font-display text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Khung giờ
                </th>
                {days.map((date) => {
                  const today = isToday(date)
                  const dimmed = Boolean(highlightDate && highlightDate !== date)
                  return (
                    <th
                      key={date}
                      id={`schedule-day-${date}`}
                      className={[
                        'border-b border-outline-variant bg-surface-container-low px-2 py-3 text-center',
                        dimmed ? 'opacity-40' : '',
                      ].join(' ')}
                    >
                      <p
                        className={[
                          'text-[10px] font-bold uppercase tracking-wide',
                          today ? 'text-brand-orange' : 'text-on-surface-variant',
                        ].join(' ')}
                      >
                        {formatWeekday(date)}
                      </p>
                      <p
                        className={[
                          'mt-0.5 font-display text-sm font-bold',
                          today ? 'text-brand-orange' : 'text-on-surface',
                        ].join(' ')}
                      >
                        {formatDayNumber(date)}
                      </p>
                      {today && <p className="mt-0.5 text-[10px] font-semibold text-brand-orange">Hôm nay</p>}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {frames.map((frame) => (
                <tr key={frame.id}>
                  <th
                    className={[
                      'sticky left-0 z-[5] w-[132px] border-b border-r border-outline-variant px-3 py-3 align-top',
                      frameAccent(frame.id).labelBg,
                    ].join(' ')}
                  >
                    <p className={['font-display text-sm font-bold', frameAccent(frame.id).labelText].join(' ')}>
                      {frame.name}
                    </p>
                    {frame.startTime && frame.endTime ? (
                      <p className="mt-1 text-[11px] font-semibold tabular-nums text-on-surface-variant">
                        {frame.startTime} – {frame.endTime}
                      </p>
                    ) : (
                      <p className="mt-1 text-[11px] text-on-surface-variant">Ngoài khung chuẩn</p>
                    )}
                  </th>

                  {days.map((date) => {
                    const key = cellKey(date, frame.id)
                    const items = cellMap.get(key) ?? []
                    const dimmed = Boolean(highlightDate && highlightDate !== date)

                    return (
                      <td
                        key={key}
                        className={[
                          'border-b border-r border-outline-variant p-2 align-top last:border-r-0',
                          frameAccent(frame.id).cellBg,
                          dimmed ? 'opacity-35' : '',
                        ].join(' ')}
                      >
                        {items.length === 0 ? (
                          <div className="flex min-h-[88px] items-center justify-center rounded-lg border border-dashed border-outline-variant bg-white/80 px-2 py-3">
                            <span className="text-[11px] text-on-surface-variant/60">Trống</span>
                          </div>
                        ) : (
                          <div className="flex min-h-[88px] flex-col gap-1.5">
                            {items.map((registration) => (
                              <ShiftChip
                                key={registration.id}
                                registration={registration}
                                frameId={frame.id}
                                checked={selectedIds.has(registration.id)}
                                isSaving={isSaving}
                                showCustomTime={frame.id === 'other'}
                                onToggle={() => onToggle(registration)}
                                onApprove={() => onApproveOne(registration)}
                              />
                            ))}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="font-display text-base font-bold text-on-surface">
                {statusFilter === 'PENDING' ? 'Không có ca chờ duyệt' : 'Không có dữ liệu trong bộ lọc này'}
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">Đổi tuần, ngày hoặc trạng thái để xem thêm.</p>
            </div>
          )}
        </div>
      )}

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-outline-variant bg-surface-container-low/60 px-4 py-2.5 text-xs text-on-surface-variant sm:px-5">
        <span>
          Hiển thị <strong className="text-on-surface">{filtered.length}</strong> ca trên lưới
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

function ShiftChip({
  registration,
  frameId,
  checked,
  isSaving,
  showCustomTime,
  onToggle,
  onApprove,
}: {
  registration: AdminShiftRegistration
  frameId: ShiftFrame['id']
  checked: boolean
  isSaving: boolean
  showCustomTime: boolean
  onToggle: () => void
  onApprove: () => void
}) {
  const isPending = registration.status === 'PENDING'
  const isApproved = registration.status === 'APPROVED'
  const isRejected = registration.status === 'REJECTED'
  const tone = shiftChipTone(frameId)

  return (
    <div
      className={[
        'rounded-lg border-l-4 px-2.5 py-2 shadow-sm transition',
        checked
          ? 'border-l-brand-orange border border-brand-orange bg-primary-container ring-1 ring-brand-orange/25'
          : isRejected
            ? 'border-l-error border border-error/25 bg-error-container/40'
            : [tone.border, tone.bg, isPending ? 'border border-dashed' : 'border'].join(' '),
      ].join(' ')}
    >
      <div className="flex items-start gap-1.5">
        {isPending ? (
          <input
            type="checkbox"
            checked={checked}
            onChange={onToggle}
            className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-outline text-brand-orange focus:ring-brand-orange"
            aria-label={`Chọn ca của ${registration.staffName}`}
          />
        ) : (
          <span className={['mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center text-[10px] font-bold', tone.accent].join(' ')}>
            {isApproved ? '✓' : '×'}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={[
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white',
                isRejected ? 'bg-error' : tone.avatar,
              ].join(' ')}
            >
              {staffInitials(registration.staffName)}
            </span>
            <p className="truncate text-xs font-bold text-on-surface">{registration.staffName}</p>
          </div>

          {showCustomTime && (
            <p className="mt-1 text-[10px] font-semibold tabular-nums text-on-surface-variant">
              {registration.startTime} – {registration.endTime}
            </p>
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <RegistrationStatusBadge status={registration.status} frameId={frameId} />
            {isPending && (
              <button
                type="button"
                onClick={onApprove}
                disabled={isSaving}
                className="rounded-md bg-brand-orange px-2 py-0.5 text-[10px] font-bold text-white transition hover:bg-brand-orangeHover disabled:opacity-50"
              >
                Duyệt
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Màu theo ca: sáng = cam, chiều = hổ phách, tối = xanh brand */
function shiftChipTone(frameId: ShiftFrame['id']) {
  switch (frameId) {
    case 'morning':
      return {
        border: 'border-l-brand-orange border-brand-orange/35',
        bg: 'bg-[#FFF4E8]',
        avatar: 'bg-brand-orange',
        accent: 'text-brand-orange',
      }
    case 'afternoon':
      return {
        border: 'border-l-tertiary border-tertiary/35',
        bg: 'bg-[#FEF3C7]',
        avatar: 'bg-tertiary',
        accent: 'text-tertiary',
      }
    case 'evening':
      return {
        border: 'border-l-brand-greenDark border-brand-greenDark/30',
        bg: 'bg-[#E8F5EC]',
        avatar: 'bg-brand-greenDark',
        accent: 'text-brand-greenDark',
      }
    default:
      return {
        border: 'border-l-on-surface-variant border-outline-variant',
        bg: 'bg-white',
        avatar: 'bg-on-surface-variant',
        accent: 'text-on-surface-variant',
      }
  }
}

function frameAccent(frameId: ShiftFrame['id']) {
  switch (frameId) {
    case 'morning':
      return {
        labelBg: 'bg-[#FFF4E8]',
        labelText: 'text-brand-orange',
        cellBg: 'bg-[#FFFBF5]',
      }
    case 'afternoon':
      return {
        labelBg: 'bg-[#FEF3C7]/70',
        labelText: 'text-tertiary',
        cellBg: 'bg-[#FFFDF5]',
      }
    case 'evening':
      return {
        labelBg: 'bg-[#E8F5EC]',
        labelText: 'text-brand-greenDark',
        cellBg: 'bg-[#F3FAF5]',
      }
    default:
      return {
        labelBg: 'bg-surface-container-low',
        labelText: 'text-on-surface',
        cellBg: 'bg-white',
      }
  }
}

function cellKey(date: string, frameId: string) {
  return `${date}|${frameId}`
}

function buildCellMap(items: AdminShiftRegistration[]) {
  const map = new Map<string, AdminShiftRegistration[]>()

  const sorted = [...items].sort((a, b) => {
    const byStart = a.startTime.localeCompare(b.startTime)
    if (byStart !== 0) return byStart
    return a.staffName.localeCompare(b.staffName, 'vi')
  })

  sorted.forEach((item) => {
    const frame = matchShiftFrame(item.startTime, item.endTime)
    const key = cellKey(item.workDate, frame.id)
    const list = map.get(key) ?? []
    list.push(item)
    map.set(key, list)
  })

  return map
}
