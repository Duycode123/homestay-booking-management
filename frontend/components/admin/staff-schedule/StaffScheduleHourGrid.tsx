'use client'

import { useState } from 'react'
import StaffScheduleSlotDialog from '@/components/admin/staff-schedule/StaffScheduleSlotDialog'
import type { AdminShiftRegistration } from '@/lib/admin/staff-schedule/adminShiftRegistrationApi'
import {
  formatDayNumber,
  formatWeekday,
  isToday,
  matchShiftFrame,
  SHIFT_FRAMES,
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
  onHighlightDate: (date: string | null) => void
  onToggle: (registration: AdminShiftRegistration) => void
  onSelectAllPending: () => void
  onClearSelection: () => void
  onApproveOne: (registration: AdminShiftRegistration) => void
  onRejectOne: (registration: AdminShiftRegistration) => void
  onApproveMany: (registrations: AdminShiftRegistration[]) => void
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
  onHighlightDate,
  onToggle,
  onSelectAllPending,
  onClearSelection,
  onApproveOne,
  onRejectOne,
  onApproveMany,
  onApproveSelected,
}: StaffScheduleHourGridProps) {
  const [activeSlot, setActiveSlot] = useState<{ date: string; frameId: ShiftFrame['id'] } | null>(null)
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
  const activeFrame = activeSlot ? frames.find((frame) => frame.id === activeSlot.frameId) ?? null : null
  const activeRegistrations = activeSlot ? cellMap.get(cellKey(activeSlot.date, activeSlot.frameId)) ?? [] : []

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
    <>
    <section className="flex max-h-[min(75vh,760px)] flex-col overflow-hidden rounded-[24px] border border-[#e2d7ca] bg-white shadow-[0_18px_52px_rgba(31,54,44,0.08)]">
      <div className="flex shrink-0 flex-col gap-3 border-b border-[#e8dfd4] bg-[linear-gradient(135deg,#fff,#fbf8f3)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="font-display text-lg font-bold text-on-surface">Lịch theo khung giờ</h2>
          <p className="mt-0.5 text-sm text-on-surface-variant">
            Mỗi ô là một ca · bấm vào ô để xem danh sách nhân viên
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

          <div className="flex flex-wrap gap-1.5 rounded-xl bg-[#f4efe8] p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onStatusFilterChange(tab.id)}
                className={[
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition',
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
                      <button
                        type="button"
                        onClick={() => onHighlightDate(highlightDate === date ? null : date)}
                        className={[
                          'mx-auto w-full rounded-xl px-2 py-1.5 transition',
                          highlightDate === date ? 'bg-secondary text-white shadow-sm' : 'hover:bg-white',
                        ].join(' ')}
                        aria-pressed={highlightDate === date}
                        aria-label={`Lọc lịch ngày ${formatDayNumber(date)}`}
                      >
                        <span className={['block text-[10px] font-bold uppercase tracking-wide', highlightDate === date ? 'text-white/70' : today ? 'text-brand-orange' : 'text-on-surface-variant'].join(' ')}>
                          {formatWeekday(date)}
                        </span>
                        <span className={['mt-0.5 block font-display text-sm font-bold', highlightDate === date ? 'text-white' : today ? 'text-brand-orange' : 'text-on-surface'].join(' ')}>
                          {formatDayNumber(date)}
                        </span>
                        {today && <span className={['mt-0.5 block text-[10px] font-semibold', highlightDate === date ? 'text-white/75' : 'text-brand-orange'].join(' ')}>Hôm nay</span>}
                      </button>
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
                          <ShiftSlotSummary
                            items={items}
                            frameId={frame.id}
                            selectedIds={selectedIds}
                            onOpen={() => setActiveSlot({ date, frameId: frame.id })}
                          />
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
    {activeSlot && activeFrame && (
      <StaffScheduleSlotDialog
        open
        date={activeSlot.date}
        frame={activeFrame}
        registrations={activeRegistrations}
        selectedIds={selectedIds}
        isSaving={isSaving}
        onClose={() => setActiveSlot(null)}
        onToggle={onToggle}
        onApprove={onApproveOne}
        onApproveMany={onApproveMany}
        onReject={onRejectOne}
      />
    )}
    </>
  )
}

function ShiftSlotSummary({
  items,
  frameId,
  selectedIds,
  onOpen,
}: {
  items: AdminShiftRegistration[]
  frameId: ShiftFrame['id']
  selectedIds: Set<number>
  onOpen: () => void
}) {
  const pending = items.filter((item) => item.status === 'PENDING').length
  const approved = items.filter((item) => item.status === 'APPROVED').length
  const selected = items.filter((item) => selectedIds.has(item.id)).length
  const tone = shiftChipTone(frameId)
  const preview = items.slice(0, 3)

  return (
    <button
      type="button"
      onClick={onOpen}
      className={[
        'group flex min-h-[88px] w-full flex-col rounded-xl border-l-4 px-3 py-2.5 text-left shadow-sm transition',
        tone.border,
        tone.bg,
        'hover:-translate-y-0.5 hover:border-secondary/45 hover:shadow-[0_10px_24px_rgba(31,54,44,0.10)]',
        selected > 0 ? 'ring-2 ring-brand-orange/20' : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex -space-x-1.5">
          {preview.map((item, index) => (
            <span key={item.id} className={['flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[8px] font-bold text-white', index === 0 ? tone.avatar : 'bg-[#6f887d]'].join(' ')} title={item.staffName}>
              {initials(item.staffName)}
            </span>
          ))}
          {items.length > preview.length && (
            <span className="flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-white bg-[#eee5da] px-1 text-[8px] font-bold text-on-surface-variant">
              +{items.length - preview.length}
            </span>
          )}
        </div>
        <span className="font-editorial text-xl text-on-surface">{items.length}</span>
      </div>

      <div className="mt-auto flex items-end justify-between gap-2 pt-2">
        <div className="flex flex-wrap gap-1">
          {approved > 0 && <span className="rounded-md bg-secondary/10 px-1.5 py-0.5 text-[9px] font-bold text-secondary">{approved} đã duyệt</span>}
          {pending > 0 && <span className="rounded-md bg-[#f2e2d0] px-1.5 py-0.5 text-[9px] font-bold text-[#8c6238]">{pending} chờ</span>}
          {selected > 0 && <span className="rounded-md bg-brand-orange px-1.5 py-0.5 text-[9px] font-bold text-white">{selected} chọn</span>}
        </div>
        <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-on-surface-variant transition group-hover:translate-x-0.5 group-hover:text-secondary" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
    </button>
  )
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
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
