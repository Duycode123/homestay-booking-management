'use client'

import { useRouter } from 'next/navigation'

type AuthTab = 'login' | 'register'

export default function AuthTabs({ active }: { active: AuthTab }) {
  const router = useRouter()

  const tabClass = (tab: AuthTab) =>
    [
      'w-1/2 cursor-pointer rounded-lg py-2.5 font-display text-xs font-medium transition-all',
      active === tab
        ? 'bg-white text-on-surface shadow-sm'
        : 'text-on-surface-variant hover:text-on-surface',
    ].join(' ')

  return (
    <div className="mb-8 flex rounded-lg bg-surface-container p-1">
      <button type="button" className={tabClass('login')} onClick={() => active !== 'login' && router.push('/login')}>
        Đăng nhập
      </button>
      <button
        type="button"
        className={tabClass('register')}
        onClick={() => active !== 'register' && router.push('/register')}
      >
        Đăng ký
      </button>
    </div>
  )
}
