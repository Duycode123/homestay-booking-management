'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'
import AdminToast from '@/components/admin/AdminToast'
import AdminFacilityReportsPanel from '@/components/admin/facility/AdminFacilityReportsPanel'
import { IconIncidentReports, IconRefresh, IconSearch } from '@/components/admin/AdminIcons'
import {
  fetchAdminIncidentReportDetail,
  fetchAdminIncidentReports,
  formatIncidentDateTime,
  getIncidentReportStats,
  getIncidentRoomOptions,
  updateAdminIncidentReportStatus,
} from '@/lib/admin/incident-reports/adminIncidentReportApi'
import {
  INCIDENT_PRIORITY_LABELS,
  INCIDENT_PRIORITY_OPTIONS,
  INCIDENT_PRIORITY_STYLES,
  INCIDENT_STATUS_LABELS,
  INCIDENT_STATUS_OPTIONS,
  INCIDENT_STATUS_STYLES,
} from '@/lib/admin/incident-reports/incidentReportLabels'
import type {
  IncidentPriority,
  IncidentReport,
  IncidentReportFilters,
  IncidentReportStatus,
  IncidentRoomOption,
} from '@/lib/admin/incident-reports/types'

const DEFAULT_FILTERS: IncidentReportFilters = {
  query: '',
  status: 'ALL',
  priority: 'ALL',
  roomId: 'ALL',
  submittedDate: '',
}

const inputClass =
  'h-11 w-full rounded-xl border border-outline bg-surface-container-lowest px-3 text-sm text-on-surface outline-none transition-all focus:border-brand-orange focus:bg-white focus:ring-2 focus:ring-brand-orange/15'

const labelClass =
  'mb-1.5 block font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant'

export default function AdminIncidentReportsPage() {
  const [filters, setFilters] = useState<IncidentReportFilters>(DEFAULT_FILTERS)
  const [reports, setReports] = useState<IncidentReport[]>([])
  const [selected, setSelected] = useState<IncidentReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [toast, setToast] = useState('')

  const loadReports = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchAdminIncidentReports(filters)
      setReports(data)
      setErrorMessage('')
      setSelected((current) => {
        if (!current) return null
        return data.find((report) => report.id === current.id) ?? current
      })
    } catch (error) {
      setReports([])
      setSelected(null)
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải danh sách báo cáo sự cố.')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    const timer = setTimeout(() => void loadReports(), 200)
    return () => clearTimeout(timer)
  }, [loadReports])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  const stats = useMemo(() => getIncidentReportStats(reports), [reports])
  const roomOptions = useMemo(() => getIncidentRoomOptions(reports), [reports])

  const handleSelectReport = async (report: IncidentReport) => {
    setSelected(report)
    try {
      const detail = await fetchAdminIncidentReportDetail(report.id)
      if (detail) setSelected(detail)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải chi tiết báo cáo sự cố.')
    }
  }

  const handleSaveReport = async (status: IncidentReportStatus, adminNote: string) => {
    if (!selected) return
    const updated = await updateAdminIncidentReportStatus(selected, status, adminNote)
    setSelected(updated)
    setReports((current) => current.map((report) => (report.id === updated.id ? updated : report)))
    setToast('Đã lưu cập nhật báo cáo sự cố.')
  }

  return (
    <>
        <AdminPageHeader
          eyebrow="Báo cáo sự cố"
          title="Báo cáo sự cố"
          description="Quản lý các sự cố do khách hàng gửi trong quá trình đặt phòng và sử dụng dịch vụ."
          breadcrumbs={[
            { label: 'Tổng quan', href: '/admin/dashboard' },
            { label: 'Báo cáo sự cố' },
          ]}
          actions={
            <button
              type="button"
              onClick={() => void loadReports()}
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
          }
        />

        <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
          <AdminToast message={toast} onDismiss={() => setToast('')} />

          {errorMessage && (
            <div className="rounded-xl border border-error/30 bg-error-container/30 px-4 py-3 text-sm text-error">
              {errorMessage}
            </div>
          )}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <AdminStatCard label="Tổng sự cố" value={isLoading ? '...' : stats.total} icon={<IconIncidentReports />} />
            <AdminStatCard label="Mới gửi" value={isLoading ? '...' : stats.newCount} accent="primary" />
            <AdminStatCard label="Đang xử lý" value={isLoading ? '...' : stats.inProgress} accent="tertiary" />
            <AdminStatCard label="Đã xử lý" value={isLoading ? '...' : stats.resolved} accent="secondary" />
            <AdminStatCard label="Mức ưu tiên cao" value={isLoading ? '...' : stats.highPriority} accent="primary" />
          </section>

          <IncidentFiltersBar
            filters={filters}
            rooms={roomOptions}
            resultCount={reports.length}
            onChange={setFilters}
          />

          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-on-surface">Danh sách báo cáo sự cố</h2>
              <p className="text-xs text-on-surface-variant">Nhấn “Xem chi tiết” để xử lý báo cáo</p>
            </div>

            <IncidentReportTable
              reports={reports}
              isLoading={isLoading}
              selectedId={selected?.id ?? null}
              onSelect={(report) => void handleSelectReport(report)}
            />
          </section>

          <AdminFacilityReportsPanel />
        </div>

        <IncidentDetailDrawer
          report={selected}
          onClose={() => setSelected(null)}
          onSave={(status, adminNote) => void handleSaveReport(status, adminNote)}
        />
    </>
  )
}

function IncidentFiltersBar({
  filters,
  rooms,
  resultCount,
  onChange,
}: {
  filters: IncidentReportFilters
  rooms: IncidentRoomOption[]
  resultCount: number
  onChange: (filters: IncidentReportFilters) => void
}) {
  const set = (patch: Partial<IncidentReportFilters>) => onChange({ ...filters, ...patch })

  return (
    <div className="overflow-hidden rounded-2xl border border-outline-variant/80 bg-white shadow-[var(--shadow-card)]">
      <div className="border-b border-outline-variant/60 bg-gradient-to-r from-surface-container-low to-white px-5 py-4">
        <div>
          <h2 className="font-display text-sm font-bold text-on-surface">Bộ lọc và tìm kiếm</h2>
          <p className="text-xs text-on-surface-variant">
            <span className="font-semibold text-brand-orange">{resultCount}</span> báo cáo phù hợp
          </p>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <label className="block">
          <span className={labelClass}>Tìm kiếm</span>
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="search"
              value={filters.query}
              onChange={(event) => set({ query: event.target.value })}
              placeholder="Mã báo cáo, khách hàng, phòng, nội dung..."
              className={[inputClass, 'pl-10'].join(' ')}
            />
          </div>
        </label>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className={labelClass}>Trạng thái</span>
            <select
              value={filters.status}
              onChange={(event) => set({ status: event.target.value as IncidentReportFilters['status'] })}
              className={inputClass}
            >
              <option value="ALL">Tất cả trạng thái</option>
              {INCIDENT_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {INCIDENT_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Mức độ ưu tiên</span>
            <select
              value={filters.priority}
              onChange={(event) => set({ priority: event.target.value as IncidentReportFilters['priority'] })}
              className={inputClass}
            >
              <option value="ALL">Tất cả mức độ</option>
              {INCIDENT_PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {INCIDENT_PRIORITY_LABELS[priority]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Phòng</span>
            <select value={filters.roomId} onChange={(event) => set({ roomId: event.target.value })} className={inputClass}>
              <option value="ALL">Tất cả phòng</option>
              {rooms.map((room) => (
                <option key={room.roomId} value={room.roomId}>
                  {room.roomName}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Ngày gửi</span>
            <input
              type="date"
              value={filters.submittedDate}
              onChange={(event) => set({ submittedDate: event.target.value })}
              className={inputClass}
            />
          </label>
        </div>
      </div>
    </div>
  )
}

function IncidentReportTable({
  reports,
  isLoading,
  selectedId,
  onSelect,
}: {
  reports: IncidentReport[]
  isLoading: boolean
  selectedId: string | null
  onSelect: (report: IncidentReport) => void
}) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-lg bg-surface-container" />
          ))}
        </div>
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-outline-variant bg-white px-6 py-12 text-center shadow-[var(--shadow-card)]">
        <p className="font-display text-sm font-medium text-on-surface">Chưa có báo cáo sự cố nào.</p>
        <p className="mt-1 text-xs text-on-surface-variant">Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low">
              {[
                'Mã báo cáo',
                'Khách hàng',
                'Phòng / Đơn liên quan',
                'Tiêu đề sự cố',
                'Mức độ',
                'Trạng thái',
                'Ngày gửi',
                'Hành động',
              ].map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => {
              const active = selectedId === report.id

              return (
                <tr
                  key={report.id}
                  className={[
                    'border-b border-outline-variant/60 transition-colors last:border-0',
                    active ? 'bg-primary-container/25' : 'hover:bg-surface-container-low',
                  ].join(' ')}
                >
                  <td className="px-4 py-3 font-display text-xs font-bold text-brand-orange">{report.reportCode}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-on-surface">{report.customerName}</p>
                    <p className="text-xs text-on-surface-variant">{report.customerEmail ?? report.customerPhone ?? 'Chưa có liên hệ'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-on-surface">{report.roomName}</p>
                    <p className="text-xs text-on-surface-variant">{report.bookingId ?? 'Không gắn đơn đặt'}</p>
                  </td>
                  <td className="max-w-xs px-4 py-3">
                    <p className="font-medium text-on-surface">{report.title}</p>
                    <p className="line-clamp-1 text-xs text-on-surface-variant">{report.description}</p>
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={report.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={report.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-on-surface-variant">{formatIncidentDateTime(report.submittedAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onSelect(report)}
                      className="rounded-lg border border-outline bg-white px-3 py-1.5 font-display text-xs font-medium text-on-surface-variant hover:border-brand-orange hover:text-brand-orange"
                    >
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function IncidentDetailDrawer({
  report,
  onClose,
  onSave,
}: {
  report: IncidentReport | null
  onClose: () => void
  onSave: (status: IncidentReportStatus, adminNote: string) => void
}) {
  const [status, setStatus] = useState<IncidentReportStatus>('NEW')
  const [adminNote, setAdminNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!report) return
    setStatus(report.status)
    setAdminNote(report.adminNote)
    setMessage('')
  }, [report])

  if (!report) return null
  const evidenceImages = report.evidenceImages ?? []

  const handleSave = async () => {
    setIsSaving(true)
    setMessage('')
    try {
      await onSave(status, adminNote)
      setMessage('Đã lưu cập nhật.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể lưu cập nhật.')
    } finally {
      setIsSaving(false)
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

      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-outline-variant bg-white shadow-[var(--shadow-elevated)]">
        <header className="border-b border-outline-variant px-5 py-4">
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.15em] text-brand-orange">
            {report.reportCode}
          </p>
          <h2 className="font-display text-xl font-bold text-on-surface">{report.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <PriorityBadge priority={report.priority} />
            <StatusBadge status={report.status} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <DetailSection title="Thông tin báo cáo">
            <InfoRow label="Mã báo cáo" value={report.reportCode} />
            <InfoRow label="Khách hàng" value={report.customerName} />
            <InfoRow label="Email / SĐT" value={[report.customerEmail, report.customerPhone].filter(Boolean).join(' / ') || 'Chưa có'} />
            <InfoRow label="Phòng liên quan" value={report.roomName} />
            <InfoRow label="Mã đơn đặt" value={report.bookingId ?? 'Không gắn đơn đặt'} />
            <InfoRow label="Thời gian gửi" value={formatIncidentDateTime(report.submittedAt)} />
          </DetailSection>

          <DetailSection title="Nội dung sự cố">
            <InfoRow label="Tiêu đề sự cố" value={report.title} />
            <p className="mt-2 text-sm leading-6 text-on-surface">{report.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <PriorityBadge priority={report.priority} />
              <StatusBadge status={report.status} />
            </div>
          </DetailSection>

          <DetailSection title="Ảnh minh chứng">
            {evidenceImages.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {evidenceImages.map((image) => (
                  <img
                    key={image}
                    src={image}
                    alt={`Ảnh minh chứng ${report.reportCode}`}
                    className="h-32 w-full rounded-xl border border-outline-variant object-cover"
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-3 py-4 text-sm text-on-surface-variant">
                Chưa có ảnh minh chứng.
              </p>
            )}
          </DetailSection>

          <DetailSection title="Cập nhật xử lý">
            <label className="block">
              <span className={labelClass}>Trạng thái mới</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as IncidentReportStatus)}
                className={inputClass}
              >
                {INCIDENT_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {INCIDENT_STATUS_LABELS[option]}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-3 block">
              <span className={labelClass}>Ghi chú xử lý của admin</span>
              <textarea
                value={adminNote}
                onChange={(event) => setAdminNote(event.target.value)}
                rows={5}
                maxLength={1000}
                placeholder="Nhập ghi chú xử lý nội bộ..."
                className="w-full rounded-xl border border-outline bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15"
              />
              <p className="mt-1 text-right text-[10px] text-on-surface-variant">{adminNote.length}/1000</p>
            </label>

            {message && (
              <p className="mt-3 rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant">
                {message}
              </p>
            )}
          </DetailSection>
        </div>

        <footer className="border-t border-outline-variant bg-surface-container-low/50 px-5 py-4">
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
              disabled={isSaving}
              onClick={() => void handleSave()}
              className="flex-1 rounded-xl bg-brand-orange py-2.5 font-display text-sm font-medium text-white hover:bg-brand-orangeHover disabled:opacity-50"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu cập nhật'}
            </button>
          </div>
        </footer>
      </aside>
    </>
  )
}

function StatusBadge({ status }: { status: IncidentReportStatus }) {
  return (
    <span className={['inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold', INCIDENT_STATUS_STYLES[status]].join(' ')}>
      {INCIDENT_STATUS_LABELS[status]}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: IncidentPriority }) {
  return (
    <span className={['inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold', INCIDENT_PRIORITY_STYLES[priority]].join(' ')}>
      {INCIDENT_PRIORITY_LABELS[priority]}
    </span>
  )
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 first:mt-0">
      <h3 className="mb-2 font-display text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
        {title}
      </h3>
      {children}
    </section>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2 text-sm">
      <p className="text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-0.5 font-medium text-on-surface">{value}</p>
    </div>
  )
}

