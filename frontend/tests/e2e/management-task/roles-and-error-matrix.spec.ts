import { test, expect } from '@playwright/test';
import { loginForE2E } from '../helpers/auth';

test.describe('Management Task Roles & Error State Matrix', () => {
  test.beforeEach(async ({ page }) => {
    await loginForE2E(page);
  });

  test('Error Matrix: HTTP 500 displays DnaErrorState with Retry, NO mock data fallback', async ({ page }) => {
    // Intercept task API to simulate backend 500 outage
    await page.route('**/api/marketing/tasks*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Database connection failure in task service'
        })
      });
    });

    await page.goto('/marketing/management-task/overview');

    // Asserts clean error presentation
    await expect(page.getByText('Task gagal dimuat')).toBeVisible();
    await expect(page.getByRole('button', { name: /Coba lagi/i })).toBeVisible();

    // Asserts ZERO mock data leak (no dummy task titles from legacy datasets)
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent).not.toContain('Aurel Mock');
    expect(bodyContent).not.toContain('Gusti Mock');
    expect(bodyContent).not.toContain('dl_tasks');
  });

  test('Error Matrix: Empty filter state renders DnaEmptyState with action', async ({ page }) => {
    // Intercept task API to return 0 results
    await page.route('**/api/marketing/tasks*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [],
          total: 0,
          page: 1,
          limit: 25,
          hasMore: false
        })
      });
    });

    await page.goto('/marketing/management-task/overview');
    await expect(page.getByText('Belum ada task')).toBeVisible();
    await expect(page.getByText('Filter ini belum memiliki pekerjaan.')).toBeVisible();
  });

  test('Security & Scope: Unauthenticated access redirects to /login', async ({ browser }) => {
    const unauthContext = await browser.newContext({ storageState: undefined });
    const unauthPage = await unauthContext.newPage();
    await unauthPage.goto('/marketing/management-task/overview');
    await expect(unauthPage).toHaveURL(/\/login/);
    await unauthContext.close();
  });
});
