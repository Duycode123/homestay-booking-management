'use client'

import { useMemo, useState } from 'react'
import StaffScheduleSlotDialog from '@/components/admin/staff-schedule/StaffScheduleSlotDialog'
import type { AdminShiftRegistration } from '@/lib/admin/staff-schedule/adminShiftRegistrationApi'
import {
  formatDate,
  matchShiftFrame,
  staffInitials,
} from '@/lib/admin/staff-schedule/staffScheduleUtils'

type StaffScheduleApprovalQueueProps = {
  registrations: AdminShiftRegistration[]
  highlightDate: string | null
  isLoading: boolean
  isSaving: boolean
  onApprove: (registration: AdminShiftRegistration) => void
  onApproveMany: (registrations: AdminShiftRegistration[]) => void
  onReject: (registration: AdminShiftRegistration) => void
}

type PendingGroup = {
  key: string
  date: string
  startTime: string
  endTime: string
  registrations: AdminShiftRegistration[]
}

export default function StaffScheduleApprovalQueue({
  registrations,
  highlightDate,
  isLoading,
  isSaving,
  onApprove,
  onApproveMany,
  onReject,
}: StaffScheduleApprovalQueueProps) {
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null)
  const groups = useMemo(
    () => groupPendingRegistrations(registrations, highlightDate),
    [highlightDate, registrations],
  )
  const pendingCount = groups.reduce((total, group) => total + group.registrations.length, 0)
  const activeGroup = groups.find((group) => group.key === activeGroupKey) ?? null

  return (
    <>
      <aside className="flex max-h-[min(75vh,760px)] flex-col overflow-hidden rounded-[24px] border border-[#ded2c3] bg-white shadow-[0_18px_52px_rgba(31,54,44,0.08)]">
        <div className="border-b border-[#e8dfd4] bg-[linear-gradient(145deg,#173a31,#285347)] px-5 py-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e5c29a]">Cần xử lý</p>
              <h2 className="mt-1 font-editorial text-2xl">Hàng đợi theo ca</h2>
              <p className="mt-1 text-xs leading-5 text-white/70">
                {highlightDate ? 'Đang lọc theo ngày được chọn trên lịch.' : 'Mỗi thẻ là một ca có người chờ duyệt.'}
              </p>
            </div>
            <span className="flex h-10 min-w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 px-3 font-display text-lg font-bold text-[#f0cfa8]" title={`${pendingCount} nhân viên chờ duyệt`}>
              {isLoading ? '…' : groups.length}
            </span>
          </div>
          {!isLoading && pendingCount > 0 && (
            <p className="mt-3 text-[11px] text-white/60">{groups.length} ca · {pendingCount} nhân viên đang chờ</p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-2xl bg-surface-container-low" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[#dcd1c3] bg-[#fbf8f3] px-5 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eaf3ee] text-secondary">
                <CheckIcon />
              </span>
              <p className="mt-4 font-display text-sm font-bold text-on-surface">Đã xử lý hết yêu cầu</p>
              <p className="mt-1 text-xs leading-5 text-on-surface-variant">Không còn ca chờ duyệt trong phạm vi đang xem.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {groups.map((group) => (
                <ShiftApprovalCard
                  key={group.key}
                  group={group}
                  isSaving={isSaving}
                  onOpen={() => setActiveGroupKey(group.key)}
                  onApprove={() => onApproveMany(group.registrations)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-[#e8dfd4] bg-[#fbf8f3] px-4 py-3 text-[11px] leading-5 text-on-surface-variant">
          Bấm vào một ca để xem nhân viên, duyệt từng người hoặc duyệt toàn bộ.
        </div>
      </aside>

      {activeGroup && (
        <StaffScheduleSlotDialog
          open
          date={activeGroup.date}
          frame={{
            ...matchShiftFrame(activeGroup.startTime, activeGroup.endTime),
            startTime: activeGroup.startTime,
            endTime: activeGroup.endTime,
          }}
          registrations={activeGroup.registrations}
          isSaving={isSaving}
          onClose={() => setActiveGroupKey(null)}
          onApprove={onApprove}
          onApproveMany={onApproveMany}
          onReject={onReject}
        />
      )}
    </>
  )
}

function ShiftApprovalCard({
  group,
  isSaving,
  onOpen,
  onApprove,
}: {
  group: PendingGroup
  isSaving: boolean
  onOpen: () => void
  onApprove: () => void
}) {
  const frame = matchShiftFrame(group.startTime, group.endTime)
  const preview = group.registrations.slice(0, 4)

  return (
    <article className="rounded-2xl border border-[#e6ddd1] bg-[#fffdf9] p-3.5 transition hover:border-[#cdb79c] hover:shadow-[0_10px_30px_rgba(31,54,44,0.08)]">
      <button type="button" onClick={onOpen} className="group w-full text-left" aria-label={`Xem ${group.registrations.length} nhân viên trong ${frame.name}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold capitalize text-on-surface">{formatDate(group.date)}</p>
            <p className="mt-1 font-display text-base font-bold text-secondary">{frame.name}</p>
            <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-on-surface-variant">{group.startTime}–{group.endTime}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#f3e5d5] px-2.5 py-1 text-[10px] font-bold text-[#8a6239]">
            {group.registrations.length} người
            <ChevronIcon />
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-[#f7f3ed] px-3 py-2.5">
          <div className="flex -space-x-2">
            {preview.map((registration) => (
              <span key={registration.id} title={registration.staffName} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#f7f3ed] bg-secondary text-[9px] font-bold text-white">
                {staffInitials(registration.staffName)}
              </span>
            ))}
            {group.registrations.length > preview.length && (
              <span className="flex h-8 min-w-8 items-center justify-center rounded-full border-2 border-[#f7f3ed] bg-[#e8ded1] px-1 text-[9px] font-bold text-on-surface-variant">+{group.registrations.length - preview.length}</span>
            )}
          </div>
          <span className="text-[11px] font-semibold text-on-surface-variant transition group-hover:text-secondary">Xem danh sách</span>
        </div>
      </button>

      <button type="button" onClick={onApprove} disabled={isSaving} className="mt-2.5 h-9 w-full rounded-xl bg-secondary text-xs font-bold text-white shadow-[0_7px_18px_rgba(23,58,49,0.16)] transition hover:bg-[#103b30] disabled:opacity-50">
        Duyệt cả ca ({group.registrations.length})
      </button>
    </article>
  )
}

function groupPendingRegistrations(registrations: AdminShiftRegistration[], highlightDate: string | null) {
  const map = new Map<string, PendingGroup>()

  registrations
    .filter((item) => item.status === 'PENDING' && (!highlightDate || item.workDate === highlightDate))
    .forEach((registration) => {
      const key = `${registration.workDate}|${registration.startTime}|${registration.endTime}`
      const existing = map.get(key)
      if (existing) {
        existing.registrations.push(registration)
      } else {
        map.set(key, {
          key,
          date: registration.workDate,
          startTime: registration.startTime,
          endTime: registration.endTime,
          registrations: [registration],
        })
      }
    })

  return [...map.values()]
    .map((group) => ({
      ...group,
      registrations: group.registrations.sort((first, second) => first.staffName.localeCompare(second.staffName, 'vi')),
    }))
    .sort((first, second) => {
      const byDate = first.date.localeCompare(second.date)
      if (byDate !== 0) return byDate
      return first.startTime.localeCompare(second.startTime)
    })
}

function CheckIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.5 2.5 5.5-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronIcon() {
  return <svg aria-hidden viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
