import { test, expect } from '@playwright/test';

test.describe('Client Sample Hub Demo', () => {
  test('End-to-End Handover Simulation', async ({ page }) => {
    // 1. Setup session
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({ name: 'Amira', role: 'HEAD_RND' }));
      localStorage.setItem('token', 'mock-token');
    });

    // 2. Go to R&D Pipeline to Approve a sample
    await page.goto('/rnd/pipeline');
    await page.waitForLoadState('networkidle');
    
    // Find an unassigned or active project and click Approve if button exists
    // For demo, we just want to see the Hub UI
    console.log('Navigating to Client Sample Hub...');
    await page.goto('/bussdev/client-sample');
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot of the new Hub
    await page.screenshot({ path: 'client-sample-hub-demo.png', fullPage: true });
    
    // Check if we can open the Shipment Dialog (simulated click on a button if table not empty)
    // Even if empty, the UI structure is visible
  });
});
