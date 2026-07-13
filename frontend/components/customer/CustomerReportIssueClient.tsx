'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  CustomerActionMessage,
  CustomerActionPageLayout,
  CustomerActionQuickLink,
  CustomerActionSidebarCard,
  CustomerActionSubmitButton,
  CustomerFormField,
} from '@/components/customer/CustomerActionPageLayout'
import { CustomerCard } from '@/components/customer/CustomerPageShell'
import { SUPPORT_EMAIL, SUPPORT_HOTLINE } from '@/lib/site-nav'
import {
  fetchCustomerBookings,
  submitCustomerIssueReport,
  type CustomerBookingSummary,
  type ReportIssueType,
} from '@/lib/customer-account-service'

const issueTypes: Array<{
  value: ReportIssueType
  label: string
  description: string
  icon: 'room' | 'equipment' | 'payment' | 'account' | 'other'
}> = [
  { value: 'ROOM', label: 'Phòng homestay', description: 'Vệ sinh, cách âm, điều hòa', icon: 'room' },
  { value: 'EQUIPMENT', label: 'Tiện nghi', description: 'Trống, ampli, micro hỏng', icon: 'equipment' },
  { value: 'PAYMENT', label: 'Thanh toán', description: 'Sai tiền, hoàn tiền, hóa đơn', icon: 'payment' },
  { value: 'ACCOUNT', label: 'Tài khoản', description: 'Đăng nhập, hồ sơ', icon: 'account' },
  { value: 'OTHER', label: 'Khác', description: 'Sự cố khác', icon: 'other' },
]

const reportTips = [
  'Ghi rõ thời gian và tên phòng xảy ra sự cố.',
  'Mô tả chi tiết giúp đội ngũ xử lý nhanh hơn.',
  'Thêm mã đặt phòng nếu liên quan lịch đặt phòng.',
]

const workflowSteps = [
  { title: 'Tiếp nhận', description: 'Hệ thống ghi nhận báo cáo ngay khi bạn gửi.' },
  { title: 'Xem xét', description: 'Đội ngũ homestay kiểm tra trong giờ vận hành.' },
  { title: 'Phản hồi', description: 'Chúng tôi liên hệ qua email hoặc số điện thoại đã đăng ký.' },
]

const MIN_DESCRIPTION_LENGTH = 10

export default function CustomerReportIssueClient() {
  const [issueType, setIssueType] = useState<ReportIssueType | ''>('')
  const [bookingCode, setBookingCode] = useState('')
  const [description, setDescription] = useState('')
  const [bookings, setBookings] = useState<CustomerBookingSummary[]>([])
  const [isLoadingBookings, setIsLoadingBookings] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const recentBookings = useMemo(() => bookings.slice(0, 4), [bookings])
  const descriptionReady = description.trim().length >= MIN_DESCRIPTION_LENGTH

  const steps = useMemo(() => {
    const hasType = Boolean(issueType)
    const hasDescription = descriptionReady

    return [
      { id: 'type', label: 'Chọn loại', complete: hasType, current: !hasType },
      { id: 'detail', label: 'Mô tả chi tiết', complete: hasDescription, current: hasType && !hasDescription },
      { id: 'send', label: 'Gửi báo cáo', complete: false, current: hasType && hasDescription },
    ]
  }, [descriptionReady, issueType])

  useEffect(() => {
    let mounted = true

    void fetchCustomerBookings()
      .then((items) => {
        if (mounted) setBookings(items)
      })
      .catch(() => {
        if (mounted) setBookings([])
      })
      .finally(() => {
        if (mounted) setIsLoadingBookings(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!issueType) {
      setMessage({ type: 'error', text: 'Vui lòng chọn loại sự cố.' })
      return
    }

    if (!description.trim()) {
      setMessage({ type: 'error', text: 'Nội dung mô tả không được để trống.' })
      return
    }

    if (description.trim().length < MIN_DESCRIPTION_LENGTH) {
      setMessage({
        type: 'error',
        text: `Mô tả cần ít nhất ${MIN_DESCRIPTION_LENGTH} ký tự để đội ngũ hiểu rõ sự cố.`,
      })
      return
    }

    setIsSubmitting(true)
    setMessage(null)
    try {
      await submitCustomerIssueReport({
        issueType,
        bookingCode: bookingCode.trim(),
        description: description.trim(),
      })
      setIssueType('')
      setBookingCode('')
      setDescription('')
      setMessage({ type: 'success', text: 'Báo cáo sự cố đã được gửi. Chúng tôi sẽ phản hồi sớm nhất có thể.' })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Không thể gửi báo cáo sự cố. Vui lòng thử lại.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CustomerActionPageLayout
      variant="support-report"
      eyebrow="Hỗ trợ"
      title="Báo cáo sự cố"
      description="Khu vực hỗ trợ — gửi sự cố để đội ngũ Homestay Booking kiểm tra và phản hồi."
      breadcrumb={[
        { label: 'Hỗ trợ', href: '/customer/support' },
        { label: 'Báo cáo sự cố' },
      ]}
      banner={
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-brand-orange/25 bg-primary-container px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-orange text-white">
              <AlertIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-sm font-bold text-[#6B3200]">Sự cố khẩn cấp tại phòng?</p>
              <p className="mt-0.5 text-sm text-[#6B3200]/80">
                Gọi hotline ngay — không cần chờ gửi form.
              </p>
            </div>
          </div>
          <a
            href={`tel:${SUPPORT_HOTLINE.replace(/\s/g, '')}`}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-brand-orange px-5 font-display text-sm font-semibold text-white shadow-[0_8px_20px_rgba(255,117,24,0.3)] transition hover:bg-brand-orangeHover"
          >
            Gọi {SUPPORT_HOTLINE}
          </a>
        </div>
      }
      stats={[
        {
          label: 'Phản hồi',
          value: 'Trong 24 giờ',
          tone: 'amber',
          icon: <ClockIcon className="h-4 w-4" />,
        },
        {
          label: 'Bảo mật',
          value: 'Chỉ đội ngũ xem',
          tone: 'green',
          icon: <ShieldIcon className="h-4 w-4" />,
        },
        {
          label: 'Kênh khác',
          value: 'Email hỗ trợ',
          tone: 'orange',
          icon: <ChatIcon className="h-4 w-4" />,
        },
      ]}
      steps={steps}
      formTitle="Gửi báo cáo"
      formDescription="Hoàn thành 3 bước: chọn loại sự cố, mô tả chi tiết, rồi gửi."
      formIcon={<AlertIcon className="h-5 w-5" />}
      sidebar={
        <>
          <CustomerActionSidebarCard
            variant="support-report"
            title="Sau khi gửi"
            description="Quy trình xử lý báo cáo của Homestay Booking."
            icon={<WorkflowIcon className="h-5 w-5 text-white" />}
          >
            <ol className="space-y-3">
              {workflowSteps.map((step, index) => (
                <li
                  key={step.title}
                  className="flex gap-3 rounded-2xl border border-white/15 bg-white/10 p-4"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 font-display text-xs font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-sm font-bold">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-white/75">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CustomerActionSidebarCard>

          <CustomerCard>
            <h2 className="font-display text-base font-bold text-on-surface">Gợi ý mô tả</h2>
            <ul className="mt-4 space-y-2">
              {reportTips.map((tip) => (
                <li key={tip} className="flex gap-2 text-sm leading-6 text-on-surface-variant">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-orange" />
                  {tip}
                </li>
              ))}
            </ul>
            <nav className="mt-5 grid gap-2">
              <CustomerActionQuickLink href="/customer/support" label="Trung tâm hỗ trợ" />
              <CustomerActionQuickLink href="/customer/bookings" label="Lịch đặt của tôi" />
            </nav>
            <p className="mt-4 text-xs leading-5 text-on-surface-variant">
              Email:{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-brand-orange hover:underline">
                {SUPPORT_EMAIL}
              </a>
            </p>
          </CustomerCard>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset>
          <legend className="mb-3 font-display text-xs font-bold uppercase tracking-[0.08em] text-on-surface-variant">
            Bước 1 — Loại sự cố
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {issueTypes.map((type) => {
              const selected = issueType === type.value

              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    setIssueType(type.value)
                    setMessage(null)
                  }}
                  className={[
                    'rounded-2xl border p-4 text-left transition',
                    selected
                      ? 'border-brand-orange bg-primary-container shadow-[0_8px_24px_rgba(255,117,24,0.12)]'
                      : 'border-outline-variant bg-white hover:border-brand-orange/30 hover:bg-surface-container-low/60',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={[
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                        selected ? 'bg-brand-orange text-white' : 'bg-surface-container text-brand-orange',
                      ].join(' ')}
                    >
                      <IssueTypeIcon type={type.icon} className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block font-display text-sm font-bold text-on-surface">{type.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-on-surface-variant">{type.description}</span>
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </fieldset>

        <div className="space-y-4 rounded-2xl border border-brand-orange/15 bg-primary-container/30 p-4 sm:p-5">
          <p className="font-display text-xs font-bold uppercase tracking-[0.08em] text-[#6B3200]">
            Bước 2 — Chi tiết sự cố
          </p>

          <CustomerFormField label="Mã đặt phòng (nếu có)" hint="Chọn từ lịch gần đây hoặc nhập thủ công.">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-on-surface-variant/60">
                <TicketIcon className="h-4 w-4" />
              </span>
              <input
                list="customer-booking-codes"
                value={bookingCode}
                onChange={(event) => setBookingCode(event.target.value)}
                placeholder="Ví dụ: BR00000012"
                className="h-12 w-full rounded-2xl border border-outline bg-white py-2.5 pl-11 pr-4 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/50 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
              />
              <datalist id="customer-booking-codes">
                {bookings.map((booking) => (
                  <option key={booking.code} value={booking.code}>
                    {booking.roomName}
                  </option>
                ))}
              </datalist>
            </div>
          </CustomerFormField>

          {!isLoadingBookings && recentBookings.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                Lịch gần đây
              </p>
              <div className="flex flex-wrap gap-2">
                {recentBookings.map((booking) => (
                  <button
                    key={booking.id}
                    type="button"
                    onClick={() => setBookingCode(booking.code)}
                    className={[
                      'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                      bookingCode === booking.code
                        ? 'border-brand-orange bg-brand-orange text-white'
                        : 'border-outline-variant bg-white text-on-surface-variant hover:border-brand-orange/30 hover:text-brand-orange',
                    ].join(' ')}
                  >
                    {booking.code}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <CustomerFormField
            label="Nội dung mô tả"
            hint={`Tối thiểu ${MIN_DESCRIPTION_LENGTH} ký tự. Càng chi tiết, xử lý càng nhanh.`}
          >
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={6}
              placeholder="Mô tả sự cố: thời gian, phòng, tiện nghi bị ảnh hưởng và những gì đã xảy ra..."
              className="w-full resize-y rounded-2xl border border-outline bg-white px-4 py-3 text-sm leading-6 text-on-surface outline-none transition placeholder:text-on-surface-variant/50 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
            />
            <div className="mt-2 flex items-center justify-between gap-3 text-xs">
              <span className={descriptionReady ? 'font-medium text-brand-greenDark' : 'text-on-surface-variant'}>
                {descriptionReady ? 'Đủ thông tin để gửi' : `Cần thêm ${Math.max(0, MIN_DESCRIPTION_LENGTH - description.trim().length)} ký tự`}
              </span>
              <span className="text-on-surface-variant">{description.trim().length} ký tự</span>
            </div>
          </CustomerFormField>
        </div>

        {message ? <CustomerActionMessage message={message} /> : null}

        <div className="flex flex-col gap-3 border-t border-outline-variant pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-on-surface-variant">
            Bước 3 — Kiểm tra lại thông tin rồi nhấn gửi.
          </p>
          <CustomerActionSubmitButton
            isSubmitting={isSubmitting}
            submittingLabel="Đang gửi"
            label="Gửi báo cáo"
            icon={<SendIcon className="h-4 w-4" />}
            variant="support"
          />
        </div>
      </form>
    </CustomerActionPageLayout>
  )
}

function IssueTypeIcon({
  type,
  className,
}: {
  type: 'room' | 'equipment' | 'payment' | 'account' | 'other'
  className?: string
}) {
  if (type === 'room') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" d="M4 20V8l8-4 8 4v12" />
        <path strokeLinecap="round" d="M9 20v-6h6v6" />
      </svg>
    )
  }
  if (type === 'equipment') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" d="M9 18V5l10-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="16" cy="16" r="3" />
      </svg>
    )
  }
  if (type === 'payment') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path strokeLinecap="round" d="M3 10h18" />
      </svg>
    )
  }
  if (type === 'account') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="4" />
        <path strokeLinecap="round" d="M5 20c1.5-3.5 4.5-5 7-5s5.5 1.5 7 5" />
      </svg>
    )
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8" />
      <path strokeLinecap="round" d="M12 8v5M12 16h.01" />
    </svg>
  )
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 4.5h3.4L21 19H3L10.3 4.5z" />
    </svg>
  )
}

function TicketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" d="M4 9a2 2 0 012-2h12a2 2 0 012 2v1a2 2 0 010 4v1a2 2 0 010 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2v-1a2 2 0 010-4V14a2 2 0 010-4V9z" />
    </svg>
  )
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  )
}

function WorkflowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" d="M4 7h6v6H4zM14 4h6v6h-6zM14 14h6v6h-6z" />
      <path strokeLinecap="round" d="M10 10h4M17 10v4" />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 7v5l3 2" />
    </svg>
  )
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" />
    </svg>
  )
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z" />
    </svg>
  )
}
