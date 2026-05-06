import { test, expect } from '@playwright/test';

test.describe('Marketing Command Center', () => {
    
  test.beforeEach(async ({ page }) => {
    // 1. Login
    await page.goto('http://localhost:3001/login');
    await page.getByPlaceholder('name@dreamlab.com').fill('marketing@dreamlab.com'); 
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button:has-text("Initialize Session")').click();
    
    // Wait for redirect to dashboard or home
    await page.waitForURL(url => url.pathname !== '/login');
  });

  const formatIDR = (num: number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  test('End-to-End Command Center Workflow', async ({ page }) => {
    // Step 1: Navigate to Command Center
    await page.goto('http://localhost:3001/marketing/input');
    await expect(page.locator('h1')).toContainText(/Dreamlab Operations/i);

    // Step 2: Capture initial state
    const aggregatedSpendHUD = page.locator('div:has(> span:text-is("Aggregated Spend")) div.text-3xl').first();
    await expect(aggregatedSpendHUD).toBeVisible();
    const initialText = await aggregatedSpendHUD.innerText();
    const initialValue = parseInt(initialText.replace(/[^0-9]/g, '')) || 0;

    // Step 3: Rapid Matrix Entry
    // IG Ads
    const igSpendInput = page.locator('[data-index="100"]');
    await igSpendInput.click();
    await igSpendInput.fill('1000000');
    await page.keyboard.press('Enter');

    // TikTok Ads
    const tiktokSpendInput = page.locator('[data-index="200"]');
    await expect(tiktokSpendInput).toBeFocused();
    await tiktokSpendInput.fill('2000000');
    await page.keyboard.press('Enter');

    // FB Ads
    const fbSpendInput = page.locator('[data-index="300"]');
    await expect(fbSpendInput).toBeFocused();
    await fbSpendInput.fill('500000');
    await page.keyboard.press('Enter');

    // Step 4: Verify HUD Live Update
    const expectedValue = initialValue + 3500000;
    await expect(aggregatedSpendHUD).toContainText(formatIDR(expectedValue));

    // Step 5: Test Persistence (LocalStorage)
    await page.reload();
    await expect(igSpendInput).toHaveValue('1000000');
    await expect(tiktokSpendInput).toHaveValue('2000000');
    await expect(fbSpendInput).toHaveValue('500000');

    // Step 6: Test Tab Switching
    await page.click('button:has-text("Organic Health")');
    await expect(page.locator('span:has-text("Growth & Engagement")')).toBeVisible();
    await page.click('button:has-text("Paid Analytics")');

    // Step 7: Cloud Sync
    const syncButton = page.locator('button:has-text("Sync to Cloud")');
    await syncButton.click();
    
    // We expect a toast or some feedback
    await expect(page.locator('text=successful').or(page.locator('text=success'))).toBeVisible();
  });

});
