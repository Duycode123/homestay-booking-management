'use client'

import { usePathname } from 'next/navigation'
import ChatbotWidget from './ChatbotWidget'
import { shouldShowChatbot } from '@/lib/chatbot/chatbot-routes'

export default function ChatbotHost() {
  const pathname = usePathname()

  if (!shouldShowChatbot(pathname)) {
    return null
  }

  return <ChatbotWidget />
}
