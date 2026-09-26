import { test, expect } from '@playwright/test';
import {
  assertPageHealthy,
  loginViaUI,
  OVERVIEW_ROUTES,
  PILOT_ROUTES,
  staticDashboardRoutes,
  UAT_EMAIL,
  visitRoute,
  watchPage,
} from './uat';

/**
 * P22 — UAT pre-flight (browser agent).
 *
 * Runs the client's path before the client does: log in, walk every page in the
 * app, then look hard at the two modules the pilot run covers (Gudang, Pembelian).
 * A red run here is a list of pages a human should not be shown yet.
 */

test.describe('P22 UAT pre-flight — browser agent', () => {
  test('login as SUPER_ADMIN stores token and lands on the dashboard', async ({ page }) => {
    test.setTimeout(120_000);

    await loginViaUI(page);

    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token, `no access_token in localStorage for ${UAT_EMAIL}`).toBeTruthy();

    const cookie = await page.evaluate(() => document.cookie);
    expect(cookie, 'token cookie missing — Edge middleware guards on it').toContain('token=');

    expect(new URL(page.url()).pathname).toBe('/executive/dashboard');
  });

  // ~264 routes, each with a real navigation and a settle for its data. Sharded
  // across parallel tests so one slow shard cannot blow the whole sweep's budget.
  const ROUTES = staticDashboardRoutes();
  const SHARDS = 4;

  test('route discovery found the app (guard against a vacuous sweep)', () => {
    expect(ROUTES.length, 'route discovery found nothing').toBeGreaterThan(200);
    expect(ROUTES).toContain('/warehouse/stok');
    expect(ROUTES).toContain('/pembelian/purchase-requests');
  });

  for (let shard = 0; shard < SHARDS; shard += 1) {
    const batch = ROUTES.filter((_, idx) => idx % SHARDS === shard);

    test(`sweep ${shard + 1}/${SHARDS}: ${batch.length} routes render without 5xx, error surface or bounce`, async ({ page }) => {
      test.setTimeout(600_000);

      await loginViaUI(page);
      const signals = watchPage(page);
      const failures: string[] = [];

      for (const route of batch) {
        await visitRoute(page, route);
        await assertPageHealthy(page, route).catch((e: Error) => {
          failures.push(e.message.split('\n')[0]);
        });
      }

      // Signals carry their own route prefix, so a crash from an earlier route
      // that landed late is reported against that route, not this one.
      expect(
        [...failures, ...signals.problems],
        `\n${batch.length} routes walked, ${failures.length + signals.problems.length} problem(s):\n${[...failures, ...signals.problems].join('\n')}\n`,
      ).toEqual([]);
    });
  }

  test('pilot modules (Gudang, Pembelian) render real content, not an empty shell', async ({ page }) => {
    test.setTimeout(300_000);

    await loginViaUI(page);
    const signals = watchPage(page);
    const problems: string[] = [];

    for (const route of [...PILOT_ROUTES, ...OVERVIEW_ROUTES]) {
      await visitRoute(page, route);
      await assertPageHealthy(page, route).catch((e: Error) => problems.push(e.message.split('\n')[0]));

      const content = page.locator('table, [role="table"], h1, h2, [data-testid]').first();
      const visible = await content.isVisible().catch(() => false);
      if (!visible) problems.push(`${route}: no table or heading rendered`);
    }

    expect(problems, `\n${[...problems, ...signals.problems].join('\n')}\n`).toEqual([]);
  });
});
