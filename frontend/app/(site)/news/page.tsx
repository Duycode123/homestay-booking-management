import Link from 'next/link'
import { createPublicPageMetadata } from '@/lib/seo'
import { formatNewsDate, getTravelNews } from '@/lib/travel-news'

export const dynamic = 'force-dynamic'

export const metadata = createPublicPageMetadata({
  title: 'Tin tức & cảm hứng du lịch',
  description: 'Các tin tức và cảm hứng du lịch, nghỉ dưỡng được The Serene Villa tổng hợp từ nguồn báo công khai.',
  path: '/news',
})

function ArticleImage({ src, alt, large = false }: { src?: string; alt: string; large?: boolean }) {
  if (!src) {
    return (
      <div className={`flex items-end bg-[#d9d0c2] p-5 ${large ? 'min-h-[300px] sm:min-h-[420px]' : 'min-h-[190px]'}`}>
        <span className="font-editorial text-2xl font-semibold text-secondary/70">The Serene Journal</span>
      </div>
    )
  }

  return <img src={src} alt={alt} className={`h-full w-full object-cover ${large ? 'min-h-[300px] sm:min-h-[420px]' : 'min-h-[190px]'}`} loading={large ? 'eager' : 'lazy'} referrerPolicy="no-referrer" />
}

export default async function NewsPage() {
  const articles = await getTravelNews()
  const featured = articles[0]
  const rest = articles.slice(1)

  return (
    <main id="main-content" className="bg-[#f7f3ec] text-on-surface">
      <section className="border-b border-[#e2d8c9] bg-[#143c32] text-white">
        <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-20">
          <p className="eyebrow text-primary-fixed">The Serene Journal</p>
          <h1 className="font-editorial mt-4 max-w-3xl text-5xl font-semibold leading-[1.04] sm:text-6xl">Tin tức &amp; cảm hứng cho những hành trình chậm lại.</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/72">Tổng hợp các câu chuyện du lịch và nghỉ dưỡng từ những nguồn báo công khai, để bạn có thêm cảm hứng trước kỳ lưu trú tiếp theo.</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 sm:py-16">
        {featured ? (
          <Link href={`/news/${featured.slug}`} className="group grid overflow-hidden rounded-[26px] border border-[#dfd5c6] bg-white shadow-[0_18px_48px_rgba(40,48,40,0.08)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_56px_rgba(40,48,40,0.12)] motion-reduce:transform-none lg:grid-cols-[1.08fr_.92fr]">
            <div className="overflow-hidden"><ArticleImage src={featured.imageUrl} alt="" large /></div>
            <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-orange">Góc cảm hứng</p>
              <h2 className="font-editorial mt-4 text-3xl font-semibold leading-tight text-secondary sm:text-4xl">{featured.title}</h2>
              <p className="mt-5 line-clamp-4 text-sm leading-7 text-on-surface-variant sm:text-base">{featured.summary}</p>
              <div className="mt-8 flex items-center gap-3 text-xs font-semibold text-secondary/65"><span>{featured.source}</span><span className="h-1 w-1 rounded-full bg-brand-orange" /><span>{formatNewsDate(featured.publishedAt)}</span></div>
              <span className="mt-7 inline-flex items-center gap-2 font-display text-sm font-semibold text-secondary">Đọc tóm lược <span aria-hidden>→</span></span>
            </div>
          </Link>
        ) : (
          <div className="rounded-[26px] border border-dashed border-[#cdbfae] bg-white px-6 py-16 text-center">
            <h2 className="font-editorial text-3xl font-semibold text-secondary">Tin tức đang được cập nhật</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-on-surface-variant">Nguồn Google News hiện chưa phản hồi. Bạn có thể quay lại sau để xem các bài viết mới nhất.</p>
          </div>
        )}

        {rest.length > 0 ? (
          <div className="mt-14">
            <div className="flex items-end justify-between gap-6 border-b border-[#dfd5c6] pb-5">
              <div><p className="eyebrow text-brand-orange">Cập nhật mới</p><h2 className="font-editorial mt-2 text-3xl font-semibold text-secondary">Chọn một hành trình để bắt đầu.</h2></div>
              <p className="hidden max-w-xs text-right text-xs leading-5 text-on-surface-variant sm:block">Mỗi bài có đường dẫn đến nguồn gốc để bạn đọc toàn bộ nội dung.</p>
            </div>
            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((article) => (
                <Link key={article.slug} href={`/news/${article.slug}`} className="group overflow-hidden rounded-[20px] border border-[#dfd5c6] bg-white transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-[#c9a276] hover:shadow-[0_18px_42px_rgba(40,48,40,0.1)] motion-reduce:transform-none">
                  <div className="overflow-hidden"><ArticleImage src={article.imageUrl} alt="" /></div>
                  <div className="p-5 sm:p-6"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-orange">{article.source}</p><h3 className="font-editorial mt-3 line-clamp-3 text-2xl font-semibold leading-tight text-secondary">{article.title}</h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-on-surface-variant">{article.summary}</p><p className="mt-5 text-xs font-medium text-secondary/60">{formatNewsDate(article.publishedAt)}</p></div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  )
}
