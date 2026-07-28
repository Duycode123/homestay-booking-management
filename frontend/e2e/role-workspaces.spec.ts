import { expect, test, type Page } from '@playwright/test'

type Role = 'ADMIN' | 'STAFF' | 'CUSTOMER'

const roleHome: Record<Role, string> = {
  ADMIN: '/admin/dashboard',
  STAFF: '/staff/dashboard',
  CUSTOMER: '/',
}

async function mockRoleAuthentication(page: Page, role: Role) {
  let activeRole: Role | null = null
  const encodedPayload = Buffer
    .from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3_600, role }))
    .toString('base64url')
  const accessToken = `e30.${encodedPayload}.e2e`

  await page.route('**/api/**', (route) => route.abort('connectionfailed'))
  await page.route('**/api/auth/csrf*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        headerName: 'X-HOMESTAY-XSRF-TOKEN',
        token: 'role-e2e-csrf-token',
      }),
    })
  })
  await page.route('**/api/auth/login', async (route) => {
    activeRole = role
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'set-cookie': `access_token=${accessToken}; Path=/; HttpOnly; SameSite=Lax`,
      },
      body: JSON.stringify({
        id: `${role.toLowerCase()}-e2e`,
        role,
        fullName: `${role} E2E`,
        email: `${role.toLowerCase()}@example.com`,
      }),
    })
  })
  await page.route('**/api/auth/session*', async (route) => {
    if (!activeRole) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Unauthenticated' }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: `${activeRole.toLowerCase()}-e2e`,
        role: activeRole,
        fullName: `${activeRole} E2E`,
        email: `${activeRole.toLowerCase()}@example.com`,
      }),
    })
  })
}

for (const role of ['ADMIN', 'STAFF', 'CUSTOMER'] as const) {
  test(`${role} login reaches the correct workspace`, async ({ page }) => {
    await mockRoleAuthentication(page, role)
    await page.goto('/login')

    await page.getByLabel('Email').fill(`${role.toLowerCase()}@example.com`)
    await page.getByRole('textbox', { name: 'Mật khẩu', exact: true }).fill('Valid-password-123')
    await page.locator('form').getByRole('button', { name: 'Đăng nhập', exact: true }).click()

    await expect(page).toHaveURL(new RegExp(`${roleHome[role].replace('/', '\\/')}$`))
    await expect(page.getByRole('main')).toBeVisible()
  })
}

test('a staff session cannot open the admin workspace', async ({ page }) => {
  await mockRoleAuthentication(page, 'STAFF')
  await page.goto('/login')
  await page.getByLabel('Email').fill('staff@example.com')
  await page.getByRole('textbox', { name: 'Mật khẩu', exact: true }).fill('Valid-password-123')
  await page.locator('form').getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await expect(page).toHaveURL(/\/staff\/dashboard$/)

  await page.goto('/admin/dashboard')
  await expect(page).toHaveURL(/\/staff\/dashboard$/)
})
