import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const publicRoutes = [
  '/',
  '/rooms',
  '/amenities',
  '/about',
  '/news',
  '/support',
  '/login',
]

function summarizeViolations(violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']) {
  return violations.map((violation) => ({
    id: violation.id,
    nodes: violation.nodes.map((node) => ({
      target: node.target,
      html: node.html,
      data: node.any[0]?.data,
    })),
  }))
}

test.describe('automated accessibility checks', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/**', (route) => route.abort('connectionfailed'))
    await page.route('**/api/auth/session*', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Unauthenticated' }),
      })
    })
  })

  for (const route of publicRoutes) {
    test(`${route} has no serious WCAG A/AA violations`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'networkidle' })

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
      const seriousViolations = results.violations.filter(
        (violation) => violation.impact === 'critical' || violation.impact === 'serious',
      )
      if (seriousViolations.length > 0) {
        console.log(`A11Y ${route}: ${JSON.stringify(summarizeViolations(seriousViolations))}`)
      }

      expect(
        seriousViolations,
        seriousViolations.map((violation) => (
          `${violation.id}: ${violation.help}\n${violation.nodes.map((node) => node.target.join(' ')).join('\n')}`
        )).join('\n\n'),
      ).toEqual([])
    })
  }

  test('mobile homepage has no serious WCAG A/AA violations', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/', { waitUntil: 'networkidle' })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(
      results.violations.filter((violation) => violation.impact === 'critical' || violation.impact === 'serious'),
    ).toEqual([])
  })
})
