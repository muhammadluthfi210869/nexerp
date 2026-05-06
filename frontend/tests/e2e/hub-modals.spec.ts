import { test, expect } from '@playwright/test';

test.describe('Client Sample Hub Modals', () => {
  test('Detailed UI Interaction', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({ name: 'Amira', role: 'HEAD_RND' }));
      localStorage.setItem('token', 'mock-token');
    });

    await page.goto('/bussdev/client-sample');
    await page.waitForLoadState('networkidle');
    
    // Check if there are any buttons
    const shipBtn = page.locator('button:has-text("Ship Now")').first();
    const reviewBtn = page.locator('button:has-text("Review Feedback")').first();
    
    if (await shipBtn.isVisible()) {
      await shipBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'hub-ship-modal.png' });
      await page.keyboard.press('Escape');
    }
    
    if (await reviewBtn.isVisible()) {
      await reviewBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'hub-review-modal.png' });
    }
    
    await page.screenshot({ path: 'hub-final-view.png', fullPage: true });
  });
});
