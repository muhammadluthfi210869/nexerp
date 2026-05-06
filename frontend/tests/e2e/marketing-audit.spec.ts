import { test, expect } from '@playwright/test';

test.describe('Marketing-Finance Integration Audit Workflow', () => {
  
  test('should successfully record ads spend and audit it through finance', async ({ page }) => {
    // 1. LOGIN WITH NEURAL SESSION INIT
    await page.goto('/login');
    await page.waitForSelector('#email');
    await page.fill('#email', 'admin@dreamlab.com');
    await page.fill('#password', 'password123');
    
    await page.getByRole('button', { name: /Initialize Session/i }).click();
    
    // Wait for navigation to complete
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    
    // Wait for the cookie to propagate and redirect
    await page.waitForURL(/\/finance\/dashboard/);
    await expect(page).toHaveURL(/finance\/dashboard/);
    
    // 2. NAVIGATE TO MARKETING INPUT
    await page.goto('/marketing/input');
    await expect(page.getByRole('heading', { name: 'Marketing Command Matrix' })).toBeVisible();
    
    // 3. ENTER ADS SPEND (Phase 3 Audit Item)
    const spendInput = page.locator('input[data-index="100"]').first();
    await spendInput.clear();
    await spendInput.fill('1500000');
    
    const leadsInput = page.locator('input[data-index="500"]').first();
    await leadsInput.clear();
    await leadsInput.fill('45');
    
    // Click Sync to Cloud
    await page.click('button:has-text("Sync to Cloud")');
    await expect(page.locator('text=Ads cloud-sync successful!')).toBeVisible();

    // 4. NAVIGATE TO FINANCE AUDIT GATE
    await page.goto('/finance/audit');
    await expect(page.locator('h1')).toContainText('Audit Gate');
    
    // 5. VERIFY THE ITEM (INTEGRITY CHECK)
    const auditRow = page.locator('tr:has-text("IG_ADS")').first();
    await expect(auditRow.locator('text=Awaiting')).toBeVisible();
    
    // Verify & Journal (This triggers the SystemOverrideLog in backend)
    await auditRow.locator('button:has-text("Verify & Journal")').click();
    
    // 6. VALIDATE AUDIT TRAIL
    await expect(page.locator('text=Metric Verified & Journaled')).toBeVisible();
    await expect(auditRow.locator('text=Verified')).toBeVisible();
    
    // 7. CHECK JOURNAL ENTRY
    await page.goto('/finance/journal');
    await expect(page.locator('tr:has-text("ADS-IG_ADS")').first()).toBeVisible();
  });

  test('should restrict target editing for non-finance users', async ({ page }) => {
     // Optional: Implementation for role-based security validation
  });
});
