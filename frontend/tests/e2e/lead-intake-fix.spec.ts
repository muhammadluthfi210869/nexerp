
import { test, expect } from '@playwright/test';

test.describe('Lead Intake Bugfix Validation (Phase 3)', () => {
  test('should successfully submit lead with AUTO-assignment', async ({ page }) => {
    // 1. LOGIN
    await page.goto('http://localhost:3001/login');
    await page.fill('#email', 'superadmin@dreamlab.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    
    // 2. NAVIGATE TO INTAKE
    await page.waitForTimeout(3000);
    await page.goto('http://localhost:3001/bussdev/intake');
    
    // 3. FILL FORM
    const testBrand = `Bugfix Test ${Date.now()}`;
    await page.fill('#clientName', 'PT Bugfix Success');
    await page.fill('#brandName', testBrand);
    await page.fill('#contactInfo', '0899-1234-5678');
    
    // Select Source (using shadcn/radix selection logic)
    await page.click('button:has-text("Select Origin")');
    await page.click('text=Instagram');
    
    // Fill Estimated Value (should auto-format)
    await page.fill('#estimatedValue', '75000000');
    // Check if it formatted to 75.000.000
    const val = await page.inputValue('#estimatedValue');
    expect(val).toBe('75.000.000');
    
    // Select Category
    await page.click('button:has-text("Select Category")');
    await page.click('text=SKINCARE');
    
    await page.fill('#productInterest', 'Serum Glowing Phase 3');
    
    // Ensure PIC is AUTO
    const picSelect = page.locator('button:has-text("AUTO-BALANCE")');
    await expect(picSelect).toBeVisible();
    
    // 4. SUBMIT
    await page.click('button:has-text("Commit Lead")');
    
    // 5. VALIDATE SUCCESS (Should redirect to pipeline or show success toast)
    await page.waitForURL('**/bussdev/pipeline');
    console.log('✅ PHASE 3 VALIDATION SUCCESS: Lead created with AUTO-assignment and proper formatting.');
  });
});
