import type { NextConfig } from 'next'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = dirname(fileURLToPath(import.meta.url))
const backendApiUrl = process.env.BACKEND_API_URL || 'http://localhost:8080'
const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const isDevelopment = process.env.NODE_ENV !== 'production'
const shouldUpgradeInsecureRequests =
  process.env.NODE_ENV === 'production' && publicSiteUrl.startsWith('https://')
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ''}`,
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob:",
  `connect-src 'self' https://cdn.justfly.vn https://res.cloudinary.com${isDevelopment ? ' ws: wss:' : ''}`,
  "frame-src 'none'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  ...(shouldUpgradeInsecureRequests ? ['upgrade-insecure-requests'] : []),
].join('; ')
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: contentSecurityPolicy,
  },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '0' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
  { key: 'Origin-Agent-Cluster', value: '?1' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
]

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  allowedDevOrigins: [
    '127.0.0.1',
    'bannister-phosphate-marine.ngrok-free.dev',
    'emcee-alumni-customer.ngrok-free.dev',
  ],
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 90, 94, 95, 100],
    minimumCacheTTL: 86400,
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1440, 1920],
    imageSizes: [48, 64, 96, 128, 160, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.justfly.vn',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.justfly.vn',
        pathname: '/**/media/**',
      },
    ],
  },
  turbopack: {
    root: projectRoot,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/:locale(en|vi)',
        destination: '/',
      },
      {
        source: '/:locale(en|vi)/:path*',
        destination: '/:path*',
      },
      {
        source: '/oauth2/:path*',
        destination: `${backendApiUrl}/oauth2/:path*`,
      },
      {
        source: '/login/oauth2/:path*',
        destination: `${backendApiUrl}/login/oauth2/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${backendApiUrl}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
