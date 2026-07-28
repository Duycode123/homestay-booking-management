import 'server-only'
import { createHash } from 'node:crypto'

export type TravelNewsArticle = {
  slug: string
  title: string
  summary: string
  source: string
  publishedAt: string
  url: string | null
  imageUrl: string
  editorial: boolean
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

const EDITORIAL_TRAVEL_NEWS: TravelNewsArticle[] = [
  {
    slug: 'cam-nang-chon-homestay-phu-hop',
    title: 'Cách chọn homestay phù hợp cho một kỳ nghỉ thật sự thư thái',
    summary: 'Ưu tiên vị trí, mức độ riêng tư, sức chứa và những tiện nghi bạn thực sự sử dụng để chọn không gian vừa đủ, thay vì chỉ nhìn vào giá hoặc hình ảnh.',
    source: 'The Serene Villa',
    publishedAt: '2026-06-18T08:00:00+07:00',
    url: null,
    imageUrl: '/images/New1.jpg',
    editorial: true,
  },
  {
    slug: 'chuan-bi-cho-ky-nghi-cuoi-tuan',
    title: 'Danh sách chuẩn bị gọn nhẹ cho chuyến nghỉ dưỡng cuối tuần',
    summary: 'Một vài bước nhỏ trước khi khởi hành giúp bạn nhận phòng thuận lợi, mang đúng đồ cần thiết và dành nhiều thời gian hơn để tận hưởng kỳ nghỉ.',
    source: 'The Serene Villa',
    publishedAt: '2026-05-24T08:00:00+07:00',
    url: null,
    imageUrl: '/images/new2.jpg',
    editorial: true,
  },
  {
    slug: 'lich-trinh-nghi-duong-cham-hai-ngay',
    title: 'Gợi ý lịch trình nghỉ dưỡng chậm trong hai ngày một đêm',
    summary: 'Giữ lịch trình thoáng, dành khoảng trống cho thiên nhiên, bữa ăn và giấc ngủ trọn vẹn là cách đơn giản để một chuyến đi ngắn vẫn đủ sức tái tạo năng lượng.',
    source: 'The Serene Villa',
    publishedAt: '2026-04-12T08:00:00+07:00',
    url: null,
    imageUrl: '/images/new3.jpg',
    editorial: true,
  },
  {
    slug: 'kinh-nghiem-dat-phong-an-toan',
    title: 'Những điều nên kiểm tra trước khi xác nhận đặt phòng',
    summary: 'Đọc kỹ thời gian nhận trả phòng, chính sách hủy, tổng chi phí và kênh liên hệ chính thức giúp bạn chủ động hơn và tránh những phát sinh không cần thiết.',
    source: 'The Serene Villa',
    publishedAt: '2026-03-08T08:00:00+07:00',
    url: null,
    imageUrl: '/images/new4.jpg',
    editorial: true,
  },
  {
    slug: 'giu-khong-gian-luu-tru-ben-vung',
    title: 'Những thói quen nhỏ cho một kỳ lưu trú xanh và dễ chịu',
    summary: 'Tiết kiệm điện nước, phân loại rác và tôn trọng không gian chung là những lựa chọn nhỏ nhưng giúp trải nghiệm của bạn và những vị khách sau tốt hơn.',
    source: 'The Serene Villa',
    publishedAt: '2026-02-15T08:00:00+07:00',
    url: null,
    imageUrl: '/images/new5.jpg',
    editorial: true,
  },
]

let lastSuccessfulSyndicatedNews: TravelNewsArticle[] = []

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
        editorial: false,
      }
    })
    .filter((article) => article.title && article.url)
}

export async function getTravelNews(): Promise<TravelNewsArticle[]> {
  try {
    const response = await fetch(GOOGLE_NEWS_RSS_URL, {
      next: { revalidate: 1800 },
      headers: { 'user-agent': 'The-Serene-Villa-News/1.0' },
      signal: AbortSignal.timeout(5_000),
    })

    if (response.ok) {
      const syndicatedNews = parseRss(await response.text())
      if (syndicatedNews.length > 0) lastSuccessfulSyndicatedNews = syndicatedNews
    }
  } catch {
    // Keep the last known good feed; editorial articles below guarantee a useful page offline.
  }

  return [...lastSuccessfulSyndicatedNews, ...EDITORIAL_TRAVEL_NEWS]
}

export function formatNewsDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Mới cập nhật'
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}
