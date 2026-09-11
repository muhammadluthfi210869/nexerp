import { test, expect } from '@playwright/test';
import { loginForE2E } from './helpers/auth';

/**
 * OmniCRM Lead Detail — regression guard for /marketing/omnicrm/leads/[id].
 *
 * Verifies:
 *   - Page loads when given a valid lead id
 *   - Display name input + Save button are present
 *   - Stage change select is present
 *   - 404 state when lead id is bogus
 */

test.describe('OmniCRM — Lead Detail page', () => {
  test.beforeEach(async ({ page }) => {
    await loginForE2E(page);
  });

  test('renders phone + displayName input + stage select when lead exists', async ({ page }) => {
    // Find a real lead id from the overview
    await page.goto('/marketing/omnicrm');
    const firstRow = page.locator('[data-testid^="overview-row-"]').first();
    const firstRowVisible = await firstRow.isVisible().catch(() => false);

    if (!firstRowVisible) {
      test.skip(true, 'No leads in DB — skipping lead-detail render test');
      return;
    }

    // Click the Detail link in the first row
    await firstRow.getByRole('link', { name: /Detail/i }).click();
    await page.waitForURL(/\/marketing\/omnicrm\/leads\/[^/]+$/);

    // Detail page renders
    await expect(page.getByTestId('lead-detail')).toBeVisible();
    await expect(page.getByTestId('lead-detail-phone')).toBeVisible();
    await expect(page.getByTestId('lead-detail-displayname-input')).toBeVisible();
    await expect(page.getByTestId('lead-detail-displayname-save')).toBeVisible();
    await expect(page.getByTestId('lead-detail-stage-select')).toBeVisible();
  });

  test('edit displayName → Save calls PATCH /crm/leads/:id/displayName', async ({ page }) => {
    await page.goto('/marketing/omnicrm');
    const firstRow = page.locator('[data-testid^="overview-row-"]').first();
    if (!(await firstRow.isVisible().catch(() => false))) {
      test.skip(true, 'No leads — skipping displayName save test');
      return;
    }
    await firstRow.getByRole('link', { name: /Detail/i }).click();
    await page.waitForURL(/\/marketing\/omnicrm\/leads\/[^/]+$/);

    const input = page.getByTestId('lead-detail-displayname-input');
    await input.fill('TEST EDIT ' + Date.now());

    let patchCalled = false;
    page.on('request', (req) => {
      if (req.method() === 'PATCH' && /\/crm\/leads\/[^/]+\/displayName/.test(req.url())) {
        patchCalled = true;
      }
    });

    await page.getByTestId('lead-detail-displayname-save').click();
    await page.waitForTimeout(2000);
    expect(patchCalled).toBe(true);
  });

  test('404 (or error) when lead id is invalid', async ({ page }) => {
    const response = await page.goto('/marketing/omnicrm/leads/not-a-real-uuid');
    // Either 4xx response, error UI, or the page shows an error message
    const hasError = await page.getByTestId('lead-detail-error').isVisible().catch(() => false);
    const status4xx = response !== null && response.status() >= 400 && response.status() < 500;
    expect(hasError || status4xx).toBe(true);
  });
});
