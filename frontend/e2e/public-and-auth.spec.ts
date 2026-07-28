import { expect, test } from '@playwright/test'

test.describe('public and authentication smoke flows', () => {
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

  test('homepage renders the primary booking experience', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByText('The Serene Villa', { exact: false }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /xem phòng được yêu thích/i })).toBeVisible()
  })

  test('login form exposes accessible fields and password visibility', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: 'Chào mừng trở lại' })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    const password = page.getByRole('textbox', { name: 'Mật khẩu', exact: true })
    await expect(password).toHaveAttribute('type', 'password')

    await page.getByRole('button', { name: 'Hiện mật khẩu' }).click()
    await expect(password).toHaveAttribute('type', 'text')
    await expect(page.getByRole('button', { name: 'Quên mật khẩu?' })).toBeVisible()
  })

  test('login failure from backend is shown without losing entered credentials', async ({ page }) => {
    await page.route('**/api/auth/csrf*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          headerName: 'X-HOMESTAY-XSRF-TOKEN',
          token: 'e2e-csrf-token',
        }),
      })
    })
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Email hoặc mật khẩu không chính xác.',
        }),
      })
    })

    await page.goto('/login')
    await page.getByLabel('Email').fill('customer@example.com')
    await page.getByRole('textbox', { name: 'Mật khẩu', exact: true }).fill('incorrect-password')
    await page.locator('form').getByRole('button', { name: 'Đăng nhập', exact: true }).click()

    await expect(
      page.getByRole('alert').filter({ hasText: 'Email hoặc mật khẩu không chính xác.' }),
    ).toBeVisible()
    await expect(page.getByLabel('Email')).toHaveValue('customer@example.com')
  })

  test('public room catalog remains usable when backend is temporarily unavailable', async ({ page }) => {
    await page.goto('/rooms')

    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByText(/không thể|thử lại|kết nối/i).first()).toBeVisible()
  })

  test('public routes keep one clear heading and never overflow a mobile viewport', async ({ page }) => {
    test.setTimeout(90_000)
    await page.setViewportSize({ width: 390, height: 844 })

    const publicRoutes = [
      '/',
      '/rooms',
      '/amenities',
      '/about',
      '/news',
      '/support',
      '/process',
      '/booking-policy',
      '/cancellation-policy',
      '/privacy',
      '/terms',
    ]

    for (const route of publicRoutes) {
      await page.goto(route)
      await expect(page.getByRole('main')).toBeVisible()
      await expect(
        page.locator('h1'),
        `${route} should expose one h1 after the route transition settles`,
      ).toHaveCount(1)

      const layout = await page.evaluate(() => ({
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
      }))

      expect(
        layout.documentWidth,
        `${route} should not overflow horizontally`,
      ).toBeLessThanOrEqual(layout.viewportWidth + 1)
    }
  })

  test('mobile navigation opens, closes and reaches a public destination', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/rooms', { waitUntil: 'networkidle' })

    await page.getByRole('button', { name: 'Mở menu' }).click()
    const navigation = page.getByRole('navigation', { name: 'Điều hướng chính' })
    await expect(navigation).toBeVisible()
    const amenitiesLink = navigation.getByRole('link', { name: 'Tiện nghi', exact: true })
    await expect(amenitiesLink).toBeVisible()
    await Promise.all([
      page.waitForURL('**/amenities'),
      amenitiesLink.click(),
    ])

    await expect(page).toHaveURL(/\/amenities$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('SEO metadata uses real public URLs and unknown routes return a helpful 404', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })

    await page.goto('/news')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/news$/)
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', /\/news$/)
    await expect(page.getByText('The Serene Journal', { exact: true })).toBeVisible()
    expect(
      consoleErrors.filter((message) => !message.includes('status of 401')),
    ).toEqual([])

    await page.goto('/amenities')
    await expect(
      page.getByRole('link', { name: 'Khám phá phòng homestay', exact: true }),
    ).toHaveAttribute('href', '/rooms')
    await expect(
      page.getByRole('link', { name: 'Cần tư vấn', exact: true }),
    ).toHaveAttribute('href', '/support')

    const response = await page.goto('/route-that-does-not-exist-e2e')
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Trang này không còn ở đây')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    await expect(
      page.locator('main').getByRole('link', { name: 'Về trang chủ', exact: true }),
    ).toBeVisible()
  })

  test('production responses include baseline security headers', async ({ page }) => {
    const response = await page.goto('/')
    expect(response).not.toBeNull()

    const headers = response!.headers()
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'")
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['permissions-policy']).toContain('camera=()')
    expect(headers['strict-transport-security']).toContain('max-age=')
    expect(headers['x-powered-by']).toBeUndefined()
  })

  test('authentication pages expose specific titles and remain excluded from indexing', async ({ page }) => {
    const authRoutes = [
      { path: '/login', title: 'Đăng nhập' },
      { path: '/register', title: 'Đăng ký tài khoản' },
      { path: '/forgot-password', title: 'Khôi phục mật khẩu' },
      { path: '/verify-email', title: 'Xác thực email' },
    ]

    for (const route of authRoutes) {
      await page.goto(route.path)
      await expect(page).toHaveTitle(new RegExp(route.title))
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    }
  })

  test('language switching updates the rendered language without changing the public URL', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Mở menu' }).click()
    await page.getByRole('button', { name: 'Switch to English' }).click()

    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('A stay that')
  })

  test('protected workspaces redirect anonymous visitors to login', async ({ page }) => {
    for (const protectedRoute of ['/customer/bookings', '/staff', '/admin']) {
      await page.goto(protectedRoute)
      await expect(page).toHaveURL(/\/login\?redirect=/)
      await expect(page.getByRole('heading', { name: 'Chào mừng trở lại' })).toBeVisible()
    }
  })
})
