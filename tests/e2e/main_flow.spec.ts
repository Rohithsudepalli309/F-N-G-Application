import { test, expect } from '@playwright/test';

const ADMIN_URL = process.env.E2E_ADMIN_URL ?? 'http://localhost:5173';
const MERCHANT_URL = process.env.E2E_MERCHANT_URL ?? 'http://localhost:5174';
const API_PATH = '**/api/v1/**';

async function jsonOk(route: any, body: unknown) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function setupAdminMocks(page: any) {
  await page.route(`${API_PATH}auth/login`, async (route: any) => {
    await jsonOk(route, {
      token: 'admin-token',
      user: {
        id: '1',
        name: 'Admin User',
        email: 'admin@fng.com',
        role: 'admin',
      },
    });
  });

  await page.route(`${API_PATH}admin/orders/pending-count`, async (route: any) => {
    await jsonOk(route, { count: 1 });
  });

  await page.route(`${API_PATH}admin/orders*`, async (route: any) => {
    await jsonOk(route, {
      orders: [
        {
          id: 'order-admin-001',
          customer_name: 'Test Customer',
          store_name: 'Test Store',
          status: 'placed',
          total_amount: 129900,
          created_at: '2026-03-16T08:00:00.000Z',
        },
      ],
    });
  });
}

async function setupMerchantMocks(page: any) {
  const orders = [
    {
      id: 101,
      status: 'placed',
      payment_status: 'paid',
      total_amount: 25900,
      address: '123 Test Street',
      created_at: '2026-03-16T08:00:00.000Z',
      customer_name: 'Customer One',
      customer_phone: '9000000001',
      items: [{ name: 'Burger', quantity: 2, price: 12950 }],
    },
  ];

  await page.route(`${API_PATH}auth/login`, async (route: any) => {
    await jsonOk(route, {
      accessToken: 'merchant-token',
      user: {
        id: 11,
        name: 'Merchant User',
        email: 'merchant@fng.com',
        role: 'merchant',
      },
    });
  });

  await page.route(`${API_PATH}merchant/profile`, async (route: any) => {
    await jsonOk(route, {
      store: {
        id: 'store-1',
        name: 'Merchant Demo Store',
        type: 'restaurant',
        is_active: true,
      },
    });
  });

  await page.route(`${API_PATH}merchant/orders*`, async (route: any) => {
    await jsonOk(route, { orders });
  });

  await page.route(`${API_PATH}merchant/orders/*/status`, async (route: any) => {
    const payload = route.request().postDataJSON() as { action?: string };
    if (payload.action === 'accept') {
      orders[0].status = 'preparing';
    }
    if (payload.action === 'ready') {
      orders[0].status = 'ready';
    }
    if (payload.action === 'reject') {
      orders[0].status = 'cancelled';
    }
    await jsonOk(route, { ok: true });
  });

  await page.route('**/socket.io/**', async (route: any) => {
    await route.fulfill({ status: 200, body: '' });
  });
}

test.describe('F&G Delivery Pipeline E2E', () => {
  test('Admin can login and view orders monitor', async ({ page }: any) => {
    await setupAdminMocks(page);

    await page.goto(`${ADMIN_URL}/login`);
    await page.getByTestId('admin-login-email').fill('admin@fng.com');
    await page.getByTestId('admin-login-password').fill('password123');
    await page.getByTestId('admin-login-submit').click();

    await expect(page).toHaveURL(/\/$/);
    await page.getByRole('link', { name: 'Live Orders' }).click();
    await expect(page).toHaveURL(/\/orders$/);

    await expect(page.getByTestId('admin-orders-refresh')).toBeVisible();
    await expect(page.getByTestId('admin-order-row-order-admin-001')).toBeVisible();
  });

  test('Merchant can login, see orders, and accept an order', async ({ page }: any) => {
    await setupMerchantMocks(page);

    await page.goto(`${MERCHANT_URL}/login`);
    await page.getByTestId('merchant-login-email').fill('merchant@fng.com');
    await page.getByTestId('merchant-login-password').fill('password123');
    await page.getByTestId('merchant-login-submit').click();

    await expect(page).toHaveURL(/\/$/);
    await page.getByRole('link', { name: 'Orders' }).click();
    await expect(page).toHaveURL(/\/orders$/);

    await expect(page.getByTestId('merchant-order-card-101')).toBeVisible();
    await page.getByTestId('merchant-order-accept-101').click();

    await expect(page.getByTestId('merchant-order-ready-101')).toBeVisible();
  });
});
