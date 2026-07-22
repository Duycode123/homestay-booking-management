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
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null)
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
      setEditingStaffId(null)
      setMessage('Đã cập nhật lương theo giờ.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể cập nhật lương theo giờ.')
    } finally {
      setSavingStaffId(null)
    }
  }

  const startEditingRate = (staffId: number, hourlyRate: number) => {
    setRateDrafts((current) => ({ ...current, [staffId]: String(hourlyRate) }))
    setEditingStaffId(staffId)
    setMessage('')
    setError('')
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

        {report?.status === 'DRAFT' && Number(report.totalHours) === 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-secondary-container/50 bg-secondary-container/15 px-4 py-3 text-sm text-on-surface-variant">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white font-display text-xs font-bold text-secondary">i</span>
            <p>
              Tháng này chưa có ca nào hoàn thành check-in và check-out, nên thành tiền đang là 0đ. Mức lương theo giờ vẫn được lưu để tự động tính khi có chấm công hợp lệ.
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStatCard label="Tổng nhân viên" value={report?.staff.length ?? 0} icon={<IconStaff className="h-5 w-5" />} />
          <AdminStatCard label="Có giờ làm" value={paidStaff} accent="secondary" icon={<IconClock className="h-5 w-5" />} />
          <AdminStatCard label="Tổng giờ" value={Number(report?.totalHours ?? 0).toFixed(2)} accent="tertiary" icon={<IconClock className="h-5 w-5" />} />
          <AdminStatCard label="Tổng tiền lương" value={formatMoney(report?.totalSalary ?? 0)} accent="primary" icon={<IconPayroll className="h-5 w-5" />} />
        </div>

        <section className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant px-5 py-4">
            <div>
              <h2 className="font-display text-lg font-bold text-on-surface">
                Chi tiết lương tháng {String(report?.month ?? 0).padStart(2, '0')}/{report?.year ?? ''}
              </h2>
              <p className="mt-1 text-xs text-on-surface-variant">Bấm “Chỉnh” tại từng nhân viên để thay đổi đơn giá giờ.</p>
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
                        {report.status === 'DRAFT' && editingStaffId === item.staffId ? (
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <input type="number" min="0" step="1000" value={rateDrafts[item.staffId] ?? ''}
                                aria-label={`Lương một giờ của ${item.fullName}`}
                                onChange={(event) => setRateDrafts((current) => ({ ...current, [item.staffId]: event.target.value }))}
                                className="h-10 w-40 rounded-lg border border-brand-orange bg-white pl-3 pr-12 text-sm font-semibold outline-none ring-2 ring-brand-orange/10" />
                              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-on-surface-variant">đ/giờ</span>
                            </div>
                            <button type="button" onClick={() => void saveRate(item.staffId)} disabled={savingStaffId === item.staffId}
                              className="h-10 rounded-lg bg-brand-greenDark px-3 text-xs font-bold text-white hover:bg-brand-greenLight disabled:opacity-50">
                              {savingStaffId === item.staffId ? 'Đang lưu' : 'Lưu'}
                            </button>
                            <button type="button" onClick={() => setEditingStaffId(null)} disabled={savingStaffId === item.staffId}
                              className="h-10 rounded-lg px-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low disabled:opacity-50">
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <span className="inline-flex min-w-32 items-center rounded-lg bg-surface-container-low px-3 py-2 font-display text-sm font-bold text-on-surface">
                              {formatMoney(item.hourlyRate)}/giờ
                            </span>
                            {report.status === 'DRAFT' && (
                              <button type="button" onClick={() => startEditingRate(item.staffId, item.hourlyRate)}
                                className="rounded-lg border border-outline-variant px-3 py-2 text-xs font-bold text-on-surface-variant hover:border-brand-orange/50 hover:text-brand-orange">
                                Chỉnh
                              </button>
                            )}
                          </div>
                        )}
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
