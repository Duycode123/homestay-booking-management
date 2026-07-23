'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATION_CHANGED_EVENT,
  notifyNotificationChanged,
  type AppNotification,
} from '@/lib/notification-service'

type NotificationMenuProps = { onNavigate?: () => void }

export default function NotificationMenu({ onNavigate }: NotificationMenuProps) {
  const router = useRouter()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = await getNotifications(20)
      setItems(data)
      setError('')
    } catch (requestError) {
      if (!silent) setError(requestError instanceof Error ? requestError.message : 'Không thể tải thông báo.')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const interval = window.setInterval(() => void load(true), 60_000)
    const sync = () => void load(true)
    window.addEventListener(NOTIFICATION_CHANGED_EVENT, sync)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener(NOTIFICATION_CHANGED_EVENT, sync)
    }
  }, [load])

  useEffect(() => {
    if (!open) return
    void load(true)
    const closeOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', closeOutside)
    document.addEventListener('keydown', closeEscape)
    return () => {
      document.removeEventListener('mousedown', closeOutside)
      document.removeEventListener('keydown', closeEscape)
    }
  }, [load, open])

  const unreadCount = useMemo(() => items.filter((item) => !item.isRead).length, [items])

  const openItem = async (item: AppNotification) => {
    if (!item.isRead) {
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, isRead: true } : entry))
      try {
        await markNotificationRead(item.id)
        notifyNotificationChanged()
      } catch {
        void load(true)
      }
    }
    setOpen(false)
    onNavigate?.()
    router.push(item.actionUrl || '/customer/notifications')
  }

  const markAll = async () => {
    if (!unreadCount) return
    setItems((current) => current.map((item) => ({ ...item, isRead: true })))
    try {
      setItems(await markAllNotificationsRead(20))
      notifyNotificationChanged()
    } catch {
      void load(true)
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ''}`}
        className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-[#ddccb4] bg-[#fffdfa] text-[#715334] shadow-[0_7px_20px_rgba(32,57,48,.08)] transition duration-300 hover:-translate-y-0.5 hover:border-[#b98853]/55 hover:bg-[#fff8ee] focus:outline-none focus:ring-2 focus:ring-[#b98853]/25"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#b54444] px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <section role="dialog" aria-label="Trung tâm thông báo" className="serene-dropdown-enter absolute right-0 z-[98] mt-3 flex max-h-[calc(100dvh-7rem)] w-[min(380px,calc(100vw-24px))] flex-col overflow-hidden rounded-[22px] border border-[#d8c9b5] bg-[#fffdfa] shadow-[0_26px_70px_rgba(20,47,38,.24)]">
          <header className="bg-[linear-gradient(145deg,#173f35,#254f43)] px-5 py-4 text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e7c59d]">Cập nhật hành trình</p>
                <h2 className="mt-1 font-display text-lg font-bold">Thông báo</h2>
              </div>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold">{unreadCount} mới</span>
            </div>
          </header>

          <div className="premium-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-2.5">
            {loading ? (
              <div className="space-y-2 p-1">{[1, 2, 3].map((value) => <div key={value} className="h-20 animate-pulse rounded-2xl bg-[#f1e9dd]" />)}</div>
            ) : error ? (
              <div className="m-1 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p>{error}</p>
                <button type="button" onClick={() => void load()} className="mt-2 font-bold underline">Thử lại</button>
              </div>
            ) : items.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f2e7d8] text-[#8d6943]"><BellIcon className="h-5 w-5" /></span>
                <h3 className="mt-3 font-display text-sm font-bold text-[#24352f]">Chưa có thông báo mới</h3>
                <p className="mt-1 text-xs leading-5 text-[#777b76]">Thông tin đặt phòng, thanh toán và hoàn tiền sẽ xuất hiện tại đây.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {items.slice(0, 7).map((item) => {
                  const meta = getNotificationMeta(item.type)
                  return (
                    <button key={item.id} type="button" onClick={() => void openItem(item)} className={`group flex w-full gap-3 rounded-2xl border p-3 text-left transition ${item.isRead ? 'border-transparent hover:border-[#e5d8c6] hover:bg-[#faf5ee]' : 'border-[#dfc49f] bg-[#fbf2e6]'}`}>
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.iconClass}`}>{meta.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start gap-2">
                          <span className="line-clamp-1 flex-1 font-display text-sm font-bold text-[#25352f]">{item.title}</span>
                          {!item.isRead ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#b57d45]" /> : null}
                        </span>
                        <span className="mt-1 line-clamp-2 text-xs leading-5 text-[#737770]">{item.message}</span>
                        <span className="mt-1.5 block text-[10px] font-semibold text-[#9b7852]">{formatNotificationTime(item.createdAt)}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <footer className="flex items-center justify-between gap-3 border-t border-[#eadfce] bg-[#fcf8f2] px-4 py-3">
            <button type="button" disabled={!unreadCount} onClick={() => void markAll()} className="text-xs font-bold text-[#806344] transition hover:text-[#a56d35] disabled:opacity-40">Đọc tất cả</button>
            <button type="button" onClick={() => { setOpen(false); onNavigate?.(); router.push('/customer/notifications') }} className="rounded-full bg-[#17493c] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#0f392f]">Xem tất cả</button>
          </footer>
        </section>
      ) : null}
    </div>
  )
}

export function BellIcon({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>
}

export function getNotificationMeta(type: string) {
  const normalized = type.toUpperCase()
  if (normalized.includes('REFUND')) return { label: 'Hoàn tiền', iconClass: 'bg-[#e5f2ec] text-[#176247]', icon: <RefundIcon /> }
  if (normalized.includes('PAYMENT')) return { label: 'Thanh toán', iconClass: 'bg-[#e9f0e9] text-[#23594a]', icon: <PaymentIcon /> }
  if (normalized.includes('CANCEL')) return { label: 'Hủy phòng', iconClass: 'bg-[#f8e9e5] text-[#a14f42]', icon: <CalendarIcon /> }
  if (normalized.includes('BOOKING') || normalized.includes('CHECK')) return { label: 'Đặt phòng', iconClass: 'bg-[#f3e6d4] text-[#8d6237]', icon: <CalendarIcon /> }
  return { label: 'Hệ thống', iconClass: 'bg-[#eee8df] text-[#6f6457]', icon: <BellIcon className="h-4 w-4" /> }
}

export function formatNotificationTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (seconds < 60) return 'Vừa xong'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày trước`
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

function PaymentIcon() { return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h3" /></svg> }
function CalendarIcon() { return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></svg> }
function RefundIcon() { return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M4 7h11a5 5 0 1 1 0 10H8" /><path d="m7 4-3 3 3 3" /></svg> }
