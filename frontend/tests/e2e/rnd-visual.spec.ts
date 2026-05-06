import { test, expect } from '@playwright/test';

test.describe('R&D Visual Audit Final', () => {
  test('Capture Dashboard State', async ({ page }) => {
    // Inject and reload
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({ name: 'Amira', role: 'HEAD_RND' }));
      localStorage.setItem('token', 'mock-token');
    });
    
    await page.goto('/rnd/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Log the page content if it fails
    const content = await page.innerText('body');
    if (content.includes('Waiting for Lab data')) {
      console.log('🔴 DASHBOARD STILL IN WAITING STATE');
    } else if (content.includes('Amira')) {
      console.log('🟢 DASHBOARD HYDRATED SUCCESSFULLY');
    }
    
    await page.screenshot({ path: 'rnd-dashboard-final.png', fullPage: true });
    
    // Check Pipeline
    await page.goto('/rnd/pipeline');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'rnd-pipeline-final.png', fullPage: true });
  });
});
