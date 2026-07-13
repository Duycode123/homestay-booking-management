'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'
import AdminToast from '@/components/admin/AdminToast'
import { IconBookings, IconPlus, IconRefresh } from '@/components/admin/AdminIcons'
import AdminStaffCreateModal from '@/components/admin/staff/AdminStaffCreateModal'
import AdminStaffDetailPanel from '@/components/admin/staff/AdminStaffDetailPanel'
import AdminStaffFiltersBar from '@/components/admin/staff/AdminStaffFiltersBar'
import AdminStaffTable from '@/components/admin/staff/AdminStaffTable'
import {
  createStaffAccount,
  disableStaffAccount,
  getStaffAccountDetail,
  listStaffAccounts,
  type StaffAccountFilters,
  type StaffAccountFormData,
  type StaffAccountResponse,
} from '@/lib/admin/staff/adminStaffApi'

const DEFAULT_FILTERS: StaffAccountFilters = {
  query: '',
  status: 'ALL',
  verification: 'ALL',
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function filterStaff(staff: StaffAccountResponse[], filters: StaffAccountFilters) {
  const query = normalize(filters.query)

  return staff.filter((item) => {
    const matchQuery =
      !query ||
      normalize(item.fullName).includes(query) ||
      normalize(item.email).includes(query) ||
      normalize(item.phone || '').includes(query) ||
      String(item.staffId).includes(query) ||
      String(item.accountId).includes(query)

    const matchStatus =
      filters.status === 'ALL' ||
      (filters.status === 'ACTIVE' && item.enabled) ||
      (filters.status === 'DISABLED' && !item.enabled)

    const matchVerification =
      filters.verification === 'ALL' ||
      (filters.verification === 'VERIFIED' && item.emailVerified) ||
      (filters.verification === 'UNVERIFIED' && !item.emailVerified)

    return matchQuery && matchStatus && matchVerification
  })
}

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffAccountResponse[]>([])
  const [filters, setFilters] = useState<StaffAccountFilters>(DEFAULT_FILTERS)
  const [selected, setSelected] = useState<StaffAccountResponse | null>(null)
  const [disableTarget, setDisableTarget] = useState<StaffAccountResponse | null>(null)
  const [createStaffOpen, setCreateStaffOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const loadStaff = useCallback(async () => {
    setIsLoading(true)

    try {
      const data = await listStaffAccounts()
      setStaff(data)
      setSelected((current) => {
        if (!current) return null
        return data.find((item) => item.staffId === current.staffId) ?? null
      })
      setErrorMessage('')
    } catch (error) {
      setStaff([])
      setSelected(null)
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải danh sách nhân viên.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStaff()
  }, [loadStaff])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  const visibleStaff = useMemo(() => filterStaff(staff, filters), [staff, filters])

  const stats = useMemo(
    () => ({
      total: staff.length,
      active: staff.filter((item) => item.enabled).length,
      disabled: staff.filter((item) => !item.enabled).length,
      verified: staff.filter((item) => item.emailVerified).length,
    }),
    [staff],
  )

  const handleSelect = async (item: StaffAccountResponse) => {
    setSelected(item)

    try {
      const detail = await getStaffAccountDetail(item.staffId)
      setSelected(detail)
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Không thể tải thông tin nhân viên.')
    }
  }

  const handleCreateStaff = async (data: StaffAccountFormData) => {
    const createdStaff = await createStaffAccount(data)
    setToast(`Đã tạo nhân viên ST-${createdStaff.staffId} (${createdStaff.email}).`)
    await loadStaff()
    setSelected(createdStaff)
    return createdStaff
  }

  const handleDisableStaff = async (item: StaffAccountResponse) => {
    const updated = await disableStaffAccount(item.staffId)
    setToast(`Đã vô hiệu hóa nhân viên ST-${updated.staffId} (${updated.email}).`)
    setStaff((current) => current.map((staffItem) => (staffItem.staffId === updated.staffId ? updated : staffItem)))
    setSelected((current) => (current?.staffId === updated.staffId ? updated : current))
    setDisableTarget(null)
  }

  return (
    <>
        <AdminPageHeader
          eyebrow="Quản lý nhân viên"
          title="Quản lý tài khoản nhân viên"
          description="Tạo tài khoản đăng nhập, xem hồ sơ liên kết và vô hiệu hóa nhân viên đã nghỉ — vẫn giữ lịch sử vận hành."
          breadcrumbs={[
            { label: 'Tổng quan', href: '/admin/dashboard' },
            { label: 'Nhân viên' },
          ]}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void loadStaff()}
                disabled={isLoading}
                title="Làm mới"
                aria-label="Làm mới"
                className={[
                  'group flex h-10 w-10 items-center justify-center rounded-full',
                  'border border-outline-variant bg-white text-on-surface-variant shadow-sm',
                  'transition-all hover:border-brand-orange/40 hover:text-brand-orange',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                ].join(' ')}
              >
                <IconRefresh
                  className={[
                    'h-[15px] w-[15px] transition-transform duration-300',
                    isLoading ? 'animate-spin' : 'group-hover:rotate-180',
                  ].join(' ')}
                />
              </button>
              <button
                type="button"
                onClick={() => setCreateStaffOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-orange px-5 py-2.5 font-display text-sm font-bold text-white shadow-lg shadow-brand-orange/25 transition hover:bg-brand-orangeHover active:scale-[0.98]"
              >
                <IconPlus className="h-4 w-4" />
                Tạo nhân viên
              </button>
            </div>
          }
        />

        <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
          <AdminToast message={toast} onDismiss={() => setToast('')} />

          {errorMessage && (
            <div className="rounded-xl border border-error/30 bg-error-container/30 px-4 py-3 text-sm text-error">
              {errorMessage}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminStatCard label="Tổng nhân viên" value={stats.total} icon={<IconBookings className="h-5 w-5" />} />
            <AdminStatCard label="Đang hoạt động" value={stats.active} accent="secondary" icon={<span>✓</span>} />
            <AdminStatCard label="Đã vô hiệu" value={stats.disabled} accent="tertiary" icon={<span>!</span>} />
            <AdminStatCard label="Email đã xác minh" value={stats.verified} accent="primary" icon={<span>@</span>} />
          </div>

          <AdminStaffFiltersBar filters={filters} resultCount={visibleStaff.length} onChange={setFilters} />

          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-on-surface">Danh sách nhân viên</h2>
                <p className="text-xs text-on-surface-variant">
                  Hỗ trợ xem danh sách, chi tiết, tạo mới và vô hiệu hóa tài khoản.
                </p>
              </div>
              <p className="text-xs text-on-surface-variant">Chọn Chi tiết để xem hồ sơ và trạng thái đăng nhập</p>
            </div>

            <AdminStaffTable
              staff={visibleStaff}
              isLoading={isLoading}
              selectedId={selected?.staffId ?? null}
              onSelect={(item) => void handleSelect(item)}
              onDisable={setDisableTarget}
            />
          </section>
        </div>

        <AdminStaffDetailPanel
          staff={selected}
          onClose={() => setSelected(null)}
          onDisable={handleDisableStaff}
        />

        <AdminStaffCreateModal
          open={createStaffOpen}
          onClose={() => setCreateStaffOpen(false)}
          onSubmit={handleCreateStaff}
        />

        {disableTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/50 p-4 backdrop-blur-sm">
            <section className="w-full max-w-md rounded-2xl border border-outline-variant bg-white p-5 shadow-[var(--shadow-elevated)]">
              <p className="font-display text-lg font-bold text-on-surface">Vô hiệu hóa tài khoản nhân viên?</p>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                {disableTarget.fullName} sẽ không thể đăng nhập nữa. Hồ sơ và lịch sử vận hành vẫn được giữ lại.
              </p>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setDisableTarget(null)}
                  className="flex-1 rounded-xl border border-outline py-2.5 font-display text-sm font-medium text-on-surface-variant hover:bg-surface-container-low"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => void handleDisableStaff(disableTarget)}
                  className="flex-1 rounded-xl bg-error py-2.5 font-display text-sm font-medium text-white hover:bg-error/90"
                >
                  Vô hiệu hóa
                </button>
              </div>
            </section>
          </div>
        )}
    </>
  )
}
