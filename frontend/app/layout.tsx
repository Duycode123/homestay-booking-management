import type { Metadata } from 'next'
import AccessibilityClientProvider from '@/components/accessibility/AccessibilityClientProvider'
import ChatbotHost from '@/components/chatbot/ChatbotHost'
import { AuthProvider } from '@/contexts/AuthContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'Homestay Booking',
  description: 'Đặt phòng homestay trực tuyến dễ dàng',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="font-sans antialiased">
        <AccessibilityClientProvider />
        <AuthProvider>
          {children}
          <ChatbotHost />
        </AuthProvider>
      </body>
    </html>
  )
}
