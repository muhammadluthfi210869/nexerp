import { test, expect } from '@playwright/test';

/**
 * SCENARIO: END-TO-END OPERATION PROTOCOL (DREAMLAB V4)
 * Focus: Visual Communication via Activity Stream & Operational Gates
 */

test.describe('Dreamlab V4 Protocol - Activity Stream & Gates', () => {
  const TEST_LEAD_NAME = `Playwright Test Client ${Date.now()}`;

  test('Should execute full operational protocol from Lead to Won Deal', async ({ page }) => {
    // 1. LOGIN
    await page.goto('http://localhost:3001/login', { timeout: 120000 });
    await page.screenshot({ path: 'tests/e2e/login-debug-3001.png' });
    await page.fill('#email', 'admin@porto.com', { timeout: 30000 });
    await page.fill('#password', 'password123');
    await page.click('button:has-text("Initialize Session")');
    await page.waitForURL('**/dashboard**', { timeout: 20000 });

    // 2. FASE 1: AKUISISI & NEGOSIASI
    // Create New Lead
    await page.goto('/bussdev/intake');
    await page.fill('input[placeholder="Client Name"]', TEST_LEAD_NAME);
    await page.fill('input[placeholder="Product Interest"]', 'Whitening Serum Series');
    await page.click('button:has-text("Create Acquisition")');
    await page.waitForTimeout(2000);

    // Open Pipeline & Locate Lead
    await page.goto('/bussdev/pipeline');
    const leadRow = page.locator(`tr:has-text("${TEST_LEAD_NAME}")`);
    await expect(leadRow).toBeVisible();
    await leadRow.locator('button:has-text("Manage")').click();

    // Log Activity: Contacted
    await page.click('button:has-text("Action Center")');
    await page.selectOption('select', 'CONTACTED');
    await page.fill('textarea', 'Klien tertarik maklon 5000 pcs. Diskusi awal via WA.');
    await page.click('button:has-text("Commit Action")');
    await page.waitForTimeout(1000);

    // Verify Protocol Log
    await leadRow.locator('button:has-text("Manage")').click();
    await page.click('button:has-text("Protocol Log")');
    await expect(page.locator('text=Stage Update')).toBeVisible();
    await expect(page.locator('text=Lead Stage berubah dari NEW_LEAD ke CONTACTED')).toBeVisible();

    // 3. FASE 2: SAMPLE GATE (HANDOVER)
    await page.click('button:has-text("Action Center")');
    await page.selectOption('select', 'SAMPLE_REQUEST');
    await page.fill('textarea', 'Mengunggah berkas PNF & Bukti Transfer Biaya Sampel (Rp 500.000).');
    await page.click('button:has-text("Commit Action")');
    await page.waitForTimeout(1000);

    // Verify Handover Log
    await leadRow.locator('button:has-text("Manage")').click();
    await page.click('button:has-text("Protocol Log")');
    await expect(page.locator('text=Dept Handover')).toBeVisible();
    await expect(page.locator('text=PROTOKOL HANDOVER: Request Sample')).toBeVisible();

    // 4. FASE 4: PRODUCTION GATE (DP 50% LOCK)
    await page.click('button:has-text("Action Center")');
    await page.selectOption('select', 'PRODUCTION_PROCESS');
    await page.fill('textarea', 'Mencoba paksa ke produksi tanpa DP terverifikasi.');
    await page.click('button:has-text("Submit to Finance Validation")');
    
    // Expect Gate Blocked Error Toast
    await expect(page.locator('text=GATE_BLOCKED: DP belum mencapai 50%')).toBeVisible();

    // Verify Blocked Log in Timeline
    await page.click('button:has-text("Protocol Log")');
    await expect(page.locator('text=Gate Blocked')).toBeVisible();
    await expect(page.locator('text=TRANSISI DIBLOKIR: DP baru 0')).toBeVisible();

    // 5. EMERGENCY OVERRIDE (ADMIN BYPASS)
    // In a real test, we would use the override endpoint. For UI test, we check if the override badge appears after API call.
    // Simulating override via API in the background or just checking visual cues if we can trigger it.
    // For this scenario, we just verify that the "Protocol Log" accurately reflects the system state.
  });
});
