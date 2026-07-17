import api from '@/lib/api'
import { getNightlyDisplayPrice } from '@/components/booking/booking-data'
import type {
  ChatbotAction,
  ChatbotAgentContext,
  ChatbotReply,
  ChatbotSession,
  ChatbotSuggestedRoom,
} from './types'

type BackendChatbotReply = {
  answer: string
  suggestedRooms?: ChatbotSuggestedRoom[]
  suggestedQuestions?: string[]
  usedAi?: boolean
  mode?: string
  state?: string
  intent?: string
  missingFields?: string[]
  context?: ChatbotAgentContext
  action?: ChatbotAction
}

type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
}

type RoomApiItem = {
  id: number
  roomName: string
  roomType?: {
    typeName?: string
    description?: string
    pricePerHour?: number | string | null
  } | null
  maxPeople?: number | null
  status?: string | null
  imageUrl?: string | null
}

const RESPONSE_RULES: Array<{ keywords: string[]; reply: ChatbotReply }> = [
  {
    keywords: ['đặt phòng', 'dat phong', 'booking', 'đặt lịch', 'book'],
    reply: {
      content:
        'Bạn có thể đặt phòng trong vài bước: chọn hạng phòng → chọn ngày và khung giờ trống → xác nhận. Vào **Đặt phòng** để bắt đầu nhé!',
      quickReplies: [
        { id: 'qr-book', label: 'Hướng dẫn đặt phòng', message: 'Hướng dẫn chi tiết cách đặt phòng' },
        { id: 'qr-price', label: 'Giá thuê phòng', message: 'Giá thuê phòng bao nhiêu?' },
      ],
    },
  },
  {
    keywords: ['giá', 'gia', 'price', 'bao nhiêu', 'chi phí', 'phí'],
    reply: {
      content:
        'Giá được niêm yết theo một đêm và phụ thuộc vào hạng phòng, sức chứa cùng tiện nghi. Bạn chọn phòng cụ thể để xem mức giá và lịch trống chính xác.',
      quickReplies: [
        { id: 'qr-types', label: 'Các loại phòng', message: 'Có những loại phòng nào?' },
      ],
    },
  },
  {
    keywords: ['loại phòng', 'phòng nào', 'standard', 'deluxe', 'family', 'homestay'],
    reply: {
      content:
        'The Serene Villa có 3 hạng phòng Standard, Deluxe và Family. Mỗi phòng có Wi-Fi, điều hòa, TV và máy nước nóng. Bạn cho mình biết số khách, ngân sách và thời gian lưu trú để mình gợi ý phòng phù hợp!',
    },
  },
  {
    keywords: ['hủy', 'huy', 'cancel', 'đổi lịch', 'doi lich'],
    reply: {
      content:
        'Bạn có thể tự hủy trước giờ nhận phòng ít nhất 24 giờ để được hoàn 100% số tiền đã thanh toán. Vào **Booking của tôi** hoặc liên hệ hỗ trợ nếu cần xử lý trường hợp đặc biệt.',
    },
  },
  {
    keywords: ['thanh toán', 'payment', 'vnpay', 'chuyển khoản', 'tiền mặt'],
    reply: {
      content:
        'Hỗ trợ chuyển khoản, ví điện tử và thanh toán tại quầy tùy bước checkout. Sau khi đặt, bạn sẽ thấy hướng dẫn thanh toán chi tiết trên màn hình xác nhận.',
    },
  },
  {
    keywords: ['giờ mở', 'mở cửa', 'open', 'đóng cửa', 'giờ hoạt động'],
    reply: {
      content: 'Homestay tiếp nhận đặt phòng từ **08:00 – 24:00** mỗi ngày. Khung giờ đặt online hiển thị theo lịch trống của từng phòng.',
    },
  },
  {
    keywords: ['tiện nghi', 'tiện nghi', 'wifi', 'wi-fi', 'điều hòa', 'máy lạnh', 'tv', 'máy nước nóng'],
    reply: {
      content:
        'Mỗi phòng có các tiện nghi cơ bản như Wi-Fi, điều hòa, TV và máy nước nóng. Bạn có thể ghi chú nhu cầu đặc biệt trong bước đặt phòng để nhân viên chuẩn bị trước.',
    },
  },
  {
    keywords: ['hướng dẫn', 'chi tiết', 'cách đặt', 'làm sao'],
    reply: {
      content:
        '**4 bước đặt phòng:**\n1. Chọn hạng phòng phù hợp\n2. Chọn ngày và giờ trống\n3. Thêm ghi chú về tiện nghi (nếu cần)\n4. Xác nhận và thanh toán\n\nCần mình dẫn tới trang đặt phòng không?',
      quickReplies: [
        { id: 'qr-go-book', label: 'Đi tới đặt phòng', message: 'Link đặt phòng ở đâu?' },
      ],
    },
  },
  {
    keywords: ['link', 'ở đâu', 'trang', 'đường dẫn'],
    reply: {
      content:
        'Đăng nhập tài khoản khách → menu **Đặt phòng** (`/rooms`) hoặc từ trang chủ chọn **Đặt ngay** trên thẻ phòng.',
    },
  },
  {
    keywords: ['xin chào', 'hello', 'hi', 'chào', 'hey'],
    reply: {
      content: 'Chào bạn! Mình là **HomeBot** — trợ lý tư vấn phòng của The Serene Villa. Bạn muốn đặt phòng, hỏi giá hay tìm phòng theo tiện nghi?',
      quickReplies: [
        { id: 'qr-1', label: 'Đặt phòng', message: 'Tôi muốn đặt phòng' },
        { id: 'qr-2', label: 'Giá phòng', message: 'Giá thuê phòng bao nhiêu?' },
        { id: 'qr-3', label: 'Giờ mở cửa', message: 'Homestay mở cửa mấy giờ?' },
      ],
    },
  },
]

const DEFAULT_REPLY: ChatbotReply = {
  content:
    'Mình chưa chắc về câu này — bạn thử hỏi về **đặt phòng**, **giá**, **hủy lịch** hoặc **thanh toán**. Nếu cần thêm trợ giúp, hãy mở **Trung tâm hỗ trợ** nhé!',
  quickReplies: [
    { id: 'qr-fallback-1', label: 'Đặt phòng', message: 'Hướng dẫn đặt phòng' },
    { id: 'qr-fallback-2', label: 'Liên hệ hỗ trợ', message: 'Làm sao liên hệ nhân viên?' },
  ],
}

function toQuickReplies(questions?: string[]) {
  return (questions ?? []).slice(0, 3).map((question, index) => ({
    id: `ai-suggested-${index}`,
    label: question.length > 28 ? `${question.slice(0, 25)}...` : question,
    message: question,
  }))
}

async function sendBackendChatbotMessage(message: string, session?: ChatbotSession): Promise<ChatbotReply> {
  const response = await api.post<ApiEnvelope<BackendChatbotReply>>('/api/ai/chat', {
    message,
    context: session?.context,
    history: session?.history?.slice(-8),
  })
  const payload = response.data
  if (!payload.success || !payload.data?.answer) {
    throw new Error(payload.message || 'Chatbot chưa phản hồi được')
  }

  return {
    content: payload.data.answer,
    quickReplies: toQuickReplies(payload.data.suggestedQuestions),
    usedAi: payload.data.usedAi,
    mode: payload.data.mode,
    state: payload.data.state,
    intent: payload.data.intent,
    missingFields: payload.data.missingFields,
    context: payload.data.context,
    suggestedRooms: payload.data.suggestedRooms?.slice(0, 4),
    action: payload.data.action,
  }
}

const SUPPORT_REPLY: ChatbotReply = {
  content:
    'Bạn có thể vào **Trung tâm hỗ trợ** (`/support`) để xem câu hỏi thường gặp. Nếu đã đăng nhập, hãy gửi **Báo cáo sự cố** để đội ngũ vận hành theo dõi đúng đơn đặt phòng.',
}

const ROOM_FALLBACK_QUICK_REPLIES = [
  { id: 'qr-common-booking', label: 'Cách đặt phòng', message: 'Tôi muốn đặt phòng thì làm thế nào?' },
  { id: 'qr-common-hours', label: 'Giờ mở cửa', message: 'Homestay mở cửa lúc mấy giờ?' },
  { id: 'qr-common-coupon', label: 'Mã giảm giá', message: 'Có mã giảm giá nào đang dùng được không?' },
  { id: 'qr-common-support', label: 'Liên hệ hỗ trợ', message: 'Làm sao liên hệ nhân viên?' },
]

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function extractPeopleCount(normalized: string) {
  const match = normalized.match(/(\d{1,3})\s*(nguoi|khach|thanh vien|ban)/)
  return match ? Number(match[1]) : null
}

function extractMaxPrice(normalized: string) {
  const match = normalized.match(/(?:duoi|toi da|khong qua|tam|khoang)?\s*(\d+(?:[.,]\d+)?)\s*(k|nghin|ngan|trieu|m|vnd|d|dong)\b/)
  if (!match) return null

  const rawValue = Number(match[1].replace(',', '.'))
  if (!Number.isFinite(rawValue)) return null

  const unit = match[2]
  if (unit === 'k' || unit === 'nghin' || unit === 'ngan') return rawValue * 1000
  if (unit === 'trieu' || unit === 'm') return rawValue * 1000000
  return rawValue
}

function formatMoney(value: number | string | null | undefined) {
  const numberValue = typeof value === 'string' ? Number(value) : value
  if (!numberValue || Number.isNaN(numberValue)) return 'chưa có giá'
  return `${numberValue.toLocaleString('vi-VN')}đ/đêm`
}

function toIsoDate(day: number, month: number, year?: number) {
  const resolvedYear = year == null ? new Date().getFullYear() : year < 100 ? 2000 + year : year
  const value = new Date(resolvedYear, month - 1, day)
  if (value.getFullYear() !== resolvedYear || value.getMonth() !== month - 1 || value.getDate() !== day) {
    return undefined
  }
  return `${resolvedYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function localIsoDate(offsetDays: number) {
  const value = new Date()
  value.setDate(value.getDate() + offsetDays)
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

function addIsoDays(value: string, days: number) {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function extractStayDates(normalized: string) {
  const relativeDate = normalized.includes('ngay kia')
    ? localIsoDate(2)
    : normalized.includes('ngay mai')
      ? localIsoDate(1)
      : normalized.includes('hom nay') || normalized.includes('toi nay')
        ? localIsoDate(0)
        : undefined
  const dates = relativeDate ? [relativeDate] : []
  const pattern = /(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?/g
  for (const match of normalized.matchAll(pattern)) {
    const parsed = toIsoDate(Number(match[1]), Number(match[2]), match[3] ? Number(match[3]) : undefined)
    if (parsed && !dates.includes(parsed)) dates.push(parsed)
    if (dates.length === 2) break
  }
  return dates
}

function buildBookingAgentFallbackReply(
  message: string,
  previous?: ChatbotAgentContext,
): ChatbotReply | null {
  const normalized = normalize(message)
  const bookingIntent = previous?.intent === 'BOOKING' || [
    'dat phong', 'tim phong', 'goi y phong', 'con phong', 'lich trong', 'nhan phong', 'check-in',
  ].some((keyword) => normalized.includes(keyword))
  if (!bookingIntent) return null

  const context: ChatbotAgentContext = {
    ...previous,
    conversationId: previous?.conversationId ?? `browser-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    intent: 'BOOKING',
  }
  const dates = extractStayDates(normalized)
  if (dates.length >= 2) {
    context.checkInDate = dates[0]
    context.checkOutDate = dates[1]
  } else if (dates.length === 1) {
    if (normalized.includes('tra phong') || normalized.includes('check out') || normalized.includes('checkout')) {
      context.checkOutDate = dates[0]
    } else if (!context.checkInDate) {
      context.checkInDate = dates[0]
    } else if (!context.checkOutDate) {
      context.checkOutDate = dates[0]
    }
  }

  const nights = normalized.match(/(\d{1,2})\s*(dem|night)\b/)
  if (context.checkInDate && nights) context.checkOutDate = addIsoDays(context.checkInDate, Number(nights[1]))

  const adults = normalized.match(/(\d{1,2})\s*(nguoi lon|adult)\b/)
  const children = normalized.match(/(\d{1,2})\s*(tre em|tre nho|child|children)\b/)
  const people = normalized.match(/(\d{1,3})\s*(nguoi|khach|thanh vien|ban)\b/)
  if (adults) context.adults = Number(adults[1])
  if (children) context.children = Number(children[1])
  if (!adults && !children && people) context.adults = Number(people[1])

  const missingFields = [
    !context.checkInDate ? 'checkInDate' : undefined,
    !context.checkOutDate ? 'checkOutDate' : undefined,
    !context.adults ? 'guests' : undefined,
  ].filter((value): value is string => Boolean(value))

  if (missingFields.includes('checkInDate')) {
    return {
      content: 'Mình sẽ kiểm tra lịch phòng thật cho bạn. Trước tiên, bạn muốn **nhận phòng ngày nào**?',
      quickReplies: [
        { id: 'agent-fallback-tomorrow', label: 'Ngày mai', message: 'Nhận phòng ngày mai' },
        { id: 'agent-fallback-date', label: 'Nhập ngày khác', message: 'Tôi muốn nhận phòng ngày ' },
      ],
      mode: 'SAFE_BOOKING_FALLBACK',
      state: 'COLLECTING_REQUIREMENTS',
      intent: 'BOOKING',
      missingFields,
      context,
    }
  }
  if (missingFields.includes('checkOutDate')) {
    return {
      content: 'Mình đã ghi nhận ngày nhận phòng. Bạn muốn **ở mấy đêm** hoặc trả phòng ngày nào?',
      quickReplies: [
        { id: 'agent-fallback-1-night', label: 'Ở 1 đêm', message: 'Ở 1 đêm' },
        { id: 'agent-fallback-2-nights', label: 'Ở 2 đêm', message: 'Ở 2 đêm' },
      ],
      mode: 'SAFE_BOOKING_FALLBACK',
      state: 'COLLECTING_REQUIREMENTS',
      intent: 'BOOKING',
      missingFields,
      context,
    }
  }
  if (missingFields.includes('guests')) {
    return {
      content: 'Kỳ lưu trú đã được ghi nhận. Đoàn của bạn có **bao nhiêu người lớn và trẻ em**?',
      quickReplies: [
        { id: 'agent-fallback-2-adults', label: '2 người lớn', message: '2 người lớn' },
        { id: 'agent-fallback-family', label: '2 lớn, 1 trẻ em', message: '2 người lớn và 1 trẻ em' },
      ],
      mode: 'SAFE_BOOKING_FALLBACK',
      state: 'COLLECTING_REQUIREMENTS',
      intent: 'BOOKING',
      missingFields,
      context,
    }
  }

  return {
    content: 'Mình đã ghi nhận đủ kỳ lưu trú và số khách, nhưng hệ thống lịch thật đang kết nối lại nên chưa thể xác nhận phòng trống. Bạn bấm **Kiểm tra lại lịch**; mình sẽ không gợi ý hoặc giữ phòng khi chưa kiểm tra được dữ liệu booking.',
    quickReplies: [
      { id: 'agent-fallback-retry', label: 'Kiểm tra lại lịch', message },
      { id: 'agent-fallback-support', label: 'Liên hệ hỗ trợ', message: 'Làm sao liên hệ nhân viên?' },
    ],
    mode: 'SAFE_BOOKING_FALLBACK',
    state: 'AGENT_TEMPORARILY_UNAVAILABLE',
    intent: 'BOOKING',
    missingFields: [],
    context,
  }
}

function normalizeRoomPrice(room: RoomApiItem) {
  const value = room.roomType?.pricePerHour
  const numberValue = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(numberValue)
    ? getNightlyDisplayPrice(Number(numberValue))
    : Number.MAX_SAFE_INTEGER
}

function roomSummary(room: RoomApiItem) {
  const typeName = room.roomType?.typeName ? ` - ${room.roomType.typeName}` : ''
  const capacity = room.maxPeople ? `, tối đa ${room.maxPeople} người` : ''
  const status = room.status && room.status !== 'AVAILABLE' ? `, trạng thái ${room.status}` : ''
  return `${room.roomName}${typeName}, ${formatMoney(normalizeRoomPrice(room))}${capacity}${status}`
}

function buildRoomAdvice(room: RoomApiItem, peopleCount: number | null, maxPrice: number | null) {
  const reasons = []
  if (peopleCount != null && room.maxPeople != null && room.maxPeople >= peopleCount) {
    reasons.push(`đủ sức chứa cho ${peopleCount} người`)
  }
  if (maxPrice != null && normalizeRoomPrice(room) <= maxPrice) {
    reasons.push(`nằm trong ngân sách ${formatMoney(maxPrice)}`)
  }
  if (room.status === 'AVAILABLE') {
    reasons.push('đang sẵn sàng đặt')
  }

  const reasonText = reasons.length > 0 ? ` vì phòng này ${reasons.join(', ')}` : ''
  return `Mình gợi ý **${room.roomName}**${reasonText}. Đây là phòng ${room.roomType?.typeName ?? 'phù hợp'}, giá ${formatMoney(normalizeRoomPrice(room))}${room.maxPeople ? `, sức chứa tối đa ${room.maxPeople} người` : ''}.`
}

function isAskingPrice(normalized: string) {
  return normalized.includes('gia thue') ||
    normalized.includes('gia phong') ||
    normalized.includes('bao nhieu') ||
    normalized.includes('bang gia') ||
    normalized.includes('chi phi') ||
    normalized.includes('phi thue') ||
    normalized.includes('gia cac phong')
}

async function buildPriceDbFallbackReply(): Promise<ChatbotReply | null> {
  const response = await api.get<ApiEnvelope<RoomApiItem[]>>('/api/rooms')
  const rooms = (response.data.data ?? [])
    .filter((room) => room.status !== 'MAINTENANCE')
    .filter((room) => normalizeRoomPrice(room) !== Number.MAX_SAFE_INTEGER)
    .sort((first, second) => normalizeRoomPrice(first) - normalizeRoomPrice(second))

  if (rooms.length === 0) return null

  const cheapest = rooms[0]
  const highest = rooms[rooms.length - 1]
  const byType = new Map<string, RoomApiItem>()
  rooms.forEach((room) => {
    const typeName = room.roomType?.typeName ?? 'Phòng homestay'
    const existing = byType.get(typeName)
    if (!existing || normalizeRoomPrice(room) < normalizeRoomPrice(existing)) {
      byType.set(typeName, room)
    }
  })

  const typeLines = Array.from(byType.values())
    .slice(0, 4)
    .map((room) => `**${room.roomType?.typeName ?? room.roomName}** từ ${formatMoney(room.roomType?.pricePerHour)}`)
    .join('; ')

  return {
    content:
      `Giá thuê hiện dao động khoảng **${formatMoney(cheapest.roomType?.pricePerHour)} đến ${formatMoney(highest.roomType?.pricePerHour)}** tùy loại phòng. Một vài mức tham khảo: ${typeLines}. Nếu bạn cho mình số người, ngân sách và khung giờ, mình sẽ gợi ý phòng hợp nhất.`,
    quickReplies: [
      { id: 'qr-price-budget', label: 'Dưới 300k', message: 'Có phòng nào dưới 300k một giờ không?' },
      { id: 'qr-price-people', label: 'Cho 4 người', message: 'Nhóm 4 người nên chọn phòng nào?' },
    ],
    mode: 'FRONTEND_DB_FALLBACK',
  }
}

async function buildRoomDbFallbackReply(message: string): Promise<ChatbotReply | null> {
  const normalized = normalize(message)
  const peopleCount = extractPeopleCount(normalized)
  const maxPrice = extractMaxPrice(normalized)
  const asksRoom =
    normalized.includes('phong') ||
    normalized.includes('homestay') ||
    normalized.includes('luu tru') ||
    normalized.includes('dat phong') ||
    peopleCount != null ||
    maxPrice != null

  if (!asksRoom) return null

  const response = await api.get<ApiEnvelope<RoomApiItem[]>>('/api/rooms')
  const rooms = response.data.data ?? []
  const candidates = rooms
    .filter((room) => room.status !== 'MAINTENANCE')
    .filter((room) => peopleCount == null || (room.maxPeople ?? 0) >= peopleCount)
    .filter((room) => maxPrice == null || normalizeRoomPrice(room) <= maxPrice)
    .sort((first, second) => normalizeRoomPrice(first) - normalizeRoomPrice(second))

  const roomList = (candidates.length > 0 ? candidates : rooms)
    .slice(0, 3)
    .map(roomSummary)
    .join('; ')

  if (!roomList) {
    return {
      content: 'Hiện tại mình chưa thấy dữ liệu phòng để tư vấn chính xác. Bạn thử tải lại trang hoặc liên hệ nhân viên để được hỗ trợ nhanh nhé.',
      quickReplies: ROOM_FALLBACK_QUICK_REPLIES,
      mode: 'FRONTEND_DB_FALLBACK',
    }
  }

  const selectedRooms = (candidates.length > 0 ? candidates : rooms).slice(0, 3)
  const bestRoom = selectedRooms[0]

  const otherRooms = selectedRooms
    .slice(1)
    .map(roomSummary)
    .join('; ')

  const timeHint = /\b\d{1,2}h\b/.test(normalized) || normalized.includes('toi nay') || normalized.includes('hom nay')
    ? ' Bạn bấm đặt phòng để kiểm tra lịch trống chính xác theo khung giờ vừa chọn nhé.'
    : ''

  const alternatives = otherRooms ? ` Nếu muốn so sánh thêm, bạn có thể xem: ${otherRooms}.` : ''
  const content = bestRoom
    ? `${buildRoomAdvice(bestRoom, peopleCount, maxPrice)}${alternatives}${timeHint}`
    : `Mình tìm được một số phòng có thể phù hợp: ${roomList}.${timeHint}`

  return {
    content,
    quickReplies: ROOM_FALLBACK_QUICK_REPLIES,
    mode: 'FRONTEND_DB_FALLBACK',
  }
}

function matchReply(message: string): ChatbotReply {
  const normalized = normalize(message)

  if (normalized.includes('lien he') || normalized.includes('hotline') || normalized.includes('nhan vien')) {
    return SUPPORT_REPLY
  }

  const asksOpeningHours =
    normalized.includes('gio mo') ||
    normalized.includes('mo cua') ||
    normalized.includes('dong cua') ||
    normalized.includes('may gio') ||
    normalized.includes('hoat dong luc nao') ||
    normalized.includes('gio hoat dong')

  if (asksOpeningHours) {
    return {
      content:
        'Homestay mở cửa từ **08:00 đến 24:00 mỗi ngày**. Bạn có thể đặt phòng online theo lịch trống của từng phòng. Nếu muốn chắc khung giờ cụ thể, bạn hỏi mình kiểu: **"Tối nay 18h-20h còn phòng nào cho 4 người?"** nhé.',
      quickReplies: [
        { id: 'qr-hours-book', label: 'Đặt phòng', message: 'Tôi muốn đặt phòng thì làm thế nào?' },
        { id: 'qr-hours-check', label: 'Kiểm tra lịch', message: 'Tối nay 18h-20h còn phòng nào cho 4 người?' },
      ],
    }
  }

  const asksBookingGuide =
    normalized.includes('toi muon dat phong') ||
    normalized.includes('muon dat phong') ||
    normalized.includes('dat phong thi lam the nao') ||
    normalized.includes('cach dat phong') ||
    normalized.includes('huong dan dat phong') ||
    normalized.includes('quy trinh dat phong')

  if (asksBookingGuide) {
    return {
      content:
        'Để đặt phòng, bạn làm theo 4 bước nhé:\n1. Chọn phòng phù hợp với số khách, ngân sách và tiện nghi cần dùng.\n2. Chọn ngày và khung giờ còn trống.\n3. Kiểm tra tổng tiền, nhập mã giảm giá nếu có.\n4. Xác nhận đặt phòng rồi thanh toán đặt cọc hoặc thanh toán toàn bộ qua SePay.\n\nNếu bạn cho mình biết số khách và thời gian lưu trú, mình có thể gợi ý phòng phù hợp trước.',
      quickReplies: [
        { id: 'qr-guide-room', label: 'Gợi ý phòng', message: 'Nhóm 4 khách nên chọn phòng nào?' },
        { id: 'qr-guide-time', label: 'Kiểm tra giờ', message: 'Tối nay 18h-20h còn phòng nào cho 4 người?' },
      ],
    }
  }

  const peopleCount = extractPeopleCount(normalized)
  const asksRoom =
    normalized.includes('phong') ||
    normalized.includes('homestay') ||
    normalized.includes('standard') ||
    normalized.includes('deluxe') ||
    normalized.includes('family')
  const onlyPeopleCount = peopleCount != null && normalized.replace(/\d{1,3}\s*(nguoi|khach|thanh vien|ban)/, '').trim().length === 0
  const asksAvailability =
    normalized.includes('con trong') ||
    normalized.includes('trong khong') ||
    normalized.includes('toi nay') ||
    normalized.includes('hom nay') ||
    normalized.includes('ngay mai') ||
    /\b\d{1,2}h\b/.test(normalized)
  const asksEquipment =
    normalized.includes('thiet bi') ||
    normalized.includes('tien nghi') ||
    normalized.includes('wifi') ||
    normalized.includes('wi-fi') ||
    normalized.includes('dieu hoa') ||
    normalized.includes('may lanh') ||
    normalized.includes('tv') ||
    normalized.includes('tivi') ||
    normalized.includes('may nuoc nong')
  const asksCoupon =
    normalized.includes('coupon') ||
    normalized.includes('ma giam gia') ||
    normalized.includes('voucher') ||
    normalized.includes('khuyen mai')

  if ((asksRoom || onlyPeopleCount) && peopleCount) {
    return {
      content:
        `Với nhóm **${peopleCount} khách**, bạn nên chọn phòng có sức chứa từ ${peopleCount} người trở lên. Nếu muốn mình lọc chính xác phòng còn trống, hãy gửi thêm thời gian lưu trú, ví dụ: **"Tối nay 18h-20h còn phòng nào cho ${peopleCount} người?"**`,
      quickReplies: ROOM_FALLBACK_QUICK_REPLIES,
    }
  }

  if ((asksRoom || asksAvailability) && asksAvailability) {
    return {
      content:
        'Mình đã hiểu bạn muốn kiểm tra phòng trống theo khung giờ này. Để tư vấn sát hơn, bạn cho mình thêm **số người** hoặc loại phòng mong muốn nhé, ví dụ: **"Tối nay 18h-20h phòng cho 4 người còn trống không?"**',
      quickReplies: ROOM_FALLBACK_QUICK_REPLIES,
    }
  }

  if (asksRoom && asksEquipment) {
    return {
      content:
        'Mình hiểu bạn đang tìm phòng theo tiện nghi. Bạn có thể hỏi: **"Phòng nào có Wi-Fi và điều hòa?"**, **"Phòng nào có TV?"** hoặc **"Phòng Family nào có máy nước nóng?"** để mình lọc chính xác hơn.',
      quickReplies: ROOM_FALLBACK_QUICK_REPLIES,
    }
  }

  if (asksCoupon) {
    return {
      content:
        'Mã giảm giá sẽ được nhập ở bước checkout, ngay trước khi bạn xác nhận thanh toán. Nếu bạn đã có mã cụ thể, cứ gửi mã đó hoặc nhập trực tiếp trong ô **Mã giảm giá** để hệ thống kiểm tra còn hạn, điều kiện đơn tối thiểu và số tiền được giảm nhé.',
      quickReplies: [
        { id: 'qr-coupon-1', label: 'Cách nhập mã', message: 'Nhập mã giảm giá ở đâu?' },
        { id: 'qr-coupon-2', label: 'Đi đặt phòng', message: 'Tôi muốn đặt phòng và áp mã giảm giá' },
      ],
    }
  }

  for (const rule of RESPONSE_RULES) {
    if (rule.keywords.some((keyword) => normalized.includes(normalize(keyword)))) {
      return rule.reply
    }
  }

  return DEFAULT_REPLY
}

function shouldPreferRuleFallback(message: string) {
  const normalized = normalize(message)
  return normalized.includes('lam the nao') ||
    normalized.includes('lam sao') ||
    normalized.includes('cach') ||
    normalized.includes('huong dan') ||
    normalized.includes('quy trinh') ||
    normalized.includes('dat phong nhu the nao') ||
    normalized.includes('gia thue') ||
    normalized.includes('gia phong') ||
    normalized.includes('bang gia') ||
    normalized.includes('chi phi') ||
    normalized.includes('phi thue') ||
    normalized.includes('gia cac phong') ||
    normalized.includes('thanh toan') ||
    normalized.includes('dat coc') ||
    normalized.includes('sepay') ||
    normalized.includes('gio mo') ||
    normalized.includes('mo cua') ||
    normalized.includes('dong cua') ||
    normalized.includes('may gio') ||
    normalized.includes('hoat dong luc nao') ||
    normalized.includes('gio hoat dong') ||
    normalized.includes('coupon') ||
    normalized.includes('ma giam gia') ||
    normalized.includes('voucher') ||
    normalized.includes('huy') ||
    normalized.includes('doi lich') ||
    normalized.includes('lien he') ||
    normalized.includes('hotline') ||
    normalized.includes('nhan vien')
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const CHATBOT_WELCOME: ChatbotReply = {
  content:
    'Xin chào! Mình là **HomeBot** — luôn sẵn sàng tư vấn hạng phòng, tiện nghi, giá và lịch trống của The Serene Villa.',
  quickReplies: [
    { id: 'w-1', label: 'Đặt phòng ngay', message: 'Tôi muốn đặt phòng' },
    { id: 'w-2', label: 'Xem giá phòng', message: 'Giá các phòng thế nào?' },
    { id: 'w-3', label: 'Giờ mở cửa', message: 'Homestay mở cửa lúc mấy giờ?' },
    { id: 'w-4', label: 'Chính sách hủy', message: 'Hủy lịch như thế nào?' },
  ],
}

export async function sendChatbotMessage(message: string, session?: ChatbotSession): Promise<ChatbotReply> {
  const trimmed = message.trim()
  if (!trimmed) {
    return { content: 'Bạn gõ câu hỏi nhé — mình sẵn sàng hỗ trợ!' }
  }

  try {
    return await sendBackendChatbotMessage(trimmed, session)
  } catch {
    // Render free instances can need a short wake-up window. Retry once before
    // using a safe client fallback so a transient cold start does not degrade the flow.
    await delay(900)
    try {
      return await sendBackendChatbotMessage(trimmed, session)
    } catch {
      // Continue with a deterministic fallback below.
    }

    const bookingFallback = buildBookingAgentFallbackReply(trimmed, session?.context)
    if (bookingFallback) return bookingFallback

    if (isAskingPrice(normalize(trimmed))) {
      try {
        const priceDbFallback = await buildPriceDbFallbackReply()
        if (priceDbFallback) return priceDbFallback
      } catch {
        // Continue to room fallback or static rules.
      }
    }
    if (shouldPreferRuleFallback(trimmed)) {
      await delay(650 + Math.min(trimmed.length * 12, 900))
      return matchReply(trimmed)
    }
    try {
      const roomDbFallback = await buildRoomDbFallbackReply(trimmed)
      if (roomDbFallback) return roomDbFallback
    } catch {
      // Keep the chatbot responsive even if both AI and room APIs are temporarily unavailable.
    }
    await delay(650 + Math.min(trimmed.length * 12, 900))
    return matchReply(trimmed)
  }
}
