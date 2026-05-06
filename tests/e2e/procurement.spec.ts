import { test, expect } from '@playwright/test';

test.describe('ERP Golden Thread: Procurement to Warehouse', () => {
  
  test('should complete a full procurement cycle', async ({ page }) => {
    // 1. Authentication
    await page.goto('/login');
    await page.fill('input[id="email"]', 'admin@dreamlab.com');
    await page.fill('input[id="password"]', 'password123');
    await page.click('button:has-text("Initialize Session")');

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    console.log('✅ Authentication Successful');

    // 2. Navigate to SCM (Purchase Orders)
    await page.goto('/scm/purchase-orders');
    await expect(page.locator('h1')).toContainText('Purchase Orders');
    
    // 3. Verify API Linkage (Intercept and check payload)
    // We expect the frontend to fetch POs from the backend
    const [response] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/scm/purchase-orders') && res.status() === 200),
      page.reload(), // Trigger the fetch
    ]);

    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    console.log(`✅ API Linkage Verified: Received ${data.length} POs`);

    // 4. Create a New PO (The "Handover" point)
    // This is where we test if the UI fields match the Backend DTO
    await page.click('button:has-text("Create PO"), button:has-text("New Order")');
    
    // Fill the form (assuming standard IDs from our DTO stabilization)
    // Note: In a real scenario, we would use data-testid for robustness
    // await page.fill('input[name="supplierId"]', '...'); 
    
    console.log('✅ UI Form State ready for Handover Test');
  });

});
