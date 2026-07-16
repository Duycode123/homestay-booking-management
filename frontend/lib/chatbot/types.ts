export type ChatRole = 'user' | 'assistant' | 'system'

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  createdAt: string
  suggestedRooms?: ChatbotSuggestedRoom[]
  action?: ChatbotAction
  state?: string
}

export type QuickReply = {
  id: string
  label: string
  message: string
}

export type ChatbotReply = {
  content: string
  quickReplies?: QuickReply[]
  usedAi?: boolean
  mode?: string
  state?: string
  intent?: string
  missingFields?: string[]
  context?: ChatbotAgentContext
  suggestedRooms?: ChatbotSuggestedRoom[]
  action?: ChatbotAction
}

export type ChatbotAgentContext = {
  conversationId?: string
  intent?: string
  checkInDate?: string
  checkOutDate?: string
  adults?: number
  children?: number
  bedrooms?: number
  beds?: number
  maxNightlyPrice?: number
  amenities?: string[]
  selectedRoomId?: number
}

export type ChatbotSuggestedRoom = {
  roomId: number
  roomName: string
  roomTypeName?: string
  pricePerNight?: number
  capacity?: number
  bedroomCount?: number
  bedCount?: number
  imageUrl?: string
  averageRating?: number
  approvedReviewCount?: number
  equipmentItems?: string[]
  reason?: string
  detailUrl?: string
  bookingUrl?: string
}

export type ChatbotAction = {
  type: string
  label: string
  href: string
  roomId?: number
}

export type ChatbotHistoryTurn = {
  role: 'user' | 'assistant'
  content: string
}

export type ChatbotSession = {
  context?: ChatbotAgentContext
  history?: ChatbotHistoryTurn[]
}
