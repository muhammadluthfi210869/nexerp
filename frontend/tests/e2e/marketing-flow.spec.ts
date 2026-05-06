import { test, expect } from '@playwright/test';

test.describe('Marketing Module E2E Flow', () => {
    
  test.beforeEach(async ({ page }) => {
    // 1. Login as Commercial/Digimar
    await page.goto('http://localhost:3001/login');
    await page.getByPlaceholder('name@company.com').fill('bd@portoaureon.com'); // Admin/Comm creds
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button:has-text("Sign In")').click();
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('scenario A & B: bulk input ads data and verify dashboard update', async ({ page }) => {
    // Step 1: Go to Input Page
    await page.goto('http://localhost:3001/marketing/input');
    await expect(page.locator('h1')).toContainText('MARKET DATA HUB');

    // Step 2: Fill Ads Data
    // First row
    await page.locator('input[type="number"]').nth(0).fill('500000'); // ad_spend
    await page.locator('input[type="number"]').nth(1).fill('10000'); // impressions
    await page.locator('input[type="number"]').nth(2).fill('200');   // clicks
    
    // Step 3: Click Save
    await page.locator('button:has-text("Simpan Ke Database")').click();
    
    // Step 4: Verify Success Toast
    await expect(page.locator('text=berhasil disimpan')).toBeVisible();

    // Step 5: Verify Dashboard
    await page.goto('http://localhost:3001/marketing/dashboard');
    await expect(page.locator('h1')).toContainText('MARKETING COMMAND');
    
    // Verify that Spend metrik exists and is not zero (assuming previous was less or resetting)
    // We check if the Ad Spend card shows a value
    const spendValue = page.locator('h2').nth(2); // Total Ad Spend MTD card
    await expect(spendValue).not.toContainText('Rp 0');
  });

});
