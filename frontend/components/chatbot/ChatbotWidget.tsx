'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CHATBOT_WELCOME, sendChatbotMessage } from '@/lib/chatbot/chatbot-service'
import type {
  ChatbotAction,
  ChatbotAgentContext,
  ChatbotSuggestedRoom,
  ChatMessage,
  QuickReply,
} from '@/lib/chatbot/types'

const CHATBOT_CONTEXT_KEY = 'the-serene-villa.chatbot-agent-context'

function createId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function formatMessageContent(content: string) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-on-surface">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return part.split('\n').map((line, lineIndex, arr) => (
      <span key={`${index}-${lineIndex}`}>
        {line}
        {lineIndex < arr.length - 1 ? <br /> : null}
      </span>
    ))
  })
}

function BotAvatar({ size = 'md', showStatus = false }: { size?: 'sm' | 'md'; showStatus?: boolean }) {
  const dim = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  return (
    <div className={`${dim} relative shrink-0`} aria-hidden>
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-greenDark to-brand-greenLight shadow-md ring-2 ring-white/90">
        <svg viewBox="0 0 24 24" className="h-[55%] w-[55%] text-white" fill="currentColor">
          <path d="M12 3a9 9 0 0 0-9 9v4a3 3 0 0 0 3 3h1.2a2.8 2.8 0 0 0 5.6 0H15a3 3 0 0 0 3-3v-4a9 9 0 0 0-9-9zm0 2a7 7 0 0 1 7 7v4a1 1 0 0 1-1 1h-1.1a4.8 4.8 0 0 1-9.8 0H6a1 1 0 0 1-1-1v-4a7 7 0 0 1 7-7zm-3.5 8.5a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm7 0a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5z" />
        </svg>
      </div>
      {showStatus ? (
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
      ) : null}
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5">
      <BotAvatar size="sm" />
      <div className="rounded-2xl rounded-bl-md border border-outline-variant/60 bg-white px-4 py-3 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-1.5" aria-label="HomeBot đang trả lời">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 animate-bounce rounded-full bg-brand-greenDark/70"
              style={{ animationDelay: `${i * 150}ms`, animationDuration: '0.9s' }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end pl-10">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-br from-brand-orange to-brand-orangeHover px-4 py-2.5 text-sm leading-relaxed text-white shadow-[0_8px_24px_rgba(178,132,85,0.35)]">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-end gap-2.5 pr-1">
      <BotAvatar size="sm" />
      <div className="min-w-0 max-w-[88%] space-y-2.5">
        <div className="rounded-2xl rounded-bl-md border border-outline-variant/50 bg-white/95 px-4 py-2.5 text-sm leading-relaxed text-on-surface shadow-[var(--shadow-card)] backdrop-blur-sm">
          {formatMessageContent(message.content)}
        </div>
        {message.suggestedRooms?.length ? <SuggestedRoomCards rooms={message.suggestedRooms} /> : null}
        {message.action ? <AgentActionButton action={message.action} /> : null}
      </div>
    </div>
  )
}

function formatNightlyPrice(value?: number) {
  if (value == null || !Number.isFinite(value)) return 'Liên hệ'
  return `${Math.round(value).toLocaleString('vi-VN')}đ/đêm`
}

function SuggestedRoomCards({ rooms }: { rooms: ChatbotSuggestedRoom[] }) {
  return (
    <div className="flex snap-x gap-2.5 overflow-x-auto pb-1 [scrollbar-width:thin]" aria-label="Phòng HomeBot gợi ý">
      {rooms.map((room) => (
        <article key={room.roomId} className="w-[225px] shrink-0 snap-start overflow-hidden rounded-2xl border border-[#ded3c5] bg-white shadow-sm">
          <a href={room.detailUrl ?? `/rooms/${room.roomId}`} className="block">
            <div className="relative h-24 overflow-hidden bg-[#e8e1d6]">
              {room.imageUrl ? (
                // The URL is managed by admin and can come from several approved CDNs.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={room.imageUrl} alt={`Ảnh ${room.roomName}`} loading="lazy" decoding="async" className="h-full w-full object-cover" />
              ) : null}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#09231c]/45 to-transparent" />
            </div>
            <div className="p-3">
              <p className="line-clamp-1 font-display text-sm font-bold text-secondary">{room.roomName}</p>
              <p className="mt-1 text-[11px] text-on-surface-variant">
                {room.capacity ? `${room.capacity} khách` : 'Sức chứa đang cập nhật'}
                {room.bedroomCount ? ` · ${room.bedroomCount} phòng ngủ` : ''}
                {room.bedCount ? ` · ${room.bedCount} giường` : ''}
              </p>
              <div className="mt-2 flex items-center justify-between gap-2 border-t border-[#eee6dc] pt-2">
                <span className="text-xs font-bold text-brand-orange">{formatNightlyPrice(room.pricePerNight)}</span>
                {room.averageRating ? <span className="text-[10px] font-semibold text-secondary">★ {room.averageRating.toFixed(1)}</span> : null}
              </div>
            </div>
          </a>
          <a href={room.bookingUrl ?? room.detailUrl ?? `/rooms/${room.roomId}`} className="mx-3 mb-3 flex h-9 items-center justify-center rounded-full bg-secondary px-3 text-xs font-bold text-white transition hover:bg-brand-orange">
            Đặt phòng
          </a>
        </article>
      ))}
    </div>
  )
}

function AgentActionButton({ action }: { action: ChatbotAction }) {
  return (
    <a href={action.href} className="flex min-h-10 w-full items-center justify-center rounded-full bg-secondary px-4 text-xs font-bold text-white shadow-[0_8px_20px_rgba(23,58,49,.18)] transition hover:-translate-y-0.5 hover:bg-brand-orange">
      {action.label}
    </a>
  )
}

function QuickReplyChips({
  replies,
  disabled,
  onSelect,
}: {
  replies: QuickReply[]
  disabled: boolean
  onSelect: (reply: QuickReply) => void
}) {
  if (replies.length === 0) return null

  return (
    <div className="flex max-h-20 flex-wrap gap-2 overflow-y-auto px-1 pb-1 pt-1">
      {replies.map((reply) => (
        <button
          key={reply.id}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(reply)}
          className="rounded-full border border-brand-orange/25 bg-brand-orange/8 px-3.5 py-1.5 text-xs font-medium text-brand-orange transition-all hover:border-brand-orange/50 hover:bg-brand-orange/15 active:scale-[0.97] disabled:opacity-50"
        >
          {reply.label}
        </button>
      ))}
    </div>
  )
}

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>(CHATBOT_WELCOME.quickReplies ?? [])
  const [typing, setTyping] = useState(false)
  const [welcomed, setWelcomed] = useState(false)
  const [agentContext, setAgentContext] = useState<ChatbotAgentContext>()
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const hotlineNumber = process.env.NEXT_PUBLIC_HOTLINE_NUMBER?.trim() ?? ''
  const hotlineHref = hotlineNumber ? `tel:${hotlineNumber.replace(/[^+\d]/g, '')}` : '/support'

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(CHATBOT_CONTEXT_KEY)
      if (stored) setAgentContext(JSON.parse(stored) as ChatbotAgentContext)
    } catch {
      window.sessionStorage.removeItem(CHATBOT_CONTEXT_KEY)
    }
  }, [])

  useEffect(() => {
    if (agentContext) window.sessionStorage.setItem(CHATBOT_CONTEXT_KEY, JSON.stringify(agentContext))
  }, [agentContext])

  const scrollToBottom = useCallback(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, typing, open, scrollToBottom])

  useEffect(() => {
    if (open && !welcomed) {
      setWelcomed(true)
      setMessages([
        {
          id: createId(),
          role: 'assistant',
          content: CHATBOT_WELCOME.content,
          createdAt: new Date().toISOString(),
        },
      ])
      setQuickReplies(CHATBOT_WELCOME.quickReplies ?? [])
    }
  }, [open, welcomed])

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 280)
      return () => window.clearTimeout(t)
    }
  }, [open])

  const submitMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || typing) return

      setQuickReplies([])
      setInput('')
      setMessages((prev) => [
        ...prev,
        { id: createId(), role: 'user', content: trimmed, createdAt: new Date().toISOString() },
      ])
      setTyping(true)

      try {
        const history = messages.slice(-8).map((message) => ({
          role: message.role === 'assistant' ? 'assistant' as const : 'user' as const,
          content: message.content,
        }))
        const reply = await sendChatbotMessage(trimmed, { context: agentContext, history })
        setMessages((prev) => [
          ...prev,
          {
            id: createId(),
            role: 'assistant',
            content: reply.content,
            createdAt: new Date().toISOString(),
            suggestedRooms: reply.suggestedRooms,
            action: reply.action,
            state: reply.state,
          },
        ])
        if (reply.context) setAgentContext(reply.context)
        setQuickReplies(reply.quickReplies ?? [])
      } finally {
        setTyping(false)
      }
    },
    [agentContext, messages, typing],
  )

  const resetConversation = () => {
    window.sessionStorage.removeItem(CHATBOT_CONTEXT_KEY)
    setAgentContext(undefined)
    setMessages([{ id: createId(), role: 'assistant', content: CHATBOT_WELCOME.content, createdAt: new Date().toISOString() }])
    setQuickReplies(CHATBOT_WELCOME.quickReplies ?? [])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void submitMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void submitMessage(input)
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] sm:bottom-6 sm:right-6">
      <a
        href={hotlineHref}
        className="pointer-events-auto group absolute bottom-[calc(100%+0.65rem)] right-0 z-0 flex h-12 w-12 items-center justify-center rounded-full border border-white/70 bg-gradient-to-br from-brand-greenLight to-brand-greenDark text-white shadow-[0_10px_30px_rgba(23,58,49,0.32)] transition-all hover:scale-105 hover:shadow-[0_14px_36px_rgba(23,58,49,0.38)] active:scale-95 sm:h-14 sm:w-14"
        aria-label={hotlineNumber ? `Gọi hotline ${hotlineNumber}` : 'Mở trung tâm hỗ trợ'}
        title={hotlineNumber ? `Hotline ${hotlineNumber}` : 'Hotline hỗ trợ'}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
          <path d="M8.1 3.8 5.8 5.2c-1 .6-1.4 1.8-1 2.9 2 5.2 5.9 9.1 11.1 11.1 1.1.4 2.3 0 2.9-1l1.4-2.3-4.5-2-1.2 1.5c-2.7-1.3-4.6-3.2-5.9-5.9l1.5-1.2-2-4.5Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14.5 5.2a5 5 0 0 1 4.3 4.3M14.8 2a8 8 0 0 1 7.2 7.2" strokeLinecap="round" />
        </svg>
        <span className="pointer-events-none absolute right-full mr-2 hidden whitespace-nowrap rounded-lg bg-secondary px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-lg group-hover:block">
          {hotlineNumber || 'Hotline hỗ trợ'}
        </span>
      </a>

      {/* Panel — absolute above launcher so height never pushes into browser chrome */}
      <div
        role="dialog"
        aria-label="HomeBot trợ lý ảo"
        aria-hidden={!open}
        className={[
          'pointer-events-auto absolute bottom-[calc(100%+0.65rem)] right-0 z-20 flex w-[min(100vw-2rem,400px)] flex-col overflow-hidden rounded-[28px] border border-white/60 bg-white/90 shadow-[var(--shadow-elevated)] backdrop-blur-xl transition-all duration-300 ease-out',
          // Fixed height within viewport: leave room for launcher + safe margins
          'h-[min(560px,calc(100dvh-7.5rem))] max-h-[calc(100dvh-7.5rem)]',
          open
            ? 'translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-3 scale-95 opacity-0',
        ].join(' ')}
      >
        {/* Header */}
        <header className="relative shrink-0 bg-gradient-to-br from-brand-greenDark via-[#1e4d3a] to-brand-greenLight px-4 py-3.5 text-white sm:px-5 sm:py-4">
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-t-[28px]">
            <div className="absolute -right-6 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-10 left-4 h-24 w-24 rounded-full bg-brand-orange/20 blur-2xl" />
          </div>
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <BotAvatar showStatus />
              <div className="min-w-0">
                <p className="font-display text-base font-bold tracking-tight">HomeBot</p>
                <p className="flex items-center gap-1.5 truncate text-xs text-white/85">
                  <span className="inline-block h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-emerald-300" />
                  Trực tuyến · Trợ lý The Serene Villa
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={resetConversation} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25" aria-label="Bắt đầu cuộc trò chuyện mới" title="Làm mới hội thoại">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 11a8 8 0 1 0-2.35 5.65M20 4v7h-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
                aria-label="Đóng chat"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Messages — only this region scrolls */}
        <div
          ref={listRef}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-gradient-to-b from-brand-bgGray/50 to-white px-4 py-4"
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {typing ? <TypingIndicator /> : null}
        </div>

        {/* Quick replies + input */}
        <div className="shrink-0 border-t border-outline-variant/40 bg-white/95 px-4 pb-3 pt-3 backdrop-blur-sm">
          <QuickReplyChips
            replies={quickReplies}
            disabled={typing}
            onSelect={(reply) => void submitMessage(reply.message)}
          />

          <form onSubmit={handleSubmit} className="mt-2 flex items-end gap-2">
            <div className="relative min-w-0 flex-1">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={typing}
                placeholder="Nhập câu hỏi của bạn..."
                className="max-h-28 w-full resize-none rounded-2xl border border-outline-variant bg-brand-bgGray/60 px-4 py-3 pr-3 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:border-brand-orange focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/20 disabled:opacity-60"
                aria-label="Tin nhắn"
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || typing}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-orange to-brand-orangeHover text-white shadow-[0_6px_20px_rgba(178,132,85,0.4)] transition-all hover:brightness-105 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              aria-label="Gửi tin nhắn"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 translate-x-0.5" fill="currentColor">
                <path d="M3.4 20.4l17.45-7.6c1.04-.45 1.04-1.87 0-2.32L3.4 2.88c-1.08-.47-2.15.64-1.58 1.68L5.3 11.25 1.82 18.72c-.57 1.04.5 2.15 1.58 1.68z" />
              </svg>
            </button>
          </form>
          <p className="mt-2 text-center text-[10px] text-on-surface-variant/60">
            HomeBot hỗ trợ tra cứu phòng · Yêu cầu quan trọng được chuyển tới đội ngũ vận hành
          </p>
        </div>
      </div>

      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          'pointer-events-auto group relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-orange via-brand-orange to-brand-orangeHover text-white shadow-[0_10px_30px_rgba(178,132,85,0.42)] transition-all duration-300 hover:scale-105 hover:shadow-[0_14px_38px_rgba(178,132,85,0.48)] active:scale-95 sm:h-14 sm:w-14',
          open ? 'rotate-0' : '',
        ].join(' ')}
        aria-label={open ? 'Đóng HomeBot' : 'Mở HomeBot'}
        aria-expanded={open}
      >
        <span
          aria-hidden
          className={[
            'absolute inset-0 rounded-full bg-brand-orange/40 transition-opacity duration-300',
            open ? 'animate-none opacity-0' : 'animate-ping opacity-75',
          ].join(' ')}
          style={{ animationDuration: '2.5s' }}
        />
        <span
          aria-hidden
          className="absolute -inset-1 rounded-full bg-gradient-to-br from-brand-orange/30 to-transparent opacity-0 blur-md transition-opacity group-hover:opacity-100"
        />
        {open ? (
          <svg viewBox="0 0 24 24" className="relative h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="relative h-6 w-6 sm:h-7 sm:w-7" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z" />
            <circle cx="8" cy="10" r="1.2" />
            <circle cx="12" cy="10" r="1.2" />
            <circle cx="16" cy="10" r="1.2" />
          </svg>
        )}
        {!open ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-greenDark text-[9px] font-bold text-white ring-2 ring-white">
            1
          </span>
        ) : null}
      </button>
    </div>
  )
}
