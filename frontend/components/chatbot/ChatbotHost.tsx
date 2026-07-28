'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { shouldShowChatbot } from '@/lib/chatbot/chatbot-routes'

const ChatbotWidget = dynamic(() => import('./ChatbotWidget'), {
  ssr: false,
  loading: () => null,
})

export default function ChatbotHost() {
  const pathname = usePathname()

  if (!shouldShowChatbot(pathname)) {
    return null
  }

  return <ChatbotWidget />
}
