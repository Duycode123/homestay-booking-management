'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { getAuthApiErrorMessage } from '@/lib/auth-api-error'
import AuthBanner from '@/components/auth/AuthBanner'
import AuthTabs from '@/components/auth/AuthTabs'
import {
  AuthError,
  AuthField,
  AuthFormPanel,
  AuthMobileBrand,
  AuthShell,
  AuthSubmitButton,
} from '@/components/auth/AuthField'

const REGISTER_BULLETS = [
  { title: 'Đặt phòng thuận tiện', desc: 'Lưu thông tin để hoàn tất những lần đặt phòng tiếp theo nhanh hơn.' },
  { title: 'Theo dõi hành trình', desc: 'Xem trạng thái và thông tin các kỳ nghỉ trong một nơi.' },
  { title: 'Nhận hỗ trợ đúng lúc', desc: 'Gửi yêu cầu đến đội ngũ vận hành ngay trong tài khoản.' },
]

const MIN_CUSTOMER_AGE = 13
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^(?:0|\+84)(?:3|5|7|8|9)\d{8}$/
const PASSWORD_HAS_LETTER = /[A-Za-z]/
const PASSWORD_HAS_NUMBER = /\d/

type RegistrationForm = {
  fullName: string
  email: string
  phone: string
  dateOfBirth: string
  password: string
  confirmPassword: string
}

const INITIAL_FORM: RegistrationForm = {
  fullName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  password: '',
  confirmPassword: '',
}

function maxBirthDateIso() {
  const date = new Date()
  date.setFullYear(date.getFullYear() - MIN_CUSTOMER_AGE)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizePhone(phone: string) {
  return phone.trim().replace(/[\s.-]/g, '')
}

function validateRegistration(form: RegistrationForm, maxBirthDate: string) {
  const fullName = form.fullName.trim()
  const email = form.email.trim().toLowerCase()
  const phone = normalizePhone(form.phone)

  if (fullName.length < 2 || fullName.length > 100) {
    return 'Họ và tên phải có từ 2 đến 100 ký tự.'
  }
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return 'Vui lòng nhập một địa chỉ email hợp lệ, tối đa 254 ký tự.'
  }
  if (!PHONE_PATTERN.test(phone)) {
    return 'Số điện thoại Việt Nam phải bắt đầu bằng 03, 05, 07, 08, 09 hoặc +84.'
  }
  if (!form.dateOfBirth) {
    return 'Vui lòng chọn ngày sinh.'
  }
  if (form.dateOfBirth > maxBirthDate) {
    return 'Bạn phải đủ 13 tuổi để tạo tài khoản.'
  }
  if (form.password.length < 8 || form.password.length > 72) {
    return 'Mật khẩu phải có từ 8 đến 72 ký tự.'
  }
  if (!PASSWORD_HAS_LETTER.test(form.password) || !PASSWORD_HAS_NUMBER.test(form.password)) {
    return 'Mật khẩu phải chứa ít nhất một chữ cái và một chữ số.'
  }
  if (form.password !== form.confirmPassword) {
    return 'Mật khẩu xác nhận không trùng khớp.'
  }

  return ''
}

function PasswordVisibilityButton({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
      aria-pressed={visible}
      className="absolute inset-y-0 right-0 flex items-center pr-4 text-on-surface-variant/60 transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:text-brand-orange"
    >
      {visible ? (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 1-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      )}
    </button>
  )
}

function PasswordRule({ met, children }: { met: boolean; children: string }) {
  return (
    <li className={met ? 'text-brand-greenLight' : 'text-on-surface-variant'}>
      <span aria-hidden="true">{met ? '✓' : '○'}</span> {children}
    </li>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<RegistrationForm>(INITIAL_FORM)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const maxBirthDate = useMemo(() => maxBirthDateIso(), [])

  const passwordRules = {
    validLength: formData.password.length >= 8 && formData.password.length <= 72,
    hasLetter: PASSWORD_HAS_LETTER.test(formData.password),
    hasNumber: PASSWORD_HAS_NUMBER.test(formData.password),
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    if (error) setError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const validationError = validateRegistration(formData, maxBirthDate)
    if (validationError) {
      setError(validationError)
      return
    }

    const payload = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: normalizePhone(formData.phone),
      dateOfBirth: formData.dateOfBirth,
      password: formData.password,
    }

    setIsLoading(true)

    try {
      const response = await api.post('/api/auth/register', payload)
      if (response.status === 200 || response.status === 201) {
        router.push(`/verify-email?sent=1&email=${encodeURIComponent(payload.email)}`)
      }
    } catch (requestError: unknown) {
      setError(getAuthApiErrorMessage(requestError, 'Chưa thể tạo tài khoản. Vui lòng thử lại.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell>
      <AuthBanner
        description="Tạo tài khoản để lưu thông tin, theo dõi kỳ nghỉ và nhận các cập nhật đặt phòng quan trọng."
        bullets={REGISTER_BULLETS}
        imageSrc="/images/Regis.png"
        imageAlt="Phong cảnh núi và cánh đồng trong làn mây nhìn từ The Serene Villa"
        imagePosition="object-[center_52%]"
      />

      <AuthFormPanel>
        <AuthMobileBrand />
        <AuthTabs active="register" />

        <div className="mb-7">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-orange">Tài khoản thành viên</p>
          <h1 className="font-editorial text-3xl font-semibold tracking-[-0.025em] text-on-surface">Bắt đầu kỳ nghỉ của bạn</h1>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant">
            Điền thông tin chính xác để nhận xác nhận đặt phòng và hỗ trợ trong suốt hành trình.
          </p>
        </div>

        {error && <AuthError message={error} />}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <AuthField
            label="Họ và tên"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Nguyễn Văn An"
            icon="user"
            minLength={2}
            maxLength={100}
            autoComplete="name"
          />
          <AuthField
            label="Địa chỉ email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="ban@example.com"
            icon="email"
            maxLength={254}
            inputMode="email"
            autoComplete="email"
          />
          <div>
            <AuthField
              label="Số điện thoại"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="0912 345 678"
              icon="user"
              maxLength={16}
              inputMode="tel"
              autoComplete="tel"
              ariaDescribedBy="phone-hint"
            />
            <p id="phone-hint" className="mt-1.5 text-[11px] leading-4 text-on-surface-variant">
              Dùng đầu số Việt Nam 03, 05, 07, 08, 09 hoặc định dạng +84.
            </p>
          </div>
          <AuthField
            label="Ngày sinh"
            name="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={handleChange}
            placeholder=""
            icon="calendar"
            max={maxBirthDate}
            autoComplete="bday"
          />
          <div>
            <AuthField
              label="Mật khẩu"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              placeholder="Tạo mật khẩu an toàn"
              icon="lock"
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              ariaDescribedBy="password-requirements"
              trailing={
                <PasswordVisibilityButton
                  visible={showPassword}
                  onToggle={() => setShowPassword((visible) => !visible)}
                />
              }
            />
            <ul id="password-requirements" className="mt-2 grid grid-cols-1 gap-1 text-[11px] sm:grid-cols-3" aria-label="Yêu cầu mật khẩu">
              <PasswordRule met={passwordRules.validLength}>8–72 ký tự</PasswordRule>
              <PasswordRule met={passwordRules.hasLetter}>Có chữ cái</PasswordRule>
              <PasswordRule met={passwordRules.hasNumber}>Có chữ số</PasswordRule>
            </ul>
          </div>
          <div>
            <AuthField
              label="Xác nhận mật khẩu"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Nhập lại mật khẩu"
              icon="lock"
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              ariaDescribedBy="confirm-password-hint"
              ariaInvalid={Boolean(formData.confirmPassword && formData.confirmPassword !== formData.password)}
            />
            {formData.confirmPassword && (
              <p
                id="confirm-password-hint"
                className={`mt-1.5 text-[11px] ${formData.confirmPassword === formData.password ? 'text-brand-greenLight' : 'text-error'}`}
                aria-live="polite"
              >
                {formData.confirmPassword === formData.password ? 'Mật khẩu đã trùng khớp.' : 'Mật khẩu chưa trùng khớp.'}
              </p>
            )}
          </div>

          <AuthSubmitButton disabled={isLoading}>
            {isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
          </AuthSubmitButton>
        </form>

        <p className="mt-5 text-center text-[11px] leading-5 text-on-surface-variant">
          Khi tạo tài khoản, bạn đồng ý với{' '}
          <Link href="/terms" className="font-semibold text-brand-greenDark underline-offset-4 hover:underline">Điều khoản sử dụng</Link>
          {' '}và{' '}
          <Link href="/privacy" className="font-semibold text-brand-greenDark underline-offset-4 hover:underline">Chính sách riêng tư</Link>.
        </p>

        <p className="mt-4 text-center text-xs text-on-surface-variant">
          Đã có tài khoản?{' '}
          <Link
            href="/login"
            className="font-display font-semibold text-brand-greenDark underline decoration-brand-orange/50 underline-offset-4 hover:decoration-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/30"
          >
            Đăng nhập
          </Link>
        </p>
      </AuthFormPanel>
    </AuthShell>
  )
}
