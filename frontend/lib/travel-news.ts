import 'server-only'
import { createHash } from 'node:crypto'

export type TravelNewsArticle = {
  slug: string
  title: string
  summary: string
  source: string
  publishedAt: string
  url: string
  imageUrl?: string
}

const GOOGLE_NEWS_RSS_URL =
  'https://news.google.com/rss/search?q=du+l%E1%BB%8Bch+ngh%E1%BB%89+d%C6%B0%E1%BB%A1ng+Vi%E1%BB%87t+Nam+OR+homestay+H%C3%A0+N%E1%BB%99i&hl=vi&gl=VN&ceid=VN:vi'

function decodeHtml(value: string) {
  return value
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function readTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return match ? decodeHtml(match[1]) : ''
}

function readImage(xml: string) {
  const description = xml.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1] ?? ''
  const fromDescription = description.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1]
  return fromDescription ? decodeHtml(fromDescription) : undefined
}

function makeSlug(url: string) {
  return createHash('sha256').update(url).digest('hex').slice(0, 16)
}

function parseRss(xml: string): TravelNewsArticle[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    .slice(0, 18)
    .map((match) => {
      const item = match[1]
      const title = readTag(item, 'title')
      const url = readTag(item, 'link')
      const publishedAt = readTag(item, 'pubDate')
      const source = readTag(item, 'source') || 'Google News'
      const summary = readTag(item, 'description') || 'Xem bài viết gốc để cập nhật thông tin đầy đủ.'

      return {
        slug: makeSlug(url),
        title,
        summary,
        source,
        publishedAt,
        url,
        imageUrl: readImage(item),
      }
    })
    .filter((article) => article.title && article.url)
}

export async function getTravelNews(): Promise<TravelNewsArticle[]> {
  try {
    const response = await fetch(GOOGLE_NEWS_RSS_URL, {
      next: { revalidate: 1800 },
      headers: { 'user-agent': 'The-Serene-Villa-News/1.0' },
    })

    if (!response.ok) return []
    return parseRss(await response.text())
  } catch {
    return []
  }
}

export function formatNewsDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Mới cập nhật'
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}
