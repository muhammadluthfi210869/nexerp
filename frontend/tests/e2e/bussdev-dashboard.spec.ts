import { test, expect } from '@playwright/test';

test.describe('Bussdev Dashboard: 100% Fidelity Validation', () => {
  test.beforeEach(async ({ page }) => {
    // 1. LOGIN
    await page.goto('http://localhost:3001/login');
    await page.fill('#email', 'superadmin@dreamlab.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for the dashboard to load (look for the "Strategic Sales Pipeline" text or similar)
    await page.waitForTimeout(5000); 
    await page.goto('http://localhost:3001/bussdev/dashboard');
  });

  test('should verify all 4 specialized dashboard cards are present and correctly structured', async ({ page }) => {
    // Verify Card I: FUNNEL OVERVIEW
    const card1 = page.locator('text=I. Funnel Overview');
    await expect(card1).toBeVisible();
    await expect(page.locator('text=Total Leads')).toBeVisible();
    await expect(page.locator('text=Leads Contacted')).toBeVisible();
    await expect(page.locator('text=Sample Process')).toBeVisible();
    await expect(page.locator('text=DP Received')).toBeVisible();
    await expect(page.locator('text=Deal Confirmed')).toBeVisible();
    await expect(page.locator('text=Repeat Order')).toBeVisible();

    // Verify Card II: REVENUE PIPELINE
    const card2 = page.locator('text=II. Revenue Pipeline');
    await expect(card2).toBeVisible();
    await expect(page.locator('text=Total Pipeline Value')).toBeVisible();
    await expect(page.locator('text=Potential Sample')).toBeVisible();
    await expect(page.locator('text=Potential Deal')).toBeVisible();
    await expect(page.locator('text=Confirmed Deal')).toBeVisible();
    await expect(page.locator('text=Repeat Order Val')).toBeVisible();

    // Verify Card III: ACTIVITY PERFORMANCE
    const card3 = page.locator('text=III. Activity Performance');
    await expect(card3).toBeVisible();
    await expect(page.locator('text=Follow-up Today')).toBeVisible();
    await expect(page.locator('text=Avg Response')).toBeVisible();
    await expect(page.locator('text=Active Leads')).toBeVisible();

    // Verify Card IV: CRITICAL ALERT
    const card4 = page.locator('text=IV. Critical Alert');
    await expect(card4).toBeVisible();
    await expect(page.locator('text=Unfollowed Leads')).toBeVisible();
    await expect(page.locator('text=Stuck Samples (>14d)')).toBeVisible();
    await expect(page.locator('text=Stuck Negotiation')).toBeVisible();
    await expect(page.locator('text=At Risk Clients')).toBeVisible();

    console.log('✅ DASHBOARD FIDELITY TEST PASSED: All 4 cards and 18 sub-metrics are visible.');
  });
});
