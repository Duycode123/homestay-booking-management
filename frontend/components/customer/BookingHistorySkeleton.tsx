export default function BookingHistorySkeleton() {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label="Đang tải lịch sử đặt phòng">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="animate-pulse overflow-hidden rounded-[20px] border border-outline-variant bg-surface-container-low/70 p-5"
        >
          <div className="flex gap-4">
            <div className="h-14 w-14 shrink-0 rounded-xl bg-surface-container-high" />
            <div className="flex-1 space-y-3">
              <div className="h-5 w-32 rounded-lg bg-surface-container-high" />
              <div className="h-4 w-48 rounded-lg bg-surface-container-high" />
              <div className="h-4 w-36 rounded-lg bg-surface-container-high" />
            </div>
            <div className="hidden h-8 w-24 rounded-lg bg-surface-container-high sm:block" />
          </div>
        </div>
      ))}
    </div>
  )
}
