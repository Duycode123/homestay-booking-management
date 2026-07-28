import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createPublicPageMetadata } from '@/lib/seo'
import { formatNewsDate, getTravelNews } from '@/lib/travel-news'

export const revalidate = 1800

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const articles = await getTravelNews()
  const article = articles.find((item) => item.slug === slug)

  if (!article) {
    return {
      title: 'Không tìm thấy bài viết',
      alternates: { canonical: null },
      robots: { index: false, follow: true },
    }
  }

  return createPublicPageMetadata({
    title: article.title,
    description: article.summary,
    path: `/news/${article.slug}`,
    image: article.imageUrl,
    imageAlt: `Ảnh minh họa cho ${article.title}`,
  })
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const articles = await getTravelNews()
  const article = articles.find((item) => item.slug === slug)
  if (!article) notFound()

  const related = articles.filter((item) => item.slug !== article.slug).slice(0, 4)

  return (
    <main id="main-content" className="bg-[#f7f3ec] text-on-surface">
      <section className="border-b border-[#e2d8c9] bg-[#234D42] text-white">
        <div className="mx-auto max-w-[1120px] px-5 py-12 sm:px-8 sm:py-16">
          <Link href="/news" className="text-xs font-semibold uppercase tracking-[0.15em] text-primary-fixed transition-opacity hover:opacity-75">← Trở về Tin tức</Link>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-[#f2d5a8]">{article.source}</p>
          <h1 className="font-editorial mt-4 max-w-4xl text-4xl font-semibold leading-[1.08] sm:text-6xl">{article.title}</h1>
          <p className="mt-5 text-sm text-white/68">Cập nhật {formatNewsDate(article.publishedAt)}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1120px] gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="overflow-hidden rounded-[24px] border border-[#dfd5c6] bg-white shadow-[0_18px_48px_rgba(40,48,40,0.08)]">
          <Image
            src={article.imageUrl}
            alt={`Ảnh minh họa cho ${article.title}`}
            width={1200}
            height={800}
            priority
            sizes="(min-width: 1024px) 800px, 100vw"
            className="max-h-[520px] w-full object-cover"
          />
          <div className="p-6 sm:p-10">
            <p className="font-editorial text-2xl font-semibold leading-[1.45] text-secondary sm:text-3xl">{article.summary}</p>
            {article.editorial ? (
              <div className="mt-8 border-l-2 border-brand-orange bg-[#fbf7f0] px-5 py-4 text-sm leading-7 text-on-surface-variant">Nội dung được biên soạn bởi The Serene Villa nhằm giúp bạn chuẩn bị một kỳ nghỉ chủ động, an toàn và thư thái hơn.</div>
            ) : (
              <>
                <div className="mt-8 border-l-2 border-brand-orange bg-[#fbf7f0] px-5 py-4 text-sm leading-7 text-on-surface-variant">The Serene Villa chỉ tổng hợp thông tin công khai để truyền cảm hứng cho hành trình của bạn. Nội dung đầy đủ thuộc về đơn vị xuất bản gốc.</div>
                {article.url ? <a href={article.url} target="_blank" rel="noreferrer" className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-secondary px-6 font-display text-sm font-semibold text-white transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-secondary-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-secondary motion-reduce:transform-none">Đọc bài viết gốc <span className="ml-2" aria-hidden>↗</span></a> : null}
              </>
            )}
          </div>
        </article>

        <aside className="self-start rounded-[20px] border border-[#dfd5c6] bg-white p-5 lg:sticky lg:top-28">
          <p className="eyebrow text-brand-orange">Đọc thêm</p>
          <div className="mt-4 divide-y divide-[#e5dccf]">
            {related.map((item) => <Link key={item.slug} href={`/news/${item.slug}`} className="group block py-4 first:pt-0"><p className="line-clamp-3 font-display text-sm font-bold leading-6 text-secondary transition-colors group-hover:text-brand-orange">{item.title}</p><p className="mt-2 text-xs text-on-surface-variant">{item.source} · {formatNewsDate(item.publishedAt)}</p></Link>)}
          </div>
        </aside>
      </section>
    </main>
  )
}
