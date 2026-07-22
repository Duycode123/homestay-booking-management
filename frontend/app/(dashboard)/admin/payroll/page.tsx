'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'
import { IconClock, IconPayroll, IconRefresh, IconStaff } from '@/components/admin/AdminIcons'
import {
  finalizePayroll, formatMoney, getPayroll, markPayrollPaid, updateHourlyRate,
  type PayrollReport, type PayrollStatus,
} from '@/lib/admin/payroll/adminPayrollApi'

const STATUS_META: Record<PayrollStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Bản nháp', className: 'bg-secondary-container/25 text-secondary' },
  FINALIZED: { label: 'Đã chốt', className: 'bg-primary-container text-on-primary-container' },
  PAID: { label: 'Đã thanh toán', className: 'bg-tertiary-container text-on-tertiary-container' },
}

function currentPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function parsePeriod(value: string) {
  const [year, month] = value.split('-').map(Number)
  return { year, month }
}

export default function AdminPayrollPage() {
  const [period, setPeriod] = useState(currentPeriod)
  const [report, setReport] = useState<PayrollReport | null>(null)
  const [rateDrafts, setRateDrafts] = useState<Record<number, string>>({})
  const [savingStaffId, setSavingStaffId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const syncReport = (data: PayrollReport) => {
    setReport(data)
    setRateDrafts(Object.fromEntries(data.staff.map((item) => [item.staffId, String(item.hourlyRate)])))
  }

  const load = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const { year, month } = parsePeriod(period)
      syncReport(await getPayroll(year, month))
    } catch (loadError) {
      setReport(null)
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải bảng lương.')
    } finally {
      setIsLoading(false)
    }
  }, [period])

  useEffect(() => { void load() }, [load])

  const paidStaff = useMemo(() => report?.staff.filter((item) => item.workHours > 0).length ?? 0, [report])

  const saveRate = async (staffId: number) => {
    if (!report || report.status !== 'DRAFT') return
    const hourlyRate = Number(rateDrafts[staffId])
    if (!Number.isFinite(hourlyRate) || hourlyRate < 0) {
      setError('Tiền lương một giờ phải lớn hơn hoặc bằng 0.')
      return
    }
    setSavingStaffId(staffId)
    setError('')
    try {
      syncReport(await updateHourlyRate(staffId, hourlyRate, report.year, report.month))
      setMessage('Đã cập nhật lương theo giờ.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể cập nhật lương theo giờ.')
    } finally {
      setSavingStaffId(null)
    }
  }

  const runPeriodAction = async (action: 'finalize' | 'paid') => {
    if (!report) return
    setIsActionLoading(true)
    setError('')
    try {
      const data = action === 'finalize'
        ? await finalizePayroll(report.year, report.month)
        : await markPayrollPaid(report.year, report.month)
      syncReport(data)
      setMessage(action === 'finalize' ? 'Đã chốt bảng lương.' : 'Đã đánh dấu bảng lương là đã thanh toán.')
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Không thể cập nhật bảng lương.')
    } finally {
      setIsActionLoading(false)
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Chấm công & tiền lương"
        title="Bảng lương nhân viên"
        description="Lương bằng số giờ check-in/check-out hoàn chỉnh nhân với đơn giá giờ. Không check-in hoặc thiếu check-out sẽ không được tính lương."
        breadcrumbs={[{ label: 'Tổng quan', href: '/admin/dashboard' }, { label: 'Bảng lương' }]}
      />

      <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
        <section className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-outline-variant bg-white p-4 shadow-[var(--shadow-card)]">
          <label className="grid gap-1.5 text-xs font-semibold text-on-surface-variant">
            Kỳ lương
            <input type="month" value={period} onChange={(event) => setPeriod(event.target.value)}
              className="h-11 rounded-xl border border-outline-variant bg-white px-3 text-sm font-semibold text-on-surface outline-none focus:border-brand-orange" />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void load()} disabled={isLoading}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-outline-variant bg-white px-4 text-sm font-semibold text-on-surface-variant hover:border-brand-orange/50 disabled:opacity-50">
              <IconRefresh className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /> Làm mới
            </button>
            {report?.status === 'DRAFT' && (
              <button type="button" onClick={() => void runPeriodAction('finalize')} disabled={isActionLoading}
                className="h-11 rounded-xl bg-brand-greenDark px-5 text-sm font-bold text-white shadow-lg shadow-brand-greenDark/15 hover:bg-brand-greenLight disabled:opacity-50">
                Chốt bảng lương
              </button>
            )}
            {report?.status === 'FINALIZED' && (
              <button type="button" onClick={() => void runPeriodAction('paid')} disabled={isActionLoading}
                className="h-11 rounded-xl bg-brand-orange px-5 text-sm font-bold text-white shadow-lg shadow-brand-orange/20 hover:bg-brand-orangeHover disabled:opacity-50">
                Đánh dấu đã thanh toán
              </button>
            )}
          </div>
        </section>

        {message && <div className="rounded-xl border border-primary/20 bg-primary-container/40 px-4 py-3 text-sm text-on-primary-container">{message}</div>}
        {error && <div className="rounded-xl border border-error/25 bg-error-container/30 px-4 py-3 text-sm text-error">{error}</div>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStatCard label="Tổng nhân viên" value={report?.staff.length ?? 0} icon={<IconStaff className="h-5 w-5" />} />
          <AdminStatCard label="Có giờ làm" value={paidStaff} accent="secondary" icon={<IconClock className="h-5 w-5" />} />
          <AdminStatCard label="Tổng giờ" value={Number(report?.totalHours ?? 0).toFixed(2)} accent="tertiary" icon={<IconClock className="h-5 w-5" />} />
          <AdminStatCard label="Tổng tiền lương" value={formatMoney(report?.totalSalary ?? 0)} accent="primary" icon={<IconPayroll className="h-5 w-5" />} />
        </div>

        <section className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant px-5 py-4">
            <div>
              <h2 className="font-display text-lg font-bold text-on-surface">Chi tiết bảng lương</h2>
              <p className="mt-1 text-xs text-on-surface-variant">Chỉ chấm công có đủ giờ vào và giờ ra mới được cộng lương.</p>
            </div>
            {report && <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${STATUS_META[report.status].className}`}>{STATUS_META[report.status].label}</span>}
          </div>

          {isLoading ? (
            <div className="space-y-3 p-5">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-xl bg-surface-container-low" />)}</div>
          ) : report && report.staff.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-left">
                <thead className="bg-surface-container-low text-[10px] uppercase tracking-[0.12em] text-on-surface-variant">
                  <tr><th className="px-5 py-3 font-semibold">Nhân viên</th><th className="px-5 py-3 font-semibold">Giờ được tính</th><th className="px-5 py-3 font-semibold">Lương một giờ</th><th className="px-5 py-3 text-right font-semibold">Thành tiền</th></tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/70">
                  {report.staff.map((item) => (
                    <tr key={item.staffId} className="hover:bg-surface-container-lowest">
                      <td className="px-5 py-4"><p className="font-display text-sm font-bold text-on-surface">{item.fullName}</p><p className="mt-0.5 text-xs text-on-surface-variant">ST-{item.staffId} · {item.email}</p></td>
                      <td className="px-5 py-4"><p className="font-display text-base font-bold text-on-surface">{Number(item.workHours).toFixed(2)} giờ</p>{item.workHours === 0 && <p className="mt-0.5 text-xs text-on-surface-variant">Không có chấm công hợp lệ</p>}</td>
                      <td className="px-5 py-4">
                        {report.status === 'DRAFT' ? (
                          <div className="flex items-center gap-2">
                            <input type="number" min="0" step="1000" value={rateDrafts[item.staffId] ?? ''}
                              onChange={(event) => setRateDrafts((current) => ({ ...current, [item.staffId]: event.target.value }))}
                              className="h-10 w-36 rounded-lg border border-outline-variant px-3 text-sm font-semibold outline-none focus:border-brand-orange" />
                            <button type="button" onClick={() => void saveRate(item.staffId)} disabled={savingStaffId === item.staffId}
                              className="h-10 rounded-lg border border-brand-orange/40 px-3 text-xs font-bold text-brand-orange hover:bg-brand-orange/5 disabled:opacity-50">
                              {savingStaffId === item.staffId ? 'Đang lưu' : 'Lưu'}
                            </button>
                          </div>
                        ) : <span className="text-sm font-semibold text-on-surface">{formatMoney(item.hourlyRate)}/giờ</span>}
                      </td>
                      <td className="px-5 py-4 text-right font-display text-base font-bold text-brand-orange">{formatMoney(item.totalSalary)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="px-6 py-16 text-center text-sm text-on-surface-variant">Chưa có nhân viên để tính lương.</div>}
        </section>
      </div>
    </>
  )
}
