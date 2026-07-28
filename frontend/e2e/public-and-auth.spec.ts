import { expect, test } from '@playwright/test'

test.describe('public and authentication smoke flows', () => {
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
    await page.route('**/api/**', (route) => route.abort('connectionfailed'))
    await page.goto('/rooms')

    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByText(/không thể|thử lại|kết nối/i).first()).toBeVisible()
  })
})
