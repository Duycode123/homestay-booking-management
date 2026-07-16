export default function RoomCatalogSkeleton({ count = 6, variant = 'grid' }: { count?: number; variant?: 'grid' | 'list' }) {
  if (variant === 'list') {
    return (
      <div className="mt-5 space-y-5" aria-hidden>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-[22px] border border-outline-variant bg-white shadow-[var(--shadow-card)] md:flex md:min-h-[310px]">
            <div className="aspect-[16/10] animate-pulse bg-surface-container md:aspect-auto md:w-[36%] md:min-w-[285px]" />
            <div className="grid flex-1 md:grid-cols-[minmax(0,1fr)_210px]">
              <div className="space-y-4 p-6">
                <div className="h-3 w-24 animate-pulse rounded-full bg-surface-container-high" />
                <div className="h-8 w-2/3 animate-pulse rounded-lg bg-surface-container-high" />
                <div className="h-4 w-full animate-pulse rounded bg-surface-container" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-surface-container" />
                <div className="h-10 animate-pulse rounded-xl bg-surface-container" />
              </div>
              <div className="space-y-4 border-t border-outline-variant bg-surface-container-low p-5 md:border-l md:border-t-0">
                <div className="h-8 w-4/5 animate-pulse rounded-lg bg-surface-container-high" />
                <div className="h-16 animate-pulse rounded-xl bg-white" />
                <div className="h-11 animate-pulse rounded-full bg-surface-container-high" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

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
