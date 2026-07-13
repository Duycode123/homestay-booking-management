import RoomCatalogSkeleton from '@/components/public/RoomCatalogSkeleton'

export default function SiteLoading() {
  return (
    <div className="min-h-[50vh] bg-brand-bgGray px-5 py-8 sm:px-8" aria-busy="true" aria-label="Đang tải trang">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 h-40 animate-pulse rounded-3xl bg-surface-container-high/80" />
        <RoomCatalogSkeleton count={3} />
      </div>
    </div>
  )
}
