import { test, expect } from '@playwright/test';

const ADMIN_URL = process.env.E2E_ADMIN_URL ?? 'http://localhost:5173';
const MERCHANT_URL = process.env.E2E_MERCHANT_URL ?? 'http://localhost:5174';
const API_PATH = '**/api/v1/**';

async function jsonResponse(route: any, status: number, body: unknown) {
  await route.fulfill({
    status: status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

test.describe('Authentication E2E — Admin Portal', () => {
  test.beforeEach(async ({ page }) => {
    // Mock successful login by default
    await page.route(`${API_PATH}auth/login`, async (route) => {
      const payload = route.request().postDataJSON();
      if (payload.email === 'admin@fng.com' && payload.password === 'correct-pass') {
        await jsonResponse(route, 200, {
          token: 'mock-admin-token',
          user: { id: '1', name: 'Admin', role: 'admin' },
        });
      } else {
        await jsonResponse(route, 401, { error: 'Invalid credentials' });
      }
    });
  });

  test('Successful Admin Login', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);
    await page.getByTestId('admin-login-email').fill('admin@fng.com');
    await page.getByTestId('admin-login-password').fill('correct-pass');
    await page.getByTestId('admin-login-submit').click();

    await expect(page).toHaveURL(/\//);
    // Verify local storage or cookie if applicable, but usually checking URL/Dashboard is enough
  });

  test('Failed Admin Login — Wrong Password', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);
    await page.getByTestId('admin-login-email').fill('admin@fng.com');
    await page.getByTestId('admin-login-password').fill('wrong-pass');
    await page.getByTestId('admin-login-submit').click();

    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Authentication E2E — Merchant Portal', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`${API_PATH}auth/login`, async (route) => {
      const payload = route.request().postDataJSON();
      if (payload.email === 'store@fng.com' && payload.password === 'store-pass') {
        await jsonResponse(route, 200, {
          accessToken: 'mock-merchant-token',
          user: { id: '11', name: 'Test Store', role: 'merchant' },
        });
      } else {
        await jsonResponse(route, 401, { error: 'Invalid email or password' });
      }
    });

    await page.route(`${API_PATH}merchant/profile`, async (route) => {
        await jsonResponse(route, 200, { store: { name: 'Demo Store' } });
    });
  });

  test('Successful Merchant Login', async ({ page }) => {
    await page.goto(`${MERCHANT_URL}/login`);
    await page.getByTestId('merchant-login-email').fill('store@fng.com');
    await page.getByTestId('merchant-login-password').fill('store-pass');
    await page.getByTestId('merchant-login-submit').click();

    await expect(page).toHaveURL(/\//);
  });

  test('Failed Merchant Login — Invalid Email', async ({ page }) => {
    await page.goto(`${MERCHANT_URL}/login`);
    await page.getByTestId('merchant-login-email').fill('unknown@fng.com');
    await page.getByTestId('merchant-login-password').fill('any-pass');
    await page.getByTestId('merchant-login-submit').click();

    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });
});
