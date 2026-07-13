import type { ReactNode } from 'react'

type AuthFieldProps = {
  label: string
  name: string
  type?: string
  value: string
  placeholder: string
  icon: 'user' | 'lock' | 'email' | 'calendar'
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  trailing?: ReactNode
  max?: string
  min?: string
}

const iconPaths = {
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  lock: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  email:
    'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  calendar:
    'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
}

export function AuthField({
  label,
  name,
  type = 'text',
  value,
  placeholder,
  icon,
  onChange,
  trailing,
  max,
  min,
}: AuthFieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block font-display text-[11px] font-medium uppercase tracking-[0.08em] text-on-surface-variant"
      >
        {label}
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-on-surface-variant/60">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d={iconPaths[icon]} />
          </svg>
        </div>
        <input
          id={name}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required
          max={max}
          min={min}
          placeholder={placeholder}
          className={[
            'w-full rounded-lg border border-outline bg-white py-2.5 pl-10 text-sm text-on-surface',
            'placeholder:text-on-surface-variant/50',
            'transition-colors focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange',
            trailing ? 'pr-10' : 'pr-4',
          ].join(' ')}
        />
        {trailing}
      </div>
    </div>
  )
}

export function AuthError({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-lg border border-error/20 bg-error-container px-3 py-2.5 text-xs text-error">
      {message}
    </div>
  )
}

export function AuthSuccess({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-lg border border-secondary-container/50 bg-secondary-container/20 px-3 py-2.5 text-xs text-secondary">
      {message}
    </div>
  )
}

export function AuthSubmitButton({
  children,
  disabled,
}: {
  children: ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="mt-6 flex h-12 w-full cursor-pointer items-center justify-center rounded-lg bg-brand-orange font-display text-sm font-medium text-white shadow-[var(--shadow-card)] transition-all hover:bg-brand-orangeHover active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-surface-container-high disabled:text-on-surface-variant disabled:shadow-none"
    >
      {children}
    </button>
  )
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-brand-bgGray font-sans antialiased">
      {children}
    </div>
  )
}

export function AuthFormPanel({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full items-center justify-center p-6 sm:p-10 md:w-1/2 lg:p-12">
      <div className="w-full max-w-[440px] rounded-xl border border-outline-variant bg-white p-8 shadow-[var(--shadow-card)] sm:p-10">
        {children}
      </div>
    </div>
  )
}

export function AuthMobileBrand() {
  return (
    <div className="mb-6 flex items-center gap-3 md:hidden">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-orange">
        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 19V6l12-3v13M9 10l12-3M9 14c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm12-4c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z"
          />
        </svg>
      </div>
      <div>
        <p className="font-display text-base font-bold text-on-surface">Homestay Booking</p>
        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Đặt phòng homestay</p>
      </div>
    </div>
  )
}
