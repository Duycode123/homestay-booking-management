'use client'

import Link from 'next/link'
import { useMemo, useState, type FormEvent } from 'react'
import {
  CustomerActionMessage,
  CustomerActionPageLayout,
  CustomerActionQuickLink,
  CustomerActionSidebarCard,
  CustomerActionSubmitButton,
} from '@/components/customer/CustomerActionPageLayout'
import { CustomerCard } from '@/components/customer/CustomerPageShell'
import { changeCustomerPassword, type ChangeCustomerPasswordPayload } from '@/lib/customer-profile-service'

const emptyForm: ChangeCustomerPasswordPayload = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

const securityTips = [
  {
    title: 'Mật khẩu riêng biệt',
    description: 'Không dùng chung mật khẩu The Serene Villa với email hoặc mạng xã hội.',
  },
  {
    title: 'Đổi định kỳ',
    description: 'Nên cập nhật mật khẩu mỗi 3–6 tháng, đặc biệt khi dùng tiện nghi công cộng.',
  },
  {
    title: 'Đăng xuất khi rời máy',
    description: 'Luôn đăng xuất trên máy tính dùng chung sau khi đặt phòng.',
  },
]

export default function CustomerSecurityClient() {
  const [form, setForm] = useState<ChangeCustomerPasswordPayload>(emptyForm)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [visibleFields, setVisibleFields] = useState({
    current: false,
    next: false,
    confirm: false,
  })

  const passwordChecks = useMemo(
    () => ({
      minLength: form.newPassword.length >= 8,
      hasNumber: /\d/.test(form.newPassword),
      hasLetter: /[A-Za-z]/.test(form.newPassword),
      matches: form.newPassword.length > 0 && form.newPassword === form.confirmPassword,
    }),
    [form.confirmPassword, form.newPassword],
  )

  const passwordStrength = useMemo(() => getPasswordStrength(form.newPassword), [form.newPassword])

  const steps = useMemo(() => {
    const hasCurrent = form.currentPassword.trim().length > 0
    const hasValidNew = passwordChecks.minLength
    const hasConfirm = passwordChecks.matches

    return [
      { id: 'verify', label: 'Xác minh', complete: hasCurrent, current: !hasCurrent },
      { id: 'new', label: 'Mật khẩu mới', complete: hasValidNew, current: hasCurrent && !hasValidNew },
      { id: 'confirm', label: 'Xác nhận', complete: hasConfirm, current: hasValidNew && !hasConfirm },
    ]
  }, [form.currentPassword, passwordChecks])

  const validate = () => {
    if (!form.currentPassword.trim()) {
      return 'Vui lòng nhập mật khẩu hiện tại.'
    }
    if (form.newPassword.length < 8) {
      return 'Mật khẩu mới phải có ít nhất 8 ký tự.'
    }
    if (form.newPassword !== form.confirmPassword) {
      return 'Mật khẩu xác nhận không khớp.'
    }
    return null
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationError = validate()

    if (validationError) {
      setMessage({ type: 'error', text: validationError })
      return
    }

    setIsSubmitting(true)
    setMessage(null)
    try {
      await changeCustomerPassword(form)
      setForm(emptyForm)
      setVisibleFields({ current: false, next: false, confirm: false })
      setMessage({ type: 'success', text: 'Cập nhật mật khẩu thành công.' })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Không thể cập nhật mật khẩu. Vui lòng thử lại.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CustomerActionPageLayout
      variant="account-security"
      eyebrow="Tài khoản"
      title="Bảo mật & mật khẩu"
      description="Khu vực quản lý đăng nhập — đổi mật khẩu và giữ tài khoản an toàn."
      breadcrumb={[
        { label: 'Tài khoản', href: '/customer/profile' },
        { label: 'Bảo mật & mật khẩu' },
      ]}
      stats={[
        {
          label: 'Trạng thái',
          value: 'Được bảo vệ',
          tone: 'green',
          icon: <ShieldIcon className="h-4 w-4" />,
        },
        {
          label: 'Yêu cầu',
          value: 'Tối thiểu 8 ký tự',
          tone: 'neutral',
          icon: <KeyIcon className="h-4 w-4" />,
        },
        {
          label: 'Phiên hiện tại',
          value: 'Vẫn giữ sau đổi',
          tone: 'green',
          icon: <SessionIcon className="h-4 w-4" />,
        },
      ]}
      steps={steps}
      formTitle="Đổi mật khẩu"
      formDescription="Hoàn thành 3 bước bên dưới để cập nhật mật khẩu đăng nhập."
      formIcon={<LockIcon className="h-5 w-5" />}
      sidebar={
        <>
          <CustomerActionSidebarCard
            variant="account-security"
            title="Mẹo bảo mật"
            description="Thói quen tốt giúp tài khoản an toàn hơn."
            icon={<ShieldIcon className="h-5 w-5 text-brand-orange" />}
          >
            <div className="space-y-3">
              {securityTips.map((tip) => (
                <article
                  key={tip.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
                >
                  <h3 className="font-display text-sm font-bold">{tip.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-white/70">{tip.description}</p>
                </article>
              ))}
            </div>
          </CustomerActionSidebarCard>

          <CustomerCard>
            <h2 className="font-display text-base font-bold text-on-surface">Liên kết tài khoản</h2>
            <nav className="mt-4 grid gap-2">
              <CustomerActionQuickLink href="/customer/profile" label="Hồ sơ cá nhân" />
              <CustomerActionQuickLink href="/customer/accessibility" label="Màn hình & trợ năng" />
            </nav>
            <p className="mt-4 text-xs leading-5 text-on-surface-variant">
              Cần hỗ trợ đăng nhập?{' '}
              <Link href="/customer/support" className="font-semibold text-brand-orange hover:underline">
                Trung tâm hỗ trợ
              </Link>
            </p>
          </CustomerCard>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <PasswordField
          id="current-password"
          label="Mật khẩu hiện tại"
          placeholder="Nhập mật khẩu đang dùng"
          value={form.currentPassword}
          visible={visibleFields.current}
          onToggleVisible={() =>
            setVisibleFields((current) => ({ ...current, current: !current.current }))
          }
          onChange={(value) => setForm((current) => ({ ...current, currentPassword: value }))}
          autoComplete="current-password"
        />

        <div className="space-y-4 rounded-2xl border border-brand-greenLight/20 bg-[#F1F8F2]/50 p-4 sm:p-5">
          <PasswordField
            id="new-password"
            label="Mật khẩu mới"
            placeholder="Tối thiểu 8 ký tự"
            value={form.newPassword}
            visible={visibleFields.next}
            onToggleVisible={() => setVisibleFields((current) => ({ ...current, next: !current.next }))}
            onChange={(value) => setForm((current) => ({ ...current, newPassword: value }))}
            autoComplete="new-password"
            accent="green"
          />

          {form.newPassword.length > 0 ? (
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                  Độ mạnh mật khẩu
                </span>
                <span className={`font-display text-xs font-bold ${passwordStrength.textClass}`}>
                  {passwordStrength.label}
                </span>
              </div>
              <div className="flex gap-1.5">
                {Array.from({ length: 4 }).map((_, index) => (
                  <span
                    key={index}
                    className={[
                      'h-1.5 flex-1 rounded-full transition-colors',
                      index < passwordStrength.score ? passwordStrength.barClass : 'bg-outline-variant',
                    ].join(' ')}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <PasswordField
            id="confirm-password"
            label="Nhập lại mật khẩu mới"
            placeholder="Nhập lại để xác nhận"
            value={form.confirmPassword}
            visible={visibleFields.confirm}
            onToggleVisible={() =>
              setVisibleFields((current) => ({ ...current, confirm: !current.confirm }))
            }
            onChange={(value) => setForm((current) => ({ ...current, confirmPassword: value }))}
            autoComplete="new-password"
            accent="green"
          />

          <ul className="grid gap-2 sm:grid-cols-2">
            <RequirementItem met={passwordChecks.minLength} text="Ít nhất 8 ký tự" />
            <RequirementItem met={passwordChecks.hasLetter} text="Có chữ cái" />
            <RequirementItem met={passwordChecks.hasNumber} text="Có chữ số" />
            <RequirementItem met={passwordChecks.matches} text="Hai mật khẩu khớp nhau" />
          </ul>
        </div>

        {message ? <CustomerActionMessage message={message} /> : null}

        <div className="flex flex-col gap-3 border-t border-outline-variant pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-on-surface-variant">
            Sau khi đổi, bạn vẫn giữ phiên đăng nhập hiện tại.
          </p>
          <CustomerActionSubmitButton
            isSubmitting={isSubmitting}
            submittingLabel="Đang cập nhật"
            label="Cập nhật mật khẩu"
            icon={<CheckIcon className="h-4 w-4" />}
            variant="primary"
          />
        </div>
      </form>
    </CustomerActionPageLayout>
  )
}

function PasswordField({
  id,
  label,
  placeholder,
  value,
  visible,
  onToggleVisible,
  onChange,
  autoComplete,
  accent = 'default',
}: {
  id: string
  label: string
  placeholder: string
  value: string
  visible: boolean
  onToggleVisible: () => void
  onChange: (value: string) => void
  autoComplete: string
  accent?: 'default' | 'green'
}) {
  const focusRing =
    accent === 'green'
      ? 'focus:border-brand-greenDark focus:ring-brand-greenDark/20'
      : 'focus:border-brand-orange focus:ring-brand-orange/20'

  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block font-display text-xs font-bold uppercase tracking-[0.08em] text-on-surface-variant">
        {label}
      </span>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-on-surface-variant/60">
          <LockIcon className="h-4 w-4" />
        </span>
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`h-12 w-full rounded-2xl border border-outline bg-white py-2.5 pl-11 pr-12 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/50 focus:ring-2 ${focusRing}`}
        />
        <button
          type="button"
          onClick={onToggleVisible}
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          className="absolute inset-y-0 right-0 flex items-center px-4 text-on-surface-variant transition hover:text-brand-orange"
        >
          {visible ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
      </div>
    </label>
  )
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <span
        className={[
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
          met ? 'bg-brand-greenLight text-white' : 'bg-outline-variant text-on-surface-variant',
        ].join(' ')}
      >
        {met ? '✓' : '·'}
      </span>
      <span className={met ? 'font-medium text-brand-greenDark' : 'text-on-surface-variant'}>{text}</span>
    </li>
  )
}

function getPasswordStrength(password: string) {
  if (!password) {
    return { score: 0, label: 'Chưa nhập', textClass: 'text-on-surface-variant', barClass: 'bg-outline-variant' }
  }

  let points = 0
  if (password.length >= 8) points++
  if (password.length >= 12) points++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) points++
  if (/\d/.test(password)) points++
  if (/[^A-Za-z0-9]/.test(password)) points++

  const score = Math.min(4, Math.max(1, Math.ceil(points / 1.5)))

  if (score <= 1) {
    return { score: 1, label: 'Yếu', textClass: 'text-error', barClass: 'bg-error' }
  }
  if (score === 2) {
    return { score: 2, label: 'Trung bình', textClass: 'text-[#B45309]', barClass: 'bg-[#F59E0B]' }
  }
  if (score === 3) {
    return { score: 3, label: 'Khá', textClass: 'text-brand-greenDark', barClass: 'bg-brand-greenLight' }
  }
  return { score: 4, label: 'Mạnh', textClass: 'text-brand-greenDark', barClass: 'bg-brand-greenDark' }
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 11V8a2 2 0 114 0v3" />
    </svg>
  )
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" />
    </svg>
  )
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="8" cy="15" r="4" />
      <path strokeLinecap="round" d="M11 15h10m-3-3l3 3-3 3" />
    </svg>
  )
}

function SessionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path strokeLinecap="round" d="M7 19h10" />
    </svg>
  )
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.6A3 3 0 0012 15a3 3 0 002.4-4.4M9.9 5.1A10.7 10.7 0 0112 5c6.5 0 10 7 10 7a18.4 18.4 0 01-4.2 5.2M6.7 6.7C4.1 8.4 2.5 10.7 2 12s3.5 7 10 7c1.8 0 3.4-.4 4.9-1" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}
