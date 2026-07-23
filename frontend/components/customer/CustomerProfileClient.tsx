'use client'

import Link from 'next/link'
import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { CustomerCard, CustomerPageShell } from '@/components/customer/CustomerPageShell'
import { useAuth } from '@/contexts/AuthContext'
import {
  fetchCurrentUser,
  getCustomerDisplayName,
  getInitials,
  uploadCustomerAvatar,
  updateCustomerProfile,
  type CustomerProfile,
  type UpdateCustomerProfilePayload,
} from '@/lib/customer-profile-service'
import type { UserRole } from '@/lib/auth'

type Message = {
  type: 'success' | 'error'
  text: string
}

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Admin',
  STAFF: 'Nhân viên',
  CUSTOMER: 'Khách hàng',
}

export default function CustomerProfileClient() {
  const { user, login, isLoading } = useAuth()
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [profileForm, setProfileForm] = useState<UpdateCustomerProfilePayload>({
    fullName: '',
    email: '',
    phone: '',
  })
  const [profileMessage, setProfileMessage] = useState<Message | null>(null)
  const [isFetchingProfile, setIsFetchingProfile] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadProfile = async () => {
      setProfile(null)
      setProfileForm({
        fullName: '',
        email: '',
        phone: '',
      })
      setIsFetchingProfile(true)

      try {
        const currentProfile = await fetchCurrentUser(user)
        if (!mounted) return

        setProfile(currentProfile)
        setProfileForm({
          fullName: currentProfile.fullName,
          email: currentProfile.email,
          phone: currentProfile.phone,
        })
        setProfileMessage(null)
      } catch {
        if (!mounted) return
        setProfileMessage({ type: 'error', text: 'Không thể tải thông tin hồ sơ. Vui lòng thử lại.' })
      } finally {
        if (mounted) {
          setIsFetchingProfile(false)
        }
      }
    }

    if (!isLoading) {
      void loadProfile()
    }

    return () => {
      mounted = false
    }
  }, [isLoading, user])

  const displayName = getCustomerDisplayName({
    ...(profile ?? { role: 'CUSTOMER' as const }),
    fullName: profileForm.fullName || profile?.fullName || '',
    email: profileForm.email || profile?.email || '',
  })
  const displayEmail = profileForm.email || profile?.email || ''
  const avatarInitial = getInitials(displayName, displayEmail)
  const avatarUrl = profile?.avatarUrl
  const role = profile?.role || user?.role || 'CUSTOMER'

  const validateProfile = () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phonePattern = /^[0-9]{9,11}$/

    if (!profileForm.fullName.trim()) {
      return 'Họ tên không được để trống.'
    }

    if (profileForm.fullName.trim().length < 2 || profileForm.fullName.trim().length > 100) {
      return 'Họ tên cần từ 2 đến 100 ký tự.'
    }

    if (!emailPattern.test(profileForm.email.trim()) || profileForm.email.trim().length > 254) {
      return 'Email chưa đúng định dạng.'
    }

    if (profileForm.phone.trim() && !phonePattern.test(profileForm.phone.trim())) {
      return 'Số điện thoại phải có 9-11 chữ số.'
    }

    return null
  }

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationError = validateProfile()

    if (validationError) {
      setProfileMessage({ type: 'error', text: validationError })
      return
    }

    setIsSavingProfile(true)
    setProfileMessage(null)

    try {
      const updatedProfile = await updateCustomerProfile({
        fullName: profileForm.fullName.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
      })

      setProfile(updatedProfile)
      setProfileForm({
        fullName: updatedProfile.fullName,
        email: updatedProfile.email,
        phone: updatedProfile.phone,
      })
      login({
        ...(user ?? { role: 'CUSTOMER' as const }),
        id: updatedProfile.id ? String(updatedProfile.id) : user?.id,
        fullName: updatedProfile.fullName,
        name: updatedProfile.fullName,
        email: updatedProfile.email,
        phone: updatedProfile.phone,
        avatarUrl: updatedProfile.avatarUrl,
      })
      setProfileMessage({ type: 'success', text: 'Cập nhật thông tin thành công.' })
    } catch (error) {
      setProfileMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Không thể cập nhật thông tin. Vui lòng thử lại.',
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setProfileMessage({ type: 'error', text: 'File tải lên phải là ảnh.' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileMessage({ type: 'error', text: 'Ảnh đại diện không được vượt quá 5MB.' })
      return
    }

    setIsUploadingAvatar(true)
    setProfileMessage(null)

    try {
      const updatedProfile = await uploadCustomerAvatar(file, user)
      setProfile(updatedProfile)
      login({
        ...(user ?? { role: updatedProfile.role }),
        id: updatedProfile.id ? String(updatedProfile.id) : user?.id,
        fullName: updatedProfile.fullName,
        name: updatedProfile.fullName,
        email: updatedProfile.email,
        phone: updatedProfile.phone,
        avatarUrl: updatedProfile.avatarUrl,
        role: updatedProfile.role,
      })
      setProfileMessage({ type: 'success', text: 'Cập nhật ảnh đại diện thành công.' })
    } catch (error) {
      setProfileMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Không thể tải ảnh đại diện lên. Vui lòng thử lại.',
      })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const completedFields = [profileForm.fullName.trim(), profileForm.email.trim(), profileForm.phone.trim(), avatarUrl].filter(Boolean).length
  const profileCompletion = completedFields * 25

  return (
    <CustomerPageShell>
      <div className="relative mb-6 overflow-hidden rounded-[22px] bg-gradient-to-br from-[#514C44] via-secondary to-[#746D63] px-6 py-8 text-white shadow-[0_22px_60px_rgba(11,59,47,0.2)] sm:px-9 sm:py-10">
        <div className="pointer-events-none absolute -right-16 -top-28 h-72 w-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-4 -top-16 h-48 w-48 rounded-full bg-primary-fixed/10 blur-3xl" />
        <div className="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative w-fit">
              <AvatarPreview avatarUrl={avatarUrl} initial={avatarInitial} size="large" />
              <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-secondary bg-[#7DB48B]" title="Tài khoản đang hoạt động" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span aria-hidden className="h-px w-7 bg-primary-fixed" />
                <p className="font-display text-[10px] font-semibold uppercase tracking-[0.22em] text-primary-fixed">Thông tin cá nhân</p>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="font-editorial text-4xl font-semibold leading-tight sm:text-5xl">{isFetchingProfile ? 'Đang tải hồ sơ' : displayName}</h1>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">{roleLabels[role]}</span>
              </div>
              <p className="mt-2 text-sm text-white/65">{isFetchingProfile ? 'Đang đồng bộ thông tin tài khoản...' : displayEmail}</p>
            </div>
          </div>
          <div className="max-w-xs border-t border-white/15 pt-5 md:border-l md:border-t-0 md:pl-7 md:pt-0">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-primary-fixed">Dùng cho kỳ lưu trú</p>
            <p className="mt-2 text-sm leading-6 text-white/68">Thông tin chính xác giúp xác nhận đặt phòng và liên hệ hỗ trợ thuận tiện hơn.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        <CustomerCard className="p-0 hover:border-outline-variant">
          <form
            onSubmit={handleSaveProfile}
            className="overflow-hidden"
          >
            <div className="border-b border-outline-variant bg-gradient-to-r from-[#F2F6F3] to-white px-6 py-6 sm:px-8">
              <p className="eyebrow text-brand-orange">Hồ sơ khách hàng</p>
              <h2 className="font-editorial mt-2 text-3xl font-semibold text-secondary">Chi tiết cá nhân</h2>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">Cập nhật thông tin được dùng khi đặt phòng và nhận hỗ trợ.</p>
            </div>

            <div className="space-y-7 px-6 py-7 sm:px-8">
              <div className="flex flex-col gap-5 rounded-2xl border border-outline-variant bg-[#FAF8F3] p-5 sm:flex-row sm:items-center">
                <AvatarPreview avatarUrl={avatarUrl} initial={avatarInitial} size="small" />
                <div className="flex-1">
                  <p className="font-display text-sm font-semibold text-on-surface">Ảnh đại diện</p>
                  <p className="mt-1 text-xs leading-5 text-on-surface-variant">Ảnh JPG, PNG hoặc WebP, dung lượng tối đa 5MB.</p>
                </div>
                <label className={`inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-secondary/20 bg-white px-4 font-display text-xs font-semibold text-secondary transition hover:border-secondary hover:bg-[#EDF4F0] ${isFetchingProfile || isUploadingAvatar ? 'pointer-events-none opacity-60' : ''}`}>
                  <input type="file" accept="image/*" disabled={isFetchingProfile || isUploadingAvatar} onChange={(event) => void handleAvatarChange(event)} className="sr-only" />
                  {isUploadingAvatar ? 'Đang cập nhật...' : 'Thay ảnh'}
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Họ và tên" hint="Tên hiển thị trên thông tin đặt phòng.">
                <input
                  name="fullName"
                  autoComplete="name"
                  minLength={2}
                  maxLength={100}
                  required
                  value={profileForm.fullName}
                  disabled={isFetchingProfile}
                  onChange={(event) => setProfileForm((form) => ({ ...form, fullName: event.target.value }))}
                  className={inputClassName}
                />
              </FormField>

                <FormField label="Email" hint="Email đăng nhập được bảo vệ. Liên hệ hỗ trợ nếu bạn cần thay đổi.">
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  maxLength={254}
                  required
                  readOnly
                  value={profileForm.email}
                  disabled={isFetchingProfile}
                  onChange={(event) => setProfileForm((form) => ({ ...form, email: event.target.value }))}
                  className={`${inputClassName} cursor-not-allowed bg-surface-container-low text-on-surface-variant`}
                />
              </FormField>

                <FormField label="Số điện thoại" hint="9–11 chữ số, không gồm khoảng trắng.">
                <input
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  pattern="[0-9]{9,11}"
                  value={profileForm.phone}
                  disabled={isFetchingProfile}
                  onChange={(event) => setProfileForm((form) => ({ ...form, phone: event.target.value }))}
                  placeholder="Ví dụ: 0901234567"
                  className={inputClassName}
                />
              </FormField>
              </div>

              {profileMessage && <MessageBox message={profileMessage} />}

              <div className="flex flex-col gap-4 border-t border-outline-variant pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-sm text-xs leading-5 text-on-surface-variant">Kiểm tra lại email và số điện thoại để không bỏ lỡ thông tin về lịch đặt.</p>
                <button
                  type="submit"
                  disabled={isSavingProfile || isFetchingProfile || isUploadingAvatar}
                  className="inline-flex h-12 items-center justify-center rounded-full bg-secondary px-7 font-display text-sm font-semibold text-white shadow-[0_12px_28px_rgba(11,59,47,0.18)] transition hover:bg-[#746D63] focus:outline-none focus:ring-2 focus:ring-secondary/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingProfile ? 'Đang lưu thay đổi...' : 'Lưu thay đổi'}
                </button>
              </div>
            </div>
          </form>
        </CustomerCard>

        <aside className="space-y-4">
          <CustomerCard className="bg-secondary text-white hover:border-outline-variant">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-primary-fixed">Mức độ hoàn thiện</p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <p className="font-editorial text-4xl font-semibold">{isFetchingProfile ? '—' : `${profileCompletion}%`}</p>
              <span className="text-xs text-white/60">{completedFields}/4 mục</span>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-primary-fixed transition-all duration-500" style={{ width: `${profileCompletion}%` }} />
            </div>
            <p className="mt-4 text-sm leading-6 text-white/68">Thêm ảnh đại diện và số điện thoại để đội ngũ dễ nhận diện, hỗ trợ bạn khi cần.</p>
          </CustomerCard>

          <CustomerCard>
            <p className="eyebrow text-brand-orange">Thiết lập riêng</p>
            <h2 className="mt-2 font-editorial text-2xl font-semibold text-secondary">Cài đặt tài khoản</h2>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">Bảo mật, quyền riêng tư và trợ năng được quản lý ở một trang riêng để không trùng với biểu mẫu hồ sơ.</p>
            <nav className="mt-5 border-y border-outline-variant">
              <ProfileLink href="/customer/account-settings" label="Mở cài đặt tài khoản" />
            </nav>
          </CustomerCard>

          <div className="rounded-xl border border-[#D8C39E]/50 bg-[#F3EBDD] p-5">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-[#74522F]">Quyền riêng tư</p>
            <p className="mt-2 text-xs leading-5 text-[#74522F]/80">Thông tin liên hệ chỉ được sử dụng để phục vụ tài khoản, đơn đặt phòng và hỗ trợ lưu trú.</p>
          </div>
        </aside>
      </div>
    </CustomerPageShell>
  )
}

const inputClassName = 'h-12 w-full rounded-xl border border-outline bg-white px-4 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/45 focus:border-secondary focus:ring-2 focus:ring-secondary/15 disabled:cursor-wait disabled:bg-surface-container-low'

function AvatarPreview({
  avatarUrl,
  initial,
  size,
}: {
  avatarUrl?: string
  initial: string
  size: 'large' | 'small'
}) {
  const classes = size === 'large' ? 'h-24 w-24 border-[3px] border-white/65 text-4xl shadow-[0_14px_30px_rgba(0,0,0,0.2)]' : 'h-14 w-14 text-xl'

  return (
    <span
      className={[
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-orange font-display font-bold text-white',
        classes,
      ].join(' ')}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="Ảnh đại diện"
          width={size === 'large' ? 96 : 56}
          height={size === 'large' ? 96 : 56}
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        initial
      )}
    </span>
  )
}

function FormField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label>
      <span className="mb-2 block font-display text-xs font-semibold uppercase tracking-[0.1em] text-on-surface">{label}</span>
      {children}
      {hint ? <span className="mt-2 block text-xs leading-5 text-on-surface-variant">{hint}</span> : null}
    </label>
  )
}

function ProfileLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="group flex items-center justify-between py-3.5 text-sm font-semibold text-on-surface transition hover:text-secondary">
      {label}
      <span aria-hidden className="text-brand-orange transition-transform group-hover:translate-x-1">→</span>
    </Link>
  )
}

function MessageBox({ message }: { message: Message }) {
  const isSuccess = message.type === 'success'

  return (
    <p
      role={isSuccess ? 'status' : 'alert'}
      aria-live={isSuccess ? 'polite' : 'assertive'}
      className={[
        'mt-4 rounded-2xl border px-4 py-3 text-sm',
        isSuccess ? 'border-[#746D63]/25 bg-[#F1F8F2] text-[#746D63]' : 'border-[#C62828]/20 bg-[#FFEBEE] text-[#C62828]',
      ].join(' ')}
    >
      {message.text}
    </p>
  )
}
