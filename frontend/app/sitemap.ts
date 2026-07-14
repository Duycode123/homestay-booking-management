import type { MetadataRoute } from 'next'

const publicRoutes = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/rooms', changeFrequency: 'daily', priority: 0.9 },
  { path: '/amenities', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/process', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/support', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/booking-policy', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/cancellation-policy', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
] as const

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')

  return publicRoutes.map(({ path, changeFrequency, priority }) => ({
    url: new URL(path, siteUrl).toString(),
    changeFrequency,
    priority,
  }))
}
