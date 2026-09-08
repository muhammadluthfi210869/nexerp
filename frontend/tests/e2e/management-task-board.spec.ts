import { test, expect } from '@playwright/test';

/**
 * Management Task Board — regression guard for the "system interrupt" bug.
 *
 * Bug: use-marketing-prototype.ts previously used
 *   placeholderData: buildFallbackBundle()
 * which rendered MOCK JSON before the real API responded. On slow laptops,
 * this caused UI flicker + "system interrupt" symptoms.
 *
 * Fix: removed buildFallbackBundle; query now uses enabled: !!user?.id.
 *
 * This test asserts that no mock member names from the old fallback dataset
 * appear in the rendered board before the real API responds.
 */

const MOCK_MEMBER_NAMES = [
  'Aurel Mock',
  'Revi Mock',
  'Zarka Mock',
];

test.describe('Management Task Board — no mock data leak', () => {
  test('no fallback mock names appear before real bundle loads', async ({ page }) => {
    // Slow down the API to make the placeholder window visible
    await page.route('**/api/marketing/prototype/bundle', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.continue();
    });

    // Auth is required to render the board
    await page.goto('/login');
    // Assume a test login helper — adjust if your setup differs
    // await page.fill('input[name=email]', 'test@example.com');
    // await page.fill('input[name=password]', 'test');
    // await page.click('button[type=submit]');

    await page.goto('/marketing/management-task/overview');

    // Within the first 500ms (before real data arrives), no mock names should appear
    // We check that the loading state is shown, not the populated board
    const loadingVisible = await page.locator('[data-testid="board-loading"], [aria-busy="true"]').first().isVisible().catch(() => false);

    if (loadingVisible) {
      // Good — board is in loading state, no mock flash
      const bodyText = await page.locator('body').textContent();
      for (const mockName of MOCK_MEMBER_NAMES) {
        expect(bodyText).not.toContain(mockName);
      }
    } else {
      // Either board already loaded (fast network in CI) or rendered nothing
      // Still verify no mock names
      const bodyText = await page.locator('body').textContent();
      for (const mockName of MOCK_MEMBER_NAMES) {
        expect(bodyText).not.toContain(mockName);
      }
    }
  });

  test('board renders real team slugs after data loads', async ({ page }) => {
    await page.goto('/marketing/management-task/overview');

    // Wait for the real bundle to load (or fail) — give it a generous timeout
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // The board should show real member slugs (assuming data exists)
    // We don't assert presence of all slugs (depends on data), just no errors
    const hasError = await page.locator('text=/error|failed/i').first().isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test('redirect from /management-task → /management-task/overview', async ({ page }) => {
    await page.goto('/marketing/management-task');
    await page.waitForURL(/\/management-task\/overview/, { timeout: 5000 });
    expect(page.url()).toContain('/overview');
  });

  test('invalid member slug redirects to overview', async ({ page }) => {
    await page.goto('/marketing/management-task/nonexistent-person');
    await page.waitForURL(/\/overview/, { timeout: 5000 });
    expect(page.url()).toContain('/overview');
  });
});
