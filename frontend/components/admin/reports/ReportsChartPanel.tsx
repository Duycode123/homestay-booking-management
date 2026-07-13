import type { ReactNode } from 'react'

type ReportsChartPanelProps = {
  title: string
  description?: string
  children: ReactNode
  isLoading?: boolean
  isEmpty?: boolean
  emptyTitle?: string
  emptyDescription?: string
}

export default function ReportsChartPanel({
  title,
  description,
  children,
  isLoading = false,
  isEmpty = false,
  emptyTitle = 'Chưa có dữ liệu',
  emptyDescription = 'Thử chọn khoảng thời gian khác hoặc kiểm tra đơn đặt phòng.',
}: ReportsChartPanelProps) {
  return (
    <section className="rounded-2xl border border-outline-variant/80 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="mb-5">
        <h2 className="font-display text-lg font-bold text-on-surface">{title}</h2>
        {description && <p className="mt-1 text-sm text-on-surface-variant">{description}</p>}
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Đang tải biểu đồ">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-surface-container" />
          <div className="h-64 animate-pulse rounded-xl bg-surface-container-low" />
        </div>
      ) : isEmpty ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant bg-surface-container-low/50 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
              />
            </svg>
          </div>
          <p className="mt-4 font-display text-base font-semibold text-on-surface">{emptyTitle}</p>
          <p className="mt-1 max-w-sm text-sm text-on-surface-variant">{emptyDescription}</p>
        </div>
      ) : (
        children
      )}
    </section>
  )
}
