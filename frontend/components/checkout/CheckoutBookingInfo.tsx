import { formatDisplayDate, type CheckoutBooking } from '@/lib/checkout-data'

export default function CheckoutBookingInfo({ booking }: { booking: CheckoutBooking }) {
  return (
    <section className="rounded-[24px] border border-[#E8E4DC] bg-white p-6 shadow-[0_4px_24px_rgba(26,28,30,0.06)]">
      <div className="mb-5">
        <p className="font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">
          Booking đã được tạo
        </p>
        <h2 className="mt-1 font-display text-xl font-bold">{booking.roomName}</h2>
        <span className="mt-3 inline-flex rounded-full bg-[#FFE8D6] px-3 py-1 font-display text-xs font-bold text-[#6B3200]">
          {booking.bookingId}
        </span>
      </div>

      <div className="grid gap-4">
        <Detail label="Ngày đặt" value={formatDisplayDate(booking.date)} />
        <Detail label="Khung giờ" value={`${booking.startTime} - ${booking.endTime}`} />
        <Detail label="Thời lượng" value={`${booking.duration} giờ`} />
        <Detail label="Địa điểm" value={booking.location} />
      </div>

      <InfoList title="Tiện nghi có sẵn" items={booking.equipments} />

      <div className="mt-6 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-4 text-sm text-[#5C5348]">
        Bước tiếp theo sẽ tạo phiên thanh toán tạm thời. Trạng thái booking trong hệ thống vẫn giữ là chờ thanh toán.
      </div>
    </section>
  )
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-6">
      <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[#5C5348]">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full bg-[#F0EDE6] px-3 py-1 text-sm text-[#5C5348]">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  )
}
