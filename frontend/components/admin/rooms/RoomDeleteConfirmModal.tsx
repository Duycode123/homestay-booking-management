'use client'

import { useEffect, useState } from 'react'
import type { AdminRoom } from '@/lib/admin/rooms/types'

type RoomDeleteConfirmModalProps = {
  room: AdminRoom | null
  onClose: () => void
  onConfirm: (roomId: string) => Promise<void>
}

export default function RoomDeleteConfirmModal({
  room,
  onClose,
  onConfirm,
}: RoomDeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!room) return
    setError('')
    setIsDeleting(false)
  }, [room])

  if (!room) return null

  const handleConfirm = async () => {
    setIsDeleting(true)
    setError('')

    try {
      await onConfirm(room.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa phòng homestay.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Đóng xác nhận xóa"
        onClick={onClose}
        className="fixed inset-0 z-50 bg-inverse-surface/50 backdrop-blur-sm"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-room-title"
          className="w-full max-w-md rounded-3xl border border-outline-variant bg-white p-6 shadow-[var(--shadow-elevated)]"
        >
          <p className="font-display text-[10px] font-semibold uppercase tracking-[0.16em] text-error">
            Xác nhận xóa
          </p>
          <h2 id="delete-room-title" className="mt-1 font-display text-xl font-bold text-on-surface">
            Xóa phòng homestay này?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
            Bạn đang xóa <strong className="text-on-surface">{room.name}</strong> ({room.code}).
            Phòng sẽ được gỡ khỏi danh sách đang hoạt động nhưng lịch sử booking, thanh toán và đánh giá vẫn được bảo toàn.
          </p>

          {room.status === 'occupied' && (
            <p className="mt-4 rounded-2xl border border-tertiary-container bg-tertiary-container/30 px-4 py-3 text-xs text-on-tertiary-container">
              Phòng đang có khách nên chưa thể xóa. Hãy checkout và kết toán booking trước.
            </p>
          )}

          {error && (
            <p className="mt-4 rounded-2xl border border-error/30 bg-error-container/30 px-4 py-3 text-xs text-error">
              {error}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="rounded-xl border border-outline px-5 py-2.5 font-display text-sm font-medium text-on-surface-variant hover:bg-surface-container-low disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={isDeleting}
              className="rounded-xl bg-error px-5 py-2.5 font-display text-sm font-medium text-white hover:bg-error/90 disabled:opacity-50"
            >
              {isDeleting ? 'Đang xóa...' : 'Xóa phòng'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
