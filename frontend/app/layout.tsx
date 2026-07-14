import type { Metadata, Viewport } from 'next'
import AccessibilityClientProvider from '@/components/accessibility/AccessibilityClientProvider'
import ChatbotHost from '@/components/chatbot/ChatbotHost'
import { AuthProvider } from '@/contexts/AuthContext'
import { FavoritesProvider } from '@/contexts/FavoritesContext'
import './globals.css'

const siteName = 'The Serene Villa'
const siteDescription =
  'Khám phá và đặt phòng homestay trực tuyến với thông tin tiện nghi, giá và lịch trống minh bạch.'
const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: siteName,
  title: {
    default: `${siteName} | Không gian lưu trú đáng nhớ`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    'homestay',
    'đặt phòng homestay',
    'booking homestay',
    'lưu trú',
    'du lịch Việt Nam',
  ],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  category: 'travel',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: '/',
    siteName,
    title: `${siteName} | Không gian lưu trú đáng nhớ`,
    description: siteDescription,
    images: [
      {
        url: '/images/homestay-social.webp',
        width: 1200,
        height: 630,
        alt: 'Không gian homestay sang trọng tại The Serene Villa',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} | Không gian lưu trú đáng nhớ`,
    description: siteDescription,
    images: ['/images/homestay-social.webp'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  manifest: '/manifest.webmanifest',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#173A31',
  colorScheme: 'light',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="font-sans antialiased">
        <AccessibilityClientProvider />
        <AuthProvider>
          <FavoritesProvider>
            {children}
            <ChatbotHost />
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
