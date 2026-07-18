import type { NextConfig } from 'next'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = dirname(fileURLToPath(import.meta.url))
const backendApiUrl = process.env.BACKEND_API_URL || 'http://localhost:8080'

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'bannister-phosphate-marine.ngrok-free.dev',
    'emcee-alumni-customer.ngrok-free.dev',
  ],
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 90, 100],
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
  async rewrites() {
    return [
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
