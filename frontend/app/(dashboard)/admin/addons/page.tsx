'use client'

import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react'
import axios from 'axios'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'
import AdminToast from '@/components/admin/AdminToast'
import AddonServiceImage from '@/components/addons/AddonServiceImage'
import { IconClose, IconEquipment, IconPlus, IconRefresh, IconSearch } from '@/components/admin/AdminIcons'
import ProjectSelect from '@/components/ui/ProjectSelect'
import { getAdminRoomTypes, uploadAdminRoomImage } from '@/lib/admin/rooms/adminRoomApi'
import type { AdminRoomTypeOption } from '@/lib/admin/rooms/types'
import {
  fetchAdminAddons,
  saveAdminAddon,
  setAdminAddonActive,
  type AddonCatalogItem,
  type AddonCatalogPayload,
} from '@/lib/addon-service'

const EMPTY_FORM: AddonCatalogPayload = {
  name: '', description: '', imageUrl: '', price: 0, unit: 'lần', roomTierId: null, active: true,
}
const inputClass = 'h-12 w-full rounded-2xl border border-outline-variant bg-surface-container-low px-4 text-sm text-on-surface outline-none transition focus:border-brand-orange focus:bg-white focus:ring-2 focus:ring-brand-orange/15'

function formatMoney(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
}

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ message?: string }>(error)) return error.response?.data?.message || fallback
  return error instanceof Error ? error.message : fallback
}

export default function AdminAddonsPage() {
  const [items, setItems] = useState<AddonCatalogItem[]>([])
  const [roomTypes, setRoomTypes] = useState<AdminRoomTypeOption[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [editing, setEditing] = useState<AddonCatalogItem | null | undefined>(undefined)
  const [form, setForm] = useState<AddonCatalogPayload>(EMPTY_FORM)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [catalog, tiers] = await Promise.all([fetchAdminAddons(), getAdminRoomTypes()])
      setItems(catalog)
      setRoomTypes(tiers)
      setError('')
    } catch (reason) {
      setError(getErrorMessage(reason, 'Không thể tải danh mục dịch vụ thuê thêm.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => void load())
  }, [load])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 3500)
    return () => window.clearTimeout(timer)
  }, [toast])

  const visibleItems = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('vi')
    return items.filter((item) => !keyword
      || `${item.name} ${item.description} ${item.roomTierName ?? ''}`.toLocaleLowerCase('vi').includes(keyword))
  }, [items, query])

  const openCreate = () => { setForm({ ...EMPTY_FORM }); setEditing(null) }
  const openEdit = (item: AddonCatalogItem) => {
    setForm({
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl ?? '',
      price: item.price,
      unit: item.unit,
      roomTierId: item.roomTierId ?? null,
      active: item.active,
    })
    setEditing(item)
  }
  const closeForm = () => { if (!saving && !uploadingImage) setEditing(undefined) }

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
    if (!allowedTypes.has(file.type)) {
      setError('Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.')
      return
    }
    if (file.size > 12 * 1024 * 1024) {
      setError('Ảnh dịch vụ không được vượt quá 12MB.')
      return
    }

    setUploadingImage(true)
    setError('')
    try {
      const uploaded = await uploadAdminRoomImage(file)
      setForm((current) => ({ ...current, imageUrl: uploaded.secureUrl }))
      setToast('Đã tải ảnh lên. Bấm “Lưu dịch vụ” để hoàn tất.')
    } catch (reason) {
      setError(getErrorMessage(reason, 'Không thể tải ảnh dịch vụ lên máy chủ lưu trữ.'))
    } finally {
      setUploadingImage(false)
    }
  }

  const submit = async () => {
    if (form.name.trim().length < 2 || !form.description.trim() || !form.unit.trim() || form.price <= 0) {
      setError('Vui lòng nhập đủ tên, mô tả, đơn vị tính và mức giá hợp lệ.')
      return
    }
    if (uploadingImage) return
    setSaving(true)
    try {
      await saveAdminAddon({
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
        unit: form.unit.trim(),
        imageUrl: form.imageUrl?.trim() || null,
      }, editing?.id)
      setEditing(undefined)
      setToast(editing ? 'Đã cập nhật dịch vụ.' : 'Đã thêm dịch vụ mới.')
      await load()
    } catch (reason) {
      setError(getErrorMessage(reason, 'Không thể lưu dịch vụ.'))
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (item: AddonCatalogItem) => {
    try {
      const updated = await setAdminAddonActive(item.id, !item.active)
      setItems((current) => current.map((entry) => entry.id === updated.id ? updated : entry))
      setToast(updated.active ? 'Dịch vụ đã được mở bán.' : 'Dịch vụ đã tạm ngưng.')
    } catch (reason) {
      setError(getErrorMessage(reason, 'Không thể đổi trạng thái dịch vụ.'))
    }
  }

  const activeCount = items.filter((item) => item.active).length
  const commonCount = items.filter((item) => item.roomTierId == null).length

  return (
    <>
      <AdminPageHeader
        eyebrow="Dịch vụ thuê thêm"
        title="Danh mục dịch vụ lưu trú"
        description="Quản lý dịch vụ khách chọn khi đặt phòng hoặc gọi thêm trong thời gian lưu trú."
        breadcrumbs={[{ label: 'Tổng quan', href: '/admin/dashboard' }, { label: 'Dịch vụ thuê thêm' }]}
        actions={<div className="flex items-center gap-2">
          <button type="button" onClick={() => void load()} disabled={loading} aria-label="Làm mới" className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant bg-white text-on-surface-variant transition hover:border-brand-orange/40 hover:text-brand-orange disabled:opacity-50">
            <IconRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button type="button" onClick={openCreate} className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-greenDark px-4 font-display text-sm font-semibold text-white shadow-lg shadow-brand-greenDark/15 transition hover:bg-brand-greenLight">
            <IconPlus className="h-4 w-4" /> Thêm dịch vụ
          </button>
        </div>}
      />

      <main className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
        <AdminToast message={toast} onDismiss={() => setToast('')} />
        {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl border border-error/30 bg-error-container/25 px-4 py-3 text-sm text-error"><span>{error}</span><button type="button" onClick={() => setError('')} aria-label="Đóng"><IconClose className="h-4 w-4" /></button></div>}

        <div className="grid gap-4 sm:grid-cols-3">
          <AdminStatCard label="Tổng dịch vụ" value={items.length} hint="Trong danh mục" icon={<IconEquipment className="h-5 w-5" />} />
          <AdminStatCard label="Đang phục vụ" value={activeCount} hint="Khách có thể lựa chọn" accent="secondary" icon={<span>●</span>} />
          <AdminStatCard label="Dùng cho mọi hạng" value={commonCount} hint="Không giới hạn hạng phòng" accent="tertiary" icon={<span>∞</span>} />
        </div>

        <section className="overflow-hidden rounded-[1.75rem] border border-outline-variant bg-white shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-outline-variant px-5 py-5 sm:px-6">
            <div><h2 className="font-display text-lg font-bold text-on-surface">Dịch vụ đang quản lý</h2><p className="mt-1 text-sm text-on-surface-variant">Tạm ngưng thay vì xóa để giữ nguyên lịch sử booking.</p></div>
            <label className="flex h-11 min-w-[17rem] items-center gap-3 rounded-2xl border border-outline-variant bg-surface-container-low px-4 transition focus-within:border-brand-orange focus-within:ring-2 focus-within:ring-brand-orange/15">
              <IconSearch className="h-4 w-4 text-brand-orange" />
              <input data-search-input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên hoặc hạng phòng" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-on-surface-variant/65" />
            </label>
          </div>

          {loading ? <LoadingGrid /> : visibleItems.length === 0 ? (
            <div className="px-6 py-16 text-center"><p className="font-display text-lg font-semibold text-on-surface">Chưa có dịch vụ phù hợp</p><p className="mt-2 text-sm text-on-surface-variant">Thêm dịch vụ đầu tiên hoặc thay đổi từ khóa tìm kiếm.</p></div>
          ) : (
            <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3 sm:p-6">
              {visibleItems.map((item) => <ServiceCard key={item.id} item={item} onEdit={openEdit} onToggle={() => void toggleActive(item)} />)}
            </div>
          )}
        </section>
      </main>

      {editing !== undefined && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-inverse-surface/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="addon-form-title">
          <button type="button" className="absolute inset-0" onClick={closeForm} aria-label="Đóng biểu mẫu" />
          <section className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/30 bg-white shadow-[var(--shadow-elevated)]">
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-brand-greenDark px-6 py-5 text-white">
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-orange">Danh mục dịch vụ</p><h2 id="addon-form-title" className="mt-1 font-editorial text-2xl">{editing ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ mới'}</h2></div>
              <button type="button" onClick={closeForm} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20" aria-label="Đóng"><IconClose className="h-4 w-4" /></button>
            </header>
            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <Field label="Tên dịch vụ" className="sm:col-span-2"><input value={form.name} maxLength={120} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ví dụ: Set BBQ ngoài trời" className={inputClass} /></Field>
              <Field label="Mô tả" className="sm:col-span-2"><textarea value={form.description} maxLength={500} rows={3} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Mô tả rõ dịch vụ khách sẽ nhận được" className={`${inputClass} h-auto resize-none py-3`} /></Field>
              <Field label="Giá dịch vụ"><input type="number" min={1} step={1000} value={form.price || ''} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} placeholder="150000" className={inputClass} /></Field>
              <Field label="Đơn vị tính"><input value={form.unit} maxLength={60} onChange={(event) => setForm({ ...form, unit: event.target.value })} placeholder="lần, set, người..." className={inputClass} /></Field>
              <Field label="Hạng phòng áp dụng"><ProjectSelect value={form.roomTierId ?? ''} onChange={(event) => setForm({ ...form, roomTierId: event.target.value ? Number(event.target.value) : null })} className={inputClass}><option value="">Mọi hạng phòng</option>{roomTypes.map((tier) => <option key={tier.id} value={tier.id}>{tier.label}</option>)}</ProjectSelect></Field>
              <Field label="Trạng thái"><ProjectSelect value={String(form.active)} onChange={(event) => setForm({ ...form, active: event.target.value === 'true' })} className={inputClass}><option value="true">Đang phục vụ</option><option value="false">Tạm ngưng</option></ProjectSelect></Field>
              <Field label="Ảnh minh họa (không bắt buộc)" className="sm:col-span-2">
                <input value={form.imageUrl ?? ''} maxLength={500} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} placeholder="https://... hoặc /images/..." className={inputClass} />
                <div className="mt-3 grid gap-3 sm:grid-cols-[180px_1fr]">
                  <AddonServiceImage imageUrl={form.imageUrl} name={form.name || 'dịch vụ'} className="h-32 w-full rounded-2xl border border-outline-variant" eager />
                  <label className="flex cursor-pointer flex-col justify-center rounded-2xl border border-dashed border-outline bg-surface-container-low px-5 py-4 transition hover:border-brand-orange hover:bg-white">
                    <span className="font-display text-sm font-bold text-brand-orange">{uploadingImage ? 'Đang tải ảnh...' : 'Chọn ảnh từ máy'}</span>
                    <span className="mt-1 text-xs leading-5 text-on-surface-variant">JPG, PNG hoặc WebP · tối thiểu 1200×900px · tối đa 12MB. URL ảnh sẽ được tự động điền sau khi tải.</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void uploadImage(event)} disabled={uploadingImage || saving} className="sr-only" />
                  </label>
                </div>
                <p className="mt-2 text-xs leading-5 text-on-surface-variant">Bạn cũng có thể dán liên kết HTTPS hoặc đường dẫn bắt đầu bằng <strong>/images/</strong>.</p>
              </Field>
            </div>
            <footer className="sticky bottom-0 flex justify-end gap-3 border-t border-outline-variant bg-white/95 px-6 py-4 backdrop-blur"><button type="button" onClick={closeForm} disabled={saving || uploadingImage} className="h-11 rounded-xl border border-outline-variant px-5 text-sm font-semibold text-on-surface-variant disabled:opacity-60">Hủy</button><button type="button" onClick={() => void submit()} disabled={saving || uploadingImage} className="h-11 rounded-xl bg-brand-greenDark px-6 text-sm font-semibold text-white shadow-lg shadow-brand-greenDark/15 disabled:opacity-60">{uploadingImage ? 'Đang tải ảnh...' : saving ? 'Đang lưu...' : 'Lưu dịch vụ'}</button></footer>
          </section>
        </div>
      )}
    </>
  )
}

function ServiceCard({ item, onEdit, onToggle }: { item: AddonCatalogItem; onEdit: (item: AddonCatalogItem) => void; onToggle: () => void }) {
  return <article className={`group flex min-h-56 flex-col overflow-hidden rounded-2xl border transition ${item.active ? 'border-outline-variant bg-white hover:-translate-y-0.5 hover:border-brand-orange/35 hover:shadow-[var(--shadow-card)]' : 'border-outline-variant bg-surface-container-low opacity-75'}`}>
    <AddonServiceImage imageUrl={item.imageUrl} name={item.name} className="h-36 w-full" />
    <div className="flex flex-1 flex-col p-5">
    <div className="flex items-start justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-container text-brand-greenDark"><IconEquipment className="h-5 w-5" /></span><span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${item.active ? 'bg-secondary-container/35 text-secondary' : 'bg-surface-container-high text-on-surface-variant'}`}>{item.active ? 'Đang phục vụ' : 'Tạm ngưng'}</span></div>
    <h3 className="mt-4 font-display text-lg font-bold text-on-surface">{item.name}</h3>
    <p className="mt-1 line-clamp-2 text-sm leading-6 text-on-surface-variant">{item.description}</p>
    <div className="mt-auto flex items-end justify-between gap-3 pt-5"><div><p className="font-display text-lg font-bold text-brand-orange">{formatMoney(item.price)}</p><p className="text-xs text-on-surface-variant">mỗi {item.unit} · {item.roomTierName ?? 'Mọi hạng phòng'}</p></div><div className="flex gap-2"><button type="button" onClick={onToggle} className="rounded-xl border border-outline-variant px-3 py-2 text-xs font-semibold text-on-surface-variant transition hover:border-brand-orange/40 hover:text-brand-orange">{item.active ? 'Tạm ngưng' : 'Mở lại'}</button><button type="button" onClick={() => onEdit(item)} className="rounded-xl bg-brand-greenDark px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-greenLight">Chỉnh sửa</button></div></div>
    </div>
  </article>
}

function LoadingGrid() {
  return <div className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((key) => <div key={key} className="h-56 animate-pulse rounded-2xl bg-surface-container-low" />)}</div>
}

function Field({ label, className = '', children }: { label: string; className?: string; children: ReactNode }) {
  return <label className={className}><span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">{label}</span>{children}</label>
}
