import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import AccessibilityClientProvider from '@/components/accessibility/AccessibilityClientProvider'
import ChatbotHost from '@/components/chatbot/ChatbotHost'
import { LocaleProvider } from '@/components/i18n/LocaleProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import { FavoritesProvider } from '@/contexts/FavoritesContext'
import { defaultLocale, isLocale, localeHeaderName, type Locale } from '@/i18n/config'
import './globals.css'

const siteName = 'The Serene Villa'
const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')

const metadataByLocale: Record<Locale, { title: string; description: string; keywords: string[]; imageAlt: string }> = {
  vi: {
    title: 'Không gian lưu trú đáng nhớ',
    description: 'Khám phá và đặt phòng homestay trực tuyến với thông tin tiện nghi, giá và lịch trống minh bạch.',
    keywords: ['homestay', 'đặt phòng homestay', 'booking homestay', 'lưu trú', 'du lịch Việt Nam'],
    imageAlt: 'Không gian homestay sang trọng tại The Serene Villa',
  },
  en: {
    title: 'A memorable place to stay',
    description: 'Discover and book homestay rooms with transparent availability, amenities and pricing.',
    keywords: ['homestay', 'homestay booking', 'boutique stay', 'Vietnam travel'],
    imageAlt: 'An elegant homestay stay at The Serene Villa',
  },
}

function localeFromHeaders(headerList: Headers): Locale {
  const requestedLocale = headerList.get(localeHeaderName)
  return isLocale(requestedLocale) ? requestedLocale : defaultLocale
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = localeFromHeaders(await headers())
  const content = metadataByLocale[locale]
  const localeCode = locale === 'vi' ? 'vi_VN' : 'en_US'

  return {
    metadataBase: siteUrl,
    applicationName: siteName,
    title: {
      default: `${siteName} | ${content.title}`,
      template: `%s | ${siteName}`,
    },
    description: content.description,
    keywords: content.keywords,
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    category: 'travel',
    alternates: {
      canonical: locale === 'vi' ? '/vi' : '/en',
      languages: { 'vi-VN': '/vi', 'en-US': '/en' },
    },
    openGraph: {
      type: 'website',
      locale: localeCode,
      url: locale === 'vi' ? '/vi' : '/en',
      siteName,
      title: `${siteName} | ${content.title}`,
      description: content.description,
      images: [{ url: '/images/homestay-social.webp', width: 1200, height: 630, alt: content.imageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${siteName} | ${content.title}`,
      description: content.description,
      images: ['/images/homestay-social.webp'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
    },
    icons: { icon: '/serene-favicon.svg', shortcut: '/serene-favicon.svg', apple: '/serene-favicon.svg' },
    manifest: '/manifest.webmanifest',
    formatDetection: { email: false, address: false, telephone: false },
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#173A31',
  colorScheme: 'light',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = localeFromHeaders(await headers())

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.justfly.vn" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased">
        <LocaleProvider initialLocale={locale}>
          <AccessibilityClientProvider />
          <AuthProvider>
            <FavoritesProvider>
              {children}
              <ChatbotHost />
            </FavoritesProvider>
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  )
}
