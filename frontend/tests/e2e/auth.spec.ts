import { test, expect } from '@playwright/test';

test.describe('Auth & RBAC Suite', () => {
  
  test('unauthorized user should be redirected to login', async ({ page }) => {
    await page.goto('/dashboard');
    // Expect redirection to /login
    await expect(page).toHaveURL(/\/login/);
  });

  test('BD user should not access Finance module', async ({ page }) => {
    // 1. Login as BD
    await page.goto('/login');
    await page.fill('input[type="email"]', 'bd@portoaureon.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 2. Wait for dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    
    // 3. Try to access /dashboard/finance
    await page.goto('/dashboard/finance');
    
    // 4. Expect redirection back to /dashboard (or 403)
    // Based on our frontend logic, it redirects to /dashboard if role not allowed
    await expect(page).toHaveURL(/.*dashboard$/);
  });

  test('successful login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('name@company.com').fill('bd@portoaureon.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button:has-text("Sign In")').click();
    
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('h2')).toContainText('EXECUTIVE COMMAND');
  });

});
