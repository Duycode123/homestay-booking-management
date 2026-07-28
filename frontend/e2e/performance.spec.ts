import { expect, test } from '@playwright/test'

type WebVitalSnapshot = {
  cumulativeLayoutShift: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  loadTime: number
  scriptTransferBytes: number
}

const routes = ['/', '/rooms', '/news', '/login']

test.describe('production Web Vitals budgets', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const metrics = {
        cumulativeLayoutShift: 0,
        largestContentfulPaint: 0,
      }

      Object.defineProperty(window, '__sereneVitals', {
        value: metrics,
        configurable: false,
      })

      new PerformanceObserver((entries) => {
        for (const entry of entries.getEntries()) {
          const layoutShift = entry as PerformanceEntry & {
            hadRecentInput?: boolean
            value?: number
          }
          if (!layoutShift.hadRecentInput) {
            metrics.cumulativeLayoutShift += layoutShift.value ?? 0
          }
        }
      }).observe({ type: 'layout-shift', buffered: true })

      new PerformanceObserver((entries) => {
        const latest = entries.getEntries().at(-1)
        if (latest) metrics.largestContentfulPaint = latest.startTime
      }).observe({ type: 'largest-contentful-paint', buffered: true })
    })

    await page.route('**/api/**', (route) => route.abort('connectionfailed'))
    await page.route('**/api/auth/session*', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Unauthenticated' }),
      })
    })
  })

  for (const route of routes) {
    test(`${route} stays within the user-facing performance budget`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'networkidle' })

      const metrics = await page.evaluate<WebVitalSnapshot>(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        const paint = performance.getEntriesByName('first-contentful-paint')[0]
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
        const vitals = (window as typeof window & {
          __sereneVitals: {
            cumulativeLayoutShift: number
            largestContentfulPaint: number
          }
        }).__sereneVitals

        return {
          cumulativeLayoutShift: vitals.cumulativeLayoutShift,
          firstContentfulPaint: paint?.startTime ?? 0,
          largestContentfulPaint: vitals.largestContentfulPaint,
          loadTime: navigation.loadEventEnd,
          scriptTransferBytes: resources
            .filter((resource) => resource.initiatorType === 'script')
            .reduce((total, resource) => total + resource.transferSize, 0),
        }
      })

      console.log(`PERFORMANCE ${route}: ${JSON.stringify(metrics)}`)
      expect(metrics.firstContentfulPaint, `${route} FCP`).toBeLessThan(3_000)
      expect(metrics.largestContentfulPaint, `${route} LCP`).toBeLessThan(4_000)
      expect(metrics.cumulativeLayoutShift, `${route} CLS`).toBeLessThanOrEqual(0.15)
      expect(metrics.loadTime, `${route} page load`).toBeLessThan(5_000)
      expect(metrics.scriptTransferBytes, `${route} script transfer`).toBeLessThan(1_500_000)
    })
  }
})
