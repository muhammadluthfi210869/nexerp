import { test, expect } from '@playwright/test';
import { loginForE2E } from './helpers/auth';

test.describe('Canonical Marketing Module QA & Hardening', () => {
  test.beforeEach(async ({ page }) => {
    await loginForE2E(page);
  });
  test('redirects /marketing/management-task to overview', async ({ page }) => {
    await page.goto('/marketing/management-task');
    await expect(page).toHaveURL(/\/marketing\/management-task\/overview/);
  });

  test('ensures no prototype endpoints are called from canonical marketing pages', async ({ page }) => {
    const prototypeCalls: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/marketing/prototype')) {
        prototypeCalls.push(url);
      }
    });

    await page.goto('/marketing/management-task/overview');
    await page.waitForLoadState('domcontentloaded');

    await page.goto('/marketing/social-tracker');
    await page.waitForLoadState('domcontentloaded');

    await page.goto('/marketing/social-tracker/reporting');
    await page.waitForLoadState('domcontentloaded');

    await page.goto('/marketing/social-tracker/integrations');
    await page.waitForLoadState('domcontentloaded');

    expect(prototypeCalls).toHaveLength(0);
  });

  test('social planner renders navigation and KPI strip', async ({ page }) => {
    await page.goto('/marketing/social-tracker');
    await expect(page.locator('h1')).toContainText(/SOCIAL MEDIA PLANNER/i);
    // Check view buttons
    await expect(page.getByRole('button', { name: /Tabel/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Kanban/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Kalender/i })).toBeVisible();
  });

  test('marketing reporting renders canonical filters and metric input', async ({ page }) => {
    await page.goto('/marketing/social-tracker/reporting');
    await expect(page.locator('h1')).toContainText(/MARKETING REPORTING/i);
    await expect(page.getByLabel('Filter brand')).toBeVisible();
    await expect(page.getByLabel('Filter channel')).toBeVisible();
    await expect(page.getByRole('button', { name: /Input metrik/i }).first()).toBeVisible();
  });
});
