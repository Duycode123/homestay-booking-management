'use client'

import { useEffect, useState } from 'react'
import {
  DISCOUNT_TYPE_LABELS,
  DISCOUNT_TYPE_OPTIONS,
} from '@/lib/admin/coupons/couponLabels'
import {
  previewCouponFromForm,
  validateCouponForm,
  validateCouponPreview,
} from '@/lib/admin/coupons/adminCouponApi'
import type { CouponFormData, CouponRoomOption } from '@/lib/admin/coupons/types'

type CouponFormModalProps = {
  open: boolean
  mode: 'create' | 'edit'
  initialData: CouponFormData
  rooms: CouponRoomOption[]
  onClose: () => void
  onSubmit: (data: CouponFormData) => Promise<void>
}

const inputClass =
  'h-11 w-full rounded-xl border border-outline bg-surface-container-lowest px-3 text-sm text-on-surface outline-none transition-all focus:border-brand-orange focus:bg-white focus:ring-2 focus:ring-brand-orange/15'

const labelClass =
  'mb-1.5 block font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant'

export default function CouponFormModal({
  open,
  mode,
  initialData,
  rooms,
  onClose,
  onSubmit,
}: CouponFormModalProps) {
  const [form, setForm] = useState<CouponFormData>(initialData)
  const [applyToAllRooms, setApplyToAllRooms] = useState(true)
  const [errors, setErrors] = useState<Partial<Record<keyof CouponFormData, string>>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [serverError, setServerError] = useState('')
  const [previewMessage, setPreviewMessage] = useState('')
  const [previewDiscount, setPreviewDiscount] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return

    setForm(initialData)
    setApplyToAllRooms(initialData.roomIds.length === 0)
    setErrors({})
    setServerError('')
    setPreviewMessage('')
    setPreviewDiscount(null)
  }, [initialData, open])

  if (!open) return null

  const set = (patch: Partial<CouponFormData>) => setForm((currentForm) => ({ ...currentForm, ...patch }))

  const allRoomIds = rooms.map((room) => room.roomId)

  const isRoomChecked = (roomId: number) => applyToAllRooms || form.roomIds.includes(roomId)

  const selectAllRooms = () => {
    setApplyToAllRooms(true)
    setForm((currentForm) => ({ ...currentForm, roomIds: [] }))
  }

  const deselectAllRooms = () => {
    setApplyToAllRooms(false)
    setForm((currentForm) => ({ ...currentForm, roomIds: [] }))
  }

  const toggleRoom = (roomId: number) => {
    if (applyToAllRooms) {
      setApplyToAllRooms(false)
      setForm((currentForm) => ({
        ...currentForm,
        roomIds: allRoomIds.filter((id) => id !== roomId),
      }))
      return
    }

    const selected = new Set(form.roomIds)
    if (selected.has(roomId)) {
      selected.delete(roomId)
    } else {
      selected.add(roomId)
    }

    const nextRoomIds = Array.from(selected)
    if (nextRoomIds.length === allRoomIds.length) {
      selectAllRooms()
      return
    }

    setForm((currentForm) => ({ ...currentForm, roomIds: nextRoomIds }))
  }

  const handlePreview = () => {
    const orderAmount = Number(form.previewOrderAmount)
    const validationErrors = validateCouponPreview(form)

    if (Object.keys(validationErrors).length > 0) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        ...validationErrors,
      }))
      setPreviewMessage('')
      setPreviewDiscount(null)
      return
    }

    const result = previewCouponFromForm(form, orderAmount)

    if (result.valid) {
      setPreviewDiscount(result.discountAmount ?? 0)
      setPreviewMessage(result.message)
    } else {
      setPreviewDiscount(null)
      setPreviewMessage(result.message)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const validationErrors = validateCouponForm(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setIsSaving(true)
    setServerError('')

    try {
      await onSubmit(form)
      onClose()
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Không thể lưu mã giảm giá.')
    } finally {
      setIsSaving(false)
    }
  }

  const allRoomsSelected = applyToAllRooms

  return (
    <>
      <button
        type="button"
        aria-label="Đóng form"
        onClick={onClose}
        className="fixed inset-0 z-50 bg-inverse-surface/50 backdrop-blur-sm"
      />

      <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="coupon-form-title"
          className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-outline-variant bg-white shadow-[var(--shadow-elevated)] sm:rounded-3xl"
        >
          <header className="relative overflow-hidden border-b border-outline-variant bg-gradient-to-r from-brand-greenDark to-brand-greenLight px-6 py-5 text-white">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-orange/20 blur-2xl"
            />
            <p className="relative font-display text-[10px] font-medium uppercase tracking-[0.15em] text-brand-orange">
              {mode === 'create' ? 'Thêm mới' : 'Chỉnh sửa'}
            </p>
            <h2 id="coupon-form-title" className="relative font-display text-xl font-bold">
              {mode === 'create' ? 'Tạo mã giảm giá mới' : 'Cập nhật mã giảm giá'}
            </h2>
          </header>

          <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <label className="block">
                <span className={labelClass}>
                  Mã giảm giá <span className="text-error">*</span>
                </span>
                <input
                  type="text"
                  value={form.code}
                  onChange={(event) => set({ code: event.target.value.toUpperCase() })}
                  className={inputClass}
                  placeholder="VD: SUMMER10"
                />
                {errors.code && <p className="mt-1 text-xs text-error">{errors.code}</p>}
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>
                    Loại giảm <span className="text-error">*</span>
                  </span>
                  <select
                    value={form.type}
                    onChange={(event) => set({ type: event.target.value as CouponFormData['type'] })}
                    className={inputClass}
                  >
                    {DISCOUNT_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {DISCOUNT_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className={labelClass}>
                    Giá trị <span className="text-error">*</span>
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.value}
                    onChange={(event) => set({ value: event.target.value })}
                    className={inputClass}
                    placeholder={form.type === 'PERCENTAGE' ? '10' : '50000'}
                  />
                  {errors.value && <p className="mt-1 text-xs text-error">{errors.value}</p>}
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Đơn tối thiểu (VND)</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={form.minOrderValue}
                    onChange={(event) => set({ minOrderValue: event.target.value })}
                    className={inputClass}
                    placeholder="100000"
                  />
                  {errors.minOrderValue && <p className="mt-1 text-xs text-error">{errors.minOrderValue}</p>}
                </label>

                <label className="block">
                  <span className={labelClass}>Ngày hết hạn</span>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(event) => set({ expiresAt: event.target.value })}
                    className={inputClass}
                  />
                </label>
              </div>

              <section className="rounded-2xl border border-outline-variant bg-surface-container-low/40 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-sm font-bold text-on-surface">Phòng áp dụng</h3>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      Không chọn phòng = áp dụng toàn bộ phòng. Hệ thống hiện lưu mã giảm giá toàn hệ thống; phần chọn phòng
                      giúp ghi nhận phạm vi dự kiến trên UI.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={allRoomsSelected ? deselectAllRooms : selectAllRooms}
                    className="shrink-0 rounded-lg border border-outline px-3 py-1.5 font-display text-xs font-medium text-brand-orange hover:bg-white"
                  >
                    {allRoomsSelected ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                  </button>
                </div>

                <div className="grid max-h-40 gap-2 overflow-y-auto sm:grid-cols-2">
                  {rooms.map((room) => {
                    const checked = isRoomChecked(room.roomId)

                    return (
                      <label
                        key={room.roomId}
                        className="flex cursor-pointer items-center gap-2 rounded-xl border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface hover:border-brand-orange/40"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRoom(room.roomId)}
                          className="h-4 w-4 rounded border-outline text-brand-orange focus:ring-brand-orange"
                        />
                        <span className="line-clamp-1">{room.roomName}</span>
                      </label>
                    )
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-brand-orange/20 bg-primary-container/20 p-4">
                <h3 className="font-display text-sm font-bold text-on-surface">Xem trước giảm giá</h3>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Ước tính mức giảm theo thông tin đang nhập — không cần lưu mã giảm giá trước.
                </p>

                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={form.previewOrderAmount}
                    onChange={(event) => set({ previewOrderAmount: event.target.value })}
                    className={inputClass}
                    placeholder="500000"
                  />
                  <button
                    type="button"
                    onClick={handlePreview}
                    className="h-11 shrink-0 rounded-xl border border-brand-orange bg-white px-4 font-display text-sm font-medium text-brand-orange hover:bg-primary-container/30"
                  >
                    Xem trước
                  </button>
                </div>
                {errors.previewOrderAmount && (
                  <p className="mt-1 text-xs text-error">{errors.previewOrderAmount}</p>
                )}
                {previewMessage && (
                  <p className="mt-3 rounded-xl border border-outline-variant bg-white px-3 py-2 text-xs text-on-surface-variant">
                    {previewMessage}
                    {previewDiscount != null && previewDiscount > 0 && (
                      <span className="mt-1 block font-semibold text-brand-orange">
                        Giảm{' '}
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                          maximumFractionDigits: 0,
                        }).format(previewDiscount)}
                      </span>
                    )}
                  </p>
                )}
              </section>

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
                disabled={isSaving}
                className="rounded-xl bg-brand-orange px-5 py-2.5 font-display text-sm font-medium text-white shadow-md shadow-brand-orange/20 hover:bg-brand-orangeHover disabled:opacity-50"
              >
                {isSaving ? 'Đang lưu...' : 'Lưu mã giảm giá'}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </>
  )
}
