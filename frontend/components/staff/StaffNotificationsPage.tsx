'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import AuthGuard from '@/components/AuthGuard'
import {
  fetchStaffNotifications,
  markAllStaffNotificationsRead,
  markStaffNotificationRead,
  resolveStaffNotification,
  type BackendStaffNotification,
} from '@/lib/staff-notification-service'
import { EmptyState, StaffPageShell, StatusBadge, Toast } from './StaffShared'

type NotificationType = 'BOOKING_REMINDER' | 'NEW_BOOKING' | 'ROOM_STATUS' | 'EQUIPMENT_ISSUE' | 'SHIFT_REMINDER' | 'SYSTEM'
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
type NotificationTab = 'ALL' | 'UNREAD' | 'BOOKING' | 'ROOM' | 'EQUIPMENT' | 'SHIFT'

type StaffNotification = {
  id: string
  type: NotificationType
  title: string
  message: string
  createdAt: string
  priority: Priority
  isRead: boolean
  isResolved: boolean
  bookingId?: string
  customerName?: string
  roomName?: string
  bookingTime?: string
  equipment?: string[]
}

const initialNotifications: StaffNotification[] = [
  {
    id: 'n1',
    type: 'BOOKING_REMINDER',
    title: 'Khách sắp đến trong 20 phút',
    message: 'Gia đình Nguyễn chuẩn bị vào Deluxe Balcony 201. Kiểm tra Wi-Fi, điều hòa, TV và máy nước nóng trước khi khách đến.',
    createdAt: '5 phút trước',
    priority: 'HIGH',
    isRead: false,
    isResolved: false,
    bookingId: 'BK-0701-60',
    customerName: 'Gia đình Nguyễn',
    roomName: 'Deluxe Balcony 201',
    bookingTime: '08:00 - 09:30',
    equipment: ['Wi-Fi tốc độ cao', 'Điều hòa', 'Smart TV'],
  },
  {
    id: 'n2',
    type: 'NEW_BOOKING',
    title: 'Booking mới cần xác nhận',
    message: 'Gia đình Trần vừa đặt Family Garden 302 cho ca 09:00.',
    createdAt: '12 phút trước',
    priority: 'MEDIUM',
    isRead: false,
    isResolved: false,
    bookingId: 'BK-0701-61',
    customerName: 'Gia đình Trần',
    roomName: 'Family Garden 302',
    bookingTime: '09:00 - 10:30',
  },
  {
    id: 'n3',
    type: 'ROOM_STATUS',
    title: 'Family Suite 301 cần vệ sinh',
    message: 'Phòng vừa kết thúc ca trước, cần kiểm tra sàn và khu TV.',
    createdAt: '25 phút trước',
    priority: 'MEDIUM',
    isRead: true,
    isResolved: false,
    roomName: 'Family Suite 301',
  },
  {
    id: 'n4',
    type: 'EQUIPMENT_ISSUE',
    title: 'Smart TV Deluxe City View 202 mất kết nối',
    message: 'TV không kết nối được Wi-Fi. Ưu tiên kiểm tra trước ca chiều.',
    createdAt: '40 phút trước',
    priority: 'URGENT',
    isRead: false,
    isResolved: false,
    roomName: 'Deluxe City View 202',
    equipment: ['Smart TV 50 inch'],
  },
  {
    id: 'n5',
    type: 'SHIFT_REMINDER',
    title: 'Nhắc ca làm chiều',
    message: 'Ca chiều bắt đầu lúc 13:00. Hãy check-in đúng khung giờ.',
    createdAt: '1 giờ trước',
    priority: 'LOW',
    isRead: true,
    isResolved: true,
  },
  {
    id: 'n6',
    type: 'SYSTEM',
    title: 'Đồng bộ dữ liệu hoàn tất',
    message: 'Danh sách booking hôm nay đã được cập nhật trong workspace nhân viên.',
    createdAt: '2 giờ trước',
    priority: 'LOW',
    isRead: true,
    isResolved: true,
  },
]

const tabs: Array<{ id: NotificationTab; label: string }> = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'UNREAD', label: 'Chưa đọc' },
  { id: 'BOOKING', label: 'Booking' },
  { id: 'ROOM', label: 'Phòng' },
  { id: 'EQUIPMENT', label: 'Tiện nghi' },
  { id: 'SHIFT', label: 'Ca làm' },
]

export default function StaffNotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [activeTab, setActiveTab] = useState<NotificationTab>('ALL')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<StaffNotification | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadNotifications() {
      try {
        const data = await fetchStaffNotifications()
        if (!isMounted) return
        setNotifications(data.map(mapBackendNotification))
      } catch (error) {
        if (!isMounted) return
        setToast(error instanceof Error ? error.message : 'Khong the tai thong bao nhan vien.')
      }
    }

    void loadNotifications()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const filtered = useMemo(() => filterNotifications(notifications, activeTab, query), [activeTab, notifications, query])
  const unreadCount = notifications.filter((item) => !item.isRead).length

  const updateNotification = async (
    id: string,
    patch: Partial<StaffNotification>,
    message: string,
    request?: () => Promise<BackendStaffNotification>,
  ) => {
    setNotifications((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)))
    setSelected((current) => (current?.id === id ? { ...current, ...patch } : current))
    try {
      const requestNotification = request ?? (() => (patch.isResolved ? resolveStaffNotification(id) : markStaffNotificationRead(id)))
      const saved = mapBackendNotification(await requestNotification())
      setNotifications((current) => current.map((item) => (item.id === id ? { ...item, ...saved } : item)))
      setSelected((current) => (current?.id === id ? { ...current, ...saved } : current))
      setToast(message)
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Khong the cap nhat thong bao.')
    }
  }

  const markAllRead = async () => {
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })))
    try {
      const data = await markAllStaffNotificationsRead()
      setNotifications(data.map(mapBackendNotification))
      setToast('Da danh dau tat ca thong bao la da doc.')
      return
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Khong the danh dau tat ca thong bao da doc.')
      return
    }
    setToast('Đã đánh dấu tất cả thông báo là đã đọc.')
  }

  return (
    <AuthGuard allowedRoles={['STAFF']}>
      <StaffPageShell>
        <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-wide text-brand-orange">Trung tâm vận hành</p>
            <h1 className="mt-2 font-display text-[32px] font-bold leading-10 text-on-surface">Thông báo</h1>
            <p className="mt-2 max-w-2xl text-base leading-6 text-on-surface-variant">
              Theo dõi các cập nhật quan trọng trong ca làm.
            </p>
          </div>
          <button type="button" onClick={markAllRead} className="btn-warm">
            Đánh dấu tất cả đã đọc
          </button>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Tổng thông báo" value={notifications.length} />
          <SummaryCard label="Chưa đọc" value={unreadCount} />
          <SummaryCard label="Cần xử lý" value={notifications.filter((item) => !item.isResolved).length} />
        </section>

        <section className="rounded-3xl border border-outline-variant bg-white p-4 shadow-[var(--homestay-shadow-card)]">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    'whitespace-nowrap rounded-2xl px-4 py-2 font-display text-sm font-bold transition',
                    activeTab === tab.id ? 'bg-secondary text-on-secondary' : 'text-on-surface-variant hover:bg-surface-container-low',
                  ].join(' ')}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm thông báo, khách, phòng..."
              className="h-11 rounded-2xl border border-outline-variant bg-surface-container-low px-4 text-sm outline-none transition focus:border-brand-orange focus:bg-white xl:w-80"
            />
          </div>
        </section>

        {filtered.length > 0 ? (
          <section className="grid gap-4">
            {filtered.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onView={() => {
                  setSelected({ ...notification, isRead: true })
                  updateNotification(notification.id, { isRead: true }, 'Đã mở chi tiết thông báo.')
                }}
                onRead={() => updateNotification(notification.id, { isRead: true }, 'Đã đánh dấu thông báo là đã đọc.')}
                onResolve={() => updateNotification(notification.id, { isRead: true, isResolved: true }, 'Đã cập nhật thông báo là đã xử lý.')}
              />
            ))}
          </section>
        ) : (
          <EmptyState
            title="Không có thông báo phù hợp"
            description="Thử đổi tab hoặc từ khóa tìm kiếm để xem thêm cập nhật."
            actionLabel="Đặt lại bộ lọc"
            onAction={() => {
              setActiveTab('ALL')
              setQuery('')
            }}
          />
        )}

        {selected && <NotificationDetail notification={selected} onClose={() => setSelected(null)} />}
        {toast && <Toast message={toast} />}
      </StaffPageShell>
    </AuthGuard>
  )
}

function NotificationCard({
  notification,
  onView,
  onRead,
  onResolve,
}: {
  notification: StaffNotification
  onView: () => void
  onRead: () => void
  onResolve: () => void
}) {
  const type = getTypeMeta(notification.type)
  const priority = getPriorityMeta(notification.priority)

  return (
    <article className={['rounded-3xl border bg-white p-5 shadow-[var(--homestay-shadow-card)]', notification.isRead ? 'border-outline-variant' : 'border-brand-orange/40'].join(' ')}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <span className={['flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', type.iconClass].join(' ')}>{type.icon}</span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-bold text-on-surface">{notification.title}</h2>
              {!notification.isRead && <span className="h-2 w-2 rounded-full bg-brand-orange" />}
            </div>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">{notification.message}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge label={type.label} className={type.badgeClass} dotClassName={type.dotClass} />
              <StatusBadge label={priority.label} className={priority.className} dotClassName={priority.dotClassName} />
              <StatusBadge
                label={notification.isResolved ? 'Đã xử lý' : notification.isRead ? 'Đã đọc' : 'Chưa đọc'}
                className={notification.isResolved ? 'border-on-secondary-container/40 bg-on-secondary-container text-[#001A0D]' : 'border-outline-variant bg-surface-container-high text-on-surface-variant'}
                dotClassName={notification.isResolved ? 'bg-secondary-container' : 'bg-on-surface-variant'}
              />
            </div>
          </div>
        </div>
        <p className="text-sm font-semibold text-on-surface-variant">{notification.createdAt}</p>
      </div>

      {notification.type === 'BOOKING_REMINDER' && (
        <div className="mt-4 grid gap-3 rounded-2xl border border-primary-container bg-primary-container/55 p-4 sm:grid-cols-2 xl:grid-cols-4">
          <MiniMetric label="Khách hàng" value={notification.customerName ?? 'Chưa rõ'} />
          <MiniMetric label="Phòng" value={notification.roomName ?? 'Chưa rõ'} />
          <MiniMetric label="Giờ booking" value={notification.bookingTime ?? 'Chưa rõ'} />
          <MiniMetric label="Tiện nghi" value={notification.equipment?.join(', ') ?? 'Không có'} />
        </div>
      )}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={onView} className="btn-secondary">Xem chi tiết</button>
        {!notification.isRead && <button type="button" onClick={onRead} className="btn-secondary">Đánh dấu đã đọc</button>}
        <button type="button" onClick={onResolve} className="btn-warm">
          {notification.type === 'BOOKING_REMINDER' ? 'Đã chuẩn bị' : 'Đã xử lý'}
        </button>
      </div>
    </article>
  )
}

function NotificationDetail({ notification, onClose }: { notification: StaffNotification; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#042A16]/45 backdrop-blur-sm" onClick={onClose}>
      <aside className="h-full w-full overflow-y-auto border-l border-outline-variant bg-white p-5 shadow-[var(--homestay-shadow-elevated)] sm:max-w-xl sm:p-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-wide text-brand-orange">Chi tiết thông báo</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-on-surface">{notification.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="icon-button" aria-label="Đóng chi tiết">×</button>
        </div>
        <p className="mt-5 text-sm leading-6 text-on-surface-variant">{notification.message}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <MiniMetric label="Thời gian" value={notification.createdAt} />
          <MiniMetric label="Mức độ" value={getPriorityMeta(notification.priority).label} />
          <MiniMetric label="Khách hàng" value={notification.customerName ?? 'Không liên quan'} />
          <MiniMetric label="Phòng" value={notification.roomName ?? 'Không liên quan'} />
        </div>
      </aside>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-3xl border border-outline-variant bg-white p-5 shadow-[var(--homestay-shadow-card)]">
      <p className="font-display text-sm font-bold text-on-surface-variant">{label}</p>
      <p className="mt-3 font-display text-4xl font-bold text-on-surface">{value}</p>
    </article>
  )
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return <div><p className="font-display text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">{label}</p><p className="mt-1 text-sm font-semibold text-on-surface">{value}</p></div>
}

function filterNotifications(items: StaffNotification[], tab: NotificationTab, query: string) {
  const normalized = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return items.filter((item) => {
    const matchesQuery = !normalized || [item.title, item.message, item.customerName, item.roomName].join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalized)
    const matchesTab =
      tab === 'ALL' ||
      (tab === 'UNREAD' && !item.isRead) ||
      (tab === 'BOOKING' && ['BOOKING_REMINDER', 'NEW_BOOKING'].includes(item.type)) ||
      (tab === 'ROOM' && item.type === 'ROOM_STATUS') ||
      (tab === 'EQUIPMENT' && item.type === 'EQUIPMENT_ISSUE') ||
      (tab === 'SHIFT' && item.type === 'SHIFT_REMINDER')
    return matchesQuery && matchesTab
  })
}

function mapBackendNotification(notification: BackendStaffNotification): StaffNotification {
  return {
    id: String(notification.id),
    type: mapNotificationType(notification.type),
    title: notification.title,
    message: notification.message,
    createdAt: formatNotificationTime(notification.createdAt),
    priority: notification.priority,
    isRead: notification.isRead,
    isResolved: notification.isResolved,
  }
}

function mapNotificationType(type: string): NotificationType {
  const normalized = type.toUpperCase()
  if (normalized.includes('BOOKING')) return 'NEW_BOOKING'
  if (normalized.includes('ROOM')) return 'ROOM_STATUS'
  if (normalized.includes('EQUIPMENT')) return 'EQUIPMENT_ISSUE'
  if (normalized.includes('SHIFT')) return 'SHIFT_REMINDER'
  return 'SYSTEM'
}

function formatNotificationTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getTypeMeta(type: NotificationType) {
  const meta: Record<NotificationType, { label: string; icon: ReactNode; iconClass: string; badgeClass: string; dotClass: string }> = {
    BOOKING_REMINDER: { label: 'Nhắc khách sắp đến', icon: <IconBell />, iconClass: 'bg-primary-container text-brand-orange', badgeClass: 'border-primary-container bg-primary-container text-on-primary-container', dotClass: 'bg-brand-orange' },
    NEW_BOOKING: { label: 'Booking mới', icon: <IconCalendar />, iconClass: 'bg-on-secondary-container text-[#001A0D]', badgeClass: 'border-on-secondary-container/40 bg-on-secondary-container text-[#001A0D]', dotClass: 'bg-secondary-container' },
    ROOM_STATUS: { label: 'Trạng thái phòng', icon: <IconRoom />, iconClass: 'bg-secondary text-on-secondary', badgeClass: 'border-secondary-container bg-secondary text-on-secondary', dotClass: 'bg-on-secondary-container' },
    EQUIPMENT_ISSUE: { label: 'Sự cố tiện nghi', icon: <IconTool />, iconClass: 'bg-error-container text-error', badgeClass: 'border-error-container bg-error-container text-on-error-container', dotClass: 'bg-error' },
    SHIFT_REMINDER: { label: 'Nhắc ca làm', icon: <IconClock />, iconClass: 'bg-tertiary-container text-tertiary', badgeClass: 'border-tertiary-container bg-tertiary-container text-on-tertiary-container', dotClass: 'bg-tertiary' },
    SYSTEM: { label: 'Hệ thống', icon: <IconSystem />, iconClass: 'bg-surface-container-high text-on-surface-variant', badgeClass: 'border-outline-variant bg-surface-container-high text-on-surface-variant', dotClass: 'bg-on-surface-variant' },
  }
  return meta[type]
}

function getPriorityMeta(priority: Priority) {
  const meta: Record<Priority, { label: string; className: string; dotClassName: string }> = {
    LOW: { label: 'Thấp', className: 'border-outline-variant bg-surface-container-low text-on-surface-variant', dotClassName: 'bg-on-surface-variant' },
    MEDIUM: { label: 'Trung bình', className: 'border-primary-container bg-primary-container text-on-primary-container', dotClassName: 'bg-brand-orange' },
    HIGH: { label: 'Cao', className: 'border-tertiary-container bg-tertiary-container text-on-tertiary-container', dotClassName: 'bg-tertiary' },
    URGENT: { label: 'Khẩn cấp', className: 'border-error-container bg-error-container text-on-error-container', dotClassName: 'bg-error' },
  }
  return meta[priority]
}

function IconBell() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> }
function IconCalendar() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none"><path d="M7 3v4M17 3v4M4 9h16M6.5 5h11A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10A2.5 2.5 0 0 1 6.5 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> }
function IconRoom() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none"><path d="M4 20V6.8L12 3l8 3.8V20M9 20v-7h6v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function IconTool() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none"><path d="M15 4a4 4 0 0 0 5 5L10.5 18.5a3 3 0 0 1-4.2 0l-.8-.8a3 3 0 0 1 0-4.2L15 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function IconClock() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none"><path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> }
function IconSystem() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none"><path d="M12 3v18M3 12h18M5 5l14 14M19 5 5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg> }

