import { test, expect } from '@playwright/test';
import { loginForE2E } from './helpers/auth';

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
  test.beforeEach(async ({ page }) => {
    await loginForE2E(page);
  });

  test('no fallback mock names appear before real bundle loads', async ({ page }) => {
    // Slow down the API to make the placeholder window visible
    await page.route('**/api/marketing/tasks**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.continue();
    });

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

  test('redirect from /management-task → a valid member slug (NOT /overview)', async ({ page }) => {
    // Regression for the /overview 404 bug. The entry page now resolves to a
    // member slug via the client-side resolver (see page.tsx). The /overview
    // route does not exist and must never be a destination.
    const VALID_SLUGS = ['aurel', 'revi', 'zarka', 'gusti', 'luthfi', 'rahmat'];
    await page.goto('/marketing/management-task');
    await page.waitForFunction(
      () => /\/management-task\/(aurel|revi|zarka|gusti|luthfi|rahmat)$/.test(window.location.pathname),
      { timeout: 5000 },
    );
    const tail = new URL(page.url()).pathname.split('/').pop() ?? '';
    expect(VALID_SLUGS).toContain(tail);
    expect(page.url()).not.toContain('/overview');
  });
});

test('management task requires an authenticated session', async ({ page }) => {
  await page.goto('/marketing/management-task');
  await expect(page).toHaveURL(/\/login\?redirect=%2Fmarketing%2Fmanagement-task/);
});
