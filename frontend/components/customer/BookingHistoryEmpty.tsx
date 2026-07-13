type BookingHistoryEmptyProps = {
  variant: 'no-bookings' | 'no-results'
  onClearFilters?: () => void
}

export default function BookingHistoryEmpty({ variant, onClearFilters }: BookingHistoryEmptyProps) {
  const isNoResults = variant === 'no-results'

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-dashed border-outline-variant bg-gradient-to-br from-surface-container-low via-white to-primary-container/20 px-6 py-12 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-orange/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-brand-greenLight/10 blur-3xl"
      />

      <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-outline-variant bg-white shadow-[var(--shadow-card)]">
        <span className="font-display text-2xl font-bold text-brand-orange">{isNoResults ? '?' : '∅'}</span>
      </div>

      <h3 className="relative mt-5 font-display text-xl font-bold text-on-surface">
        {isNoResults ? 'Không tìm thấy đơn phù hợp' : 'Chưa có lịch đặt phòng'}
      </h3>
      <p className="relative mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">
        {isNoResults
          ? 'Thử đổi khoảng ngày, giờ hoặc trạng thái để xem thêm kết quả.'
          : 'Khi bạn đặt phòng, lịch sử sẽ hiển thị tại đây để theo dõi và đánh giá sau kỳ lưu trú.'}
      </p>

      {isNoResults && onClearFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="relative mt-6 inline-flex h-11 items-center rounded-xl bg-brand-orange px-5 font-display text-sm font-semibold text-white shadow-[0_10px_26px_rgba(255,117,24,0.22)] transition hover:bg-brand-orangeHover active:scale-[0.98]"
        >
          Xóa bộ lọc
        </button>
      )}
    </div>
  )
}
