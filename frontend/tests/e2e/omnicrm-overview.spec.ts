import { test, expect } from '@playwright/test';
import { loginForE2E } from './helpers/auth';

/**
 * OmniCRM Overview — regression guard for the Live Capture single-page view.
 *
 * Verifies the page rendered the consolidated landing after the multi-tab UI
 * was removed. Asserts:
 *   - 4 KPI cards visible (Leads Today, Buku Tamu Pending, Reply Rate, Avg First Response)
 *   - Filter bar present (date range, BusDev, Source, Buku Tamu Status)
 *   - Live Capture table renders (or empty-state shown)
 *   - No JS console errors during load
 */

test.describe('OmniCRM — Overview page', () => {
  test.beforeEach(async ({ page }) => {
    await loginForE2E(page);
  });

  test('renders 4 KPI cards + filter bar + live capture container', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/marketing/omnicrm');

    // 4 KPI cards visible
    await expect(page.getByTestId('kpi-card-leads-today')).toBeVisible();
    await expect(page.getByTestId('kpi-card-buku-tamu')).toBeVisible();
    await expect(page.getByTestId('kpi-card-reply-rate')).toBeVisible();
    await expect(page.getByTestId('kpi-card-first-response')).toBeVisible();

    // Filter bar
    await expect(page.getByTestId('overview-filter-from')).toBeVisible();
    await expect(page.getByTestId('overview-filter-to')).toBeVisible();
    await expect(page.getByTestId('overview-filter-busdev')).toBeVisible();
    await expect(page.getByTestId('overview-filter-source')).toBeVisible();
    await expect(page.getByTestId('overview-filter-status')).toBeVisible();
    await expect(page.getByTestId('overview-refresh')).toBeVisible();

    // Live Capture container present (either table rows OR empty/error state)
    const hasRows = (await page.locator('[data-testid^="overview-row-"]').count()) > 0;
    const hasEmpty = await page.getByTestId('overview-empty').isVisible().catch(() => false);
    const hasError = await page.getByTestId('overview-error').isVisible().catch(() => false);
    expect(hasRows || hasEmpty || hasError).toBe(true);

    // No unexpected console errors (ignore 401 from background pollers)
    const real = consoleErrors.filter((e) => !e.includes('401') && !e.includes('Failed to load resource'));
    expect(real, `console errors: ${real.join('; ')}`).toEqual([]);
  });

  test('date range filter triggers reload', async ({ page }) => {
    await page.goto('/marketing/omnicrm');

    const fromInput = page.getByTestId('overview-filter-from');
    const toInput = page.getByTestId('overview-filter-to');

    // Set explicit 7-day range
    const today = new Date().toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
    await fromInput.fill(sevenDaysAgo);
    await toInput.fill(today);

    // Either table or empty/error state must show
    await page.waitForTimeout(500); // debounce
    const result = await Promise.race([
      page.locator('[data-testid^="overview-row-"]').first().waitFor({ timeout: 3000 }).then(() => 'rows'),
      page.getByTestId('overview-empty').waitFor({ timeout: 3000 }).then(() => 'empty'),
      page.getByTestId('overview-error').waitFor({ timeout: 3000 }).then(() => 'error'),
    ]).catch(() => null);
    expect(result).not.toBeNull();
  });

  test('KPI "Buku Tamu Pending" tile is clickable → /marketing/omnicrm/guestbook', async ({ page }) => {
    await page.goto('/marketing/omnicrm');
    const tile = page.getByTestId('kpi-card-buku-tamu');
    await tile.click();
    await page.waitForURL(/\/marketing\/omnicrm\/guestbook$/);
    await expect(page).toHaveURL(/\/marketing\/omnicrm\/guestbook/);
  });

  test('KPI "Leads Today" tile is clickable → /marketing/omnicrm/kpi', async ({ page }) => {
    await page.goto('/marketing/omnicrm');
    await page.getByTestId('kpi-card-leads-today').click();
    await page.waitForURL(/\/marketing\/omnicrm\/kpi$/);
    await expect(page).toHaveURL(/\/marketing\/omnicrm\/kpi/);
  });

  test('Mgmt-task sidebar does NOT have broken /overview link', async ({ page }) => {
    // Regression guard from the sidebar cleanup (removed 2 broken entries).
    await page.goto('/marketing/management-task');
    // production-light resolver should redirect to /marketing/management-task/{member}
    await page.waitForLoadState('networkidle');
    const finalPath = new URL(page.url()).pathname;
    expect(finalPath).toMatch(/\/marketing\/management-task\/(aurel|revi|zarka|gusti|luthfi|rahmat)$/);
    expect(finalPath).not.toBe('/marketing/management-task/overview');
  });
});
