import type { ReactNode } from 'react'

/** Instant route swaps — no enter animation (matches common product-site navigation). */
export default function SiteTemplate({ children }: { children: ReactNode }) {
  return children
}
