export default function RoomCatalogSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-3xl border border-outline-variant bg-white shadow-[var(--shadow-card)]"
        >
          <div className="aspect-[16/10] animate-pulse bg-surface-container" />
          <div className="space-y-3 p-6">
            <div className="h-3 w-24 animate-pulse rounded-full bg-surface-container-high" />
            <div className="h-7 w-3/4 animate-pulse rounded-lg bg-surface-container-high" />
            <div className="h-4 w-full animate-pulse rounded bg-surface-container" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-surface-container" />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="h-10 animate-pulse rounded-xl bg-surface-container" />
              <div className="h-10 animate-pulse rounded-xl bg-surface-container" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
