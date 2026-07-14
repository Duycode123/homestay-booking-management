'use client'

import Image from 'next/image'
import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import {
  commonAmenityError,
  createCommonAmenity,
  deleteCommonAmenity,
  fetchAdminCommonAmenities,
  updateCommonAmenity,
  uploadCommonAmenityImage,
  type CommonAmenityForm,
} from '@/lib/admin/common-amenity-api'
import type { CommonAmenity } from '@/lib/common-amenity-service'

const emptyForm: CommonAmenityForm = { name: '', description: '', iconName: 'facility', imageUrl: '', displayOrder: 0, active: true }

export default function AdminAmenitiesManager({ privateAmenities }: { privateAmenities: ReactNode }) {
  const [tab, setTab] = useState<'common' | 'private'>('common')
  const [items, setItems] = useState<CommonAmenity[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [editing, setEditing] = useState<CommonAmenity | 'create' | null>(null)

  const load = async () => {
    setLoading(true)
    try { setItems(await fetchAdminCommonAmenities()) }
    catch (error) { setMessage(commonAmenityError(error)) }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const remove = async (id: number) => {
    if (!window.confirm('Xóa tiện nghi chung này?')) return
    try { await deleteCommonAmenity(id); setItems((current) => current.filter((item) => item.id !== id)); setMessage('Đã xóa tiện nghi chung.') }
    catch (error) { setMessage(commonAmenityError(error)) }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-[var(--shadow-card)]">
      <header className="border-b border-outline-variant px-5 pt-5 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="font-display text-xl font-bold text-on-surface">Quản lý tiện nghi</h2><p className="mt-1 text-sm text-on-surface-variant">Tách riêng tiện ích toàn khu và tiện nghi gắn với từng phòng.</p></div>{tab === 'common' && <button type="button" onClick={() => setEditing('create')} className="rounded-xl bg-brand-orange px-5 py-2.5 text-sm font-bold text-white shadow-lg">Thêm tiện ích chung</button>}</div>
        <div className="mt-5 flex gap-6">
          <Tab active={tab === 'common'} onClick={() => setTab('common')}>Tiện nghi chung <Count value={items.length} /></Tab>
          <Tab active={tab === 'private'} onClick={() => setTab('private')}>Tiện nghi riêng theo phòng</Tab>
        </div>
      </header>

      {message && <p className="mx-5 mt-4 rounded-xl bg-primary-container/45 px-4 py-3 text-sm text-on-primary-container sm:mx-6">{message}</p>}
      {tab === 'private' ? <div className="[&>section]:rounded-none [&>section]:border-0 [&>section]:shadow-none">{privateAmenities}</div> : <CommonList items={items} loading={loading} onEdit={setEditing} onDelete={remove} />}
      {editing && <CommonAmenityModal item={editing === 'create' ? null : editing} onClose={() => setEditing(null)} onSaved={(saved) => { setItems((current) => [...current.filter((item) => item.id !== saved.id), saved].sort((a, b) => a.displayOrder - b.displayOrder)); setEditing(null); setMessage('Đã lưu tiện nghi chung.') }} />}
    </section>
  )
}

function CommonList({ items, loading, onEdit, onDelete }: { items: CommonAmenity[]; loading: boolean; onEdit: (item: CommonAmenity) => void; onDelete: (id: number) => void }) {
  if (loading) return <div className="grid gap-4 p-6 md:grid-cols-2"><div className="h-32 animate-pulse rounded-2xl bg-surface-container" /><div className="h-32 animate-pulse rounded-2xl bg-surface-container" /></div>
  return <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-2">{items.map((item) => <article key={item.id} className="flex gap-4 rounded-2xl border border-outline-variant p-4"><div className="relative flex h-24 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#eee3d3] text-2xl">{item.imageUrl ? <Image src={item.imageUrl} alt={item.name} fill unoptimized sizes="128px" className="object-cover" /> : '✦'}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><h3 className="font-bold text-on-surface">{item.name}</h3><span className={['mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold', item.active ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container text-on-surface-variant'].join(' ')}>{item.active ? 'Đang hiển thị' : 'Đã ẩn'}</span></div><span className="text-xs text-on-surface-variant">#{item.displayOrder}</span></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-on-surface-variant">{item.description}</p><div className="mt-3 flex gap-3 text-xs font-bold"><button type="button" onClick={() => onEdit(item)} className="text-brand-orange">Sửa</button><button type="button" onClick={() => onDelete(item.id)} className="text-error">Xóa</button></div></div></article>)}{items.length === 0 && <p className="col-span-full py-10 text-center text-on-surface-variant">Chưa có tiện nghi chung.</p>}</div>
}

function CommonAmenityModal({ item, onClose, onSaved }: { item: CommonAmenity | null; onClose: () => void; onSaved: (item: CommonAmenity) => void }) {
  const [form, setForm] = useState<CommonAmenityForm>(item ? { name: item.name, description: item.description, iconName: item.iconName, imageUrl: item.imageUrl || '', displayOrder: item.displayOrder, active: item.active } : emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const set = (patch: Partial<CommonAmenityForm>) => setForm((current) => ({ ...current, ...patch }))

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) { setError('Ảnh phải là JPG, PNG hoặc WebP và không vượt quá 5MB.'); return }
    setUploading(true); setError('')
    try { const result = await uploadCommonAmenityImage(file); set({ imageUrl: result.secureUrl }) }
    catch (reason) { setError(commonAmenityError(reason)) }
    finally { setUploading(false) }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.name.trim() || !form.description.trim()) { setError('Vui lòng nhập tên và mô tả tiện nghi.'); return }
    setSaving(true); setError('')
    try { onSaved(item ? await updateCommonAmenity(item.id, form) : await createCommonAmenity(form)) }
    catch (reason) { setError(commonAmenityError(reason)) }
    finally { setSaving(false) }
  }

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"><form onSubmit={(event) => void submit(event)} className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[26px] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="eyebrow text-brand-orange">Tiện nghi chung</p><h2 className="mt-1 font-display text-2xl font-bold">{item ? 'Chỉnh sửa tiện nghi' : 'Thêm tiện nghi mới'}</h2></div><button type="button" onClick={onClose} className="h-10 w-10 rounded-full border border-outline-variant">×</button></div><label className="mt-6 block text-sm font-bold">Tên tiện nghi<input value={form.name} onChange={(e) => set({ name: e.target.value })} className="input-field mt-2" maxLength={120} /></label><label className="mt-4 block text-sm font-bold">Mô tả<textarea value={form.description} onChange={(e) => set({ description: e.target.value })} rows={3} className="input-field mt-2 h-auto py-3" maxLength={500} /></label><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">Biểu tượng<input value={form.iconName} onChange={(e) => set({ iconName: e.target.value })} className="input-field mt-2" maxLength={60} /></label><label className="text-sm font-bold">Thứ tự<input type="number" min={0} max={10000} value={form.displayOrder} onChange={(e) => set({ displayOrder: Number(e.target.value) })} className="input-field mt-2" /></label></div><div className="mt-5 grid gap-4 sm:grid-cols-[160px_1fr]"><div className="relative h-28 overflow-hidden rounded-2xl bg-surface-container">{form.imageUrl ? <Image src={form.imageUrl} alt="" fill unoptimized sizes="160px" className="object-cover" /> : <span className="flex h-full items-center justify-center text-sm text-on-surface-variant">Chưa có ảnh</span>}</div><label className="flex cursor-pointer flex-col justify-center rounded-2xl border border-dashed border-outline p-4 text-sm"><span className="font-bold text-brand-orange">{uploading ? 'Đang tải ảnh...' : 'Tải ảnh tiện nghi'}</span><span className="mt-1 text-xs text-on-surface-variant">Ảnh gốc được giữ chất lượng cao, tối đa 5MB.</span><input type="file" accept="image/*" onChange={(e) => void upload(e)} disabled={uploading || saving} className="sr-only" /></label></div><label className="mt-5 flex items-center gap-3 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => set({ active: e.target.checked })} className="h-4 w-4" />Hiển thị tiện nghi này trên trang khách hàng</label>{error && <p className="mt-4 rounded-xl bg-error-container/40 px-4 py-3 text-sm text-error">{error}</p>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl border border-outline px-5 py-2.5 font-bold">Hủy</button><button type="submit" disabled={saving || uploading} className="rounded-xl bg-brand-orange px-5 py-2.5 font-bold text-white disabled:opacity-60">{saving ? 'Đang lưu...' : 'Lưu tiện nghi'}</button></div></form></div>
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) { return <button type="button" onClick={onClick} className={['border-b-2 pb-3 text-sm font-bold transition', active ? 'border-brand-orange text-brand-orange' : 'border-transparent text-on-surface-variant'].join(' ')}>{children}</button> }
function Count({ value }: { value: number }) { return <span className="ml-1 rounded-full bg-surface-container px-2 py-0.5 text-[10px]">{value}</span> }
