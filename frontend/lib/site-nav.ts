export type SiteNavItem = {
  label: string
  href: string
}

/** Header nav — public discovery and service information. */
export const publicNavItems: SiteNavItem[] = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Phòng homestay', href: '/rooms' },
  { label: 'Tiện nghi', href: '/amenities' },
  { label: 'Về chúng tôi', href: '/about' },
  { label: 'Tin tức', href: '/news' },
  { label: 'Hỗ trợ', href: '/support' },
]

/** Footer explore — includes brand story */
export const footerExploreLinks: SiteNavItem[] = [
  { label: 'Phòng homestay', href: '/rooms' },
  { label: 'Tiện nghi', href: '/amenities' },
  { label: 'Tin tức', href: '/news' },
  { label: 'Về chúng tôi', href: '/about' },
]

export const footerSupportLinks: SiteNavItem[] = [
  { label: 'Trung tâm hỗ trợ', href: '/support' },
  { label: 'Chính sách đặt phòng', href: '/booking-policy' },
  { label: 'Chính sách hủy lịch', href: '/cancellation-policy' },
]

export const footerLegalLinks: SiteNavItem[] = [
  { label: 'Điều khoản sử dụng', href: '/terms' },
  { label: 'Chính sách bảo mật', href: '/privacy' },
]

/** Same-page anchors for homepage header (smooth scroll without path prefix) */
export function homepageNavItems(): SiteNavItem[] {
  return publicNavItems.map((item) =>
    item.href.startsWith('/#') ? { ...item, href: item.href.slice(1) } : item,
  )
}

export const HOMEPAGE_ANCHOR_SECTION_IDS = ['process'] as const
export type HomepageAnchorSectionId = (typeof HOMEPAGE_ANCHOR_SECTION_IDS)[number]

export const HEADER_SCROLL_OFFSET_PX = 80

/** When already on the target page, nav should scroll to top instead of reloading. */
export function shouldScrollToTop(pathname: string, href: string) {
  const targetPath = href.split('?')[0]?.split('#')[0] ?? href
  return Boolean(targetPath && pathname === targetPath)
}

export function scrollToPageTop(behavior: ScrollBehavior = 'smooth') {
  window.scrollTo({ top: 0, behavior })
}

/** Clear homepage hash/section and scroll to the very top. */
export function goToHomepageTop() {
  if (typeof window === 'undefined') return

  if (window.location.pathname !== '/' || window.location.hash || window.location.search) {
    window.history.replaceState(window.history.state, '', '/')
  }

  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
}

export function getHomeSectionIdFromHref(href: string) {
  if (href.startsWith('/#')) return href.slice(2)
  if (href.startsWith('#')) return href.slice(1)
  return null
}

export function readHomepageHashSection(): HomepageAnchorSectionId | null {
  if (typeof window === 'undefined') return null

  const hash = window.location.hash.replace('#', '')
  return HOMEPAGE_ANCHOR_SECTION_IDS.includes(hash as HomepageAnchorSectionId)
    ? (hash as HomepageAnchorSectionId)
    : null
}

export function getActiveHomeSectionFromScroll(): HomepageAnchorSectionId | null {
  if (typeof window === 'undefined') return null

  const marker = window.scrollY + HEADER_SCROLL_OFFSET_PX + 48
  let active: HomepageAnchorSectionId | null = null

  for (const sectionId of HOMEPAGE_ANCHOR_SECTION_IDS) {
    const element = document.getElementById(sectionId)
    if (element && element.offsetTop <= marker) {
      active = sectionId
    }
  }

  return active
}

export function scrollToHomeSection(sectionId: string, behavior: ScrollBehavior = 'smooth') {
  if (typeof window === 'undefined') return false

  const element = document.getElementById(sectionId)
  if (!element) return false

  const top = Math.max(0, element.getBoundingClientRect().top + window.scrollY - HEADER_SCROLL_OFFSET_PX)
  window.scrollTo({ top, behavior })
  window.history.pushState(window.history.state, '', `/#${sectionId}`)
  return true
}

export function isHomepageAnchorHref(href: string) {
  const sectionId = getHomeSectionIdFromHref(href)
  return Boolean(
    sectionId && HOMEPAGE_ANCHOR_SECTION_IDS.includes(sectionId as HomepageAnchorSectionId),
  )
}

export function isPublicNavItemActive(
  pathname: string,
  href: string,
  activeHomeSection: string | null,
) {
  if (href === '/') return pathname === '/'

  if (
    href.startsWith('/')
    && !href.startsWith('/#')
    && (pathname === href || pathname.startsWith(`${href}/`))
  ) return true

  if (pathname === '/') {
    const sectionId = getHomeSectionIdFromHref(href)
    if (sectionId && activeHomeSection === sectionId) return true
  }

  return false
}
