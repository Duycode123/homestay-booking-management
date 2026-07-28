import type { MetadataRoute } from 'next'
import { getPublicRoomsForSeo } from '@/lib/public/room-seo'
import { getTravelNews } from '@/lib/travel-news'

export const revalidate = 3600

const publicRoutes = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/rooms', changeFrequency: 'daily', priority: 0.9 },
  { path: '/amenities', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/news', changeFrequency: 'daily', priority: 0.7 },
  { path: '/process', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/support', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/booking-policy', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/cancellation-policy', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
] as const

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
  const [rooms, articles] = await Promise.all([
    getPublicRoomsForSeo(),
    getTravelNews(),
  ])

  const staticRoutes: MetadataRoute.Sitemap = publicRoutes.map(({ path, changeFrequency, priority }) => ({
    url: new URL(path, siteUrl).toString(),
    changeFrequency,
    priority,
  }))

  const roomRoutes: MetadataRoute.Sitemap = rooms
    .filter((room) => Number.isInteger(room.id) && room.id > 0)
    .map((room) => ({
      url: new URL(`/rooms/${room.id}`, siteUrl).toString(),
      changeFrequency: 'daily',
      priority: 0.8,
      images: [room.imageUrl, ...(room.imageUrls ?? [])].filter((image): image is string => Boolean(image)),
    }))

  const newsRoutes: MetadataRoute.Sitemap = articles.map((article) => {
    const publishedAt = new Date(article.publishedAt)

    return {
      url: new URL(`/news/${article.slug}`, siteUrl).toString(),
      lastModified: Number.isNaN(publishedAt.getTime()) ? undefined : publishedAt,
      changeFrequency: 'weekly',
      priority: 0.6,
      images: article.imageUrl ? [new URL(article.imageUrl, siteUrl).toString()] : undefined,
    }
  })

  return [...staticRoutes, ...roomRoutes, ...newsRoutes]
}
