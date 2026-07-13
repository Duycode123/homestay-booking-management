'use client'

import AdminCloseButton from '@/components/admin/AdminCloseButton'

type AdminToastProps = {
  message: string
  onDismiss?: () => void
}

export default function AdminToast({ message, onDismiss }: AdminToastProps) {
  if (!message) return null

  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-2xl border border-secondary-container/40 bg-gradient-to-r from-secondary-container/20 to-white px-4 py-3 shadow-[var(--shadow-card)]"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-container/40 text-secondary">
        ✓
      </span>
      <p className="flex-1 text-sm font-medium text-secondary">{message}</p>
      {onDismiss && <AdminCloseButton onClick={onDismiss} label="Đóng thông báo" className="h-8 w-8" />}
    </div>
  )
}
