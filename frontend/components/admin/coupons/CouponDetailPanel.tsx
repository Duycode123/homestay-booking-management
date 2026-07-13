'use client'

import { useState } from 'react'
import {
  formatCouponExpiry,
  formatCouponValue,
  DISCOUNT_TYPE_LABELS,
} from '@/lib/admin/coupons/couponLabels'
import type { AdminCoupon } from '@/lib/admin/coupons/types'
import { CouponExpiryBadge, CouponTypeBadge } from './CouponBadges'

type CouponDetailPanelProps = {
  coupon: AdminCoupon | null
  onClose: () => void
  onEdit: (coupon: AdminCoupon) => void
  onDelete: (id: number) => Promise<void>
}

export default function CouponDetailPanel({
  coupon,
  onClose,
  onEdit,
  onDelete,
}: CouponDetailPanelProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [message, setMessage] = useState('')

  if (!coupon) return null

  const handleDelete = async () => {
    setIsDeleting(true)
    setMessage('')

    try {
      await onDelete(coupon.couponId)
      onClose()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể xóa mã giảm giá.')
      setConfirmDelete(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Đóng chi tiết"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-inverse-surface/50 backdrop-blur-sm"
      />

      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-outline-variant bg-white shadow-[var(--shadow-elevated)] sm:max-w-lg">
        <div className="relative shrink-0 bg-gradient-to-br from-brand-orange/20 via-brand-orange/5 to-brand-greenLight/20 px-5 pb-5 pt-5">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/95" />
          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-[10px] font-bold uppercase tracking-[0.15em] text-brand-orange">
                  CP-{String(coupon.couponId).padStart(4, '0')}
                </p>
                <h2 className="font-display text-2xl font-bold leading-tight text-on-surface">{coupon.code}</h2>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <CouponTypeBadge type={coupon.type} size="md" />
              <CouponExpiryBadge status={coupon.expiryStatus} size="md" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard label="Loại giảm" value={DISCOUNT_TYPE_LABELS[coupon.type]} />
            <MetricCard label="Giá trị" value={formatCouponValue(coupon.type, coupon.value)} />
            <MetricCard
              label="Đơn tối thiểu"
              value={
                coupon.minOrderValue
                  ? new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                      maximumFractionDigits: 0,
                    }).format(coupon.minOrderValue)
                  : 'Không yêu cầu'
              }
            />
            <MetricCard label="Hết hạn" value={formatCouponExpiry(coupon.expiresAt)} />
          </div>

          <Section title="Phạm vi áp dụng">
            <p className="text-sm text-on-surface-variant">
              Mã giảm giá hiện áp dụng cho <strong className="text-on-surface">tất cả phòng</strong> trong hệ thống.
            </p>
          </Section>

          {message && (
            <p className="mt-4 rounded-2xl border border-error/30 bg-error-container/30 px-4 py-3 text-xs text-error">
              {message}
            </p>
          )}
        </div>

        <footer className="shrink-0 space-y-2 border-t border-outline-variant bg-surface-container-low/50 px-5 py-4">
          {confirmDelete ? (
            <div className="space-y-3">
              <p className="text-sm text-on-surface-variant">
                Xác nhận xóa <strong className="text-on-surface">{coupon.code}</strong>?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={isDeleting}
                  className="flex-1 rounded-xl border border-outline py-2.5 font-display text-sm font-medium text-on-surface-variant hover:bg-white disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={isDeleting}
                  className="flex-1 rounded-xl bg-error py-2.5 font-display text-sm font-medium text-white hover:bg-error/90 disabled:opacity-50"
                >
                  {isDeleting ? 'Đang xóa...' : 'Xóa mã giảm giá'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-outline bg-white px-4 py-2.5 font-display text-sm font-medium text-on-surface-variant hover:text-on-surface"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => onEdit(coupon)}
                className="flex-1 rounded-xl bg-brand-orange py-2.5 font-display text-sm font-medium text-white shadow-md shadow-brand-orange/20 hover:bg-brand-orangeHover"
              >
                Chỉnh sửa
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex-1 rounded-xl border border-error/30 py-2.5 font-display text-sm font-medium text-error hover:bg-error-container/30"
              >
                Xóa
              </button>
            </div>
          )}
        </footer>
      </aside>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="mb-2 font-display text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
        {title}
      </h3>
      {children}
    </section>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-outline-variant bg-white p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-1 font-display text-base font-bold text-on-surface">{value}</p>
    </div>
  )
}
