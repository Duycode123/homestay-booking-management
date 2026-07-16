'use client'

import ProjectSelect from '@/components/ui/ProjectSelect'

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

const MAX_ROOM_IMAGE_BYTES = 12 * 1024 * 1024
const MIN_ROOM_IMAGE_WIDTH = 1200
const MIN_ROOM_IMAGE_HEIGHT = 900
const SUPPORTED_ROOM_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function readImageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new window.Image()

    image.onload = () => {
      const dimensions = { width: image.naturalWidth, height: image.naturalHeight }
      URL.revokeObjectURL(objectUrl)
      resolve(dimensions)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Không thể đọc kích thước ảnh.'))
    }
    image.src = objectUrl
  })
}

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
  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(null)
  const isUploadingImage = uploadingImageIndex !== null

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
    setUploadingImageIndex(null)
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

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>, imageIndex: number) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (!SUPPORTED_ROOM_IMAGE_TYPES.has(file.type)) {
      setErrors((current) => ({ ...current, image: 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.' }))
      return
    }

    if (file.size > MAX_ROOM_IMAGE_BYTES) {
      setErrors((current) => ({ ...current, image: 'Ảnh phòng không được vượt quá 12MB.' }))
      return
    }

    try {
      const dimensions = await readImageDimensions(file)
      if (dimensions.width < MIN_ROOM_IMAGE_WIDTH || dimensions.height < MIN_ROOM_IMAGE_HEIGHT) {
        setErrors((current) => ({
          ...current,
          image: `Ảnh ${dimensions.width}×${dimensions.height}px quá nhỏ. Tối thiểu 1200×900px, khuyến nghị 1600×1200px (tỷ lệ 4:3).`,
        }))
        return
      }
    } catch {
      setErrors((current) => ({ ...current, image: 'Ảnh bị lỗi hoặc không thể đọc được.' }))
      return
    }

    setUploadingImageIndex(imageIndex)
    setServerError('')
    setErrors((current) => ({ ...current, image: undefined }))

    try {
      const result = await uploadAdminRoomImage(file)
      if (imageIndex === 0) {
        set({ image: result.secureUrl })
      } else {
        const additionalImages = [...form.additionalImages]
        additionalImages[imageIndex - 1] = result.secureUrl
        set({ additionalImages })
      }
    } catch (error) {
      setErrors((current) => ({
        ...current,
        image: error instanceof Error ? error.message : 'Không thể tải ảnh phòng lên máy chủ lưu trữ.',
      }))
    } finally {
      setUploadingImageIndex(null)
    }
  }

  const setImagePath = (imageIndex: number, value: string) => {
    if (imageIndex === 0) {
      set({ image: value })
      return
    }

    const additionalImages = [...form.additionalImages]
    while (additionalImages.length < 3) additionalImages.push('')
    additionalImages[imageIndex - 1] = value
    set({ additionalImages })
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
                  <ProjectSelect
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
                  </ProjectSelect>
                  {errors.category && <p className="mt-1 text-xs text-error">{errors.category}</p>}
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>
                    Trạng thái <span className="text-error">*</span>
                  </span>
                  <ProjectSelect
                    value={form.status}
                    onChange={(event) => set({ status: event.target.value as RoomFormData['status'] })}
                    className={inputClass}
                  >
                    {roomStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {roomStatusLabels[status]}
                      </option>
                    ))}
                  </ProjectSelect>
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

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>
                    Số phòng ngủ <span className="text-error">*</span>
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={20}
                    value={form.bedroomCount}
                    onChange={(event) => set({ bedroomCount: Number(event.target.value) })}
                    className={inputClass}
                  />
                  {errors.bedroomCount && <p className="mt-1 text-xs text-error">{errors.bedroomCount}</p>}
                </label>

                <label className="block">
                  <span className={labelClass}>
                    Số giường <span className="text-error">*</span>
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={50}
                    value={form.bedCount}
                    onChange={(event) => set({ bedCount: Number(event.target.value) })}
                    className={inputClass}
                  />
                  {errors.bedCount && <p className="mt-1 text-xs text-error">{errors.bedCount}</p>}
                </label>
              </div>

              <section>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <span className={labelClass}>Bộ ảnh phòng</span>
                    <p className="text-xs text-on-surface-variant">Thiết lập 1 ảnh đại diện và 3 ảnh phụ để hiển thị gallery trên trang chi tiết.</p>
                  </div>
                  <span className="rounded-full bg-primary-container px-3 py-1 text-xs font-bold text-on-primary-container">4 ảnh</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[form.image, ...form.additionalImages, '', '', ''].slice(0, 4).map((image, imageIndex) => (
                    <label key={imageIndex} className="group relative block cursor-pointer overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-low">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image || '/images/homestay-luxury-hero.webp'} alt="" className="h-28 w-full object-cover transition group-hover:scale-105" />
                      <span className="absolute inset-x-2 bottom-2 rounded-lg bg-secondary/85 px-2 py-1 text-center text-[10px] font-bold text-white backdrop-blur-sm">
                        {uploadingImageIndex === imageIndex ? 'Đang tải...' : imageIndex === 0 ? 'Ảnh đại diện' : `Ảnh phụ ${imageIndex}`}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => void handleImageChange(event, imageIndex)}
                        disabled={isUploadingImage || isSaving}
                        className="sr-only"
                      />
                    </label>
                  ))}
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {[form.image, ...form.additionalImages, '', '', ''].slice(0, 4).map((image, imageIndex) => (
                    <label key={`path-${imageIndex}`} className="rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">
                        {imageIndex === 0 ? 'Đường dẫn ảnh đại diện' : `Đường dẫn ảnh phụ ${imageIndex}`}
                      </span>
                      <input
                        type="text"
                        value={image}
                        onChange={(event) => setImagePath(imageIndex, event.target.value)}
                        placeholder={`/images/rooms/ten-phong/${imageIndex === 0 ? 'main' : `detail-${imageIndex}`}.jpg`}
                        className="mt-1 w-full bg-transparent text-xs text-on-surface outline-none placeholder:text-on-surface-variant/55"
                      />
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-[11px] leading-5 text-on-surface-variant">
                  Có thể tải lên Cloudinary hoặc dùng ảnh tĩnh trong project. Với ảnh tĩnh, chép file 1600×1200px vào frontend/public/images/rooms/ten-phong/ rồi nhập đường dẫn /images/rooms/ten-phong/ten-anh.jpg.
                </p>
                {errors.image && <p className="mt-1 text-xs text-error">{errors.image}</p>}
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
