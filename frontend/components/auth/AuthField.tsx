import type { ChangeEvent, InputHTMLAttributes, ReactNode } from 'react'

type AuthFieldProps = {
  label: string
  name: string
  type?: string
  value: string
  placeholder: string
  icon: 'user' | 'lock' | 'email' | 'calendar'
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  trailing?: ReactNode
  max?: string
  min?: string
  maxLength?: number
  minLength?: number
  pattern?: string
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode']
  autoComplete?: string
  ariaDescribedBy?: string
  ariaInvalid?: boolean
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
  maxLength,
  minLength,
  pattern,
  inputMode,
  autoComplete,
  ariaDescribedBy,
  ariaInvalid,
}: AuthFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-xs font-semibold tracking-[0.03em] text-on-surface">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-on-surface-variant/65" aria-hidden="true">
          <svg className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d={iconPaths[icon]} />
          </svg>
        </span>
        <input
          id={name}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required
          max={max}
          min={min}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          inputMode={inputMode}
          autoComplete={autoComplete}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          placeholder={placeholder}
          className={[
            'h-12 w-full rounded-xl border border-outline/70 bg-surface-container-lowest pl-11 text-sm text-on-surface shadow-[inset_0_1px_0_rgba(255,255,255,.7)]',
            'placeholder:text-on-surface-variant/45',
            'transition-[border-color,box-shadow,background-color] duration-200 hover:border-outline',
            'focus:border-brand-orange focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-orange/10',
            trailing ? 'pr-11' : 'pr-4',
          ].join(' ')}
        />
        {trailing}
      </div>
    </div>
  )
}

export function AuthError({ message }: { message: string }) {
  return (
    <div role="alert" aria-live="assertive" className="mb-5 flex gap-2.5 rounded-xl border border-error/20 bg-error-container/75 px-4 py-3 text-xs leading-5 text-error">
      <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="7.5" stroke="currentColor" />
        <path d="M10 6.25v4.5M10 13.5v.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span>{message}</span>
    </div>
  )
}

export function AuthSuccess({ message }: { message: string }) {
  return (
    <div role="status" aria-live="polite" className="mb-5 flex gap-2.5 rounded-xl border border-secondary/20 bg-secondary-container/25 px-4 py-3 text-xs leading-5 text-secondary">
      <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="7.5" stroke="currentColor" />
        <path d="m6.5 10 2.25 2.25 4.75-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{message}</span>
    </div>
  )
}

export function AuthSubmitButton({ children, disabled }: { children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="mt-6 flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-brand-greenDark px-6 font-display text-sm font-semibold tracking-[0.01em] text-white shadow-[0_12px_28px_rgba(18,50,39,.16)] transition-[transform,background-color,box-shadow] hover:-translate-y-0.5 hover:bg-brand-greenLight hover:shadow-[0_16px_34px_rgba(18,50,39,.2)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-orange/25 active:translate-y-0 disabled:cursor-not-allowed disabled:bg-surface-container-high disabled:text-on-surface-variant disabled:shadow-none"
    >
      {children}
    </button>
  )
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-brand-bgGray font-sans antialiased lg:flex-row">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-orange/[0.07] blur-3xl lg:hidden" aria-hidden="true" />
      {children}
    </main>
  )
}

export function AuthFormPanel({ children }: { children: ReactNode }) {
  return (
    <section className="relative z-10 flex min-h-dvh w-full items-center justify-center px-5 py-8 sm:px-8 sm:py-12 lg:w-[52%] lg:px-10 xl:px-16">
      <div className="w-full max-w-[460px] py-4 sm:rounded-[1.75rem] sm:border sm:border-outline-variant/80 sm:bg-white/90 sm:p-10 sm:shadow-[0_24px_70px_rgba(23,48,39,.08)] sm:backdrop-blur-xl">
        {children}
      </div>
    </section>
  )
}

export function AuthMobileBrand() {
  return (
    <div className="mb-8 flex items-center gap-3 lg:hidden">
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-orange/30 bg-brand-greenDark text-brand-orange shadow-[0_8px_20px_rgba(18,50,39,.12)]">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3.75 11.25 12 4.5l8.25 6.75v7.5a.75.75 0 0 1-.75.75h-15a.75.75 0 0 1-.75-.75v-7.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M9.25 19.5v-5.25h5.5v5.25" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M15.8 5.7c.25-1.65 1.35-2.7 3.2-2.95-.12 1.7-1.2 2.73-3.2 2.95Z" fill="currentColor" />
        </svg>
      </span>
      <div>
        <p className="font-display text-base font-semibold tracking-[0.01em] text-on-surface">The Serene Villa</p>
        <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.22em] text-on-surface-variant">Curated stays</p>
      </div>
    </div>
  )
}
