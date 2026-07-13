export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse space-y-6 px-5 py-6 sm:px-8">
      <div className="space-y-2">
        <div className="h-3 w-24 rounded bg-surface-container" />
        <div className="h-8 w-64 max-w-full rounded-xl bg-surface-container-high" />
        <div className="h-4 w-96 max-w-full rounded bg-surface-container" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-28 rounded-2xl bg-surface-container" />
        ))}
      </div>

      <div className="h-32 rounded-2xl bg-surface-container" />
      <div className="h-[420px] rounded-2xl bg-surface-container" />
    </div>
  )
}
