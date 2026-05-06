import { chromium } from 'playwright';

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log("Navigating to login...");
  await page.goto('http://localhost:3001/login');
  
  console.log("Filling form...");
  await page.fill('input[type="email"]', 'bd@portoaureon.com');
  await page.fill('input[type="password"]', 'password123');
  
  console.log("Submitting...");
  await page.click('button[type="submit"]');

  console.log("Waiting for URL change...");
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('response', response => {
    if (response.url().includes('/auth/login')) {
      console.log('LOGIN RESPONSE:', response.status(), response.url());
    }
  });

  try {
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    console.log("URL:", page.url());
  } catch (_e) {
    console.log("TIMEOUT! Current URL:", page.url());
    await page.screenshot({ path: 'timeout.png' });
    console.log("Saved timeout.png");
  }

  await browser.close();
})();
