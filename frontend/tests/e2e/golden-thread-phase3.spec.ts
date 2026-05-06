import { test, expect } from '@playwright/test';

test.describe('Phase 3 Golden Thread: Cross-Divisional Integrity & Operational Gates', () => {
  const CLIENT_NAME = `PHASE3-CORP-${Date.now()}`;
  const BRAND_NAME = `PHASE3-BRAND-${Date.now()}`;
  
  test.beforeEach(async ({ page }) => {
    // Shared Login as Super Admin to handle multiple roles
    await page.goto('/login');
    await page.getByPlaceholder('name@Dreamlab.com').fill('superadmin@dreamlab.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.click('button:has-text("Initialize Session")');
    // After login, it might redirect to /finance/dashboard or /dashboard
    await page.waitForURL(/.*dashboard/);
  });

  test('Cross-Service Flow: Commercial -> Finance -> Production -> SCM', async ({ page }) => {
    test.slow(); // This is a long thread

    // 1. COMMERCIAL: Lead Intake
    console.log(`[1] Creating lead for ${CLIENT_NAME}`);
    await page.goto('/bussdev/intake');
    await page.fill('input[placeholder="PT. NAME"]', CLIENT_NAME);
    await page.fill('input[placeholder="BRAND NAME"]', BRAND_NAME);
    await page.fill('input[placeholder="+62"]', '08123456789'); // Contact info
    
    // Select Source
    await page.locator('button:has-text("SELECT")').first().click();
    await page.locator('div[role="option"]:has-text("Website")').click();
    
    // Select Vertical
    await page.locator('button:has-text("SELECT")').first().click();
    await page.locator('div[role="option"]:has-text("SKINCARE")').click();
    
    await page.fill('input[placeholder="e.g. SERUM"]', 'Premium Facial Serum');
    await page.fill('input[id="estimatedValue"]', '150000000');
    
    await page.click('button:has-text("Commit Lead Registry")');
    await expect(page.locator('text=Lead registered successfully')).toBeVisible();

    // 2. COMMERCIAL: Advance to SPK Signed
    await page.goto('/bussdev/pipeline');
    await page.fill('input[placeholder*="Search"]', CLIENT_NAME);
    // Click the card or row
    await page.locator(`text=${CLIENT_NAME}`).first().click();
    
    // Log Activity
    console.log(`[2] Logging SPK Signed activity for ${CLIENT_NAME}`);
    await page.click('button:has-text("Log Activity")');
    
    // Select Activity Type
    await page.locator('button:has-text("SELECT")').first().click();
    await page.locator('div[role="option"]:has-text("MEETING_OFFLINE")').click();

    await page.fill('textarea', 'Closing meeting. SPK Signed. DP Proof attached.');
    
    // Status Change
    await page.locator('button:has-text("NO CHANGE")').click();
    await page.locator('div[role="option"]:has-text("SPK SIGNED")').click();

    // Fill payment
    await page.fill('input[placeholder="IDR"]', '45000000');
    await page.fill('input[placeholder="HTTPS://"]', 'https://example.com/proof.pdf');

    await page.click('button:has-text("Submit Activity")');
    await expect(page.locator('text=Activity logged')).toBeVisible();

    // 3. FINANCE: Verify DP Payment
    console.log(`[3] Finance verifying payment for ${CLIENT_NAME}`);
    await page.goto('/finance/sales-orders');
    await page.fill('input[placeholder*="Search"]', CLIENT_NAME);
    
    // Find the "Verify Payment" button for our client
    const verifyBtn = page.locator('tr', { hasText: CLIENT_NAME }).locator('button:has-text("Verify Payment")');
    // If it's in the HUD (top cards)
    const hudVerifyBtn = page.locator('div.Card', { hasText: CLIENT_NAME }).locator('button:has-text("Verify Payment")');
    
    if (await hudVerifyBtn.isVisible()) {
        await hudVerifyBtn.click();
    } else {
        await verifyBtn.click();
    }
    
    await page.click('button:has-text("Verify & Approve Order")');
    await expect(page.locator('text=verified')).toBeVisible();

    // 4. PRODUCTION: Verify Gate Unlock
    console.log(`[4] Production verifying lead visibility for WO creation`);
    await page.goto('/production/work-orders');
    await page.click('button:has-text("New Work Order")');
    
    // Check if our lead is in the dropdown
    await page.click('button:has-text("Select product")');
    await expect(page.locator(`text=${BRAND_NAME}`)).toBeVisible();
    await page.click(`text=${BRAND_NAME}`);
    
    await page.fill('input[name="targetQty"]', '5000');
    await page.fill('input[type="date"]', '2026-12-31');
    await page.click('button:has-text("Create Work Order")');
    await expect(page.locator('text=Work Order created')).toBeVisible();

    // 5. PRODUCTION: Operational Blockage Check (Material Requisition)
    console.log(`[5] Production checking Handover Lock (MR)`);
    await page.goto('/production/active'); // Or where active WOs are listed
    const woRow = page.locator('tr', { hasText: BRAND_NAME }).first();
    await woRow.locator('button:has-text("Start")').click();
    
    // Expect error: "Warehouse has not fully released materials yet"
    await expect(page.locator('text=Warehouse has not fully released materials')).toBeVisible();
    console.log('✅ GATE VERIFIED: Production blocked by Warehouse Handover Lock');

    // 6. SCM/WAREHOUSE: Release Materials
    console.log(`[6] Warehouse issuing materials for ${BRAND_NAME}`);
    await page.goto('/production/requisitions'); // Requisitions view
    const reqRow = page.locator('tr', { hasText: BRAND_NAME }).first();
    await reqRow.locator('button:has-text("Issue")').click();
    await expect(page.locator('text=issued')).toBeVisible();

    // 7. PRODUCTION: Start Production (Unlocked)
    console.log(`[7] Production starting WO (Now Unlocked)`);
    await page.goto('/production/active');
    await page.locator('tr', { hasText: BRAND_NAME }).locator('button:has-text("Start")').click();
    await expect(page.locator('text=Production started')).toBeVisible();
    
    console.log(`🚀 PHASE 3 GOLDEN THREAD PASSED: ${CLIENT_NAME} flow complete.`);
  });
});
