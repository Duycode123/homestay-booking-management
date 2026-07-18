import 'server-only'
import { createHash } from 'node:crypto'

export type TravelNewsArticle = {
  slug: string
  title: string
  summary: string
  source: string
  publishedAt: string
  url: string
  imageUrl: string
}

const GOOGLE_NEWS_RSS_URL =
  'https://news.google.com/rss/search?q=du+l%E1%BB%8Bch+ngh%E1%BB%89+d%C6%B0%E1%BB%A1ng+Vi%E1%BB%87t+Nam+OR+homestay+H%C3%A0+N%E1%BB%99i&hl=vi&gl=VN&ceid=VN:vi'

// Đổi một dòng này khi bạn muốn chọn ảnh banner riêng cho trang Tin tức.
export const NEWS_HERO_IMAGE = '/images/New6.jpg'

// Google News RSS không cung cấp ảnh đại diện ổn định cho mọi bài viết. Các ảnh
// nội bộ này giữ trải nghiệm nhất quán, còn tiêu đề, ngày đăng và liên kết vẫn
// được lấy trực tiếp từ nguồn Google News.
const NEWS_CARD_IMAGES = [
  '/images/New1.jpg',
  '/images/new2.jpg',
  '/images/new3.jpg',
  '/images/new4.jpg',
  '/images/new5.jpg',
]

function decodeEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
}

function plainText(value: string) {
  return decodeEntities(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function readTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return match ? plainText(match[1]) : ''
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function cleanTitle(title: string, source: string) {
  const sourceAtEnd = new RegExp(`\\s[-–—]\\s${escapeRegExp(source)}$`, 'i')
  return title.replace(sourceAtEnd, '').trim()
}

function createSummary(source: string) {
  return `Bản tin được The Serene Villa tuyển chọn từ ${source}. Mở bài viết gốc để xem thông tin đầy đủ và bối cảnh liên quan.`
}

function makeSlug(url: string) {
  return createHash('sha256').update(url).digest('hex').slice(0, 16)
}

function parseRss(xml: string): TravelNewsArticle[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    .slice(0, 18)
    .map((match, index) => {
      const item = match[1]
      const url = readTag(item, 'link')
      const publishedAt = readTag(item, 'pubDate')
      const source = readTag(item, 'source') || 'Google News'
      const title = cleanTitle(readTag(item, 'title'), source)

      return {
        slug: makeSlug(url),
        title,
        summary: createSummary(source),
        source,
        publishedAt,
        url,
        imageUrl: NEWS_CARD_IMAGES[index % NEWS_CARD_IMAGES.length],
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
