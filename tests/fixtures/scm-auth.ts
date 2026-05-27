import { Page, APIRequestContext, expect } from '@playwright/test';

export const SCM_USER = { email: 'scm@dreamlab.com', password: 'password123' };
export const ADMIN_USER = { email: 'admin@dreamlab.com', password: 'password123' };

export async function loginAsScm(page: Page) {
  await page.goto('/login');
  await page.fill('input[id="email"]', SCM_USER.email);
  await page.fill('input[id="password"]', SCM_USER.password);
  await page.click('button:has-text("Initialize Session")');
  await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
}

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[id="email"]', email);
  await page.fill('input[id="password"]', password);
  await page.click('button:has-text("Initialize Session")');
  await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
}

export async function getScmToken(request: APIRequestContext): Promise<string> {
  const res = await request.post('/api/auth/login', {
    data: { email: SCM_USER.email, password: SCM_USER.password },
  });
  expect(res.status()).toBe(201);
  const body = await res.json();
  return body.access_token;
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
