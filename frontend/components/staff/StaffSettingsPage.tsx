'use client'

import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { StaffPageShell, Toast } from './StaffShared'
import { useAuth } from '@/contexts/AuthContext'
import { clearStaffAuthCaches, getDisplayName, getInitials, getProfileValue, getRoleLabel } from '@/lib/staff-profile'
import {
  applyUiPreferences,
  changePassword,
  defaultStaffUiPreferences,
  getCurrentUser,
  getNotificationSettings,
  loadUiPreferences,
  saveUiPreferences,
  uploadMyAvatar,
  updateMyProfile,
  updateNotificationSettings,
  type StaffNotificationSettings,
  type StaffProfile,
  type StaffUiPreferences,
} from '@/lib/staff-settings-service'

type SettingsTab = 'PROFILE' | 'NOTIFICATIONS' | 'SECURITY' | 'APPEARANCE'
type ToastState = { type: 'success' | 'error'; text: string }

const tabs: Array<{ id: SettingsTab; label: string }> = [
  { id: 'PROFILE', label: 'Hồ sơ' },
  { id: 'NOTIFICATIONS', label: 'Thông báo' },
  { id: 'SECURITY', label: 'Bảo mật' },
  { id: 'APPEARANCE', label: 'Giao diện' },
]

const emptyProfile: StaffProfile = {
  fullName: '',
  email: '',
  phone: '',
  role: 'STAFF',
}

const emptyPasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

export default function StaffSettingsPage() {
  const { user, login, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<SettingsTab>('PROFILE')
  const [profile, setProfile] = useState<StaffProfile>(emptyProfile)
  const [profileErrors, setProfileErrors] = useState<Partial<Record<keyof StaffProfile, string>>>({})
  const [notificationSettings, setNotificationSettings] = useState<StaffNotificationSettings>({
    newBooking: true,
    bookingReminder: true,
    shiftReminder: true,
    roomIssue: true,
    equipmentIssue: true,
  })
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm)
  const [passwordErrors, setPasswordErrors] = useState<Partial<Record<keyof typeof passwordForm, string>>>({})
  const [appearance, setAppearance] = useState<StaffUiPreferences>(defaultStaffUiPreferences)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [pageError, setPageError] = useState('')
  const [isProfileLoading, setIsProfileLoading] = useState(true)
  const [isProfileSaving, setIsProfileSaving] = useState(false)
  const [isAvatarUploading, setIsAvatarUploading] = useState(false)
  const [isNotificationLoading, setIsNotificationLoading] = useState(true)
  const [savingNotificationKey, setSavingNotificationKey] = useState<keyof StaffNotificationSettings | null>(null)
  const [isPasswordSaving, setIsPasswordSaving] = useState(false)

  const cardPadding = appearance.displayDensity === 'compact' ? 'p-4 sm:p-5' : 'p-5 sm:p-6'
  const profileInitials = useMemo(() => getInitials(profile.fullName || profile.email || getDisplayName(user)), [profile.email, profile.fullName, user])

  useEffect(() => {
    const preferences = loadUiPreferences()
    setAppearance(preferences)
    applyUiPreferences(preferences)
  }, [])

  useEffect(() => {
    if (!user) return

    setIsProfileLoading(true)
    setPageError('')
    void getCurrentUser(user)
      .then((currentUser) => {
        setProfile(currentUser)
        login({
          ...user,
          ...currentUser,
          name: currentUser.fullName,
          role: currentUser.role || user.role,
        })
      })
      .catch((error) => setPageError(error instanceof Error ? error.message : 'Không thể tải hồ sơ nhân viên.'))
      .finally(() => setIsProfileLoading(false))
  }, [user?.id, user?.email])

  useEffect(() => {
    setIsNotificationLoading(true)
    void getNotificationSettings()
      .then(setNotificationSettings)
      .catch((error) => showToast('error', error instanceof Error ? error.message : 'Không thể tải tùy chọn thông báo.'))
      .finally(() => setIsNotificationLoading(false))
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  const showToast = (type: ToastState['type'], text: string) => {
    setToast({ type, text })
  }

  const updateProfile = <Key extends keyof StaffProfile>(key: Key, value: StaffProfile[Key]) => {
    setProfile((current) => ({ ...current, [key]: value }))
    setProfileErrors((current) => ({ ...current, [key]: undefined }))
  }

  const saveProfile = async () => {
    const errors = validateProfile(profile)
    setProfileErrors(errors)

    if (Object.keys(errors).length > 0) return

    setIsProfileSaving(true)
    try {
      const updatedProfile = await updateMyProfile({
        fullName: profile.fullName.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
      })

      setProfile(updatedProfile)
      if (user) {
        login({
          ...user,
          ...updatedProfile,
          name: updatedProfile.fullName,
          role: updatedProfile.role || user.role,
        })
      }
      showToast('success', 'Đã lưu thay đổi hồ sơ.')
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không thể lưu hồ sơ nhân viên.')
    } finally {
      setIsProfileSaving(false)
    }
  }

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast('error', 'File tải lên phải là ảnh.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Ảnh đại diện không được vượt quá 5MB.')
      return
    }

    setIsAvatarUploading(true)
    try {
      const updatedProfile = await uploadMyAvatar(file, user)
      setProfile(updatedProfile)
      if (user) {
        login({
          ...user,
          ...updatedProfile,
          name: updatedProfile.fullName,
          role: updatedProfile.role || user.role,
        })
      }
      showToast('success', 'Đã cập nhật ảnh đại diện.')
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không thể tải ảnh đại diện lên.')
    } finally {
      setIsAvatarUploading(false)
    }
  }

  const updatePasswordField = (key: keyof typeof passwordForm, value: string) => {
    setPasswordForm((current) => ({ ...current, [key]: value }))
    setPasswordErrors((current) => ({ ...current, [key]: undefined }))
  }

  const updatePassword = async () => {
    const errors = validatePasswordForm(passwordForm)
    setPasswordErrors(errors)

    if (Object.keys(errors).length > 0) return

    setIsPasswordSaving(true)
    try {
      await changePassword(passwordForm)
      setPasswordForm(emptyPasswordForm)
      showToast('success', 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.')
      clearStaffAuthCaches()
      await logout('/login')
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không thể cập nhật mật khẩu.')
    } finally {
      setIsPasswordSaving(false)
    }
  }

  const toggleNotification = async (key: keyof StaffNotificationSettings) => {
    if (savingNotificationKey) return

    const previousSettings = notificationSettings
    const nextSettings = { ...previousSettings, [key]: !previousSettings[key] }
    setNotificationSettings(nextSettings)
    setSavingNotificationKey(key)

    try {
      const savedSettings = await updateNotificationSettings(nextSettings)
      setNotificationSettings(savedSettings)
      showToast('success', 'Đã lưu tùy chọn thông báo.')
    } catch (error) {
      setNotificationSettings(previousSettings)
      showToast('error', error instanceof Error ? error.message : 'Không thể lưu tùy chọn thông báo.')
    } finally {
      setSavingNotificationKey(null)
    }
  }

  const updateAppearance = <Key extends keyof StaffUiPreferences>(key: Key, value: StaffUiPreferences[Key]) => {
    const nextPreferences = { ...appearance, [key]: value }
    setAppearance(nextPreferences)
    saveUiPreferences(nextPreferences)
    showToast('success', 'Đã lưu tùy chọn giao diện.')
  }

  return (
    <AuthGuard allowedRoles={['STAFF']}>
      <StaffPageShell>
        <div className="staff-settings-density-scope contents">
        <header>
          <p className="font-display text-sm font-bold uppercase tracking-wide text-brand-orange">Không gian làm việc</p>
          <h1 className="mt-2 font-display text-[32px] font-bold leading-10 text-on-surface">Cài đặt</h1>
          <p className="mt-2 max-w-2xl text-base leading-6 text-on-surface-variant">
            Quản lý hồ sơ, bảo mật, thông báo và cách hiển thị khu vực làm việc của nhân viên.
          </p>
        </header>

        {pageError && <MessageBox type="error" message={pageError} />}

        <section className="rounded-3xl border border-outline-variant bg-white p-3 shadow-[var(--homestay-shadow-card)]">
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'whitespace-nowrap rounded-2xl px-5 py-3 font-display text-sm font-bold transition',
                  activeTab === tab.id ? 'bg-secondary text-on-secondary' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {activeTab === 'PROFILE' && (
          <SettingsCard title="Hồ sơ nhân viên" description="Thông tin này lấy từ tài khoản đang đăng nhập và được lưu về hệ thống." paddingClassName={cardPadding}>
            {isProfileLoading ? (
              <LoadingState message="Đang tải hồ sơ..." />
            ) : (
              <>
                <div className="flex flex-col gap-5 lg:flex-row">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-primary-container font-display text-3xl font-bold text-on-primary-container">
                    {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" /> : profileInitials}
                  </div>
                  <div className="lg:max-w-[240px]">
                    <label className="block">
                      <span className="mb-2 block font-display text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                        Avatar
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => void handleAvatarChange(event)}
                        disabled={isAvatarUploading || isProfileSaving}
                        className="block w-full text-xs text-on-surface-variant file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-4 file:py-2.5 file:font-display file:text-sm file:font-bold file:text-white hover:file:bg-secondary-container disabled:cursor-not-allowed disabled:opacity-60"
                      />
                      <span className="mt-2 block text-xs text-on-surface-variant">
                        {isAvatarUploading ? 'Đang tải ảnh lên Cloudinary...' : 'Tối đa 5MB. URL avatar sẽ được lưu vào database.'}
                      </span>
                    </label>
                  </div>
                  <div className="grid flex-1 gap-4 sm:grid-cols-2">
                    <Field label="Tên hiển thị" error={profileErrors.fullName}>
                      <input value={profile.fullName} onChange={(event) => updateProfile('fullName', event.target.value)} className="input-field" disabled={isProfileSaving} />
                    </Field>
                    <Field label="Email" error={profileErrors.email}>
                      <input type="email" value={profile.email} onChange={(event) => updateProfile('email', event.target.value)} className="input-field" disabled={isProfileSaving} />
                    </Field>
                    <Field label="Số điện thoại" error={profileErrors.phone}>
                      <input value={profile.phone} onChange={(event) => updateProfile('phone', event.target.value)} className="input-field" disabled={isProfileSaving} />
                    </Field>
                    <Field label="Vai trò">
                      <input value={getRoleLabel(profile.role)} disabled className="input-field cursor-not-allowed opacity-75" />
                    </Field>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button type="button" onClick={saveProfile} className="btn-warm" disabled={isProfileSaving || isAvatarUploading}>
                    {isProfileSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </>
            )}
          </SettingsCard>
        )}

        {activeTab === 'NOTIFICATIONS' && (
          <SettingsCard title="Thông báo" description="Các lựa chọn này được lưu theo tài khoản nhân viên và vẫn giữ sau khi đăng nhập lại." paddingClassName={cardPadding}>
            {isNotificationLoading ? (
              <LoadingState message="Đang tải tùy chọn thông báo..." />
            ) : (
              <div className="grid gap-3">
                <SettingsToggle label="Nhận thông báo booking mới" checked={notificationSettings.newBooking} isSaving={savingNotificationKey === 'newBooking'} disabled={Boolean(savingNotificationKey)} onChange={() => toggleNotification('newBooking')} />
                <SettingsToggle label="Nhắc khách sắp đến" checked={notificationSettings.bookingReminder} isSaving={savingNotificationKey === 'bookingReminder'} disabled={Boolean(savingNotificationKey)} onChange={() => toggleNotification('bookingReminder')} />
                <SettingsToggle label="Nhắc ca làm" checked={notificationSettings.shiftReminder} isSaving={savingNotificationKey === 'shiftReminder'} disabled={Boolean(savingNotificationKey)} onChange={() => toggleNotification('shiftReminder')} />
                <SettingsToggle label="Thông báo sự cố phòng" checked={notificationSettings.roomIssue} isSaving={savingNotificationKey === 'roomIssue'} disabled={Boolean(savingNotificationKey)} onChange={() => toggleNotification('roomIssue')} />
                <SettingsToggle label="Thông báo tiện nghi lỗi" checked={notificationSettings.equipmentIssue} isSaving={savingNotificationKey === 'equipmentIssue'} disabled={Boolean(savingNotificationKey)} onChange={() => toggleNotification('equipmentIssue')} />
              </div>
            )}
          </SettingsCard>
        )}

        {activeTab === 'SECURITY' && (
          <SettingsCard title="Bảo mật" description="Đổi mật khẩu thật cho tài khoản hiện tại. Sau khi đổi thành công bạn sẽ cần đăng nhập lại." paddingClassName={cardPadding}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mật khẩu hiện tại" error={passwordErrors.currentPassword}>
                <input type="password" value={passwordForm.currentPassword} onChange={(event) => updatePasswordField('currentPassword', event.target.value)} className="input-field" disabled={isPasswordSaving} />
              </Field>
              <Field label="Mật khẩu mới" error={passwordErrors.newPassword}>
                <input type="password" value={passwordForm.newPassword} onChange={(event) => updatePasswordField('newPassword', event.target.value)} className="input-field" disabled={isPasswordSaving} />
              </Field>
              <Field label="Xác nhận mật khẩu mới" error={passwordErrors.confirmPassword}>
                <input type="password" value={passwordForm.confirmPassword} onChange={(event) => updatePasswordField('confirmPassword', event.target.value)} className="input-field" disabled={isPasswordSaving} />
              </Field>
            </div>
            <div className="mt-6 flex justify-end">
              <button type="button" onClick={updatePassword} className="btn-warm" disabled={isPasswordSaving}>
                {isPasswordSaving ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </button>
            </div>
          </SettingsCard>
        )}

        {activeTab === 'APPEARANCE' && (
          <SettingsCard title="Giao diện" description="Tùy chọn hiển thị được lưu trên trình duyệt bằng localStorage và tự áp dụng lại khi reload." paddingClassName={cardPadding}>
            <div className="grid gap-4 lg:grid-cols-2">
              <OptionGroup
                label="Mật độ hiển thị"
                options={[
                  { value: 'comfortable', label: 'Thoải mái' },
                  { value: 'compact', label: 'Gọn' },
                ]}
                value={appearance.displayDensity}
                onChange={(value) => updateAppearance('displayDensity', value as StaffUiPreferences['displayDensity'])}
              />
              <OptionGroup
                label="Ưu tiên hiển thị"
                options={[
                  { value: 'card', label: 'Card' },
                  { value: 'table', label: 'Bảng' },
                ]}
                value={appearance.preferredView}
                onChange={(value) => updateAppearance('preferredView', value as StaffUiPreferences['preferredView'])}
              />
              <div className="lg:col-span-2">
                <SettingsToggle label="Giảm hiệu ứng chuyển động" checked={appearance.reduceMotion} onChange={() => updateAppearance('reduceMotion', !appearance.reduceMotion)} />
              </div>
            </div>
          </SettingsCard>
        )}

        {toast && <Toast message={toast.text} />}
        </div>
      </StaffPageShell>
    </AuthGuard>
  )
}

function validateProfile(profile: StaffProfile) {
  const errors: Partial<Record<keyof StaffProfile, string>> = {}
  if (!profile.fullName.trim()) errors.fullName = 'Vui lòng nhập tên hiển thị.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) errors.email = 'Email chưa đúng định dạng.'
  if (profile.phone.trim() && !/^[0-9]{9,11}$/.test(profile.phone.trim())) errors.phone = 'Số điện thoại phải có 9-11 chữ số.'
  return errors
}

function validatePasswordForm(form: typeof emptyPasswordForm) {
  const errors: Partial<Record<keyof typeof emptyPasswordForm, string>> = {}
  if (!form.currentPassword) errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại.'
  if (!form.newPassword) errors.newPassword = 'Vui lòng nhập mật khẩu mới.'
  if (form.newPassword && form.newPassword.length < 8) errors.newPassword = 'Mật khẩu mới cần tối thiểu 8 ký tự.'
  if (!form.confirmPassword) errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới.'
  if (form.confirmPassword && form.confirmPassword !== form.newPassword) errors.confirmPassword = 'Mật khẩu xác nhận chưa khớp.'
  if (form.currentPassword && form.newPassword && form.currentPassword === form.newPassword) errors.newPassword = 'Mật khẩu mới không được giống mật khẩu hiện tại.'
  return errors
}

function SettingsCard({ title, description, children, paddingClassName }: { title: string; description: string; children: React.ReactNode; paddingClassName: string }) {
  return (
    <section className={['rounded-3xl border border-outline-variant bg-white shadow-[var(--homestay-shadow-card)]', paddingClassName].join(' ')}>
      <h2 className="font-display text-2xl font-bold text-on-surface">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-on-surface-variant">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-display text-sm font-bold text-on-surface">{label}</span>
      <span className="mt-2 block">{children}</span>
      {error && <span className="mt-2 block text-sm font-semibold text-error">{error}</span>}
    </label>
  )
}

function SettingsToggle({ label, checked, disabled, isSaving, onChange }: { label: string; checked: boolean; disabled?: boolean; isSaving?: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange} disabled={disabled} className="flex items-center justify-between gap-4 rounded-2xl border border-outline-variant bg-surface-container-low p-4 text-left transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70">
      <span>
        <span className="block font-display text-sm font-bold text-on-surface">{label}</span>
        {isSaving && <span className="mt-1 block text-xs font-semibold text-brand-orange">Đang lưu...</span>}
      </span>
      <span className={['relative h-7 w-12 rounded-full transition', checked ? 'bg-brand-orange' : 'bg-surface-container-high'].join(' ')}>
        <span className={['absolute top-1 h-5 w-5 rounded-full bg-white shadow transition', checked ? 'left-6' : 'left-1'].join(' ')} />
      </span>
    </button>
  )
}

function OptionGroup({ label, options, value, onChange }: { label: string; options: Array<{ value: string; label: string }>; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <p className="font-display text-sm font-bold text-on-surface">{label}</p>
      <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl border border-outline-variant bg-surface-container-low p-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={[
              'rounded-xl px-4 py-3 font-display text-sm font-bold transition',
              value === option.value ? 'bg-secondary text-on-secondary shadow-[var(--homestay-shadow-card)]' : 'text-on-surface-variant hover:bg-white',
            ].join(' ')}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function LoadingState({ message }: { message: string }) {
  return <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-5 text-sm font-semibold text-on-surface-variant">{message}</div>
}

function MessageBox({ type, message }: { type: ToastState['type']; message: string }) {
  const isError = type === 'error'
  return (
    <div className={['rounded-2xl border px-4 py-3 text-sm font-semibold', isError ? 'border-error-container bg-error-container text-on-error-container' : 'border-[#CDE9D6] bg-[#E8F5EC] text-secondary'].join(' ')}>
      {message}
    </div>
  )
}
