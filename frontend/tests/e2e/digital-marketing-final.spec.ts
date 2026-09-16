import { test, expect } from '@playwright/test';
import { loginForE2E } from './helpers/auth';

test.describe('Digital Marketing Finalization - Management Task & Social Media Brands', () => {
  test.beforeEach(async ({ page }) => {
    await loginForE2E(page);
  });

  test('Management Task: Entry opens Overview, clicking member card opens Member Profile, back button returns to Overview', async ({ page }) => {
    // 1. Visit management task entry via sidebar route /marketing/management-task/overview
    await page.goto('/marketing/management-task/overview');
    await expect(page).toHaveURL(/\/marketing\/management-task\/overview/);

    // 2. Assert Overview loaded with Member Workspace
    await expect(page.getByText(/Member Workspace/i)).toBeVisible();
    await expect(page.getByText(/Overview & Performa Tim/i)).toBeVisible();

    // 3. Click member card 'Gusti'
    const gustiCard = page.locator('div').filter({ hasText: /^Gusti/ }).first();
    await gustiCard.click();

    // 4. Assert Member Profile is loaded
    await expect(page.getByText(/Kembali ke Overview/i)).toBeVisible();
    await expect(page.getByText(/Lead Digital & Brand Strategist/i).first()).toBeVisible();

    // 5. Click Kembali ke Overview
    await page.getByRole('button', { name: /Kembali ke Overview/i }).first().click();

    // 6. Assert back on Overview
    await expect(page.getByText(/Member Workspace/i)).toBeVisible();
  });

  test('Social Media Brands - Dreamlab: Opens Overview with Channel Navbar and per-channel Report/Planner modes', async ({ page }) => {
    await page.goto('/marketing/dreamlab');
    await page.waitForLoadState('domcontentloaded');

    // Assert brand header
    await expect(page.locator('h1')).toContainText(/DREAMLAB WORKSPACE/i);

    // Assert channel top navbar tabs
    await expect(page.locator('#brand-nav-overview')).toBeVisible();
    await expect(page.locator('#brand-nav-instagram')).toBeVisible();
    await expect(page.locator('#brand-nav-tiktok')).toBeVisible();
    await expect(page.locator('#brand-nav-youtube')).toBeVisible();
    await expect(page.locator('#brand-nav-website')).toBeVisible();
    await expect(page.locator('#brand-nav-ads')).toBeVisible();

    // Switch to Instagram channel
    await page.locator('#brand-nav-instagram').click();
    await expect(page.getByText(/Instagram Workspace/i).first()).toBeVisible();

    // Assert per-channel Report and Planner buttons
    await expect(page.locator('#channel-btn-report')).toBeVisible();
    await expect(page.locator('#channel-btn-planner')).toBeVisible();

    // Switch to Instagram Planner
    await page.locator('#channel-btn-planner').click();
    await expect(page.getByRole('button', { name: /Tambah Konten/i })).toBeVisible();

    // Switch to Instagram Report
    await page.locator('#channel-btn-report').click();
    await expect(page.getByRole('button', { name: /Update Metrik/i }).first()).toBeVisible();

    // Switch to TikTok channel
    await page.locator('#brand-nav-tiktok').click();
    await expect(page.getByText(/TikTok Workspace/i).first()).toBeVisible();
  });

  test('Social Media Brands - Toribio: Opens Overview with Channel Navbar and per-channel Report/Planner modes', async ({ page }) => {
    await page.goto('/marketing/toribio');
    await page.waitForLoadState('domcontentloaded');

    // Assert Toribio brand header
    await expect(page.locator('h1')).toContainText(/TORIBIO WORKSPACE/i);

    // Assert channel top navbar tabs
    await expect(page.locator('#brand-nav-overview')).toBeVisible();
    await expect(page.locator('#brand-nav-instagram')).toBeVisible();
    await expect(page.locator('#brand-nav-tiktok')).toBeVisible();

    // Switch to TikTok channel on Toribio
    await page.locator('#brand-nav-tiktok').click();
    await expect(page.getByText(/TikTok Workspace/i).first()).toBeVisible();
    await expect(page.locator('#channel-btn-report')).toBeVisible();
    await expect(page.locator('#channel-btn-planner')).toBeVisible();
  });
});
