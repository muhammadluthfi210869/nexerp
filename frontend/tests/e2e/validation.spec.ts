import { test, expect } from '@playwright/test';

test.describe('Edge Case & Validation Suite', () => {
  
  test('Formula: Prevent save if dosage != 100%', async ({ page }) => {
    // 1. LOGIN AS RND
    await page.goto('/login');
    await page.getByPlaceholder('name@company.com').fill('rnd@portoaureon.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button:has-text("Sign In")').click();

    // Wait for dashboard to load
    await expect(page).toHaveURL(/\/dashboard/);
    // Ensure sidebar is ready
    await page.waitForSelector('text=R&D Formulas');

    // 2. OPEN FORMULA BUILDER
    await page.click('text=R&D Formulas');
    await page.click('text=Active Formulation Lab');
    await page.locator('button:has-text("Build Formula")').first().click();
    
    // 3. ADD MATERIAL AND SET DOSAGE TO 99%
    await page.click('text=Inject Raw Material');
    await page.locator('button.w-full.text-left').first().click();
    await page.fill('input[placeholder="Percentage"]', '99');
    
    // 4. EXPECT SAVE BUTTON TO BE DISABLED (OR SHOW ERROR MESSAGE)
    const saveButton = page.locator('button:has-text("Lock Formula Environment")');
    await expect(saveButton).toBeDisabled();
    await expect(page.locator('text=Critical Deviation: 99.00%')).toBeVisible();
  });

  test('Production: Mass Balance Validation (Tolerance > 1%)', async ({ page }) => {
    // 1. LOGIN AS PRODUCTION
    await page.goto('/login');
    await page.getByPlaceholder('name@company.com').fill('production@portoaureon.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button:has-text("Sign In")').click();

    // Wait for dashboard to load
    await expect(page).toHaveURL(/\/dashboard/);
    // Ensure sidebar is ready
    await page.waitForSelector('text=Factory Floor');

    // 2. OPEN PRODUCTION STATION
    await page.click('text=Factory Floor');
    await page.click('text=BATCHING');
    
    // 3. INPUT RESULTS WITH HIGH SHRINKAGE (> 1%)
    // Input Qty is 100, Good is 95 (5% shrinkage)
    const inputs = page.locator('div[role="dialog"] input');
    await inputs.nth(0).fill('100'); // Input Qty
    await inputs.nth(1).fill('95');  // Good Qty
    await inputs.nth(2).fill('0');   // Reject Qty
    await inputs.nth(3).fill('0');   // Quarantine Qty
    
    // 4. EXPECT WARNING MESSAGE
    await expect(page.locator('text=Selisih Material Terlalu Besar!')).toBeVisible();
    
    // 5. TRY TO SAVE
    const logButton = page.locator('button:has-text("SUBMIT STAGE RESULT")');
    await expect(logButton).toBeDisabled();
  });

});
