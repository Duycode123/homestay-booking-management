'use client'

import { useCallback, useEffect, useState } from 'react'
import AdminStatCard from '@/components/admin/AdminStatCard'
import ReportsDateRangePicker from '@/components/admin/reports/ReportsDateRangePicker'
import { formatAdminPrice } from '@/lib/admin/adminBookingApi'
import {
  defaultCouponReportRange,
  fetchCouponUsageReport,
} from '@/lib/admin/coupons/adminCouponApi'
import type { CouponUsageReport } from '@/lib/admin/coupons/types'
import type { ReportDateRange } from '@/lib/admin/reportsTypes'
import CouponTopUsageChart from './CouponTopUsageChart'
import CouponUsageTrendChart from './CouponUsageTrendChart'

export default function CouponReportSection() {
  const [range, setRange] = useState<ReportDateRange>(defaultCouponReportRange())
  const [report, setReport] = useState<CouponUsageReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const loadReport = useCallback(async () => {
    setIsLoading(true)

    try {
      const data = await fetchCouponUsageReport(range)
      setReport(data)
      setErrorMessage('')
    } catch (error) {
      setReport(null)
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải báo cáo mã giảm giá.')
    } finally {
      setIsLoading(false)
    }
  }, [range])

  useEffect(() => {
    const timer = setTimeout(() => void loadReport(), 200)
    return () => clearTimeout(timer)
  }, [loadReport])

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold text-on-surface">Báo cáo sử dụng mã giảm giá</h2>
        <p className="text-sm text-on-surface-variant">
          Theo dõi lượt dùng, tổng tiền giảm và mã giảm giá hiệu quả nhất.
        </p>
      </div>

      <ReportsDateRangePicker value={range} onChange={setRange} disabled={isLoading} />

      {errorMessage && (
        <div className="rounded-xl border border-error/30 bg-error-container/30 px-4 py-3 text-sm text-error">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <AdminStatCard
          label="Tổng lượt dùng"
          value={report?.totalUsed ?? 0}
          hint="Mã giảm giá đã áp dụng thành công"
          accent="primary"
          icon={<span className="text-base">#</span>}
        />
        <AdminStatCard
          label="Tổng tiền giảm"
          value={formatAdminPrice(report?.totalDiscountGiven ?? 0)}
          hint="Tổng discount đã ghi nhận"
          accent="secondary"
          icon={<span className="text-base">₫</span>}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-outline-variant bg-white p-5 shadow-[var(--shadow-card)]">
          <h3 className="mb-4 font-display text-sm font-bold text-on-surface">Xu hướng theo ngày</h3>
          {isLoading ? (
            <div className="h-56 animate-pulse rounded-xl bg-surface-container" />
          ) : (
            <CouponUsageTrendChart data={report?.trend ?? []} />
          )}
        </div>

        <div className="rounded-2xl border border-outline-variant bg-white p-5 shadow-[var(--shadow-card)]">
          <h3 className="mb-4 font-display text-sm font-bold text-on-surface">Mã giảm giá dùng nhiều nhất</h3>
          {isLoading ? (
            <div className="h-56 animate-pulse rounded-xl bg-surface-container" />
          ) : (
            <CouponTopUsageChart data={report?.topCoupons ?? []} />
          )}
        </div>
      </div>
    </section>
  )
}
