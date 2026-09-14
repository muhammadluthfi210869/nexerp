import type { Page } from '@playwright/test';

// Seeded, non-production account used only by the local E2E environment.
const TEST_USER = {
  email: 'superadmin@nexerp.id',
  password: 'password123',
};

export async function loginForE2E(page: Page) {
  await page.goto('/login');
  await page.waitForSelector('input#email', { timeout: 15_000 });
  await page.fill('input#email', TEST_USER.email);
  await page.fill('input#password', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
    timeout: 30_000,
  });
}
