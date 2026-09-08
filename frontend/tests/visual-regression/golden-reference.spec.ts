import { test, expect } from '@playwright/test';

/**
 * Golden Reference Visual Regression Test
 *
 * Captures the canonical DNA visual reference page as a baseline.
 * Subsequent runs compare against this baseline (maxDiffPixelRatio: 0.01 = 1%).
 *
 * Run once to capture baseline:
 *   npx playwright test tests/visual-regression/golden-reference.spec.ts
 *
 * Update baseline:
 *   npx playwright test tests/visual-regression/golden-reference.spec.ts --update-snapshots
 */
test('golden-reference renders identically', async ({ page }) => {
  await page.goto('/dna-visual/golden-reference');
  await expect(page).toHaveScreenshot('golden-reference-baseline.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.01,
  });
});
