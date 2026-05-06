import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3001/login');
  await page.getByPlaceholder('name@company.com').fill('production@portoaureon.com');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button:has-text("Sign In")').click();

  await page.waitForURL('**/dashboard**');
  await page.click('text=Factory Floor');

  // Let UI load Factory Floor
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: 'factory-floor.png' });
  console.log('Saved factory-floor.png');

  await browser.close();
})();
