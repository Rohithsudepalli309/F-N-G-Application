import { defineConfig, devices } from '@playwright/test';

const adminUrl = process.env.E2E_ADMIN_URL ?? 'http://127.0.0.1:5173';
const merchantUrl = process.env.E2E_MERCHANT_URL ?? 'http://127.0.0.1:5174';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: adminUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'npx pnpm --dir ../apps/admin-dashboard dev --host 127.0.0.1 --port 5173',
      url: adminUrl,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npx pnpm --dir ../apps/merchant-dashboard dev --host 127.0.0.1 --port 5174',
      url: merchantUrl,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
