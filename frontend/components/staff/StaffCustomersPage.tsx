'use client'

import ProjectSelect from '@/components/ui/ProjectSelect'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { fetchStaffCustomers, type BackendStaffCustomerBooking, type BackendStaffCustomerSummary } from '@/lib/staff-customer-service'
import { StaffPageShell } from './StaffShared'

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
type CustomerType = 'NEW' | 'RETURNING' | 'VIP'
type CustomerFilter = 'ALL' | CustomerType | 'HAS_TODAY_BOOKING'
type NotePriority = 'NORMAL' | 'IMPORTANT'

type StaffBooking = {
  id: string
  code: string
  customerId: string
  roomName: string
  date: string
  startTime: string
  endTime: string
  totalPrice: number
  status: BookingStatus
}

type StaffCustomer = {
  id: string
  name: string
  phone?: string
  email?: string
  type: CustomerType
  bookingCount: number
  lastBookingAt?: string
  favoriteRoom?: string
  favoriteAmenities: string[]
  hasTodayBooking?: boolean
  notes: {
    id: string
    content: string
    priority: NotePriority
    createdAt: string
  }[]
}

type Meta = {
  label: string
  className: string
  dotClassName: string
}

const todayKey = formatDateKey(new Date())

const initialCustomers: StaffCustomer[] = [
  {
    id: 'c1',
    name: 'Gia đình Nguyễn',
    phone: '0908 123 456',
    email: 'nguyen.family@example.com',
    type: 'VIP',
    bookingCount: 28,
    lastBookingAt: todayKey,
    favoriteRoom: 'Deluxe Balcony 201',
    favoriteAmenities: ['Wi-Fi tốc độ cao', 'Điều hòa'],
    hasTodayBooking: true,
    notes: [{ id: 'n1', content: 'Ưu tiên kiểm tra tiện nghi trước 15 phút, khách thường đến sớm.', priority: 'IMPORTANT', createdAt: '08:00 hôm nay' }],
  },
  {
    id: 'c2',
    name: 'Gia đình Trần',
    phone: '0912 567 890',
    email: 'tran.family@example.com',
    type: 'RETURNING',
    bookingCount: 12,
    lastBookingAt: todayKey,
    favoriteRoom: 'Family Garden 302',
    favoriteAmenities: ['Smart TV'],
    hasTodayBooking: true,
    notes: [{ id: 'n2', content: 'Ưu tiên phòng yên tĩnh và chuẩn bị thêm khăn tắm.', priority: 'NORMAL', createdAt: 'Hôm qua' }],
  },
  {
    id: 'c3',
    name: 'Lê Thu Hà',
    phone: '0987 444 221',
    email: 'le.thu.ha@example.com',
    type: 'RETURNING',
    bookingCount: 9,
    lastBookingAt: todayKey,
    favoriteRoom: 'Standard Garden 102',
    favoriteAmenities: ['Máy nước nóng', 'Ấm đun nước'],
    hasTodayBooking: true,
    notes: [],
  },
  {
    id: 'c4',
    name: 'Hải Đăng',
    phone: '0933 880 112',
    email: 'hai.dang@example.com',
    type: 'VIP',
    bookingCount: 34,
    lastBookingAt: todayKey,
    favoriteRoom: 'Family Suite 301',
    favoriteAmenities: ['Tủ lạnh mini'],
    hasTodayBooking: true,
    notes: [{ id: 'n3', content: 'Có voucher thành viên, kiểm tra ưu đãi trước khi thanh toán.', priority: 'IMPORTANT', createdAt: 'Tuần này' }],
  },
  {
    id: 'c5',
    name: 'Phạm Minh Anh',
    phone: '0901 777 222',
    email: 'pham.minh.anh@example.com',
    type: 'RETURNING',
    bookingCount: 7,
    lastBookingAt: '2026-06-30',
    favoriteRoom: 'Deluxe City View 202',
    favoriteAmenities: ['Smart TV'],
    notes: [],
  },
  {
    id: 'c6',
    name: 'Gia đình Võ',
    phone: '0978 112 334',
    email: 'vo.family@example.com',
    type: 'NEW',
    bookingCount: 1,
    lastBookingAt: '2026-06-29',
    favoriteRoom: 'Standard Garden 101',
    favoriteAmenities: ['Điều hòa'],
    notes: [],
  },
]

const initialBookingHistory: StaffBooking[] = [
  { id: 'b1', code: 'BK-0701-60', customerId: 'c1', roomName: 'Deluxe Balcony 201', date: todayKey, startTime: '08:00', endTime: '09:30', totalPrice: 520000, status: 'CONFIRMED' },
  { id: 'b2', code: 'BK-0701-61', customerId: 'c2', roomName: 'Family Garden 302', date: todayKey, startTime: '09:00', endTime: '10:30', totalPrice: 720000, status: 'PENDING' },
  { id: 'b3', code: 'BK-0701-62', customerId: 'c3', roomName: 'Standard Garden 102', date: todayKey, startTime: '10:00', endTime: '11:30', totalPrice: 430000, status: 'CHECKED_IN' },
  { id: 'b4', code: 'BK-0701-63', customerId: 'c4', roomName: 'Family Suite 301', date: todayKey, startTime: '11:00', endTime: '12:30', totalPrice: 900000, status: 'IN_PROGRESS' },
  { id: 'b5', code: 'BK-0630-22', customerId: 'c1', roomName: 'Deluxe Balcony 201', date: '2026-06-30', startTime: '18:00', endTime: '20:00', totalPrice: 680000, status: 'COMPLETED' },
  { id: 'b6', code: 'BK-0630-25', customerId: 'c5', roomName: 'Deluxe City View 202', date: '2026-06-30', startTime: '13:00', endTime: '15:00', totalPrice: 610000, status: 'COMPLETED' },
  { id: 'b7', code: 'BK-0629-18', customerId: 'c6', roomName: 'Standard Garden 101', date: '2026-06-29', startTime: '19:00', endTime: '21:00', totalPrice: 420000, status: 'CANCELLED' },
]

const filters: Array<{ value: CustomerFilter; label: string }> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'NEW', label: 'Khách mới' },
  { value: 'RETURNING', label: 'Khách quay lại' },
  { value: 'VIP', label: 'VIP' },
  { value: 'HAS_TODAY_BOOKING', label: 'Có booking hôm nay' },
]

export default function StaffCustomersPage() {
  const [customers, setCustomers] = useState(initialCustomers)
  const [bookingHistory, setBookingHistory] = useState(initialBookingHistory)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<CustomerFilter>('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [noteTargetId, setNoteTargetId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadCustomers() {
      setIsLoading(true)
      try {
        const data = await fetchStaffCustomers()
        if (!isMounted) return
        setCustomers(data.map(mapBackendCustomer))
        setBookingHistory(data.flatMap((customer) => customer.recentBookings.map((booking) => mapBackendBooking(booking, customer.id))))
      } catch (error) {
        if (!isMounted) return
        setToastMessage(error instanceof Error ? error.message : 'Khong the tai danh sach khach hang.')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadCustomers()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!toastMessage) return
    const timer = window.setTimeout(() => setToastMessage(null), 2600)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  const filteredCustomers = useMemo(() => filterCustomers(customers, query, filter), [customers, filter, query])
  const selectedCustomer = selectedCustomerId ? customers.find((customer) => customer.id === selectedCustomerId) ?? null : null
  const noteTarget = noteTargetId ? customers.find((customer) => customer.id === noteTargetId) ?? null : null
  const kpis = [
    { label: 'Tổng khách hàng', value: customers.length, helper: 'Hồ sơ đang theo dõi', icon: <IconUsers />, className: 'bg-secondary text-on-secondary' },
    { label: 'Khách quay lại', value: customers.filter((customer) => customer.type === 'RETURNING').length, helper: 'Có lịch sử đặt phòng', icon: <IconRefresh />, className: 'bg-primary-container text-brand-orange' },
    { label: 'Khách VIP', value: customers.filter((customer) => customer.type === 'VIP').length, helper: 'Ưu tiên hỗ trợ', icon: <IconStar />, className: 'bg-tertiary-container text-tertiary' },
    { label: 'Có booking hôm nay', value: customers.filter((customer) => customer.hasTodayBooking).length, helper: 'Cần phục vụ trong ngày', icon: <IconCalendar />, className: 'bg-on-secondary-container text-[#001A0D]' },
  ]

  const addNote = (customerId: string, content: string, priority: NotePriority) => {
    const nextNote = {
      id: `note-${Date.now()}`,
      content: content.trim(),
      priority,
      createdAt: 'Vừa xong',
    }

    setCustomers((current) =>
      current.map((customer) => (customer.id === customerId ? { ...customer, notes: [nextNote, ...customer.notes] } : customer)),
    )
    setNoteTargetId(null)
    setToastMessage('Đã thêm ghi chú khách hàng.')
  }

  const resetFilters = () => {
    setQuery('')
    setFilter('ALL')
  }

  return (
    <AuthGuard allowedRoles={['STAFF']}>
      <StaffPageShell>
            <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="font-display text-sm font-bold uppercase tracking-wide text-brand-orange">Chăm sóc khách hàng</p>
                <h1 className="mt-2 font-display text-[32px] font-bold leading-10 text-on-surface">Khách hàng</h1>
                <p className="mt-2 max-w-2xl text-base leading-6 text-on-surface-variant">
                  Tra cứu thông tin khách hàng, lịch sử đặt phòng và ghi chú hỗ trợ.
                </p>
              </div>
              <button type="button" onClick={() => setNoteTargetId(customers[0]?.id ?? null)} className="btn-warm self-start">
                <IconPlus />
                Thêm ghi chú nhanh
              </button>
            </header>

            {isLoading ? (
              <PageSkeleton />
            ) : (
              <>
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
                </section>

                <section className="rounded-3xl border border-outline-variant bg-white p-4 shadow-[var(--homestay-shadow-card)]">
                  <div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_260px_auto]">
                    <SearchInput value={query} onChange={setQuery} />
                    <ProjectSelect value={filter} onChange={(event) => setFilter(event.target.value as CustomerFilter)} className="h-12 rounded-2xl border border-outline-variant bg-surface-container-low px-4 font-display text-sm font-bold text-on-surface outline-none transition focus:border-brand-orange focus:bg-white">
                      {filters.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </ProjectSelect>
                    <button type="button" onClick={resetFilters} className="btn-secondary">Đặt lại</button>
                  </div>
                </section>

                {filteredCustomers.length > 0 ? (
                  <section className="grid gap-4 xl:grid-cols-2">
                    {filteredCustomers.map((customer) => (
                      <CustomerCard
                        key={customer.id}
                        customer={customer}
                        onView={() => setSelectedCustomerId(customer.id)}
                        onAddNote={() => setNoteTargetId(customer.id)}
                      />
                    ))}
                  </section>
                ) : (
                  <EmptyState onReset={resetFilters} />
                )}
              </>
            )}

        {selectedCustomer && (
          <CustomerDetailPanel
            customer={selectedCustomer}
            bookings={bookingHistory.filter((booking) => booking.customerId === selectedCustomer.id)}
            onClose={() => setSelectedCustomerId(null)}
            onAddNote={() => setNoteTargetId(selectedCustomer.id)}
          />
        )}
        {noteTarget && <NoteModal customer={noteTarget} onCancel={() => setNoteTargetId(null)} onSubmit={addNote} />}
        {toastMessage && <Toast message={toastMessage} />}
      </StaffPageShell>
    </AuthGuard>
  )
}

function CustomerCard({ customer, onView, onAddNote }: { customer: StaffCustomer; onView: () => void; onAddNote: () => void }) {
  return (
    <article className="rounded-3xl border border-outline-variant bg-white p-5 shadow-[var(--homestay-shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--homestay-shadow-elevated)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-2xl font-bold text-on-surface">{customer.name}</h2>
            <StatusBadge meta={getCustomerTypeMeta(customer.type)} />
            {customer.hasTodayBooking && <span className="rounded-full border border-primary-container bg-primary-container px-3 py-1 font-display text-xs font-bold text-on-primary-container">Có booking hôm nay</span>}
          </div>
          <p className="mt-1 text-sm text-on-surface-variant">{customer.phone ?? 'Chưa có số điện thoại'} · {customer.email ?? 'Chưa có email'}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Số booking" value={`${customer.bookingCount}`} />
        <Metric label="Lần đặt gần nhất" value={customer.lastBookingAt ? formatDisplayDate(customer.lastBookingAt) : 'Chưa có'} />
        <Metric label="Phòng hay đặt" value={customer.favoriteRoom ?? 'Chưa có'} />
        <Metric label="Ghi chú" value={`${customer.notes.length}`} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {customer.favoriteAmenities.length ? customer.favoriteAmenities.map((item) => (
          <span key={item} className="rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-xs font-semibold text-on-surface-variant">{item}</span>
        )) : <span className="rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-xs font-semibold text-on-surface-variant">Chưa có tiện nghi thường thuê</span>}
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={onView} className="btn-secondary">Xem hồ sơ</button>
        <button type="button" onClick={onAddNote} className="btn-warm">Thêm ghi chú</button>
      </div>
    </article>
  )
}

function CustomerDetailPanel({ customer, bookings, onClose, onAddNote }: { customer: StaffCustomer; bookings: StaffBooking[]; onClose: () => void; onAddNote: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#173A31]/45 backdrop-blur-sm" onClick={onClose}>
      <aside className="h-full w-full overflow-y-auto border-l border-outline-variant bg-white p-5 shadow-[var(--homestay-shadow-elevated)] sm:max-w-2xl sm:p-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-wide text-brand-orange">Hồ sơ khách hàng</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-on-surface">{customer.name}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{customer.phone ?? 'Chưa có số điện thoại'} · {customer.email ?? 'Chưa có email'}</p>
          </div>
          <button type="button" onClick={onClose} className="icon-button" aria-label="Đóng hồ sơ"><IconClose /></button>
        </div>

        <div className="mt-5"><StatusBadge meta={getCustomerTypeMeta(customer.type)} /></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Metric label="Tổng booking" value={`${customer.bookingCount}`} />
          <Metric label="Lần đặt gần nhất" value={customer.lastBookingAt ? formatDisplayDate(customer.lastBookingAt) : 'Chưa có'} />
          <Metric label="Phòng hay đặt" value={customer.favoriteRoom ?? 'Chưa có'} />
          <Metric label="Tiện nghi yêu thích" value={customer.favoriteAmenities.length ? `${customer.favoriteAmenities.length} mục` : 'Chưa có'} />
        </div>

        <PanelSection title="Tiện nghi thường thuê">
          <div className="flex flex-wrap gap-2">
            {customer.favoriteAmenities.length ? customer.favoriteAmenities.map((item) => (
              <span key={item} className="rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-xs font-semibold text-on-surface-variant">{item}</span>
            )) : <p className="text-sm text-on-surface-variant">Chưa có dữ liệu tiện nghi.</p>}
          </div>
        </PanelSection>

        <PanelSection title="Lịch sử booking gần đây">
          <div className="space-y-3">
            {bookings.length ? bookings.map((booking) => (
              <div key={booking.id} className="rounded-2xl border border-outline-variant bg-surface-container-low p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-display text-sm font-bold text-on-surface">{booking.code}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{booking.roomName} · {formatDisplayDate(booking.date)} · {booking.startTime} - {booking.endTime}</p>
                  </div>
                  <StatusBadge meta={getBookingStatusMeta(booking.status)} />
                </div>
                <p className="mt-2 text-sm font-semibold text-on-surface">{formatCurrency(booking.totalPrice)}</p>
              </div>
            )) : <p className="text-sm text-on-surface-variant">Chưa có booking gần đây.</p>}
          </div>
        </PanelSection>

        <PanelSection title="Ghi chú nội bộ">
          <div className="space-y-3">
            {customer.notes.length ? customer.notes.map((note) => (
              <div key={note.id} className="rounded-2xl border border-outline-variant bg-surface-container-low p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={['rounded-full px-2 py-1 font-display text-[11px] font-bold', note.priority === 'IMPORTANT' ? 'bg-error-container text-on-error-container' : 'bg-primary-container text-on-primary-container'].join(' ')}>
                    {note.priority === 'IMPORTANT' ? 'Quan trọng' : 'Bình thường'}
                  </span>
                  <span className="text-xs text-on-surface-variant">{note.createdAt}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">{note.content}</p>
              </div>
            )) : <p className="text-sm text-on-surface-variant">Chưa có ghi chú nội bộ.</p>}
          </div>
        </PanelSection>

        <button type="button" onClick={onAddNote} className="btn-warm mt-6 w-full">Thêm ghi chú</button>
      </aside>
    </div>
  )
}

function NoteModal({ customer, onCancel, onSubmit }: { customer: StaffCustomer; onCancel: () => void; onSubmit: (customerId: string, content: string, priority: NotePriority) => void }) {
  const [content, setContent] = useState('')
  const [priority, setPriority] = useState<NotePriority>('NORMAL')
  const [error, setError] = useState('')

  const submit = () => {
    if (content.trim().length < 5) {
      setError('Ghi chú cần ít nhất 5 ký tự.')
      return
    }
    onSubmit(customer.id, content, priority)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end bg-[#173A31]/45 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6" onClick={onCancel}>
      <div className="w-full rounded-t-3xl border border-outline-variant bg-white p-5 shadow-[var(--homestay-shadow-elevated)] sm:max-w-xl sm:rounded-3xl sm:p-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-wide text-brand-orange">Ghi chú nội bộ</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-on-surface">{customer.name}</h2>
          </div>
          <button type="button" onClick={onCancel} className="icon-button" aria-label="Đóng ghi chú"><IconClose /></button>
        </div>
        <label className="mt-5 block">
          <span className="font-display text-sm font-bold text-on-surface">Nội dung ghi chú</span>
          <textarea value={content} onChange={(event) => { setContent(event.target.value); setError('') }} className="input-field mt-2 min-h-32 resize-none py-3" placeholder="Nhập ghi chú hỗ trợ cho khách hàng..." />
          {error && <span className="mt-2 block text-sm font-semibold text-error">{error}</span>}
        </label>
        <label className="mt-4 block">
          <span className="font-display text-sm font-bold text-on-surface">Mức độ ưu tiên</span>
          <ProjectSelect value={priority} onChange={(event) => setPriority(event.target.value as NotePriority)} className="input-field mt-2">
            <option value="NORMAL">Bình thường</option>
            <option value="IMPORTANT">Quan trọng</option>
          </ProjectSelect>
        </label>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="btn-secondary">Hủy</button>
          <button type="button" onClick={submit} className="btn-warm">Lưu ghi chú</button>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, helper, icon, className }: { label: string; value: number; helper: string; icon: ReactNode; className: string }) {
  return <article className="rounded-3xl border border-outline-variant bg-white p-5 shadow-[var(--homestay-shadow-card)]"><div className="flex items-start justify-between gap-4"><div><p className="font-display text-sm font-bold text-on-surface-variant">{label}</p><p className="mt-3 font-display text-4xl font-bold leading-none text-on-surface">{value}</p></div><span className={['flex h-12 w-12 items-center justify-center rounded-2xl', className].join(' ')}>{icon}</span></div><p className="mt-4 text-sm text-on-surface-variant">{helper}</p></article>
}

function SearchInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <label className="relative block"><span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"><IconSearch /></span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Tìm tên khách hàng, email, số điện thoại..." className="h-12 w-full rounded-2xl border border-outline-variant bg-surface-container-low pl-11 pr-4 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/70 focus:border-brand-orange focus:bg-white" /></label>
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-3"><p className="font-display text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">{label}</p><p className="mt-2 text-sm font-semibold text-on-surface">{value}</p></div>
}

function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="mt-6"><h3 className="font-display text-base font-bold text-on-surface">{title}</h3><div className="mt-3">{children}</div></section>
}

function StatusBadge({ meta }: { meta: Meta }) {
  return <span className={['inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-display text-xs font-bold', meta.className].join(' ')}><span className={['h-1.5 w-1.5 rounded-full', meta.dotClassName].join(' ')} />{meta.label}</span>
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return <div className="rounded-3xl border border-dashed border-outline bg-white px-5 py-14 text-center shadow-[var(--homestay-shadow-card)]"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-container text-brand-orange"><IconSearch /></div><h2 className="mt-5 font-display text-xl font-bold text-on-surface">Không tìm thấy khách hàng</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">Thử đổi từ khóa tìm kiếm hoặc bộ lọc.</p><button type="button" onClick={onReset} className="btn-warm mx-auto mt-6">Đặt lại bộ lọc</button></div>
}

function PageSkeleton() {
  return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-3xl border border-outline-variant bg-white shadow-[var(--homestay-shadow-card)]" />)}</div><div className="h-20 animate-pulse rounded-3xl border border-outline-variant bg-white shadow-[var(--homestay-shadow-card)]" /><div className="grid gap-4 xl:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-64 animate-pulse rounded-3xl border border-outline-variant bg-white shadow-[var(--homestay-shadow-card)]" />)}</div></div>
}

function Toast({ message }: { message: string }) {
  return <div className="fixed bottom-5 left-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-secondary-container bg-secondary px-4 py-3 text-sm font-semibold text-on-secondary shadow-[var(--homestay-shadow-elevated)]">{message}</div>
}

function getCustomerTypeMeta(type: CustomerType): Meta {
  const meta: Record<CustomerType, Meta> = {
    NEW: { label: 'Khách mới', className: 'border-primary-container bg-primary-container text-on-primary-container', dotClassName: 'bg-brand-orange' },
    RETURNING: { label: 'Khách quay lại', className: 'border-on-secondary-container/40 bg-on-secondary-container text-[#001A0D]', dotClassName: 'bg-secondary-container' },
    VIP: { label: 'VIP', className: 'border-tertiary-container bg-tertiary-container text-on-tertiary-container', dotClassName: 'bg-tertiary' },
  }
  return meta[type]
}

function getBookingStatusMeta(status: BookingStatus): Meta {
  const meta: Record<BookingStatus, Meta> = {
    PENDING: { label: 'Chờ xác nhận', className: 'border-primary-container bg-primary-container text-on-primary-container', dotClassName: 'bg-brand-orange' },
    CONFIRMED: { label: 'Đã xác nhận', className: 'border-on-secondary-container/40 bg-on-secondary-container text-[#001A0D]', dotClassName: 'bg-secondary-container' },
    CHECKED_IN: { label: 'Đã check-in', className: 'border-tertiary-container bg-tertiary-container text-on-tertiary-container', dotClassName: 'bg-tertiary' },
    IN_PROGRESS: { label: 'Đang sử dụng', className: 'border-secondary-container bg-secondary text-on-secondary', dotClassName: 'bg-on-secondary-container' },
    COMPLETED: { label: 'Hoàn tất', className: 'border-outline-variant bg-surface-container-high text-on-surface-variant', dotClassName: 'bg-on-surface-variant' },
    CANCELLED: { label: 'Đã hủy', className: 'border-outline-variant bg-surface-container-high text-on-surface-variant', dotClassName: 'bg-on-surface-variant' },
    NO_SHOW: { label: 'Không đến', className: 'border-error-container bg-error-container text-on-error-container', dotClassName: 'bg-error' },
  }
  return meta[status]
}

function filterCustomers(customers: StaffCustomer[], query: string, filter: CustomerFilter) {
  const normalized = normalizeText(query)
  return customers.filter((customer) => {
    const matchesQuery = !normalized || normalizeText([customer.name, customer.phone, customer.email].join(' ')).includes(normalized)
    const matchesFilter = filter === 'ALL' || (filter === 'HAS_TODAY_BOOKING' ? customer.hasTodayBooking : customer.type === filter)
    return matchesQuery && matchesFilter
  })
}

function mapBackendCustomer(customer: BackendStaffCustomerSummary): StaffCustomer {
  return {
    id: String(customer.id),
    name: customer.name,
    phone: customer.phone ?? undefined,
    email: customer.email ?? undefined,
    type: customer.type,
    bookingCount: customer.bookingCount,
    lastBookingAt: customer.lastBookingAt ?? undefined,
    favoriteRoom: customer.favoriteRoom ?? undefined,
    favoriteAmenities: [],
    hasTodayBooking: customer.hasTodayBooking,
    notes: [],
  }
}

function mapBackendBooking(booking: BackendStaffCustomerBooking, fallbackCustomerId: number): StaffBooking {
  return {
    id: String(booking.id),
    code: booking.code,
    customerId: String(booking.customerId ?? fallbackCustomerId),
    roomName: booking.roomName,
    date: booking.date,
    startTime: formatBackendTime(booking.startTime),
    endTime: formatBackendTime(booking.endTime),
    totalPrice: Number(booking.totalPrice ?? 0),
    status: mapBackendBookingStatus(booking.status),
  }
}

function mapBackendBookingStatus(status: string): BookingStatus {
  const statusMap: Record<string, BookingStatus> = {
    PENDING_PAYMENT: 'PENDING',
    DEPOSIT_PAID: 'CONFIRMED',
    PAID: 'CONFIRMED',
    CHECKED_IN: 'CHECKED_IN',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
  }

  return statusMap[status] ?? 'PENDING'
}

function formatBackendTime(value?: string | null) {
  if (!value) return '--:--'
  return value.slice(0, 5)
}

function normalizeText(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDisplayDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(year, month - 1, day))
}

function IconUsers() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M17 20a5 5 0 0 0-10 0M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM21 19a4 4 0 0 0-4-4M18 5.3a3 3 0 0 1 0 5.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> }
function IconRefresh() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M18 3v4h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function IconStar() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 16.9l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg> }
function IconCalendar() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M7 3v4M17 3v4M4 9h16M6.5 5h11A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10A2.5 2.5 0 0 1 6.5 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> }
function IconPlus() { return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" /></svg> }
function IconSearch() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15ZM16 16l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> }
function IconClose() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg> }
