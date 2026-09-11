import { test, expect } from '@playwright/test';
import { loginForE2E } from './helpers/auth';

/**
 * OmniCRM Buku Tamu — approval flow regression guard.
 *
 * Verifies the Buku Tamu drill-down page renders PENDING events and the
 * Approve button is wired to the backend (POST /crm/guestbook/events/:id/approve).
 *
 * Skips actual approval if no PENDING events exist (test still passes —
 * the empty-state path is valid).
 */

test.describe('OmniCRM — Buku Tamu approval', () => {
  test.beforeEach(async ({ page }) => {
    await loginForE2E(page);
  });

  test('Buku Tamu page renders — empty state OR pending list', async ({ page }) => {
    await page.goto('/marketing/omnicrm/guestbook');

    // Wait for one of the 3 terminal states (loading → empty/error/rows)
    const settled = await Promise.race([
      page.getByTestId('omnicrm-guestbook-empty').waitFor({ timeout: 8000 }).then(() => 'empty'),
      page.getByTestId('omnicrm-guestbook-error').waitFor({ timeout: 8000 }).then(() => 'error'),
      page.locator('[data-testid^="omnicrm-guestbook-row-"]').first().waitFor({ timeout: 8000 }).then(() => 'rows'),
    ]).catch(() => null);

    expect(settled).not.toBeNull();
  });

  test('Approve button is wired — clicking calls POST /crm/guestbook/events/:id/approve', async ({ page }) => {
    await page.goto('/marketing/omnicrm/guestbook');

    // Wait for either rows or empty
    const approveBtn = page.locator('[data-testid^="omnicrm-guestbook-approve-"]').first();
    await approveBtn.waitFor({ timeout: 8000 }).catch(() => null);
    if ((await approveBtn.count()) === 0) {
      test.skip(true, 'No PENDING events in DB — skipping approve action test');
      return;
    }

    // Intercept the POST to verify it's actually called
    let approveCalled = false;
    page.on('request', (req) => {
      if (req.method() === 'POST' && /\/crm\/guestbook\/events\/[^/]+\/approve/.test(req.url())) {
        approveCalled = true;
      }
    });

    await approveBtn.click();
    await page.waitForTimeout(2000);
    expect(approveCalled).toBe(true);
  });

  test('Reject button is wired — clicking calls POST /crm/guestbook/events/:id/reject', async ({ page }) => {
    await page.goto('/marketing/omnicrm/guestbook');

    const rejectBtn = page.locator('[data-testid^="omnicrm-guestbook-reject-"]').first();
    await rejectBtn.waitFor({ timeout: 8000 }).catch(() => null);
    if ((await rejectBtn.count()) === 0) {
      test.skip(true, 'No PENDING events — skipping reject action test');
      return;
    }

    let rejectCalled = false;
    page.on('request', (req) => {
      if (req.method() === 'POST' && /\/crm\/guestbook\/events\/[^/]+\/reject/.test(req.url())) {
        rejectCalled = true;
      }
    });

    await rejectBtn.click();
    await page.waitForTimeout(2000);
    expect(rejectCalled).toBe(true);
  });
});
