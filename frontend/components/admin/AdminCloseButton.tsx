'use client'

import { IconClose } from '@/components/admin/AdminIcons'

type AdminCloseButtonProps = {
  onClick: () => void
  label?: string
  /** onDark: nút trên ảnh/header tối */
  variant?: 'default' | 'onDark'
  className?: string
}

export default function AdminCloseButton({
  onClick,
  label = 'Đóng',
  variant = 'default',
  className = '',
}: AdminCloseButtonProps) {
  const base =
    'group inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200 active:scale-95'

  const styles =
    variant === 'onDark'
      ? 'border border-white/35 bg-white/90 text-on-surface shadow-sm backdrop-blur-sm hover:bg-white hover:text-brand-orange hover:shadow-md'
      : 'border border-outline-variant bg-white text-on-surface-variant shadow-sm hover:border-brand-orange/35 hover:bg-primary-container/50 hover:text-brand-orange hover:shadow-md'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={[base, styles, className].filter(Boolean).join(' ')}
    >
      <IconClose className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
    </button>
  )
}
