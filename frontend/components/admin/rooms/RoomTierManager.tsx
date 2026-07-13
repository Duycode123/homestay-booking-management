'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { formatRoomPrice, validateRoomTypeForm } from '@/lib/admin/rooms/adminRoomApi'
import type {
  AdminRoom,
  AdminRoomTypeOption,
  RoomTypeFormData,
  RoomTypeFormErrors,
} from '@/lib/admin/rooms/types'

type RoomTierManagerProps = {
  roomTypes: AdminRoomTypeOption[]
  rooms: AdminRoom[]
  isLoading: boolean
  onCreate: (data: RoomTypeFormData) => Promise<void>
  onUpdate: (id: number, data: RoomTypeFormData) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

const EMPTY_FORM: RoomTypeFormData = {
  typeName: '',
  description: '',
  pricePerHour: 0,
}

const inputClass =
  'h-10 w-full rounded-xl border border-outline bg-surface-container-lowest px-3 text-sm text-on-surface outline-none transition-all focus:border-brand-orange focus:bg-white focus:ring-2 focus:ring-brand-orange/15'

const labelClass =
  'mb-1.5 block font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant'

export default function RoomTierManager({
  roomTypes,
  rooms,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
}: RoomTierManagerProps) {
  const [form, setForm] = useState<RoomTypeFormData>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [errors, setErrors] = useState<RoomTypeFormErrors>({})
  const [serverError, setServerError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)

  const roomCountByTypeId = useMemo(() => {
    const counts = new Map<number, number>()
    rooms.forEach((room) => {
      if (!room.roomTypeId) return
      counts.set(room.roomTypeId, (counts.get(room.roomTypeId) ?? 0) + 1)
    })
    return counts
  }, [rooms])

  useEffect(() => {
    if (!editingId) return
    const current = roomTypes.find((roomType) => roomType.id === editingId)
    if (!current) {
      resetForm()
      return
    }

    setForm({
      typeName: current.label,
      description: current.description,
      pricePerHour: current.pricePerHour,
    })
  }, [editingId, roomTypes])

  const set = (patch: Partial<RoomTypeFormData>) => {
    setForm((current) => ({ ...current, ...patch }))
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setErrors({})
    setServerError('')
    setIsSaving(false)
    setPendingDeleteId(null)
  }

  const startEdit = (roomType: AdminRoomTypeOption) => {
    setEditingId(roomType.id)
    setForm({
      typeName: roomType.label,
      description: roomType.description,
      pricePerHour: roomType.pricePerHour,
    })
    setErrors({})
    setServerError('')
    setPendingDeleteId(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationErrors = validateRoomTypeForm(form)

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setServerError('')
    setIsSaving(true)

    try {
      if (editingId) {
        await onUpdate(editingId, form)
      } else {
        await onCreate(form)
      }
      resetForm()
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Không thể lưu hạng phòng.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (roomType: AdminRoomTypeOption) => {
    setDeletingId(roomType.id)
    setServerError('')

    try {
      await onDelete(roomType.id)
      setPendingDeleteId(null)
      if (editingId === roomType.id) {
        resetForm()
      }
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Không thể xóa hạng phòng.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="overflow-hidden rounded-2xl border border-outline-variant/80 bg-white shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-low/50 px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-on-surface">Hạng phòng</h2>
            <p className="text-xs text-on-surface-variant">Quản lý tên hạng, giá theo giờ và mô tả dùng khi tạo phòng.</p>
          </div>
          <p className="rounded-full bg-primary-container px-3 py-1 text-xs font-semibold text-on-primary-container">
            {roomTypes.length} hạng
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-xl bg-surface-container-low" />
            ))}
          </div>
        ) : roomTypes.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="font-display text-base font-bold text-on-surface">Chưa có hạng phòng</p>
            <p className="mt-1 text-sm text-on-surface-variant">Tạo hạng phòng đầu tiên để có thể thêm phòng homestay.</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/70">
            {roomTypes.map((roomType) => {
              const roomCount = roomCountByTypeId.get(roomType.id) ?? 0
              const isEditing = editingId === roomType.id

              return (
                <div
                  key={roomType.id}
                  className={[
                    'grid gap-3 px-5 py-4 transition-colors md:grid-cols-[minmax(0,1fr)_150px_120px_150px]',
                    isEditing ? 'bg-primary-container/20' : 'hover:bg-surface-container-lowest',
                  ].join(' ')}
                >
                  <div className="min-w-0">
                    <p className="font-display text-sm font-bold text-on-surface">{roomType.label}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-on-surface-variant">
                      {roomType.description || 'Chưa có mô tả.'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-on-surface-variant">Giá/giờ</p>
                    <p className="mt-1 font-display text-sm font-bold text-brand-orange">
                      {formatRoomPrice(roomType.pricePerHour)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-on-surface-variant">Đang dùng</p>
                    <p className="mt-1 text-sm font-semibold text-on-surface">{roomCount} phòng</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    {pendingDeleteId === roomType.id ? (
                      <div className="w-full rounded-xl border border-error/25 bg-error-container/20 p-2 md:w-auto">
                        <p className="mb-2 max-w-[180px] text-xs leading-relaxed text-error">
                          {roomCount > 0
                            ? `Đang có ${roomCount} phòng sử dụng hạng này.`
                            : 'Xác nhận xóa hạng phòng này?'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void handleDelete(roomType)}
                            disabled={deletingId === roomType.id}
                            className="rounded-lg bg-error px-2.5 py-1.5 font-display text-xs font-medium text-white transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId === roomType.id ? 'Đang xóa' : 'Xác nhận'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteId(null)}
                            disabled={deletingId === roomType.id}
                            className="rounded-lg border border-outline-variant px-2.5 py-1.5 font-display text-xs font-medium text-on-surface-variant transition-colors hover:border-brand-orange/40 hover:text-brand-orange disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startEdit(roomType)}
                          className="rounded-lg border border-outline-variant px-2.5 py-1.5 font-display text-xs font-medium text-on-surface-variant transition-colors hover:border-brand-orange/40 hover:text-brand-orange"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(roomType.id)}
                          disabled={deletingId === roomType.id}
                          className="rounded-lg border border-error/25 px-2.5 py-1.5 font-display text-xs font-medium text-error transition-colors hover:bg-error-container/30 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Xóa
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="rounded-2xl border border-outline-variant/80 bg-white p-5 shadow-[var(--shadow-card)]"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-bold text-on-surface">
              {editingId ? 'Sửa hạng phòng' : 'Thêm hạng phòng'}
            </h3>
            <p className="text-xs text-on-surface-variant">Giá hạng phòng sẽ cập nhật trên các phòng liên quan.</p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-outline-variant px-2.5 py-1.5 font-display text-xs font-medium text-on-surface-variant transition-colors hover:border-brand-orange/40 hover:text-brand-orange"
            >
              Mới
            </button>
          )}
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className={labelClass}>Tên hạng</span>
            <input
              type="text"
              value={form.typeName}
              onChange={(event) => set({ typeName: event.target.value })}
              className={inputClass}
              placeholder="VD: Family"
            />
            {errors.typeName && <p className="mt-1 text-xs text-error">{errors.typeName}</p>}
          </label>

          <label className="block">
            <span className={labelClass}>Giá/giờ (VND)</span>
            <input
              type="number"
              min={1000}
              step={1000}
              value={form.pricePerHour || ''}
              onChange={(event) => set({ pricePerHour: Number(event.target.value) })}
              className={inputClass}
              placeholder="300000"
            />
            {errors.pricePerHour && <p className="mt-1 text-xs text-error">{errors.pricePerHour}</p>}
          </label>

          <label className="block">
            <span className={labelClass}>Mô tả</span>
            <textarea
              value={form.description}
              onChange={(event) => set({ description: event.target.value })}
              rows={4}
              maxLength={2000}
              className="w-full rounded-xl border border-outline bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface outline-none transition-all focus:border-brand-orange focus:bg-white focus:ring-2 focus:ring-brand-orange/15"
              placeholder="Mô tả ngắn về trang tiện nghi, không gian hoặc mục đích sử dụng."
            />
            <p className="mt-1 text-right text-[10px] text-on-surface-variant">{form.description.length}/2000</p>
            {errors.description && <p className="mt-1 text-xs text-error">{errors.description}</p>}
          </label>

          {serverError && (
            <p className="rounded-xl border border-error/30 bg-error-container/30 px-3 py-2.5 text-xs text-error">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-xl bg-brand-orange px-4 py-2.5 font-display text-sm font-medium text-white shadow-md shadow-brand-orange/20 transition-colors hover:bg-brand-orangeHover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? 'Đang lưu...' : editingId ? 'Lưu hạng phòng' : 'Thêm hạng phòng'}
          </button>
        </div>
      </form>
    </section>
  )
}
