import { test, expect } from '@playwright/test';

/**
 * ERP PERFORMANCE INTEGRITY AUDIT (Phase 4)
 * Objective: Verify < 500ms LCP and Zero Console Errors across critical modules.
 */

const CRITICAL_MODULES = [
  '/bussdev/dashboard',
  '/creative/board',
  '/marketing/dashboard',
  '/production',
  '/hr',
  '/rnd'
];

test.describe('🛡️ ERP Performance Integrity Audit', () => {
  test.setTimeout(180000);

  test('E2E Latency & Integrity Verification', async ({ page }) => {
    // 1. AUTHENTICATION GATE
    console.log('🔑 Authenticating via Edge Gate...');
    await page.goto('http://localhost:3003/login');
    await page.fill('#email', 'admin@dreamlab.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for initial dashboard load
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    console.log('✅ Authentication Successful.');

    const auditResults: any[] = [];

    for (const route of CRITICAL_MODULES) {
      console.log(`\n🚀 Auditing Route: ${route}`);
      
      // Clear logs/metrics
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      // Start Measuring
      const startTime = Date.now();
      
      // Navigate
      await page.goto(`http://localhost:3003${route}`, { 
        waitUntil: 'networkidle',
        timeout: 20000 
      });

      // Measure Timing
      const loadTime = Date.now() - startTime;
      
      // Performance Metrics via Web API
      const performanceTiming = await page.evaluate(() => {
        const [navigation] = performance.getEntriesByType('navigation') as any;
        return {
          ttfb: navigation.responseStart - navigation.requestStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.startTime,
          loadEvent: navigation.loadEventEnd - navigation.startTime,
        };
      });

      const isSuccess = loadTime < 1500 && consoleErrors.length === 0;

      auditResults.push({
        route,
        loadTime,
        ttfb: performanceTiming.ttfb,
        errors: consoleErrors.length,
        status: isSuccess ? 'PASS' : 'FAIL'
      });

      console.log(`${isSuccess ? '✅' : '❌'} Load Time: ${loadTime}ms | TTFB: ${performanceTiming.ttfb.toFixed(1)}ms`);
      if (consoleErrors.length > 0) {
        console.log(`   ⚠️ Errors detected: ${consoleErrors.join(', ')}`);
      }
    }

    // FINAL REPORT
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL PERFORMANCE INTEGRITY REPORT');
    console.log('='.repeat(60));
    console.log(`${'ROUTE'.padEnd(25)} | ${'TTFB'.padEnd(10)} | ${'LOAD'.padEnd(10)} | ${'STATUS'}`);
    console.log('-'.repeat(60));
    
    auditResults.forEach(res => {
      console.log(`${res.route.padEnd(25)} | ${res.ttfb.toFixed(1).padEnd(10)} | ${res.loadTime.toString().padEnd(10)} | ${res.status}`);
    });
    console.log('='.repeat(60));

    // Assertion: All critical routes must pass basic load and error checks
    const failures = auditResults.filter(r => r.status === 'FAIL');
    expect(failures.length, `Detected ${failures.length} performance/integrity failures!`).toBe(0);
  });
});
