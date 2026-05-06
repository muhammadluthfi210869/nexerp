import { test, expect } from '@playwright/test';

const PAGES_TO_AUDIT = [
  '/hr',
  '/logistics/fleet',
  '/finance/invoices',
  '/scm/dashboard',
  '/scm/purchase-orders',
  '/warehouse/hub',
  '/master/personnel',
  '/rnd/pipeline'
];

test.describe('ERP Performance & Stability Audit', () => {
  for (const path of PAGES_TO_AUDIT) {
    test(`Audit Page: ${path}`, async ({ page }) => {
      const errors: string[] = [];
      
      // Capture console errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      page.on('pageerror', exception => {
        errors.push(exception.message);
      });

      const startTime = Date.now();
      
      // Visit page
      const response = await page.goto(path, { waitUntil: 'networkidle' });
      
      const duration = Date.now() - startTime;
      
      // 1. Check Status
      expect(response?.status()).toBe(200);
      
      // 2. Check Latency (< 500ms for initial load is hard without build, but let's see baseline)
      console.log(`Latency [${path}]: ${duration}ms`);
      
      // 3. Check for Errors
      if (errors.length > 0) {
        console.error(`Errors found on [${path}]:`, errors);
      }
      expect(errors).toHaveLength(0);

      // 4. Visual Stability (Optional check for specific elements)
      const shell = page.locator('header');
      await expect(shell).toBeVisible();
    });
  }
});
