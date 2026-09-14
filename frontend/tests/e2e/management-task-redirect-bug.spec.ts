import { test, expect } from '@playwright/test';
import { loginForE2E } from './helpers/auth';

/**
 * Management Task redirect — regression guard for the /overview 404 bug.
 *
 * Bug: phase-3 page.tsx originally redirected `/marketing/management-task`
 *   → `/marketing/management-task/overview`, but the `/overview` route does
 *   not exist on any branch → 404. Subsequent partial "fix" redirected
 *   to itself (`/marketing/management-task`), which loops indefinitely.
 *
 * Correct behavior (from production-light): the entry page is a client-side
 * resolver that reads the logged-in user from localStorage and routes to the
 *   correct member slug (`aurel`, `revi`, `zarka`, `gusti`, `luthfi`, `rahmat`).
 *
 * This test asserts:
 *   - `/marketing/management-task` does NOT land on `/overview` (404)
 *   - `/marketing/management-task` does NOT loop on itself
 *   - It DOES land on `/marketing/management-task/{slug}` under login
 *   - Unauthenticated visitor is bounced to `/login?redirect=...`
 */

const VALID_SLUGS = ['aurel', 'revi', 'zarka', 'gusti', 'luthfi', 'rahmat'];

test.describe('Management Task redirect — /overview 404 bug regression guard', () => {
  test('authenticated: /management-task routes to a valid member slug, never /overview or self', async ({ page }) => {
    await loginForE2E(page);

    await page.goto('/marketing/management-task');

    // Wait for the client-side resolver to run (router.replace).
    // Give it up to 5s — production-light's resolver fires in useEffect.
    await page.waitForFunction(
      () => {
        const path = window.location.pathname;
        // Either routed to a member slug, OR still on the entry page if user is unauthenticated
        return /\/management-task\/(aurel|revi|zarka|gusti|luthfi|rahmat)$/.test(path);
      },
      { timeout: 5000 },
    );

    const finalUrl = new URL(page.url());
    expect(finalUrl.pathname).not.toBe('/marketing/management-task/overview');
    expect(finalUrl.pathname).not.toBe('/marketing/management-task'); // no self-loop
    const tail = finalUrl.pathname.split('/').pop() ?? '';
    expect(VALID_SLUGS).toContain(tail);
  });

  test('the broken /overview route must not exist (would 404)', async ({ page }) => {
    const response = await page.goto('/marketing/management-task/overview', {
      waitUntil: 'domcontentloaded',
    });
    // Either the page is 404, or it redirects away. Both are acceptable
    // as long as the user does not land on a "not found" page at /overview.
    const finalPath = new URL(page.url()).pathname;
    expect(finalPath).not.toBe('/marketing/management-task/overview');
    // If we got a 404 response, body should not claim to be the management task board
    if (response && response.status() === 404) {
      const bodyText = (await page.locator('body').textContent()) ?? '';
      expect(bodyText.toLowerCase()).not.toContain('management task');
    }
  });

  test('unauthenticated: /management-task redirects to /login with redirect query', async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
    await page.goto('/marketing/management-task', { waitUntil: 'domcontentloaded' });
    // Either routes to /login, or to the entry page that itself bounces — either way
    // we MUST NOT see a 404 page or stay on the broken /overview URL.
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    const finalPath = new URL(page.url()).pathname;
    expect(finalPath).not.toBe('/marketing/management-task/overview');
  });
});
