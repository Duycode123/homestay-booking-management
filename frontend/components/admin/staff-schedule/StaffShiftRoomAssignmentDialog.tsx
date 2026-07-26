'use client'

import ProjectSelect from '@/components/ui/ProjectSelect'
import type { AdminShiftRegistration } from '@/lib/admin/staff-schedule/adminShiftRegistrationApi'
import { formatDate } from '@/lib/admin/staff-schedule/staffScheduleUtils'
import type { BackendRoom } from '@/lib/rooms-api'

type StaffShiftRoomAssignmentDialogProps = {
  registrations: AdminShiftRegistration[] | null
  rooms: BackendRoom[]
  selectedRoomId: string
  errorMessage: string
  isLoadingRooms: boolean
  isSaving: boolean
  onRoomChange: (roomId: string) => void
  onClose: () => void
  onConfirm: () => void
}

export default function StaffShiftRoomAssignmentDialog({
  registrations,
  rooms,
  selectedRoomId,
  errorMessage,
  isLoadingRooms,
  isSaving,
  onRoomChange,
  onClose,
  onConfirm,
}: StaffShiftRoomAssignmentDialogProps) {
  if (!registrations?.length) return null

  const first = registrations[0]
  const selectedRoom = rooms.find((room) => String(room.id) === selectedRoomId)

  return (
    <div
      className="fixed inset-0 z-[220] flex items-end justify-center bg-[#10251e]/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Phân công căn lưu trú"
    >
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Đóng" />

      <section className="relative w-full max-w-xl overflow-hidden rounded-t-[28px] border border-[#dfd3c5] bg-white shadow-[0_30px_90px_rgba(12,35,28,0.3)] sm:rounded-[28px]">
        <div className="bg-[linear-gradient(140deg,#173a31,#285347)] px-6 py-5 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e5c29a]">
            Phân công địa điểm làm việc
          </p>
          <h2 className="mt-1 font-editorial text-2xl">Chọn căn cho ca làm</h2>
          <p className="mt-2 text-sm leading-6 text-white/75">
            {registrations.length === 1
              ? `${first.staffName} · ${formatDate(first.workDate)} · ${first.startTime}–${first.endTime}`
              : `${registrations.length} ca đang chọn sẽ được phân công cùng một căn.`}
          </p>
        </div>

        <div className="space-y-5 p-6">
          <div className="rounded-2xl border border-[#e4d9cc] bg-[#fbf8f3] p-4">
            <p className="text-sm font-bold text-on-surface">Vì sao cần chọn căn?</p>
            <p className="mt-1 text-sm leading-6 text-on-surface-variant">
              Lịch, booking trong ca và vị trí GPS khi check-in đều được đối chiếu theo đúng căn nhân viên phụ trách.
            </p>
          </div>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
              Căn lưu trú <span className="text-error">*</span>
            </span>
            <ProjectSelect
              value={selectedRoomId}
              onChange={(event) => onRoomChange(event.target.value)}
              disabled={isLoadingRooms || isSaving}
              aria-label="Chọn căn lưu trú"
            >
              <option value="">{isLoadingRooms ? 'Đang tải danh sách căn…' : 'Chọn căn cần phụ trách'}</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.roomName} · {room.district || room.addressLine || room.city || 'Chưa có khu vực'}
                </option>
              ))}
            </ProjectSelect>
          </label>

          {selectedRoom && (
            <div className="rounded-2xl border border-secondary/15 bg-[#f2f7f4] p-4">
              <p className="font-display text-base font-bold text-secondary">{selectedRoom.roomName}</p>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                {[selectedRoom.addressLine, selectedRoom.ward, selectedRoom.district, selectedRoom.city]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              <p className="mt-2 text-xs font-semibold text-secondary">
                Bán kính check-in: {selectedRoom.checkInRadiusMeters ?? 100}m
              </p>
            </div>
          )}

          {!isLoadingRooms && rooms.length === 0 && (
            <p className="rounded-xl border border-error/25 bg-error-container/30 px-4 py-3 text-sm text-error">
              Chưa có căn đang hoạt động với tọa độ hợp lệ. Hãy cập nhật căn lưu trú trước khi duyệt ca.
            </p>
          )}

          {errorMessage && (
            <p className="rounded-xl border border-error/25 bg-error-container/30 px-4 py-3 text-sm text-error">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-[#e8dfd4] bg-[#fbf8f3] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="h-11 rounded-xl border border-[#d8ccbd] bg-white text-sm font-bold text-on-surface-variant transition hover:text-on-surface disabled:opacity-50"
          >
            Quay lại
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving || !selectedRoomId || rooms.length === 0}
            className="h-11 rounded-xl bg-secondary text-sm font-bold text-white shadow-[0_8px_20px_rgba(23,58,49,0.18)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? 'Đang phân công…' : `Duyệt ${registrations.length} ca`}
          </button>
        </div>
      </section>
    </div>
  )
}
