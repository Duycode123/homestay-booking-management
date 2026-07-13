'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'
import AdminToast from '@/components/admin/AdminToast'
import { IconCoupons, IconPlus, IconRefresh } from '@/components/admin/AdminIcons'
import CouponDetailPanel from '@/components/admin/coupons/CouponDetailPanel'
import CouponFiltersBar from '@/components/admin/coupons/CouponFiltersBar'
import CouponFormModal from '@/components/admin/coupons/CouponFormModal'
import CouponReportSection from '@/components/admin/coupons/CouponReportSection'
import CouponTable from '@/components/admin/coupons/CouponTable'
import {
  createAdminCoupon,
  deleteAdminCoupon,
  EMPTY_COUPON_FORM,
  fetchAdminCoupons,
  fetchCouponRooms,
  toFormData,
  updateAdminCoupon,
} from '@/lib/admin/coupons/adminCouponApi'
import type { AdminCoupon, CouponFilters, CouponFormData, CouponRoomOption } from '@/lib/admin/coupons/types'

const DEFAULT_FILTERS: CouponFilters = {
  query: '',
  type: 'ALL',
  expiryStatus: 'ALL',
  sortBy: 'code',
  sortOrder: 'asc',
}

type FormModalState =
  | { open: false }
  | { open: true; mode: 'create'; data: CouponFormData }
  | { open: true; mode: 'edit'; couponId: number; data: CouponFormData }

export default function AdminCouponsPage() {
  const [filters, setFilters] = useState<CouponFilters>(DEFAULT_FILTERS)
  const [coupons, setCoupons] = useState<AdminCoupon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selected, setSelected] = useState<AdminCoupon | null>(null)
  const [formModal, setFormModal] = useState<FormModalState>({ open: false })
  const [rooms, setRooms] = useState<CouponRoomOption[]>([])
  const [toast, setToast] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const loadCoupons = useCallback(async () => {
    setIsLoading(true)

    try {
      const data = await fetchAdminCoupons(filters)
      setCoupons(data)
      setErrorMessage('')
      setSelected((currentCoupon) => {
        if (!currentCoupon) return null
        return data.find((item) => item.couponId === currentCoupon.couponId) ?? null
      })
    } catch (error) {
      setCoupons([])
      setSelected(null)
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải danh sách mã giảm giá.')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    const timer = setTimeout(() => void loadCoupons(), 200)
    return () => clearTimeout(timer)
  }, [loadCoupons])

  useEffect(() => {
    let active = true

    fetchCouponRooms()
      .then((data) => {
        if (active) {
          setRooms(data)
        }
      })
      .catch((error) => {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : 'Không thể tải danh sách phòng.')
        }
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!toast) return

    const timer = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  const stats = useMemo(() => {
    return {
      total: coupons.length,
      active: coupons.filter((coupon) => coupon.expiryStatus === 'ACTIVE').length,
      noExpiry: coupons.filter((coupon) => coupon.expiryStatus === 'NO_EXPIRY').length,
      expired: coupons.filter((coupon) => coupon.expiryStatus === 'EXPIRED').length,
      percentage: coupons.filter((coupon) => coupon.type === 'PERCENTAGE').length,
    }
  }, [coupons])

  const handleCreate = async (data: CouponFormData) => {
    await createAdminCoupon(data)
    setToast('Tạo mã giảm giá thành công.')
    await loadCoupons()
  }

  const handleUpdate = async (data: CouponFormData) => {
    if (!formModal.open || formModal.mode !== 'edit') return

    const updated = await updateAdminCoupon(formModal.couponId, data)
    if (!updated) {
      throw new Error('Không tìm thấy mã giảm giá.')
    }

    setToast('Cập nhật mã giảm giá thành công.')
    setSelected(updated)
    await loadCoupons()
  }

  const handleDelete = async (id: number) => {
    await deleteAdminCoupon(id)
    setToast('Xóa mã giảm giá thành công.')
    setSelected(null)
    await loadCoupons()
  }

  return (
    <>
        <AdminPageHeader
          eyebrow="Mã giảm giá"
          title="Quản lý mã giảm giá"
          description="Tạo, chỉnh sửa mã giảm giá và theo dõi hiệu quả sử dụng."
          breadcrumbs={[
            { label: 'Tổng quan', href: '/admin/dashboard' },
            { label: 'Mã giảm giá' },
          ]}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void loadCoupons()}
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
                onClick={() => setFormModal({ open: true, mode: 'create', data: EMPTY_COUPON_FORM })}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-orange px-5 py-2.5 font-display text-sm font-medium text-white shadow-lg shadow-brand-orange/25 transition-all hover:bg-brand-orangeHover active:scale-[0.98]"
              >
                <IconPlus className="h-4 w-4" />
                Thêm mã giảm giá
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
            <AdminStatCard
              label="Kết quả lọc"
              value={stats.total}
              hint="Mã giảm giá hiển thị"
              icon={<IconCoupons className="h-5 w-5" />}
            />
            <AdminStatCard
              label="Đang hiệu lực"
              value={stats.active}
              hint="Có thể sử dụng"
              accent="secondary"
              icon={<span className="text-base">✓</span>}
            />
            <AdminStatCard
              label="Hết hạn"
              value={stats.expired}
              hint="Không còn dùng được"
              accent="primary"
              icon={<span className="text-base">!</span>}
            />
            <AdminStatCard
              label="Loại phần trăm"
              value={stats.percentage}
              hint="Số mã giảm theo % (không phải mức %)"
              accent="tertiary"
              icon={<span className="text-base">%</span>}
            />
          </div>

          <CouponReportSection />

          <CouponFiltersBar filters={filters} onChange={setFilters} resultCount={coupons.length} />

          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-on-surface">Danh sách mã giảm giá</h2>
              <p className="text-xs text-on-surface-variant">Nhấn thẻ để xem chi tiết</p>
            </div>
            <CouponTable
              coupons={coupons}
              isLoading={isLoading}
              selectedId={selected?.couponId ?? null}
              onSelect={setSelected}
            />
          </section>
        </div>

        <CouponDetailPanel
          coupon={selected}
          onClose={() => setSelected(null)}
          onEdit={(coupon) =>
            setFormModal({ open: true, mode: 'edit', couponId: coupon.couponId, data: toFormData(coupon) })
          }
          onDelete={handleDelete}
        />

        <CouponFormModal
          open={formModal.open}
          mode={formModal.open ? formModal.mode : 'create'}
          initialData={formModal.open ? formModal.data : EMPTY_COUPON_FORM}
          rooms={rooms}
          onClose={() => setFormModal({ open: false })}
          onSubmit={formModal.open && formModal.mode === 'edit' ? handleUpdate : handleCreate}
        />
    </>
  )
}
