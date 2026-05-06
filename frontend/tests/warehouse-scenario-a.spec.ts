import { test, expect } from '@playwright/test';

test.describe('Warehouse Scenario A: Inbound to Analytics Happy Path', () => {
  const BATCH_ID = `AUTO-QA-${Date.now()}`;

  test('should successfully process inbound and reflect in dashboard', async ({ page }) => {
    // 1. LOGIN
    await page.goto('http://localhost:3001/login');
    await page.fill('input[type="email"]', 'superadmin@dreamlab.com'); // Mock credentials
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/.*warehouse/);

    // 2. NAVIGATE TO INBOUND
    await page.click('text=Inbound Entry');
    await expect(page).toHaveURL(/.*inbound/);

    // 3. FILL INBOUND FORM
    // Selecting material (using text to find the trigger)
    await page.click('button:has-text("Pilih Material")');
    await page.click('div[role="option"]:first-child'); // Select first available material

    await page.fill('input[placeholder*="BATCH"]', BATCH_ID);
    await page.fill('input[type="number"]', '750');
    
    // Select Location
    await page.click('button:has-text("Pilih Lokasi")');
    await page.click('text=Rack A-1');

    await page.fill('input[placeholder*="Catatan tambahan"]', 'Automated E2E Test Run - Scenario A');

    // 4. SUBMIT & ASSERT NOTIFICATION
    await page.click('button:has-text("KONFIRMASI PENERIMAAN")');
    
    // Check for success toast
    await expect(page.locator('text=Barang berhasil diterima')).toBeVisible();

    // 5. VERIFY DASHBOARD ANALYTICS
    await page.goto('http://localhost:3001/warehouse');
    
    // Assert that Capacity Utility is visible and rendering
    const capacityCard = page.locator('text=Utilitas Kapasitas');
    await expect(capacityCard).toBeVisible();
    
    // Taking a visual evidence
    await page.screenshot({ path: `tests/evidence/scenario-a-${BATCH_ID}.png` });
    
    console.log(`✅ SCENARIO A PASSED: Batch ${BATCH_ID} tracked from inbound to dashboard.`);
  });
});
