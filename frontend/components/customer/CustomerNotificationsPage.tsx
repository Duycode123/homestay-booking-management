'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerPageShell } from '@/components/customer/CustomerPageShell'
import { BellIcon, formatNotificationTime, getNotificationMeta } from '@/components/layout/NotificationMenu'
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notifyNotificationChanged,
  type AppNotification,
} from '@/lib/notification-service'

type Filter = 'ALL' | 'UNREAD' | 'BOOKING' | 'PAYMENT' | 'REFUND'

const filters: Array<{ value: Filter; label: string }> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'UNREAD', label: 'Chưa đọc' },
  { value: 'BOOKING', label: 'Đặt phòng' },
  { value: 'PAYMENT', label: 'Thanh toán' },
  { value: 'REFUND', label: 'Hoàn tiền' },
]

export default function CustomerNotificationsPage() {
  const router = useRouter()
  const [items, setItems] = useState<AppNotification[]>([])
  const [filter, setFilter] = useState<Filter>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      setItems(await getNotifications(50))
      setError('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể tải thông báo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    queueMicrotask(() => void load())
  }, [])

  const unreadCount = items.filter((item) => !item.isRead).length
  const visibleItems = useMemo(() => items.filter((item) => matchesFilter(item, filter)), [filter, items])

  const openItem = async (item: AppNotification) => {
    if (!item.isRead) {
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, isRead: true } : entry))
      try {
        await markNotificationRead(item.id)
        notifyNotificationChanged()
      } catch {
        void load()
        return
      }
    }
    if (item.actionUrl && item.actionUrl !== '/customer/notifications') router.push(item.actionUrl)
  }

  const markAll = async () => {
    if (!unreadCount) return
    setItems((current) => current.map((item) => ({ ...item, isRead: true })))
    try {
      setItems(await markAllNotificationsRead(50))
      notifyNotificationChanged()
    } catch {
      void load()
    }
  }

  return (
    <CustomerPageShell>
      <section className="relative overflow-hidden rounded-[26px] bg-[linear-gradient(135deg,#234D42,#52766B)] px-6 py-8 text-white shadow-[0_24px_60px_rgba(20,55,46,.17)] sm:px-9 sm:py-10">
        <div aria-hidden className="absolute -right-16 -top-20 h-56 w-56 rounded-full border border-white/10" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e7c59d]">Cập nhật hành trình</p>
            <h1 className="mt-3 font-editorial text-4xl sm:text-5xl">Trung tâm thông báo</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">Theo dõi đặt phòng, thanh toán, yêu cầu hủy và hoàn tiền tại một nơi.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold">{unreadCount} chưa đọc</span>
            <button type="button" onClick={() => void markAll()} disabled={!unreadCount} className="rounded-full bg-[#d0a06b] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#bb8752] disabled:cursor-default disabled:opacity-45">Đọc tất cả</button>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[24px] border border-[#e2d7c8] bg-[#fffdfa] p-3 shadow-[0_18px_50px_rgba(30,53,45,.08)] sm:p-5">
        <div className="flex gap-2 overflow-x-auto border-b border-[#ebe1d4] pb-4">
          {filters.map((item) => (
            <button key={item.value} type="button" onClick={() => setFilter(item.value)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${filter === item.value ? 'bg-[#234D42] text-white shadow-sm' : 'bg-[#f5eee4] text-[#665d52] hover:bg-[#eee2d3]'}`}>{item.label}</button>
          ))}
        </div>

        <div className="mt-4 min-h-64">
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((value) => <div key={value} className="h-28 animate-pulse rounded-2xl bg-[#f1e9dd]" />)}</div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700"><p>{error}</p><button type="button" onClick={() => void load()} className="mt-3 font-bold underline">Tải lại</button></div>
          ) : visibleItems.length === 0 ? (
            <div className="py-16 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f2e7d8] text-[#8d6943]"><BellIcon className="h-6 w-6" /></span>
              <h2 className="mt-4 font-display text-lg font-bold text-[#26372f]">Không có thông báo phù hợp</h2>
              <p className="mt-2 text-sm text-[#777b76]">Các cập nhật nghiệp vụ mới sẽ được lưu tại đây.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {visibleItems.map((item) => {
                const meta = getNotificationMeta(item.type)
                return (
                  <button key={item.id} type="button" onClick={() => void openItem(item)} className={`group flex w-full items-start gap-4 rounded-[20px] border p-4 text-left transition sm:p-5 ${item.isRead ? 'border-[#e8dfd3] bg-white hover:border-[#cfb998]' : 'border-[#dfc49f] bg-[#fbf2e6] shadow-[0_8px_24px_rgba(81,61,37,.06)]'}`}>
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${meta.iconClass}`}>{meta.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-col justify-between gap-1 sm:flex-row sm:items-start sm:gap-4">
                        <span className="font-display text-base font-bold text-[#25352f]">{item.title}</span>
                        <span className="shrink-0 text-[11px] font-semibold text-[#9b7852]">{formatNotificationTime(item.createdAt)}</span>
                      </span>
                      <span className="mt-1.5 block text-sm leading-6 text-[#6f756f]">{item.message}</span>
                      <span className="mt-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a6843]">{meta.label}{!item.isRead ? <><span>·</span><span className="text-[#a45142]">Chưa đọc</span></> : null}</span>
                    </span>
                    <span className="mt-3 text-[#a38867] transition-transform group-hover:translate-x-1" aria-hidden>→</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </CustomerPageShell>
  )
}

function matchesFilter(item: AppNotification, filter: Filter) {
  if (filter === 'ALL') return true
  if (filter === 'UNREAD') return !item.isRead
  const type = item.type.toUpperCase()
  if (filter === 'BOOKING') return type.includes('BOOKING') || type.includes('CHECK') || type.includes('CANCEL')
  if (filter === 'PAYMENT') return type.includes('PAYMENT')
  return type.includes('REFUND')
}
