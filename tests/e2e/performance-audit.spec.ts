import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * PHASE 1: AUTOMATED X-RAY (PERFORMANCE DETECTION)
 * This test suite crawls major ERP routes and detects:
 * 1. Stuck loading states (Loading overlay doesn't disappear)
 * 2. Slow page transitions (> 3 seconds)
 * 3. Network errors during page load
 */

const ROUTES_TO_AUDIT = [
  '/dashboard',
  '/master/staff',
  '/finance/cash-flow',
  '/scm/purchase-orders',
  '/warehouse/stock-opname',
  '/production/realization',
  '/hr/attendance',
  '/marketing/leads',
  '/bussdev/clients',
];

const PERFORMANCE_THRESHOLD_MS = 3000; // 3 seconds
const CRITICAL_TIMEOUT_MS = 10000;     // 10 seconds (Absolute max)

test.describe('ERP Performance Audit - Phase 1', () => {

  test.beforeEach(async ({ page }) => {
    // Standard Login
    await page.goto('/login');
    await page.fill('input[id="email"]', 'admin@dreamlab.com');
    await page.fill('input[id="password"]', 'password123');
    await page.click('button:has-text("Initialize Session")');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  for (const route of ROUTES_TO_AUDIT) {
    test(`Audit Loading State: ${route}`, async ({ page }) => {
      const auditLog: string[] = [];
      const startTime = Date.now();

      // Monitor network requests
      const failedRequests: string[] = [];
      page.on('requestfailed', request => {
        failedRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`);
      });

      console.log(`\n[AUDIT] Starting scan for: ${route}`);
      
      // Navigate to route
      await page.goto(route);

      // Detection Logic: Look for the "Synchronizing" overlay (from loading.tsx)
      const loadingOverlay = page.locator('text=Synchronizing');
      
      try {
        // Wait for it to disappear
        await expect(loadingOverlay).toBeHidden({ timeout: CRITICAL_TIMEOUT_MS });
        
        const endTime = Date.now();
        const loadDuration = endTime - startTime;

        if (loadDuration > PERFORMANCE_THRESHOLD_MS) {
          console.warn(`[SLOW] ⚠️ ${route} took ${loadDuration}ms to settle.`);
        } else {
          console.log(`[PASS] ✅ ${route} settled in ${loadDuration}ms.`);
        }

        // Check for any failed background requests
        if (failedRequests.length > 0) {
          console.error(`[NETWORK] ❌ ${route} had ${failedRequests.length} failed requests:`);
          failedRequests.forEach(err => console.error(`   - ${err}`));
        }

      } catch (error) {
        console.error(`[STUCK] ❌ FATAL: ${route} timed out after ${CRITICAL_TIMEOUT_MS}ms (Still Synchronizing)`);
        
        // Take a screenshot for evidence
        const screenshotPath = path.join(process.cwd(), 'artifacts', `stuck-${route.replace(/\//g, '-')}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        
        console.log(`[EVIDENCE] Screenshot saved to: ${screenshotPath}`);
        throw new Error(`Page ${route} is stuck in loading state.`);
      }
    });
  }
});
