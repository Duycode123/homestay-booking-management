import type { PaymentOption } from '@/lib/payment-service'

export default function CheckoutPaymentMethods({
  bookingId,
  paymentOption,
  total,
  onChange,
}: {
  bookingId: string
  paymentOption: PaymentOption
  total: number
  onChange: (option: PaymentOption) => void
}) {
  const depositAmount = Math.round(total * 0.5)
  const remainingAmount = Math.max(0, total - depositAmount)

  return (
    <section aria-labelledby="checkout-payment-option-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B28455]">Hình thức thanh toán</p>
          <h3 id="checkout-payment-option-title" className="mt-1 font-display text-xl font-bold">Bạn muốn thanh toán bao nhiêu?</h3>
        </div>
        <span className="rounded-full bg-[#F3EFE8] px-3 py-1 text-xs font-semibold text-[#6A6C66]">Mã {bookingId}</span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <PaymentOptionCard
          active={paymentOption === 'deposit'}
          badge="Phổ biến"
          percentage="50%"
          title="Đặt cọc trước"
          amount={depositAmount}
          description={`Thanh toán phần còn lại ${formatCurrency(remainingAmount)} khi checkout.`}
          onClick={() => onChange('deposit')}
        />
        <PaymentOptionCard
          active={paymentOption === 'full'}
          percentage="100%"
          title="Thanh toán toàn bộ"
          amount={total}
          description="Hoàn tất tiền phòng ngay, không cần kết toán thêm khi checkout."
          onClick={() => onChange('full')}
        />
      </div>
    </section>
  )
}

function PaymentOptionCard({
  active,
  badge,
  percentage,
  title,
  amount,
  description,
  onClick,
}: {
  active: boolean
  badge?: string
  percentage: string
  title: string
  amount: number
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'relative min-h-[178px] overflow-hidden rounded-[22px] border p-4 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#B28455]/20',
        active
          ? 'border-[#B28455] bg-[#F7EDE0] shadow-[0_12px_30px_rgba(178,132,85,0.14)]'
          : 'border-[#E4DED3] bg-white hover:-translate-y-0.5 hover:border-[#B28455]/50 hover:shadow-sm',
      ].join(' ')}
    >
      {active && <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-[#B28455]" />}
      <span className="flex items-start justify-between gap-3">
        <span className="flex items-center gap-2">
          <span className={['rounded-full px-2.5 py-1 font-display text-xs font-bold', active ? 'bg-[#234D42] text-white' : 'bg-[#EEEAE3] text-[#5F655F]'].join(' ')}>{percentage}</span>
          {badge && <span className="text-[10px] font-bold uppercase tracking-wide text-[#A16F3E]">{badge}</span>}
        </span>
        <span className={['flex h-6 w-6 items-center justify-center rounded-full border', active ? 'border-[#B28455] bg-[#B28455] text-white' : 'border-[#CFC7BB] text-transparent'].join(' ')}>
          <CheckIcon />
        </span>
      </span>
      <span className="mt-4 block font-display text-base font-bold text-[#242A27]">{title}</span>
      <span className="mt-1 block font-display text-xl font-bold text-[#A97643]">{formatCurrency(amount)}</span>
      <span className="mt-2 block text-xs leading-5 text-[#6A6C66]">{description}</span>
    </button>
  )
}

function CheckIcon() {
  return <svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="m6 12.5 4 4L18 8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat('vi-VN').format(value)}đ`
}
