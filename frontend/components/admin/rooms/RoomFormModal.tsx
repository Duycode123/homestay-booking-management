'use client'

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { uploadAdminRoomImage, validateRoomForm } from '@/lib/admin/rooms/adminRoomApi'
import type { AdminRoomTypeOption, RoomFormData, RoomFormErrors } from '@/lib/admin/rooms/types'
import {
  roomCategoryLabels,
  roomCategoryOptions,
  roomStatusLabels,
  roomStatusOptions,
} from '@/lib/admin/rooms/types'

type RoomFormModalProps = {
  open: boolean
  mode: 'create' | 'edit'
  initialData: RoomFormData
  roomTypes?: AdminRoomTypeOption[]
  onClose: () => void
  onSubmit: (data: RoomFormData) => Promise<void>
}

const inputClass =
  'h-11 w-full rounded-xl border border-outline bg-surface-container-lowest px-3 text-sm text-on-surface outline-none transition-all focus:border-brand-orange focus:bg-white focus:ring-2 focus:ring-brand-orange/15'

const labelClass =
  'mb-1.5 block font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant'

export default function RoomFormModal({
  open,
  mode,
  initialData,
  roomTypes = [],
  onClose,
  onSubmit,
}: RoomFormModalProps) {
  const [form, setForm] = useState<RoomFormData>(initialData)
  const [errors, setErrors] = useState<RoomFormErrors>({})
  const [serverError, setServerError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  useEffect(() => {
    if (!open) return
    const firstRoomType = roomTypes[0]
    setForm(
      firstRoomType && !initialData.roomTypeId
        ? {
            ...initialData,
            roomTypeId: firstRoomType.id,
            category: firstRoomType.category,
            capacity: firstRoomType.capacity,
            pricePerHour: firstRoomType.pricePerHour,
          }
        : initialData,
    )
    setErrors({})
    setServerError('')
    setIsSaving(false)
    setIsUploadingImage(false)
  }, [open, initialData, roomTypes])

  if (!open) return null

  const set = (patch: Partial<RoomFormData>) => setForm((current) => ({ ...current, ...patch }))

  const handleRoomTypeChange = (value: string) => {
    const roomTypeId = Number(value)
    const roomType = roomTypes.find((item) => item.id === roomTypeId)

    if (!roomType) return

    set({
      roomTypeId: roomType.id,
      category: roomType.category,
      capacity: roomType.capacity,
      pricePerHour: roomType.pricePerHour,
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationErrors = validateRoomForm(form)

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setServerError('')
    setIsSaving(true)

    try {
      await onSubmit(form)
      onClose()
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Không thể lưu phòng homestay.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrors((current) => ({ ...current, image: 'File tải lên phải là ảnh.' }))
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((current) => ({ ...current, image: 'Ảnh phòng không được vượt quá 5MB.' }))
      return
    }

    setIsUploadingImage(true)
    setServerError('')
    setErrors((current) => ({ ...current, image: undefined }))

    try {
      const result = await uploadAdminRoomImage(file)
      set({ image: result.secureUrl })
    } catch (error) {
      setErrors((current) => ({
        ...current,
        image: error instanceof Error ? error.message : 'Không thể tải ảnh phòng lên máy chủ lưu trữ.',
      }))
    } finally {
      setIsUploadingImage(false)
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Đóng form phòng homestay"
        onClick={onClose}
        className="fixed inset-0 z-50 bg-inverse-surface/50 backdrop-blur-sm"
      />

      <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="room-form-title"
          className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-outline-variant bg-white shadow-[var(--shadow-elevated)] sm:rounded-3xl"
        >
          <header className="relative overflow-hidden border-b border-outline-variant bg-gradient-to-r from-brand-greenDark to-brand-greenLight px-6 py-5 text-white">
            <p className="font-display text-[10px] font-medium uppercase tracking-[0.15em] text-brand-orange">
              {mode === 'create' ? 'Thêm phòng' : 'Chỉnh sửa phòng'}
            </p>
            <h2 id="room-form-title" className="font-display text-xl font-bold">
              {mode === 'create' ? 'Thêm phòng homestay mới' : 'Cập nhật phòng homestay'}
            </h2>
          </header>

          <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>
                    Tên phòng <span className="text-error">*</span>
                  </span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) => set({ name: event.target.value })}
                    className={inputClass}
                    placeholder="VD: Deluxe Balcony 2011"
                    autoFocus
                  />
                  {errors.name && <p className="mt-1 text-xs text-error">{errors.name}</p>}
                </label>

                <label className="block">
                  <span className={labelClass}>
                    Hạng phòng <span className="text-error">*</span>
                  </span>
                  <select
                    value={roomTypes.length > 0 ? String(form.roomTypeId ?? '') : form.category}
                    onChange={(event) => {
                      if (roomTypes.length > 0) {
                        handleRoomTypeChange(event.target.value)
                        return
                      }

                      set({ category: event.target.value as RoomFormData['category'] })
                    }}
                    className={inputClass}
                  >
                    {roomTypes.length > 0
                      ? roomTypes.map((roomType) => (
                          <option key={roomType.id} value={roomType.id}>
                            {roomType.label}
                          </option>
                        ))
                      : roomCategoryOptions.map((category) => (
                          <option key={category} value={category}>
                            {roomCategoryLabels[category]}
                          </option>
                        ))}
                  </select>
                  {errors.category && <p className="mt-1 text-xs text-error">{errors.category}</p>}
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>
                    Trạng thái <span className="text-error">*</span>
                  </span>
                  <select
                    value={form.status}
                    onChange={(event) => set({ status: event.target.value as RoomFormData['status'] })}
                    className={inputClass}
                  >
                    {roomStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {roomStatusLabels[status]}
                      </option>
                    ))}
                  </select>
                  {errors.status && <p className="mt-1 text-xs text-error">{errors.status}</p>}
                </label>

                <label className="block">
                  <span className={labelClass}>Sức chứa</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={form.capacity === 0 ? '' : String(form.capacity)}
                    onChange={(event) => {
                      const digits = event.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
                      set({ capacity: digits ? Number(digits) : 0 })
                    }}
                    onBlur={() => {
                      if (form.capacity < 1) set({ capacity: 1 })
                      if (form.capacity > 100) set({ capacity: 100 })
                    }}
                    className={inputClass}
                  />
                  {errors.capacity && <p className="mt-1 text-xs text-error">{errors.capacity}</p>}
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
                <div className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-low">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.image || '/images/homestay-room-hero.png'} alt="" className="h-36 w-full object-cover" />
                </div>

                <div className="space-y-3">
                  <label className="block">
                    <span className={labelClass}>Ảnh phòng</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => void handleImageChange(event)}
                      disabled={isUploadingImage || isSaving}
                      className="block w-full text-sm text-on-surface-variant file:mr-3 file:rounded-xl file:border-0 file:bg-brand-orange file:px-4 file:py-2.5 file:font-display file:text-sm file:font-medium file:text-white hover:file:bg-brand-orangeHover disabled:opacity-60"
                    />
                    <p className="mt-1 text-[11px] text-on-surface-variant">
                      {isUploadingImage ? 'Đang tải ảnh lên...' : 'Tối đa 5MB.'}
                    </p>
                  </label>

                  <label className="block">
                    <span className={labelClass}>Đường dẫn hình ảnh</span>
                    <input
                      type="text"
                      value={form.image}
                      onChange={(event) => set({ image: event.target.value })}
                      className={inputClass}
                      placeholder="https://..."
                    />
                  </label>
                  {errors.image && <p className="text-xs text-error">{errors.image}</p>}
                </div>
              </div>

              {serverError && (
                <p className="rounded-xl border border-error/30 bg-error-container/30 px-3 py-2.5 text-xs text-error">
                  {serverError}
                </p>
              )}
            </div>

            <footer className="flex justify-end gap-2 border-t border-outline-variant bg-surface-container-low/40 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="rounded-xl border border-outline px-5 py-2.5 font-display text-sm font-medium text-on-surface-variant hover:bg-white disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSaving || isUploadingImage}
                className="rounded-xl bg-brand-orange px-5 py-2.5 font-display text-sm font-medium text-white shadow-md shadow-brand-orange/20 hover:bg-brand-orangeHover disabled:opacity-50"
              >
                {isUploadingImage ? 'Đang tải ảnh...' : isSaving ? 'Đang lưu...' : 'Lưu phòng'}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </>
  )
}
