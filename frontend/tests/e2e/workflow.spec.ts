import { test, expect } from '@playwright/test';

test.describe('Golden Path Workflow', () => {
  
  test('Full Business Cycle: Commercial -> R&D -> Finance', async ({ page }) => {
    const uniqueId = Date.now().toString().slice(-6);
    const clientName = `Automated Lead ${uniqueId}`;
    const productName = `Automated Test Product - ${clientName}`;

    // 1. LOGIN AS BUSDEV
    await page.goto('/login');
    await page.getByPlaceholder('name@company.com').fill('bd@portoaureon.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByRole('button', { name: "Sign In" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // 2. CREATE LEAD
    // Navigate using the link specifically in side nav if possible, or just text link
    await page.getByRole('link', { name: "Commercial" }).click();
    await page.getByRole('button', { name: /Quick Add Vector/i }).click();
    await expect(page.getByText('New Client Vector synchronized.')).toBeVisible();
    
    // 3. INITIATE NPF
    // Wait for the new lead to appear in the "NEW" column.
    // We dynamically identify the name from the UI since the timestamp is generated backend/component side.
    const leadCard = page.locator('p:has-text("Automated Lead")').first();
    await leadCard.waitFor({ state: 'visible', timeout: 5000 });
    const actualClientName = await leadCard.innerText();
    await leadCard.click();
    
    await page.getByRole('button', { name: /Initiate R&D Vector/i }).click();
    await expect(page.getByText('NPF request dispatched to R&D Lab.')).toBeVisible();
    await page.getByRole('button', { name: "Close Terminal" }).click();

    // 4. LOGOUT & LOGIN AS R&D
    await page.getByRole('button', { name: "Terminate Session" }).click();
    await expect(page).toHaveURL(/\/login/);
    
    await page.getByPlaceholder('name@company.com').fill('rnd@portoaureon.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByRole('button', { name: "Sign In" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // 5. BUILD FORMULA
    await page.getByRole('link', { name: "R&D Formulas" }).click();
    
    // Find the NPF we just created using the actual name we captured
    const npfRow = page.getByRole('row', { name: actualClientName }).first();
    const trackButton = npfRow.getByRole('button', { name: /Initialize Track/i });
    
    await trackButton.waitFor({ state: 'visible', timeout: 10000 });
    await trackButton.click();
    // Wait for the SUCCESS toast or for it to disappear from the list
    await expect(page.getByText(/Formulation track initialized/i)).toBeVisible();
    
    await page.getByRole('tab', { name: /Active Formulation Lab/i }).click();
    // Find the Sample row for our product using the actual name
    const sampleRow = page.getByRole('row', { name: actualClientName }).first();
    await sampleRow.getByRole('button', { name: /Build Formula/i }).click();
    
    // Add Material
    await page.getByRole('button', { name: /Inject Raw Material/i }).click();
    await page.locator('button.w-full.text-left').first().click(); 
    
    await page.getByPlaceholder('Percentage').fill('100');
    
    // Save Formula
    await page.getByRole('button', { name: /Lock Formula Environment/i }).click();
    // Broaden matching for success message
    await expect(page.getByText(/Formula locked|locked into vault/i)).toBeVisible();

    // 6. LOGOUT & LOGIN AS FINANCE
    await page.getByRole('button', { name: "Terminate Session" }).click();
    await page.getByPlaceholder('name@company.com').fill('finance@portoaureon.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByRole('button', { name: "Sign In" }).click();

    // 7. VERIFY PAYMENT (AND UNLOCK FACTORY)
    await page.getByRole('link', { name: "Finance" }).click();
    await page.getByRole('button', { name: /Invoice/i }).first().click();
    await page.getByRole('button', { name: /Initialize Billing Matrix/i }).click();
    await expect(page.getByText('Invoice Matrix generated')).toBeVisible();
    
    // Verify the DP Invoice
    await page.getByRole('button', { name: /DP/i }).first().click();
    await page.getByRole('button', { name: /VERIFY & UNLOCK FACTORY/i }).click();
    await expect(page.getByText('Financial Interlock cleared')).toBeVisible();
    
    // Verify SO Status is ACTIVE
    const statusBadge = page.locator('span:has-text("ACTIVE")').first();
    await expect(statusBadge).toBeVisible();
  });

});
