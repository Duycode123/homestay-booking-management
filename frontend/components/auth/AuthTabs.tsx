'use client'

import { useRouter } from 'next/navigation'

type AuthTab = 'login' | 'register'

export default function AuthTabs({ active }: { active: AuthTab }) {
  const router = useRouter()

  const tabClass = (tab: AuthTab) =>
    [
      'w-1/2 cursor-pointer rounded-full px-4 py-2.5 font-display text-xs font-semibold transition-[color,background-color,box-shadow]',
      active === tab
        ? 'bg-white text-brand-greenDark shadow-[0_4px_14px_rgba(23,48,39,.08)]'
        : 'text-on-surface-variant hover:bg-white/50 hover:text-on-surface',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/35',
    ].join(' ')

  return (
    <div className="mb-8 flex rounded-full border border-outline-variant/70 bg-surface-container-low p-1" aria-label="Chọn phương thức tài khoản">
      <button
        type="button"
        aria-pressed={active === 'login'}
        className={tabClass('login')}
        onClick={() => active !== 'login' && router.push('/login')}
      >
        Đăng nhập
      </button>
      <button
        type="button"
        aria-pressed={active === 'register'}
        className={tabClass('register')}
        onClick={() => active !== 'register' && router.push('/register')}
      >
        Đăng ký
      </button>
    </div>
  )
}
