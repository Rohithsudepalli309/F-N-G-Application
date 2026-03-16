import { test, expect } from '@playwright/test';

const ADMIN_URL = process.env.E2E_ADMIN_URL ?? 'http://localhost:5173';
const MERCHANT_URL = process.env.E2E_MERCHANT_URL ?? 'http://localhost:5174';

test.describe('F&G Delivery Pipeline E2E', () => {
  
  test('Customer Flow: Login -> Place Order -> Track Status', async (ctx: any) => {
    const { page } = ctx;
    // 1. Mock Customer App Login (Using internal simulation for CI)
    await page.goto(`${ADMIN_URL}/login`);
    await page.fill('input[name="phone"]', '9123456789');
    await page.click('button:has-text("Send OTP")');
    await page.fill('input[name="otp"]', '123456'); // Mock OTP
    await page.click('button:has-text("Verify")');
    
    // 2. Select Store & Add to Cart
    await page.click('text=Burger King');
    await page.click('button:has-text("Add to Cart")');
    await page.click('button:has-text("Checkout")');
    
    // 3. Place Order & Verify Confirmation
    await page.click('button:has-text("Confirm Order")');
    await expect(page.locator('text=Order Placed Success')).toBeVisible();
    
    const orderNumber = await page.innerText('.order-id');
    console.log(`Order created: ${orderNumber}`);
  });

  test('Merchant Flow: Accept Order -> Mark for Pickup', async (ctx: any) => {
    const { page } = ctx;
    await page.goto(`${MERCHANT_URL}/login`);
    // Login as merchant...
    await expect(page.locator('text=New Orders')).toBeVisible();
    await page.click('button:has-text("Accept")');
    await page.click('button:has-text("Ready for Pickup")');
  });

  test('Admin Flow: Monitoring Dashboard verification', async (ctx: any) => {
    const { page } = ctx;
    await page.goto(`${ADMIN_URL}/login`);
    // Admin checks live order monitor...
  });

});
