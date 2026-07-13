export type ChatRole = 'user' | 'assistant' | 'system'

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  createdAt: string
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
}
