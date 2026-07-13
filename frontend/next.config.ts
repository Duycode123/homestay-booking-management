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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  turbopack: {
    root: projectRoot,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendApiUrl}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
